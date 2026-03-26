const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({datasources:{db:{url:'postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db'}}});
prisma.user.findMany({take:5}).then(console.log).finally(()=>prisma.$disconnect());
