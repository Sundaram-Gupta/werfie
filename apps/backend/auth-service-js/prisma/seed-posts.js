const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const postContents = [
    "Just deployed my first microservices app! 🚀 #DevOps #Docker",
    "Learning React hooks has been a game changer for my development workflow",
    "Anyone else excited about the new JavaScript features? #JavaScript #WebDev",
    "TypeScript makes my code so much more maintainable! Highly recommend it",
    "Just finished a great book on system design. Mind = blown 🤯",
    "Coffee + Code = Perfect morning ☕️ #CodingLife",
    "Working on a new side project this weekend. Let's build something cool!",
    "The tech community is amazing. So much to learn from everyone! 🙌",
    "Just got my PR merged! Feeling accomplished today #OpenSource",
    "Debugging is like being a detective in a crime movie where you're also the murderer 😅",
    "Clean code is not written by following a set of rules. You don't become a software craftsman by learning a list of what to do and what not to do.",
    "The best error message is the one that never shows up #UX",
    "Documentation is love. Documentation is life. ❤️",
    "Refactoring legacy code on a Friday afternoon. What could go wrong? 😬",
    "TDD changed the way I write code. No going back now!",
    "Just discovered this amazing VS Code extension. Productivity++",
    "Pair programming session was super productive today! 👥",
    "Remember: Code is read more often than it is written",
    "Excited to attend the tech conference next month! #TechSummit2026",
    "GraphQL or REST? The eternal debate continues... 🤔",
    "Microservices architecture is complex but so powerful when done right",
    "Just pushed to production on a Friday. Living dangerously! 🎲",
    "The best code is no code at all. Second best is simple code.",
    "Learned something new about async/await today. Never stop learning!",
    "Code review feedback is a gift. Embrace it! 🎁",
    "Working remotely has its perks. No commute = more coding time!",
    "Just hit 100 commits on my personal project! 💯",
    "CSS Grid is magic. That is all. ✨",
    "Automated testing saves lives (and weekends)",
    "The cloud is just someone else's computer, but it's a really good computer ☁️",
    "Kubernetes makes orchestration look easy. Spoiler: it's not, but it's worth it",
    "Just optimized our API response time by 50%! Performance matters 🏎️",
    "Reading other people's code is the best way to improve your own",
    "Git commit messages matter. Future you will thank present you!",
    "Responsive design isn't optional anymore. Mobile-first all the way! 📱",
    "Just discovered a bug that's been in production for months. Oops! 🐛",
    "The best developers are the ones who can explain complex things simply",
    "Accessibility isn't a feature, it's a requirement #a11y",
    "Code without tests is broken by design",
    "Just finished a 6-hour debugging session. Found the issue: a missing semicolon 😭",
    "Shoutout to Stack Overflow for saving my life daily 🙏",
    "Version control is not optional. Use Git!",
    "The best time to start learning is now. The second best time is also now.",
    "Just launched my portfolio website! Check it out 🌐",
    "Imposter syndrome is real, but so is your progress. Keep going! 💪",
    "Code reviews make better developers. Change my mind.",
    "Just got my first tech job offer! Dreams do come true! 🎉",
    "Remember to take breaks. Your code will still be there when you get back",
    "The programming language doesn't matter as much as problem-solving skills",
    "Just contributed to an open source project for the first time! Feels amazing! 🌟"
];

async function main() {
    console.log('🌱 Creating posts from multiple users...');

    // Get all users
    const users = await prisma.user.findMany({
        select: { id: true, email: true },
        take: 50
    });

    if (users.length === 0) {
        console.log('❌ No users found. Please seed users first.');
        return;
    }

    console.log(`📝 Found ${users.length} users`);

    let created = 0;
    for (let i = 0; i < postContents.length; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];

        try {
            await prisma.post.create({
                data: {
                    userId: randomUser.id,
                    content: postContents[i],
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last week
                }
            });
            created++;

            if ((i + 1) % 10 === 0) {
                console.log(`✅ Created ${i + 1} posts...`);
            }
        } catch (error) {
            console.error(`❌ Error creating post: ${error.message}`);
        }
    }

    const totalPosts = await prisma.post.count();
    console.log(`\n🎉 Created ${created} new posts!`);
    console.log(`📊 Total posts in database: ${totalPosts}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
