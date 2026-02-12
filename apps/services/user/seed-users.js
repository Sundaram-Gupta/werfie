
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const users = [
    { handle: '@user1', email: 'user1@xclone.com', password: 'password123' },
    { handle: '@user2', email: 'user2@xclone.com', password: 'password123' },
    { handle: '@user3', email: 'user3@xclone.com', password: 'password123' },
    { handle: '@user4', email: 'user4@xclone.com', password: 'password123' },
    { handle: '@user5', email: 'user5@xclone.com', password: 'password123' },
    { handle: '@user6', email: 'user6@xclone.com', password: 'password123' },
    { handle: '@user7', email: 'user7@xclone.com', password: 'password123' },
    { handle: '@user8', email: 'user8@xclone.com', password: 'password123' },
    { handle: '@user9', email: 'user9@xclone.com', password: 'password123' },
    { handle: '@user10', email: 'user10@xclone.com', password: 'password123' },
    { handle: '@user11', email: 'user11@xclone.com', password: 'password123' },
    { handle: '@user12', email: 'user12@xclone.com', password: 'password123' },
    { handle: '@user13', email: 'user13@xclone.com', password: 'password123' },
    { handle: '@user14', email: 'user14@xclone.com', password: 'password123' },
    { handle: '@user15', email: 'user15@xclone.com', password: 'password123' },
    { handle: '@user16', email: 'user16@xclone.com', password: 'password123' },
    { handle: '@user17', email: 'user17@xclone.com', password: 'password123' },
    { handle: '@user18', email: 'user18@xclone.com', password: 'password123' },
    { handle: '@user19', email: 'user19@xclone.com', password: 'password123' },
    { handle: '@user20', email: 'user20@xclone.com', password: 'password123' },
    { handle: '@user21', email: 'user21@xclone.com', password: 'password123' },
    { handle: '@user22', email: 'user22@xclone.com', password: 'password123' },
    { handle: '@user23', email: 'user23@xclone.com', password: 'password123' },
    { handle: '@user24', email: 'user24@xclone.com', password: 'password123' },
    { handle: '@user25', email: 'user25@xclone.com', password: 'password123' },
    { handle: '@user26', email: 'user26@xclone.com', password: 'password123' },
    { handle: '@user27', email: 'user27@xclone.com', password: 'password123' },
    { handle: '@user28', email: 'user28@xclone.com', password: 'password123' },
    { handle: '@user29', email: 'user29@xclone.com', password: 'password123' },
    { handle: '@user30', email: 'user30@xclone.com', password: 'password123' },
    { handle: '@user31', email: 'user31@xclone.com', password: 'password123' },
    { handle: '@user32', email: 'user32@xclone.com', password: 'password123' },
    { handle: '@user33', email: 'user33@xclone.com', password: 'password123' },
    { handle: '@user34', email: 'user34@xclone.com', password: 'password123' },
    { handle: '@user35', email: 'user35@xclone.com', password: 'password123' },
    { handle: '@user36', email: 'user36@xclone.com', password: 'password123' },
    { handle: '@user37', email: 'user37@xclone.com', password: 'password123' },
    { handle: '@user38', email: 'user38@xclone.com', password: 'password123' },
    { handle: '@user39', email: 'user39@xclone.com', password: 'password123' },
    { handle: '@user40', email: 'user40@xclone.com', password: 'password123' },
    { handle: '@user41', email: 'user41@xclone.com', password: 'password123' },
    { handle: '@user42', email: 'user42@xclone.com', password: 'password123' },
    { handle: '@user43', email: 'user43@xclone.com', password: 'password123' },
    { handle: '@user44', email: 'user44@xclone.com', password: 'password123' },
    { handle: '@user45', email: 'user45@xclone.com', password: 'password123' },
    { handle: '@user46', email: 'user46@xclone.com', password: 'password123' },
    { handle: '@user47', email: 'user47@xclone.com', password: 'password123' },
    { handle: '@user48', email: 'user48@xclone.com', password: 'password123' },
    { handle: '@user49', email: 'user49@xclone.com', password: 'password123' },
    { handle: '@user50', email: 'user50@xclone.com', password: 'password123' }
];

async function main() {
    console.log(`🌱 Seeding ${users.length} users...`);

    for (const user of users) {
        const passwordHash = await bcrypt.hash(user.password, 10);

        // Remove @ from handle for storage if needed, or keep as is. 
        // Based on schema, handle is in Profile, email/password in User.

        try {
            const createdUser = await prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: {
                    email: user.email,
                    passwordHash: passwordHash,
                    profile: {
                        create: {
                            name: user.handle, // Using handle as name for now
                            handle: user.handle.replace('@', ''), // Removing @ for handle field
                        }
                    }
                }
            });
            console.log(`✅ Created/Updated: ${user.handle}`);
        } catch (e) {
            console.error(`❌ Failed to seed ${user.handle}:`, e.message);
        }
    }

    console.log('✨ Seeding complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
