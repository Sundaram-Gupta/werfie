const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

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

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log(`Total users in database: ${count}`);

    if (count > 0) {
        const user = await prisma.user.findFirst();
        console.log('Sample user:', user.email);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
