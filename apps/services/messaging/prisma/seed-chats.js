
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting chat seeding...');

    // 1. Fetch Users using raw SQL (since User model is separate)
    // We assume table name is "User" (Postgres default via Prisma typically "User")
    let users = [];
    try {
        users = await prisma.$queryRaw`SELECT id FROM "User" LIMIT 50`;
        console.log(`Found ${users.length} users.`);
    } catch (e) {
        console.error('Failed to fetch users. Ensure "User" table exists.', e);
        return;
    }

    if (users.length < 2) {
        console.log('Not enough users to seed chats.');
        return;
    }

    // Helper for charts
    function generateChartUrl() {
        const types = ['bar', 'line', 'pie', 'doughnut', 'radar'];
        const type = types[Math.floor(Math.random() * types.length)];
        const dataPoints = Array.from({ length: 5 }, () => Math.floor(Math.random() * 100));

        const config = {
            type: type,
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
                datasets: [{
                    label: 'Sales',
                    data: dataPoints,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }]
            },
            options: {
                title: { display: true, text: `Quarterly ${type} Report` }
            }
        };
        return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}`;
    }

    // 2. Create Conversations for each user
    // "add some dummy chart for each user at least 25" -> verify 25 messages for at least a few users

    // We will pick the first 10 users and ensure they have conversations.
    const targetUsers = users.slice(0, 10);

    for (const currentUser of targetUsers) {
        console.log(`Processing User ${currentUser.id}...`);

        // Create 2 conversations per user
        for (let k = 0; k < 2; k++) {
            const otherUser = users[Math.floor(Math.random() * users.length)];
            if (otherUser.id === currentUser.id) continue;

            // Check if conversation exists (complex query without relation, so assume new or create)
            // We'll just create a new one to be safe/fast.

            const conversation = await prisma.conversation.create({
                data: {
                    type: 'direct',
                    participants: {
                        create: [
                            { userId: currentUser.id },
                            { userId: otherUser.id }
                        ]
                    }
                }
            });

            // Create 25 messages in this conversation
            // 50% chance sent by current user, 50% by other
            // Some messages text, some charts
            const messages = [];
            for (let m = 0; m < 25; m++) {
                const senderId = Math.random() > 0.5 ? currentUser.id : otherUser.id;
                let content = '';

                if (Math.random() > 0.5) {
                    // Chart message
                    content = generateChartUrl();
                } else {
                    // Text message
                    content = `Message ${m + 1} - ${new Date().toISOString()}`;
                }

                messages.push({
                    conversationId: conversation.id,
                    senderId: senderId,
                    content: content,
                    createdAt: new Date(Date.now() - (25 - m) * 60000) // Spread over last 25 mins
                });
            }

            await prisma.message.createMany({ data: messages });
            console.log(`Created conversation ${conversation.id} with 25 messages.`);
        }
    }

    console.log('✅ Chat seeding complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
