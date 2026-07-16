import { PrismaService } from '../../../database/prisma.service';

/**
 * Looks up the last known display name of a customer from historical message logs.
 */
export async function customerName(
  prisma: PrismaService,
  customerNumber: string,
): Promise<string | null> {
  if (!customerNumber || customerNumber === 'unknown') {
    return null;
  }

  const lastMessage = await prisma.whatsappMessage.findFirst({
    where: {
      customerNumber,
      customerName: { not: null },
    },
    orderBy: { createdOn: 'desc' },
    select: { customerName: true },
  });

  return lastMessage?.customerName ?? null;
}
