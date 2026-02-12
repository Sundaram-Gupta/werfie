const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedChats() {
    console.log('Starting chat seeding...')

    try {
        // Get or create users
        const johnEmail = 'john@example.com'
        let john = await prisma.user.findUnique({ where: { email: johnEmail }, include: { profile: true } })

        if (!john) {
            john = await prisma.user.create({
                data: {
                    email: johnEmail,
                    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
                    profile: {
                        create: {
                            name: 'John Doe',
                            handle: 'johndoe',
                            bio: 'Software Engineer',
                            isVerified: false
                        }
                    }
                },
                include: { profile: true }
            })
        }

        // Create additional users for conversations
        const users = [
            { email: 'elon@example.com', name: 'Elon Musk', handle: 'elonmusk', bio: 'CEO of X', verified: true },
            { email: 'vercel@example.com', name: 'Vercel', handle: 'vercel', bio: 'Deploy instantly', verified: true },
            { email: 'guillermo@example.com', name: 'Guillermo Rauch', handle: 'rauchg', bio: 'CEO @Vercel', verified: true },
            { email: 'react@example.com', name: 'React', handle: 'reactjs', bio: 'A JavaScript library', verified: true },
            { email: 'tailwind@example.com', name: 'Tailwind CSS', handle: 'tailwindcss', bio: 'Utility-first CSS', verified: true },
            { email: 'linear@example.com', name: 'Linear', handle: 'linear', bio: 'Issue tracking', verified: false },
            { email: 'openai@example.com', name: 'OpenAI', handle: 'openai', bio: 'AI research', verified: true },
            { email: 'github@example.com', name: 'GitHub', handle: 'github', bio: 'Where the world builds', verified: true }
        ]

        const createdUsers = []
        for (const userData of users) {
            // Try to find by email first, then by handle
            let user = await prisma.user.findUnique({
                where: { email: userData.email },
                include: { profile: true }
            })

            if (!user) {
                // Try to find by handle
                const profile = await prisma.profile.findUnique({
                    where: { handle: userData.handle },
                    include: { user: true }
                })

                if (profile) {
                    user = profile.user
                    user.profile = profile
                } else {
                    // Create new user
                    user = await prisma.user.create({
                        data: {
                            email: userData.email,
                            passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
                            profile: {
                                create: {
                                    name: userData.name,
                                    handle: userData.handle,
                                    bio: userData.bio,
                                    isVerified: userData.verified
                                }
                            }
                        },
                        include: { profile: true }
                    })
                }
            }
            createdUsers.push(user)
        }

        console.log(`✓ Users ready: ${createdUsers.length + 1} total`)

        // Create conversations with messages
        const conversations = [
            {
                otherUser: createdUsers[0], // Elon Musk
                messages: [
                    { from: 'other', text: "Let's build a rocket! 🚀", time: new Date(Date.now() - 2 * 60 * 1000) },
                    { from: 'john', text: "It's going great! Just implementing the chat feature now.", time: new Date(Date.now() - 1 * 60 * 1000) },
                    { from: 'other', text: "Nice! Are you using Shaden UI?", time: new Date(Date.now() - 30 * 1000) },
                    { from: 'john', text: "Of course! It looks super clean. 👍", time: new Date(Date.now() - 10 * 1000) },
                    { from: 'other', text: "Can't wait to see it live! 🚀", time: new Date() },
                    { from: 'other', text: "Sending you a preview link shortly.", time: new Date() }
                ]
            },
            {
                otherUser: createdUsers[1], // Vercel
                messages: [
                    { from: 'other', text: "Your deployment is ready.", time: new Date(Date.now() - 4 * 60 * 60 * 1000) }
                ]
            },
            {
                otherUser: createdUsers[2], // Guillermo Rauch
                messages: [
                    { from: 'other', text: "Next.js 15 is insane.", time: new Date(Date.now() - 3 * 60 * 60 * 1000) },
                    { from: 'john', text: "Nice! Are you using Shaden UI?", time: new Date(Date.now() - 2 * 60 * 60 * 1000) }
                ]
            },
            {
                otherUser: createdUsers[3], // React
                messages: [
                    { from: 'other', text: "Have you tried Server Components?", time: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                ]
            },
            {
                otherUser: createdUsers[4], // Tailwind CSS
                messages: [
                    { from: 'other', text: "v4.0 is coming soon!", time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
                ]
            },
            {
                otherUser: createdUsers[5], // Linear
                messages: [
                    { from: 'other', text: "New issue tracking features.", time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
                ]
            },
            {
                otherUser: createdUsers[6], // OpenAI
                messages: [
                    { from: 'other', text: "GPT-5 preview?", time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                ]
            },
            {
                otherUser: createdUsers[7], // GitHub
                messages: [
                    { from: 'other', text: "Copilot X is now available.", time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                ]
            }
        ]

        for (const convData of conversations) {
            // Create conversation
            const conversation = await prisma.conversation.create({
                data: {
                    type: 'direct',
                    participants: {
                        create: [
                            { userId: john.id },
                            { userId: convData.otherUser.id }
                        ]
                    }
                }
            })

            // Create messages
            for (const msg of convData.messages) {
                await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderId: msg.from === 'john' ? john.id : convData.otherUser.id,
                        content: msg.text,
                        createdAt: msg.time
                    }
                })
            }

            console.log(`✓ Created conversation with ${convData.otherUser.profile.name}`)
        }

        console.log('\n✅ Chat seeding completed successfully!')
        console.log(`Created ${conversations.length} conversations with messages`)

    } catch (error) {
        console.error('❌ Error seeding chats:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

seedChats()
