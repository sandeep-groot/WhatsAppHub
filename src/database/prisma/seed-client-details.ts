import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding manual client and phone details...');

  const wabaId = '1191809157345209';
  const phoneNumber = '+17174300078';
  const phoneNumberId = '1140615095809542';
  const clientName = 'Saffron Market';

  // 1. Upsert Client
  const client = await prisma.client.upsert({
    where: { wabaId },
    update: {
      name: clientName,
      status: 'ACTIVE',
    },
    create: {
      name: clientName,
      wabaId,
      status: 'ACTIVE',
    },
  });
  console.log(`Saved Client: ${client.name} (${client.id})`);

  // 2. Upsert WhatsAppNumber
  const whatsAppNumber = await prisma.whatsAppNumber.upsert({
    where: { phoneNumberId },
    update: {
      phoneNumber,
      wabaId,
      connectionStatus: 'ACTIVE',
      lastPing: new Date(),
    },
    create: {
      clientId: client.id,
      phoneNumber,
      wabaId,
      phoneNumberId,
      connectionStatus: 'ACTIVE',
      lastPing: new Date(),
    },
  });
  console.log(`Saved WhatsAppNumber: ${whatsAppNumber.phoneNumber} (${whatsAppNumber.id})`);

  // 3. Upsert onboarding checklist
  const onboardingSteps = [
    { step: 1, name: 'Account Created', status: 'DONE' },
    { step: 2, name: 'Connected Account', status: 'DONE' },
    { step: 3, name: 'Connected via YCloud', status: 'DONE' },
    { step: 4, name: 'Configure Webhook', status: 'DONE' },
    { step: 5, name: 'Verify API', status: 'DONE' },
    { step: 6, name: 'Mark as Active', status: 'DONE' },
  ];

  for (const step of onboardingSteps) {
    await prisma.onboardingStep.upsert({
      where: {
        numberId_stepNumber: {
          numberId: whatsAppNumber.id,
          stepNumber: step.step,
        },
      },
      update: {
        status: step.status as any,
        notes: `Manually seeded for validation`,
      },
      create: {
        numberId: whatsAppNumber.id,
        stepNumber: step.step,
        status: step.status as any,
        notes: `Manually seeded for validation`,
      },
    });
  }
  console.log('Saved onboarding steps.');
  console.log('Manual seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during manual seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
