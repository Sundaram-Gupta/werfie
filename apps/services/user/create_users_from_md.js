const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting user creation from Markdown...');

    // Path to userpassword.md
    const mdPath = path.resolve(__dirname, '../../../userpassword.md');

    if (!fs.existsSync(mdPath)) {
        console.error(`❌ File not found: ${mdPath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(mdPath, 'utf8');
    const lines = content.split('\n');

    // Regex to match table rows: | @handle | email | password |
    const rowRegex = /^\|\s*(@\w+)\s*\|\s*([\w@\.]+)\s*\|\s*(\w+)\s*\|/;

    let createdCount = 0;
    let skippedCount = 0;

    for (const line of lines) {
        const match = line.match(rowRegex);
        if (match) {
            const handleWithAt = match[1].trim(); // @user1
            const handle = handleWithAt.substring(1); // user1
            const email = match[2].trim();
            const password = match[3].trim();
            const name = `User ${handle.replace('user', '')}`; // User 1

            try {
                // Check if user exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: email }
                });

                if (existingUser) {
                    console.log(`⚠️  User ${handle} (${email}) already exists. Skipping.`);
                    skippedCount++;
                    continue;
                }

                const passwordHash = await bcrypt.hash(password, 10);

                await prisma.user.create({
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

                console.log(`✅ Created user: ${handle} (${email})`);
                createdCount++;

            } catch (error) {
                console.error(`❌ Failed to create user ${handle}: ${error.message}`);
            }
        }
    }

    console.log(`\n🎉 Process complete. Created: ${createdCount}, Skipped: ${skippedCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
