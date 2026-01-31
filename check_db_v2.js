const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true }
    })
    console.log('Sample Users:', JSON.stringify(users, null, 2))

    const reports = await prisma.report.findMany()
    console.log('Total Reports:', reports.length)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
