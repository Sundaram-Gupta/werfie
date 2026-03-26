const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCols() {
  try {
    const cols = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'VerificationRequest'
    `;
    console.log('Columns:', cols);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkCols();
