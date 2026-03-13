const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    const usersCreated = [];

    for (let i = 1; i <= 50; i++) {
        const email = `user${i}@xclone.com`;
        const handle = `user${i}`;
        const name = `User ${i}`;

        try {
            // Check if exists
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                console.log(`User ${handle} already exists, skipping.`);
                usersCreated.push({ email, password, handle });
                continue;
            }

            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    profile: {
                        create: {
                            handle,
                            name,
                            bio: `This is the bio for ${name}. I love X-Clone!`,
                            location: 'Internet',
                            website: 'xclone.com',
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`
                        }
                    }
                }
            });

            console.log(`Created user: ${handle}`);
            usersCreated.push({ email, password, handle });
        } catch (e) {
            console.error(`Failed to create ${handle}:`, e.message);
        }
    }

    console.log('✅ Seeding complete.');

    // Generate Metadata File Content
    let mdContent = `# User Credentials\n\n| Handle | Email | Password |\n| :--- | :--- | :--- |\n`;
    usersCreated.forEach(u => {
        mdContent += `| @${u.handle} | ${u.email} | ${u.password} |\n`;
    });

    fs.writeFileSync('../../../userpassword.md', mdContent);
    console.log('📄 Credentials saved to userpassword.md');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
