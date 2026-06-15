import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';

export interface WabaBindInput {
  code: string;
  wabaId: string;
  phoneNumberId: string;
  solutionId: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly auditService: AuditService,
  ) {}

  async bindWabaAndNumber(dto: WabaBindInput, actorId: string) {
    const ycloudConfig = this.configService.get('ycloud', { infer: true });
    const hasCredentials = ycloudConfig && ycloudConfig.apiKey && ycloudConfig.apiKey.trim().length > 0;

    let wabaResponse: {
      id: string;
      name: string;
      accountReviewStatus: string;
      paymentMethodAttached: boolean;
    };

    let registerResponse: {
      phoneNumber: string;
      wabaId: string;
      verifiedName: string;
      status: string;
    };

    if (!hasCredentials) {
      this.logger.warn(
        `YCloud API Key is not set in environment variables. Falling back to MOCK mode for WABA ID: ${dto.wabaId}`,
      );
      
      wabaResponse = {
        id: dto.wabaId,
        name: `Mock Client WABA - ${dto.wabaId.substring(0, 6)}`,
        accountReviewStatus: 'APPROVED',
        paymentMethodAttached: true,
      };

      registerResponse = {
        phoneNumber: `+120655501${Math.floor(10 + Math.random() * 90)}`,
        wabaId: dto.wabaId,
        verifiedName: `Mock Verified Number - ${dto.phoneNumberId.substring(0, 6)}`,
        status: 'CONNECTED',
      };
    } else {
      const apiKey = ycloudConfig.apiKey;
      this.logger.log(`Initiating YCloud API handshake for WABA: ${dto.wabaId}`);

      // 1. Call WABA Bind API
      try {
        const bindUrl = `https://api.ycloud.com/v2/whatsapp/businessAccounts/${dto.wabaId}/tp/bind`;
        const bindRes = await fetch(bindUrl, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!bindRes.ok) {
          const errMsg = await bindRes.text();
          this.logger.error(`YCloud tp/bind failed with status ${bindRes.status}: ${errMsg}`);
          throw new BadRequestException(`YCloud WABA binding failed: ${errMsg}`);
        }

        wabaResponse = await bindRes.json() as typeof wabaResponse;
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(`Failed to reach YCloud tp/bind API: ${err instanceof Error ? err.message : err}`);
        throw new BadRequestException('Failed to complete WABA binding with YCloud.');
      }

      // 2. Call Register Phone Number API
      try {
        const registerUrl = `https://api.ycloud.com/v2/whatsapp/phoneNumbers/${dto.wabaId}/${dto.phoneNumberId}/register`;
        const registerRes = await fetch(registerUrl, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!registerRes.ok) {
          const errMsg = await registerRes.text();
          this.logger.error(`YCloud phoneNumbers/register failed with status ${registerRes.status}: ${errMsg}`);
          throw new BadRequestException(`YCloud phone registration failed: ${errMsg}`);
        }

        registerResponse = await registerRes.json() as typeof registerResponse;
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(`Failed to reach YCloud register API: ${err instanceof Error ? err.message : err}`);
        throw new BadRequestException('Failed to complete phone registration with YCloud.');
      }
    }

    // 3. Database Updates and Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Find or create Client
      const clientName = wabaResponse.name || registerResponse.verifiedName || `Client - WABA ${dto.wabaId}`;
      let client = await tx.client.findUnique({
        where: { wabaId: dto.wabaId },
      });

      if (!client) {
        client = await tx.client.create({
          data: { name: clientName, wabaId: dto.wabaId },
        });
      }

      // Upsert WhatsAppNumber connection
      const whatsAppNumber = await tx.whatsAppNumber.upsert({
        where: { phoneNumberId: dto.phoneNumberId },
        update: {
          phoneNumber: registerResponse.phoneNumber,
          wabaId: dto.wabaId,
          ycloudAccountId: wabaResponse.id,
          connectionStatus: 'ACTIVE',
          lastPing: new Date(),
        },
        create: {
          clientId: client.id,
          phoneNumber: registerResponse.phoneNumber,
          wabaId: dto.wabaId,
          phoneNumberId: dto.phoneNumberId,
          ycloudAccountId: wabaResponse.id,
          connectionStatus: 'ACTIVE',
          lastPing: new Date(),
        },
      });

      // Initialize the 6 steps checklist
      // Step 1: Create Hub Account -> DONE
      // Step 2: Connect Account -> DONE
      // Step 3: Connect via YCloud -> DONE
      // Step 4: Configure webhook -> IN_PROGRESS
      // Steps 5-6 -> PENDING
      for (let step = 1; step <= 6; step++) {
        let status: 'PENDING' | 'IN_PROGRESS' | 'DONE' = 'PENDING';
        if (step <= 3) status = 'DONE';
        else if (step === 4) status = 'IN_PROGRESS';

        await tx.onboardingStep.upsert({
          where: {
            numberId_stepNumber: {
              numberId: whatsAppNumber.id,
              stepNumber: step,
            },
          },
          update: {
            status,
          },
          create: {
            numberId: whatsAppNumber.id,
            stepNumber: step,
            status,
          },
        });
      }

      return {
        client,
        whatsAppNumber,
      };
    });

    // Record Audit Log (outside the transaction scope)
    this.auditService.record({
      actorId,
      action: 'whatsapp.bind',
      entityType: 'WhatsAppNumber',
      entityId: result.whatsAppNumber.id,
      metadata: {
        wabaId: dto.wabaId,
        phoneNumberId: dto.phoneNumberId,
        phoneNumber: registerResponse.phoneNumber,
        paymentMethodAttached: wabaResponse.paymentMethodAttached,
      },
    });

    return {
      success: true,
      client: result.client,
      whatsAppNumber: result.whatsAppNumber,
    };
  }

  verifyWebhookSignature(signatureHeader: string, rawBody: Buffer): boolean {
    const ycloudConfig = this.configService.get('ycloud', { infer: true });
    const secret = ycloudConfig?.webhookSecret;

    if (!secret || secret.trim().length === 0) {
      this.logger.warn(
        'YCLOUD_WEBHOOK_SECRET is not set in environment variables. Webhook signature checking is bypassed.',
      );
      return true;
    }

    if (!signatureHeader) {
      this.logger.warn('Signature verification failed: Missing ycloud-signature header.');
      return false;
    }

    if (!rawBody || rawBody.length === 0) {
      this.logger.warn('Signature verification failed: Empty raw body.');
      return false;
    }

    try {
      // Parse header: t=TIMESTAMP,s=SIGNATURE
      const parts = signatureHeader.split(',');
      let timestamp = '';
      let signature = '';
      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 't') timestamp = value;
        if (key === 's') signature = value;
      }

      if (!timestamp || !signature) {
        this.logger.warn('Signature verification failed: Invalid ycloud-signature format.');
        return false;
      }

      // Check timestamp age (within 5 minutes to prevent replay attacks)
      const now = Math.floor(Date.now() / 1000);
      const ts = Number(timestamp);
      if (Math.abs(now - ts) > 300) {
        this.logger.warn(`Signature verification failed: Timestamp difference is too large: ${Math.abs(now - ts)}s`);
        return false;
      }

      // Compute HMAC-SHA256
      const payload = `${timestamp}.${rawBody.toString('utf8')}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (sigBuffer.length !== expectedBuffer.length) {
        this.logger.warn('Signature verification failed: Length mismatch.');
        return false;
      }

      const matches = crypto.timingSafeEqual(sigBuffer, expectedBuffer);

      if (!matches) {
        this.logger.warn('Signature verification failed: Signature mismatch.');
      }

      return matches;
    } catch (err) {
      this.logger.error(`Signature verification failed with exception: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  async handleWebhook(body: any) {
    const eventType = body.type;
    this.logger.log(`Processing YCloud Webhook Event: ${eventType}`);

    switch (eventType) {
      case 'whatsapp.inbound_message.received': {
        const inbound = body.whatsappInboundMessage;
        if (!inbound) break;

        const clientPhone = inbound.to; // Number receiving the message
        const customerPhone = inbound.from; // Customer sending the message
        const textContent = inbound.text?.body || '[Media or Non-text Message]';
        const messageId = inbound.id;

        // Find connection in DB
        const whatsAppNumber = await this.prisma.whatsAppNumber.findUnique({
          where: { phoneNumber: clientPhone },
        });

        if (!whatsAppNumber) {
          this.logger.warn(`Received message for unregistered client phone number: ${clientPhone}`);
          break;
        }

        // Prevent duplicate logs from webhook retries
        const existingMessage = await this.prisma.message.findUnique({
          where: { ycloudMessageId: messageId },
        });

        if (existingMessage) {
          this.logger.log(`Message with ID ${messageId} already exists. Skipping duplicate insert.`);
          break;
        }

        // Save Message record
        await this.prisma.message.create({
          data: {
            numberId: whatsAppNumber.id,
            direction: 'INBOUND',
            senderNumber: customerPhone,
            messageBody: textContent,
            status: 'DELIVERED',
            ycloudMessageId: messageId,
          },
        });

        // Increment message count and last ping
        await this.prisma.whatsAppNumber.update({
          where: { id: whatsAppNumber.id },
          data: {
            messageCount: { increment: 1 },
            lastPing: new Date(),
            connectionStatus: 'ACTIVE',
          },
        });

        // Auto-complete onboarding checklists (Steps 4-6)
        // Step 4: Configure Webhook -> DONE
        // Step 5: Verify API Connection -> DONE
        // Step 6: Mark as Active -> DONE
        await this.prisma.onboardingStep.updateMany({
          where: {
            numberId: whatsAppNumber.id,
            stepNumber: { in: [4, 5, 6] },
          },
          data: {
            status: 'DONE',
          },
        });

        this.logger.log(`Inbound message logged successfully. Onboarding steps completed for ${clientPhone}`);
        break;
      }

      case 'whatsapp.message.updated': {
        const messageUpdate = body.whatsappMessage;
        if (!messageUpdate) break;

        const messageId = messageUpdate.id;
        const newStatus = messageUpdate.status;

        // Find existing logged message
        const existingMessage = await this.prisma.message.findUnique({
          where: { ycloudMessageId: messageId },
        });

        if (existingMessage) {
          await this.prisma.message.update({
            where: { id: existingMessage.id },
            data: { status: newStatus },
          });
          this.logger.log(`Message ${messageId} status updated to ${newStatus}`);
        }
        break;
      }

      case 'whatsapp.phone_number.updated': {
        const phoneUpdate = body.whatsappPhoneNumber || body.data;
        if (!phoneUpdate) break;

        const clientPhone = phoneUpdate.phoneNumber;
        const status = phoneUpdate.status;

        const whatsAppNumber = await this.prisma.whatsAppNumber.findUnique({
          where: { phoneNumber: clientPhone },
        });

        if (whatsAppNumber) {
          const connectionStatus = status === 'CONNECTED' ? 'ACTIVE' : 'ERROR';
          await this.prisma.whatsAppNumber.update({
            where: { id: whatsAppNumber.id },
            data: {
              connectionStatus,
              lastPing: new Date(),
            },
          });
          this.logger.log(`Phone number connection ${clientPhone} updated to ${connectionStatus} (raw: ${status})`);
        }
        break;
      }

      default:
        this.logger.log(`Unprocessed YCloud event category: ${eventType}`);
        break;
    }

    return { success: true };
  }

  async getClients() {
    return this.prisma.client.findMany({
      orderBy: { name: 'asc' },
      include: {
        numbers: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
      },
    });
  }

  async getNumbers() {
    return this.prisma.whatsAppNumber.findMany({
      orderBy: { phoneNumber: 'asc' },
      include: {
        client: true,
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
  }

  async getMessages(numberId: string, startDate?: string, endDate?: string) {
    const where: any = { numberId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    return this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}

