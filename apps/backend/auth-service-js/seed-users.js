const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Load .env manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
        }
    });
}


async function main() {
    const filePath = path.join(__dirname, '../../../userpassword.md');
    console.log(`Reading credentials from ${filePath}...`);

    if (!fs.existsSync(filePath)) {
        console.error('File not found!');
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Skip header and separator lines
    // Data starts from index 4 (0-based) based on the file view
    // Line 0: # User Credentials
    // Line 1: 
    // Line 2: | Handle | Email | Password |
    // Line 3: | :--- | :--- | :--- |
    // Line 4: | @user1 | user1@xclone.com | password123 |

    let count = 0;
    let skipped = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('|') || trimmed.includes('| Handle |') || trimmed.includes('| :---')) {
            continue;
        }

        const parts = trimmed.split('|').map(p => p.trim()).filter(p => p);
        // console.log('Parsed parts:', parts); // Debug
        if (parts.length < 3) {
            console.log('Skipping line (not enough parts):', trimmed);
            continue;
        }

        const [handle, email, password] = parts;

        // Remove '@' from handle if needed, though schema stores handle as string. 
        // Usually handles in DB don't have @, but let's check what the user wants. 
        // The previous register route showed: `handle: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/)`
        // So likely needs the '@' removed.
        const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;

        console.log(`Processing: ${cleanHandle}, ${email}`); // Debug

        try {
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: email },
                        { profile: { handle: cleanHandle } }
                    ]
                }
            });

            if (existingUser) {
                console.log(`User ${email} or handle ${cleanHandle} already exists. Skipping.`);
                skipped++;
                continue;
            }

            const passwordHash = await bcrypt.hash(password, 10);

            await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    // role, status, isVerified have defaults in DB, and Prisma Client is stale so we can't pass them
                    profile: {
                        create: {
                            name: cleanHandle, // Use handle as name for now
                            handle: cleanHandle,
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanHandle}` // Generate a random avatar
                        }
                    }
                }
            });

            console.log(`Created user: ${cleanHandle} (${email})`);
            count++;
        } catch (error) {
            console.error(`Failed to create user ${email}:`, error.message);
        }
    }

    console.log(`\nSummary: Created ${count} users. Skipped ${skipped} users.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
