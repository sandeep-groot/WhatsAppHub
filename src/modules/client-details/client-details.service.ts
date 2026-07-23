import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDetailDto } from './dto/create-client-detail.dto';
import { UpdateClientDetailDto } from './dto/update-client-detail.dto';

@Injectable()
export class ClientDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.clientDetail.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        clients: true,
      },
    });
  }

  async findOne(id: string) {
    const clientDetail = await this.prisma.clientDetail.findUnique({
      where: { id },
      include: {
        clients: true,
      },
    });

    if (!clientDetail) {
      throw new NotFoundException(`Client detail record not found with ID: ${id}`);
    }

    return clientDetail;
  }

  async create(dto: CreateClientDetailDto) {
    const existing = await this.prisma.clientDetail.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('A client with this email address already exists.');
    }

    return this.prisma.clientDetail.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        phoneNumber: dto.phoneNumber,
        companyName: dto.companyName || null,
      },
    });
  }

  async update(id: string, dto: UpdateClientDetailDto) {
    const clientDetail = await this.prisma.clientDetail.findUnique({
      where: { id },
    });

    if (!clientDetail) {
      throw new NotFoundException(`Client detail record not found with ID: ${id}`);
    }

    if (dto.email && dto.email.toLowerCase() !== clientDetail.email) {
      const existing = await this.prisma.clientDetail.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('A client with this email address already exists.');
      }
    }

    return this.prisma.clientDetail.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.email ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : {}),
        ...(dto.companyName !== undefined ? { companyName: dto.companyName } : {}),
      },
    });
  }

  async remove(id: string) {
    const clientDetail = await this.prisma.clientDetail.findUnique({
      where: { id },
      include: {
        clients: true,
      },
    });

    if (!clientDetail) {
      throw new NotFoundException(`Client detail record not found with ID: ${id}`);
    }

    if (clientDetail.clients && clientDetail.clients.length > 0) {
      throw new BadRequestException(
        `Cannot delete client details record that has ${clientDetail.clients.length} active portfolio(s) linked to it.`,
      );
    }

    return this.prisma.clientDetail.delete({
      where: { id },
    });
  }
}
