import { PrismaClient, RoleName } from '@prisma/client';
import { hashPassword } from '../../common/utils/password.util';
import { LANGUAGE_CODES } from '../../modules/language-codes/language-codes.constants';
import { WEBHOOK_EVENT_CATALOGUE } from '../../modules/webhooks/webhook-events.constants';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { key: 'clients.read', description: 'View clients' },
  { key: 'clients.write', description: 'Create and update clients' },
  { key: 'connections.read', description: 'View connections' },
  { key: 'connections.update', description: 'Update connections' },
  { key: 'messages.read', description: 'View messages' },
  { key: 'users.manage', description: 'Manage users' },
  { key: 'audit.read', description: 'View audit logs' },
] as const;

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.key),
  OPERATOR: [
    'clients.read',
    'clients.write',
    'connections.read',
    'connections.update',
    'messages.read',
    'audit.read',
  ],
  VIEWER: ['clients.read', 'connections.read', 'messages.read', 'audit.read'],
};

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name} role`,
      },
    });
  }

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS) as [
    RoleName,
    string[],
  ][]) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: roleName },
    });
    for (const key of permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@praxion.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const passwordHash = await hashPassword(adminPassword);
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.ADMIN },
  });

  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      email: adminEmail.toLowerCase(),
      passwordHash,
      firstName: 'Praxion',
      lastName: 'Technologies',
      roles: {
        create: [{ roleId: adminRole.id }],
      },
    },
  });

  // Seed the WhatsApp webhook event type catalogue. isActive is intentionally
  // left untouched on update so admin toggles survive re-seeding.
  for (const entry of WEBHOOK_EVENT_CATALOGUE) {
    await prisma.webhookEventType.upsert({
      where: { type: entry.type },
      update: {
        label: entry.label,
        category: entry.category,
        description: entry.description,
      },
      create: {
        type: entry.type,
        label: entry.label,
        category: entry.category,
        description: entry.description,
      },
    });
  }

  // Seed the supported WhatsApp language codes.
  for (const entry of LANGUAGE_CODES) {
    await prisma.languageCode.upsert({
      where: { code: entry.code },
      update: { language: entry.language },
      create: { language: entry.language, code: entry.code },
    });
  }

  console.log(
    `Seed complete. Admin user: ${adminEmail}. ` +
      `Webhook event types: ${WEBHOOK_EVENT_CATALOGUE.length}. ` +
      `Language codes: ${LANGUAGE_CODES.length}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
