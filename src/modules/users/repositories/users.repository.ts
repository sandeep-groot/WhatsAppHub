import { Injectable } from '@nestjs/common';
import { Prisma, RoleName, UserStatus } from '@prisma/client';
import { paginationSkip } from '../../../common/dto/pagination.dto';
import { PrismaService } from '../../../database/prisma.service';

const userInclude = {
  roles: { include: { role: true } },
} satisfies Prisma.UserInclude;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(page: number, limit: number) {
    return this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: paginationSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: userInclude,
      }),
      this.prisma.user.count(),
    ]);
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  create(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    roleNames: RoleName[];
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: {
          create: data.roleNames.map((name) => ({
            role: { connect: { name } },
          })),
        },
      },
      include: userInclude,
    });
  }

  update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      roleNames?: RoleName[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (data.roleNames) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        for (const roleName of data.roleNames) {
          const role = await tx.role.findUniqueOrThrow({
            where: { name: roleName },
          });
          await tx.userRole.create({
            data: { userId: id, roleId: role.id },
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
        include: userInclude,
      });
    });
  }

  deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
      include: userInclude,
    });
  }
}
