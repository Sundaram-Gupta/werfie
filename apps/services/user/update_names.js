const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$executeRaw`
      UPDATE "Profile" 
      SET name = UPPER(LEFT(handle, 1)) || SUBSTRING(handle, 2)
      WHERE name = 'User' OR name IS NULL OR TRIM(name) = '';
    `;
    console.log(`Update successful. Rows affected: ${result}`);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
