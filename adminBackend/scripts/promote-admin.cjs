/**
 * Grant ADMIN role to an existing user (same DB as auth gateway).
 * Usage from repo root:
 *   cd adminBackend && node scripts/promote-admin.cjs you@email.com
 *
 * Then sign in at the admin panel with that email and password.
 */
const { PrismaClient } = require('@prisma/client');

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
    console.error('Usage: node scripts/promote-admin.cjs <email>');
    process.exit(1);
}

const prisma = new PrismaClient();

(async () => {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error(`No user found with email: ${email}`);
            console.error('Register this account in the app first, then run this script again.');
            process.exit(1);
        }
        await prisma.user.update({
            where: { email },
            data: { role: user.role === 'SUPER_ADMIN' ? user.role : 'ADMIN' },
        });
        console.log(`OK: ${email} now has ADMIN role. Use the app password to log in at http://localhost:5175/login`);
    } finally {
        await prisma.$disconnect();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
