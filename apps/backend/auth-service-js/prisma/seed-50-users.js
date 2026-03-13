const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creating 50 test users...');

    const password = await bcrypt.hash('password123', 10);

    for (let i = 1; i <= 50; i++) {
        try {
            const user = await prisma.user.create({
                data: {
                    email: `user${i}@xclone.com`,
                    passwordHash: password,
                    profile: {
                        create: {
                            name: `User ${i}`,
                            handle: `user${i}`,
                            bio: `This is the bio for User ${i}. I love X-Clone!`,
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
                            location: 'Internet',
                            website: 'xclone.com',
                        },
                    },
                },
            });

            if (i % 10 === 0) {
                console.log(`✅ Created ${i} users...`);
            }
        } catch (error) {
            if (error.code === 'P2002') {
                console.log(`⚠️  User ${i} already exists, skipping...`);
            } else {
                console.error(`❌ Error creating user ${i}:`, error.message);
            }
        }
    }

    const totalUsers = await prisma.user.count();
    console.log(`\n🎉 Database now has ${totalUsers} users!`);
    console.log('\n📝 Test Credentials:');
    console.log('Email: user1@xclone.com to user50@xclone.com');
    console.log('Password: password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
