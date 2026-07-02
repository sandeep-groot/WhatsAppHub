import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration backfill for existing messages...');

  // 1. Fetch the registered WhatsAppNumber
  const whatsAppNumber = await prisma.whatsAppNumber.findUnique({
    where: { phoneNumber: '+17174300078' },
  });

  if (!whatsAppNumber) {
    console.error('Error: Business number +17174300078 is not registered in database.');
    return;
  }

  console.log(`Resolved WhatsAppNumber Connection ID: ${whatsAppNumber.id}`);

  // 2. Fetch all messages that have missing numberId or customerNumber
  const messages = await prisma.whatsappMessage.findMany({
    where: {
      OR: [
        { numberId: null } as any,
        { customerNumber: null } as any,
      ],
    },
  });

  console.log(`Found ${messages.length} messages requiring backfill.`);

  let updatedCount = 0;

  for (const msg of messages) {
    const isOutbound = msg.fromNumber === whatsAppNumber.phoneNumber;
    const customerNumber = isOutbound
      ? (msg.toNumber ?? 'unknown')
      : (msg.fromNumber ?? 'unknown');
    const direction = isOutbound ? 'OUTBOUND' : 'INBOUND';

    await prisma.whatsappMessage.update({
      where: { id: msg.id },
      data: {
        numberId: whatsAppNumber.id,
        customerNumber,
        direction,
        status: msg.status || (isOutbound ? 'SENT' : 'DELIVERED'),
      },
    });

    updatedCount++;
  }

  console.log(`Successfully backfilled and repaired ${updatedCount} messages.`);
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
