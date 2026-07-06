import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { comparePassword } from '../../common/utils/password.util';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUserResponse, IssuedAuthTokens } from './dto/auth-response.dto';
import type { LoginInput } from './dto/login.dto';
import { AccessTokenPayload } from './strategies/jwt.strategy';
import { AuthenticatedUser } from './types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly auditService: AuditService,
  ) {}

  async login(
    dto: LoginInput,
    ipAddress?: string,
  ): Promise<IssuedAuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await comparePassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    const authUser = this.toAuthUser(user);

    void this.auditService.record({
      actorId: user.id,
      action: 'auth.login',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return { ...tokens, user: authUser };
  }

  async refresh(
    refreshToken: string,
    ipAddress?: string,
  ): Promise<IssuedAuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { roles: { include: { role: true } } } },
      },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(stored.user.id, stored.user.email);
    const authUser = this.toAuthUser(stored.user);

    void this.auditService.record({
      actorId: stored.userId,
      action: 'auth.refresh',
      entityType: 'User',
      entityId: stored.userId,
      ipAddress,
    });

    return { ...tokens, user: authUser };
  }

  async logout(
    user: AuthenticatedUser,
    refreshToken?: string,
    ipAddress?: string,
  ): Promise<{ success: true }> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    void this.auditService.record({
      actorId: user.id,
      action: 'auth.logout',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return { success: true };
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    return this.toAuthUser(user);
  }

  async updateProfile(
    userId: string,
    dto: { firstName?: string; lastName?: string; email?: string },
  ): Promise<AuthUserResponse> {
    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase();
      const existing = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ? dto.email.toLowerCase() : undefined,
      },
      include: { roles: { include: { role: true } } },
    });

    void this.auditService.record({
      actorId: userId,
      action: 'users.update_profile',
      entityType: 'User',
      entityId: userId,
      metadata: { changes: dto },
    });

    return this.toAuthUser(updatedUser);
  }

  private async issueTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jwt = this.configService.get('jwt', { infer: true });

    const accessPayload: AccessTokenPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    const refreshTokenPlain = randomBytes(48).toString('hex');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshTokenPlain),
        expiresAt: this.parseExpiry(jwt.refreshExpiresIn),
      },
    });

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: jwt.accessSecret,
      expiresIn: jwt.accessExpiresIn as `${number}m`,
    });

    return { accessToken, refreshToken: refreshTokenPlain };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * multipliers[unit]);
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    roles: { role: { name: import('@prisma/client').RoleName } }[];
  }): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((r) => r.role.name),
    };
  }
}
