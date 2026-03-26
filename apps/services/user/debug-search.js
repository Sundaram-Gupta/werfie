const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const terms = ['Latesh10'];
    const andConditions = terms.map(term => ({
        OR: [
            { profile: { name: { contains: term, mode: 'insensitive' } } },
            { profile: { handle: { contains: term, mode: 'insensitive' } } },
            { email: { contains: term, mode: 'insensitive' } }
        ]
    }));

    const users = await prisma.user.findMany({
        where: { AND: andConditions },
        select: {
            id: true,
            email: true,
            profile: {
                select: {
                    name: true,
                    handle: true
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());
