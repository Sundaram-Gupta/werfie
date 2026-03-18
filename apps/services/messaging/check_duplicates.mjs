import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    const allConversations = await prisma.conversation.findMany({
      include: { 
        participants: {
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        }
      }
    });

    console.log('Total conversations:', allConversations.length);

    allConversations.forEach(conv => {
        console.log(`\nConv ID: ${conv.id} (Type: ${conv.type})`);
        conv.participants.forEach(p => {
            const u = p.user;
            const prof = u?.profile;
            console.log(`  - Participant UserID: ${p.userId}, Email: ${u?.email}, Name: ${prof?.name}, Handle: ${prof?.handle}`);
        });
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

checkDuplicates();
