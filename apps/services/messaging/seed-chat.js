import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting Robust Chat Seeding...');

    // 1. Fetch Users
    const users = await prisma.$queryRawUnsafe(`
        SELECT id, email FROM public."User" 
        WHERE email IN ('user1@xclone.com', 'user2@xclone.com')
    `);

    if (users.length < 2) {
        console.error('❌ Missing users. Found:', users.map(u => u.email));
        process.exit(1);
    }

    const u1 = users.find(u => u.email === 'user1@xclone.com');
    const u2 = users.find(u => u.email === 'user2@xclone.com');
    console.log(`✅ Using users: ${u1.email} and ${u2.email}`);

    const convoId = randomUUID();

    try {
        // 2. Insert Conversation
        console.log('⏳ Inserting Conversation...');
        await prisma.$executeRawUnsafe(`
            INSERT INTO public."Conversation" (id, type, "updatedAt")
            VALUES ('${convoId}', 'direct', NOW())
        `);
        console.log('✅ Conversation inserted.');

        // 3. Insert Participants
        console.log('⏳ Inserting Participants...');
        const p1Id = randomUUID();
        const p2Id = randomUUID();
        await prisma.$executeRawUnsafe(`
            INSERT INTO public."Participant" (id, "userId", "conversationId", "lastReadAt")
            VALUES 
            ('${p1Id}', '${u1.id}', '${convoId}', NOW()),
            ('${p2Id}', '${u2.id}', '${convoId}', NOW())
        `);
        console.log('✅ Participants inserted.');

        // 4. Insert Messages
        console.log('⏳ Inserting Messages...');
        const msgId = randomUUID();
        await prisma.$executeRawUnsafe(`
            INSERT INTO public."Message" (id, "conversationId", "senderId", content, status, type, "createdAt", "updatedAt")
            VALUES ('${msgId}', '${convoId}', '${u1.id}', 'Hello from seed!', 'read', 'text', NOW(), NOW())
        `);
        console.log('✅ Message 1 inserted.');

        const msg2Id = randomUUID();
        await prisma.$executeRawUnsafe(`
            INSERT INTO public."Message" (id, "conversationId", "senderId", content, status, type, "createdAt", "updatedAt")
            VALUES ('${msg2Id}', '${convoId}', '${u2.id}', 'Reply from seed!', 'read', 'text', NOW(), NOW())
        `);
        console.log('✅ Message 2 inserted.');

        // 5. Update Conversation Metadata
        console.log('⏳ Updating Conversation Meta...');
        // Try adding lastMessageId/At if columns exist
        try {
            await prisma.$executeRawUnsafe(`
                UPDATE public."Conversation" 
                SET "lastMessageId" = '${msg2Id}', "lastMessageAt" = NOW()
                WHERE id = '${convoId}'
            `);
            console.log('✅ Conversation meta updated.');
        } catch (e) {
            console.log('⚠️ Could not update lastMessage (columns might be missing):', e.message.split('\n')[0]);
        }

    } catch (e) {
        console.error('❌ SEEDING FAILED:', e.message);
        process.exit(1);
    }

    console.log('🎉 Seeding Complete!');
}

main().finally(() => prisma.$disconnect());
