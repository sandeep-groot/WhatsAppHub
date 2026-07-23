import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration of existing Client records to client_details...');

  // 1. Fetch all clients
  const clients = await prisma.client.findMany({
    include: {
      numbers: true,
    },
  });

  console.log(`Found ${clients.length} existing clients.`);

  let migratedCount = 0;

  for (const client of clients) {
    // Skip if already linked to client details
    if (client.clientDetailId) {
      console.log(`Client "${client.name}" is already linked. Skipping.`);
      continue;
    }

    // 2. Derive unique email
    const cleanName = client.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const placeholderEmail = `${cleanName || 'client'}_${client.id.toLowerCase()}@example.com`;

    // 3. Find first phone number if available, otherwise placeholder
    const firstNum = client.numbers[0]?.phoneNumber || '+00000000000';

    // 4. Create parent client_details
    console.log(`Creating client_details for client: "${client.name}"`);
    const detail = await prisma.clientDetail.create({
      data: {
        name: client.name,
        email: placeholderEmail,
        phoneNumber: firstNum,
        companyName: client.name,
      },
    });

    // 5. Update client record with foreign key
    await prisma.client.update({
      where: { id: client.id },
      data: {
        clientDetailId: detail.id,
      },
    });

    migratedCount++;
  }

  console.log(`Migration complete. Successfully migrated ${migratedCount} clients.`);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
