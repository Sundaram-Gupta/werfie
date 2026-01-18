const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create test users
    const password = await bcrypt.hash('password123', 10)

    const user1 = await prisma.user.create({
        data: {
            email: 'john@example.com',
            passwordHash: password,
            profile: {
                create: {
                    name: 'John Doe',
                    handle: 'johndoe',
                    bio: 'Software Developer | Tech Enthusiast',
                    location: 'San Francisco, CA',
                },
            },
        },
        include: { profile: true },
    })

    const user2 = await prisma.user.create({
        data: {
            email: 'jane@example.com',
            passwordHash: password,
            profile: {
                create: {
                    name: 'Jane Smith',
                    handle: 'janesmith',
                    bio: 'Designer & Creator',
                    location: 'New York, NY',
                },
            },
        },
        include: { profile: true },
    })

    const user3 = await prisma.user.create({
        data: {
            email: 'bob@example.com',
            passwordHash: password,
            profile: {
                create: {
                    name: 'Bob Wilson',
                    handle: 'bobwilson',
                    bio: 'Product Manager | Startup Enthusiast',
                },
            },
        },
        include: { profile: true },
    })

    console.log('✅ Created 3 users')

    // Create some posts
    const post1 = await prisma.post.create({
        data: {
            userId: user1.id,
            content: 'Just finished building an amazing X clone with React and Next.js! 🚀 #webdev #coding',
        },
    })

    const post2 = await prisma.post.create({
        data: {
            userId: user2.id,
            content: 'Design is not just what it looks like. Design is how it works. - Steve Jobs 🎨',
        },
    })

    const post3 = await prisma.post.create({
        data: {
            userId: user3.id,
            content: 'Building products that users love is the ultimate goal. Always listen to feedback! 💡',
        },
    })

    const post4 = await prisma.post.create({
        data: {
            userId: user1.id,
            content: 'TypeScript + React = ❤️ Best combo for building scalable applications!',
        },
    })

    const post5 = await prisma.post.create({
        data: {
            userId: user2.id,
            content: 'Just launched my new design portfolio! Check it out and let me know what you think 🎉',
        },
    })

    console.log('✅ Created 5 posts')

    // Create some follows
    await prisma.follow.create({
        data: {
            followerId: user1.id,
            followingId: user2.id,
        },
    })

    await prisma.follow.create({
        data: {
            followerId: user1.id,
            followingId: user3.id,
        },
    })

    await prisma.follow.create({
        data: {
            followerId: user2.id,
            followingId: user1.id,
        },
    })

    console.log('✅ Created follow relationships')

    // Create some likes
    await prisma.like.create({
        data: {
            postId: post1.id,
            userId: user2.id,
        },
    })

    await prisma.like.create({
        data: {
            postId: post1.id,
            userId: user3.id,
        },
    })

    await prisma.like.create({
        data: {
            postId: post2.id,
            userId: user1.id,
        },
    })

    await prisma.like.create({
        data: {
            postId: post3.id,
            userId: user1.id,
        },
    })

    console.log('✅ Created likes')

    // Create a reply
    await prisma.post.create({
        data: {
            userId: user2.id,
            content: 'Totally agree! React + TypeScript is amazing! 🔥',
            replyToId: post4.id,
        },
    })

    console.log('✅ Created reply')

    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📝 Test Credentials:')
    console.log('Email: john@example.com')
    console.log('Email: jane@example.com')
    console.log('Email: bob@example.com')
    console.log('Password: password123')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
