const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Emergency Clear Started...');
  try {
    await prisma.stockMovement.deleteMany({});
  } catch (e) {}
  try {
    await prisma.orderItem.deleteMany({});
  } catch (e) {}
  try {
    await prisma.cartItem.deleteMany({});
  } catch (e) {}
  try {
    await prisma.payment.deleteMany({});
  } catch (e) {}
  try {
    await prisma.order.deleteMany({});
  } catch (e) {}
  try {
    await prisma.productImage.deleteMany({});
  } catch (e) {}
  try {
    await prisma.productVariant.deleteMany({});
  } catch (e) {}
  try {
    await prisma.product.deleteMany({});
  } catch (e) {}
  console.log('All data cleared.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
