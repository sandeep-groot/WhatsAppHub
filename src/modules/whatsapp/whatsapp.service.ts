import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../database/prisma.service';
import { YcloudMessagesClient } from '../../providers/bsp/ycloud/ycloud-messages.client';
import type { YCloudSendMessagePayload } from '../../providers/bsp/ycloud/ycloud.types';
import { AuditService } from '../audit/audit.service';
import type { SendMessageInput } from './dto/send-message.dto';
import type { WabaBindInput } from './dto/waba-bind.dto';



@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly auditService: AuditService,
    private readonly ycloudMessages: YcloudMessagesClient,
  ) {}

  /**
   * Sends a WhatsApp message (text or template) via YCloud's sendDirectly
   * endpoint, then persists the outbound message to both the dedicated
   * whatsapp_messages table and the dashboard Message log (when the sender
   * number is registered).
   */
  async sendMessage(dto: SendMessageInput, actorId: string) {
    // Build the typed YCloud payload from the validated DTO. The superRefine
    // on the schema guarantees the matching field is present for each type.
    let payload: YCloudSendMessagePayload;
    let messageText: string;

    if (dto.type === 'text') {
      if (!dto.text) {
        throw new BadRequestException('text is required when type is "text".');
      }
      payload = {
        type: 'text',
        from: dto.from,
        to: dto.to,
        text: { body: dto.text.body },
      };
      messageText = dto.text.body;
    } else {
      if (!dto.template) {
        throw new BadRequestException(
          'template is required when type is "template".',
        );
      }
      payload = {
        type: 'template',
        from: dto.from,
        to: dto.to,
        template: dto.template,
      };
      messageText = `[template] ${dto.template.name}`;
    }

    const response = await this.ycloudMessages.sendDirectly(payload);

    const wamid = response.wamid ?? response.id;
    const sendTime = response.sendTime
      ? new Date(response.sendTime)
      : response.createTime
        ? new Date(response.createTime)
        : undefined;

    // 1. Resolve registered business line connection
    const whatsAppNumber = await this.prisma.whatsAppNumber.findUnique({
      where: { phoneNumber: dto.from },
    });

    if (!whatsAppNumber) {
      throw new BadRequestException(`Business number ${dto.from} is not registered.`);
    }

    // 2. Persist to unified whatsapp_messages table (deduplicated by wamid)
    if (wamid) {
      const commonData = {
        wamid,
        wabaId: response.wabaId,
        fromNumber: response.from ?? dto.from,
        toNumber: response.to ?? dto.to,
        customerNumber: response.to ?? dto.to,
        direction: 'OUTBOUND' as const,
        messageType: response.type ?? dto.type,
        messageText: response.text?.body ?? messageText,
        status: response.status ?? 'SENT',
        sendTime,
      };

      await this.prisma.whatsappMessage.upsert({
        where: { wamid },
        create: {
          ...commonData,
          whatsAppNumber: { connect: { id: whatsAppNumber.id } },
        },
        update: commonData,
      });
    }

    // 3. Update stats and checklist
    await this.prisma.whatsAppNumber.update({
      where: { id: whatsAppNumber.id },
      data: { messageCount: { increment: 1 }, lastPing: new Date() },
    });

    this.auditService.record({
      actorId,
      action: 'whatsapp.message.send',
      entityType: 'WhatsappMessage',
      entityId: wamid,
      metadata: {
        from: dto.from,
        to: dto.to,
        type: dto.type,
        status: response.status ?? null,
      },
    });

    return {
      success: true,
      wamid,
      status: response.status,
      message: response,
    };
  }

  async bindWabaAndNumber(dto: WabaBindInput, actorId: string) {
    const ycloudConfig = this.configService.get('ycloud', { infer: true });
    const apiKey = ycloudConfig?.apiKey;

    if (!apiKey || apiKey.trim().length === 0) {
      throw new BadRequestException('YCloud API credentials (YCLOUD_API_KEY) are not configured on the server.');
    }

    this.logger.log(`Initiating YCloud API handshake for WABA: ${dto.wabaId}`);

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

  async getMessages(
    ycloudPhoneId: string,
    customerNumber?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const whatsAppNumber = await this.prisma.whatsAppNumber.findFirst({
      where: {
        OR: [
          { id: ycloudPhoneId },
          { phoneNumberId: ycloudPhoneId },
        ],
      },
    });

    if (!whatsAppNumber) return [];

    const where: any = { numberId: whatsAppNumber.id };

    if (customerNumber) {
      where.customerNumber = customerNumber;
    }

    if (startDate || endDate) {
      where.createdOn = {};
      if (startDate) {
        where.createdOn.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdOn.lte = new Date(endDate);
      }
    }

    return this.prisma.whatsappMessage.findMany({
      where,
      orderBy: { createdOn: customerNumber ? 'asc' : 'desc' }, // Order asc for sequential chat history
      take: 200,
    });
  }

  async getCustomers(ycloudPhoneId: string) {
    const whatsAppNumber = await this.prisma.whatsAppNumber.findFirst({
      where: {
        OR: [
          { id: ycloudPhoneId },
          { phoneNumberId: ycloudPhoneId },
        ],
      },
    });

    if (!whatsAppNumber) return [];

    const messages = await this.prisma.whatsappMessage.findMany({
      where: { numberId: whatsAppNumber.id },
      distinct: ['customerNumber'],
      orderBy: { createdOn: 'desc' },
      select: {
        customerNumber: true,
        customerName: true,
      },
    });

    return messages;
  }
}

