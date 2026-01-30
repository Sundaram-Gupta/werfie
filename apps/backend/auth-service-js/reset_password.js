const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetPassword() {
    try {
        const passwordHash = await bcrypt.hash('password123', 10);
        await prisma.user.update({
            where: { email: 'test2@gmail.com' },
            data: { passwordHash }
        });
        console.log('Password reset for test2@gmail.com');
    } catch (e) {
        console.error('Error resetting password:', e);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
