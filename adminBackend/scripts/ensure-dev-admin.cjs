/**
 * Create or reset the default admin user (same DB as gateway / user service).
 *
 *   cd adminBackend && npm run ensure-dev-admin
 *
 * Defaults: admin@example.com / admin (matches apps/admin login placeholders)
 *
 * Override: DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD in .env
 */
const path = require('path');
const fs = require('fs');

const envCandidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', 'apps', 'backend', 'auth-service-js', '.env'),
];
for (const p of envCandidates) {
    if (fs.existsSync(p)) require('dotenv').config({ path: p });
}
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to adminBackend/.env or apps/backend/auth-service-js/.env');
    process.exit(1);
}

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const EMAIL = (process.env.DEV_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
const PASSWORD = process.env.DEV_ADMIN_PASSWORD || 'admin';

async function uniqueHandle(prisma, base = 'werfie_super_admin') {
    let h = base;
    for (let i = 0; i < 20; i++) {
        const taken = await prisma.profile.findUnique({ where: { handle: h } });
        if (!taken) return h;
        h = `${base}_${i}`;
    }
    return `${base}_${Date.now()}`;
}

(async () => {
    const prisma = new PrismaClient();
    try {
        const passwordHash = await bcrypt.hash(PASSWORD, 10);
        let user = await prisma.user.findUnique({
            where: { email: EMAIL },
            include: { profile: true },
        });

        if (!user) {
            const handle = await uniqueHandle(prisma);
            await prisma.user.create({
                data: {
                    email: EMAIL,
                    passwordHash,
                    role: 'SUPER_ADMIN',
                    profile: {
                        create: {
                            name: 'Super Admin',
                            handle,
                            bio: 'Dev admin (ensure-dev-admin)',
                        },
                    },
                },
            });
            console.log(`Created admin user: ${EMAIL}`);
        } else {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    role: 'SUPER_ADMIN',
                },
            });
            if (!user.profile) {
                const handle = await uniqueHandle(prisma);
                await prisma.profile.create({
                    data: {
                        userId: user.id,
                        name: 'Super Admin',
                        handle,
                        bio: 'Dev admin (ensure-dev-admin)',
                    },
                });
            }
            console.log(`Updated password + SUPER_ADMIN for: ${EMAIL}`);
        }

        console.log(`\nSign in at the admin panel with:\n  Email:    ${EMAIL}\n  Password: ${'*'.repeat(PASSWORD.length)} (${PASSWORD.length} chars)\n`);
    } finally {
        await prisma.$disconnect();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
