
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function main() {
    try {
        const path = require.resolve('@prisma/client');
        fs.writeFileSync('debug_path.txt', 'Resolved to: ' + path);

        const prisma = new PrismaClient();
        if (prisma.user) {
            fs.appendFileSync('debug_path.txt', '\nUser model exists');
        } else {
            fs.appendFileSync('debug_path.txt', '\nUser model MISSING');
            fs.appendFileSync('debug_path.txt', '\nKeys: ' + Object.keys(prisma).join(', '));
        }
        await prisma.$disconnect();
    } catch (e) {
        fs.writeFileSync('debug_path.txt', 'Error: ' + e.message);
    }
}
main();
