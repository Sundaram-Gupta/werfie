const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Explore Items...');

    // Clear existing?
    // await prisma.exploreItem.deleteMany({});

    const items = [
        // News
        {
            category: 'news',
            title: 'Global Climate Summit Reaches Historic Agreement',
            source: 'World News',
            imageUrl: 'https://images.unsplash.com/photo-1621274790572-7c32596bc67f?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
        },
        {
            category: 'news',
            title: 'Tech Giant Unveils Revolutionary Quantum Chip',
            source: 'Tech Daily',
            imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
        },
        {
            category: 'news',
            title: 'New Space Station Module Successfully Docked',
            source: 'Space Watch',
            imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
        },
        {
            category: 'news',
            title: 'Startup Designs Flying Car Prototype',
            source: 'Future Tech',
            imageUrl: 'https://images.unsplash.com/photo-1542223616-9de9adb5e3e8?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 10)
        },
        {
            category: 'news',
            title: 'Ancient City Discovered in Amazon Rainforest',
            source: 'Archaeology Now',
            imageUrl: 'https://images.unsplash.com/photo-1518182170546-0766acfb0238?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
        },
        {
            category: 'news',
            title: 'Breakthrough in Renewable Energy Storage',
            source: 'Green Energy',
            imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 15)
        },

        // Sports
        {
            category: 'sports',
            title: 'Championship Finals: Underdog Team Takes Lead',
            source: 'Sports Central',
            imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bde9be2b?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 30)
        },
        {
            category: 'sports',
            title: 'Record-Breaking Transfer Fee Confirmed for Star Striker',
            source: 'Football Insider',
            imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60)
        },
        {
            category: 'sports',
            title: 'Tennis Legend Announces Retirement After 20 Years',
            source: 'Court Side',
            imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        {
            category: 'sports',
            title: 'Olympics 2028: New Sports Added',
            source: 'Global Sports',
            imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
        },
        {
            category: 'sports',
            title: 'NBA Finals: Game 7 Prediction',
            source: 'Hoops Hype',
            imageUrl: 'https://images.unsplash.com/photo-1519861531473-920026393112?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
        },

        // Entertainment
        {
            category: 'entertainment',
            title: 'Blockbuster Movie Smashes Box Office Records',
            source: 'Movie Weekly',
            imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
        },
        {
            category: 'entertainment',
            title: 'Award Season: Top Contenders Revealed',
            source: 'Hollywood Buzz',
            imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
        },
        {
            category: 'entertainment',
            title: 'Famous Band Announces Reunion Tour',
            source: 'Music News',
            imageUrl: 'https://images.unsplash.com/photo-1501612766622-2788e3093630?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
        },
        {
            category: 'entertainment',
            title: 'Viral Streaming Series Renewed for Season 2',
            source: 'Stream Daily',
            imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        {
            category: 'entertainment',
            title: 'Celebrity Gala: Best Dressed List',
            source: 'Fashion Week',
            imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=1000',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
        }
    ];

    for (const item of items) {
        await prisma.exploreItem.create({ data: item });
        console.log(`Created ${item.category}: ${item.title}`);
    }

    console.log('✅ Explore Items seeded.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
