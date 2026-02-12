import { MessagingService } from './services/messaging.service.js'
import { getUserFromRequest, withAuth } from './lib/auth.js'
import { createConversationSchema } from './lib/validations.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
    console.log('🧪 Testing Imports & Prisma...');
    try {
        console.log('✅ MessagingService imported:', !!MessagingService);
        console.log('✅ getUserFromRequest imported:', !!getUserFromRequest);
        console.log('✅ withAuth imported:', !!withAuth);
        console.log('✅ createConversationSchema imported:', !!createConversationSchema);

        const userCount = await prisma.user.count();
        console.log('✅ Prisma connected. User count:', userCount);

        const convs = await MessagingService.getConversations('test-user-id');
        console.log('✅ MessagingService.getConversations called. Count:', convs.length);

        console.log('🎉 All imports and basic checks PASSED!');
    } catch (error) {
        console.error('❌ Test FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
