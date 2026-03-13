/**
 * Reset user1@xclone.com password to "password123"
 * Run: node reset-user1-password.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'user1@xclone.com';
    const newPassword = 'password123';
    const hash = await bcrypt.hash(newPassword, 10);

    // Use raw SQL to avoid schema mismatch
    const result = await prisma.$executeRaw`
        UPDATE "User" SET "passwordHash" = ${hash} WHERE email = ${email}
    `;

    if (result === 0) {
        console.log('User not found:', email);
        process.exit(1);
    }
    console.log('Password reset for', email, 'to', newPassword);
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
