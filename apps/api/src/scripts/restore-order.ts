import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shortId = 'FFWJSKHZ';
  const orders = await prisma.order.findMany({
    where: {
      id: { endsWith: shortId.toLowerCase() },
    },
  });

  if (orders.length === 0) {
    console.log('Order not found');
    return;
  }

  const order = orders[0];
  console.log(`Found order ${order.id} with status ${order.status}`);

  if (order.status === 'CANCELLED') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PENDING' },
    });
    console.log('Order status restored to PENDING');
  } else {
    console.log('Order status is not CANCELLED, skipping');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
