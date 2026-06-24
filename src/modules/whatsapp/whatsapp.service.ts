import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

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

