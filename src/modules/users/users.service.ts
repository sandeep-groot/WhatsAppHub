import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginationMeta } from '../../common/dto/pagination.dto';
import type { PaginationQueryInput } from '../../common/dto/pagination.dto';
import { hashPassword } from '../../common/utils/password.util';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import type { CreateUserInput } from './dto/create-user.dto';
import type { UpdateUserInput } from './dto/update-user.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: PaginationQueryInput) {
    const [users, total] = await this.usersRepository.findMany(
      query.page,
      query.limit,
    );
    return {
      items: users.map((user) => this.toResponse(user)),
      meta: paginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponse(user);
  }

  async create(actor: AuthenticatedUser, dto: CreateUserInput) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roleNames: dto.roles,
    });

    void this.auditService.record({
      actorId: actor.id,
      action: 'users.create',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, roles: dto.roles },
    });

    return this.toResponse(user);
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateUserInput) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const user = await this.usersRepository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      roleNames: dto.roles,
    });

    void this.auditService.record({
      actorId: actor.id,
      action: 'users.update',
      entityType: 'User',
      entityId: id,
      metadata: { changes: dto },
    });

    return this.toResponse(user);
  }

  async deactivate(actor: AuthenticatedUser, id: string) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const user = await this.usersRepository.deactivate(id);

    void this.auditService.record({
      actorId: actor.id,
      action: 'users.deactivate',
      entityType: 'User',
      entityId: id,
    });

    return this.toResponse(user);
  }

  private toResponse(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    roles: { role: { name: import('@prisma/client').RoleName } }[];
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: user.roles.map((r) => r.role.name),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
