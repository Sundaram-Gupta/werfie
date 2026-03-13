/**
 * Dummy Data for X.com Clone Application
 * 
 * This file contains all mock data used throughout the application including:
 * - Posts (POSTS)
 * - Notifications (NOTIFICATIONS)
 * - Explore content (EXPLORE_DATA)
 * - Communities (COMMUNITIES)
 * - User profiles (USERS)
 * 
 * Data Structures:
 * 
 * @typedef {Object} User
 * @property {string} name - Display name of the user
 * @property {string} handle - Username/handle (without @)
 * @property {string} avatar - URL to user's avatar image
 * @property {boolean} verified - Whether user has verified badge
 * @property {string} [bio] - Optional user biography
 * @property {Object} [stats] - Optional user statistics
 * @property {number} [stats.followers] - Number of followers
 * @property {number} [stats.following] - Number of accounts following
 * 
 * @typedef {Object} PostStats
 * @property {number} comments - Number of comments/replies
 * @property {number} reposts - Number of reposts/retweets
 * @property {number} likes - Number of likes
 * @property {string} views - Formatted view count (e.g., "12M", "450K")
 * 
 * @typedef {Object} Post
 * @property {number} id - Unique post identifier
 * @property {User} user - User who created the post
 * @property {string} content - Post text content
 * @property {string} timestamp - Relative time (e.g., "10m", "1h", "2d")
 * @property {PostStats} stats - Engagement statistics
 * @property {string} [image] - Optional image URL
 * @property {string} [video] - Optional video URL
 * @property {Post} [repost] - Optional reposted post object
 * 
 * @typedef {Object} Notification
 * @property {number} id - Unique notification identifier
 * @property {string} type - Type: "like", "repost", "follow", "mention", "reply"
 * @property {User} user - User who triggered the notification
 * @property {string} content - Notification message
 * @property {string} timestamp - Relative time
 * @property {boolean} read - Whether notification has been read
 * @property {string} [postPreview] - Optional preview of related post
 * 
 * @typedef {Object} TrendingTopic
 * @property {number} id - Unique identifier
 * @property {string} category - Category (e.g., "Politics", "Technology")
 * @property {string} name - Trending topic name/hashtag
 * @property {string} posts - Formatted post count (e.g., "15.4K posts")
 * 
 * @typedef {Object} ExploreArticle
 * @property {number} id - Unique identifier
 * @property {string} category - Article category
 * @property {string} title - Article headline
 * @property {string} image - Article image URL
 * @property {string} source - News source
 * @property {string} time - Relative time
 */

import { BadgeCheck } from "lucide-react"

/**
 * POSTS - Array of post objects for the main feed
 * Each post follows the Post typedef structure defined above
 */
export const POSTS = [
    {
        id: 1,
        user: {
            name: "Elon Musk",
            handle: "elonmusk",
            avatar: "https://github.com/shadcn.png", // Using a placeholder for now
            verified: true,
        },
        content: "We are going to Mars sooner than you think. 🚀🔴",
        timestamp: "10m",
        stats: {
            comments: 5400,
            reposts: 12500,
            likes: 89000,
            views: "12M",
        },
    },
    {
        id: 2,
        user: {
            name: "Vercel",
            handle: "vercel",
            avatar: "https://assets.vercel.com/image/upload/v1607554385/repositories/vercel/logo.png",
            verified: true,
        },
        content: "Next.js 14 is here! ⚡️\n\nExperience faster builds, improved reliability, and new features to help you ship better software.",
        timestamp: "1h",
        stats: {
            comments: 120,
            reposts: 890,
            likes: 3400,
            views: "450K",
        },
    },
    {
        id: 3,
        user: {
            name: "SportsCenter",
            handle: "SportsCenter",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/SportsCenter_logo.svg/1024px-SportsCenter_logo.svg.png",
            verified: true,
        },
        content: "BREAKING: LeBron James has officially become the first player in NBA history to score 40,000 points! 👑🏀 #KingJames",
        timestamp: "2h",
        stats: {
            comments: 3200,
            reposts: 15000,
            likes: 120000,
            views: "25M",
        },
    },
    {
        id: 4,
        user: {
            name: "Tailwind CSS",
            handle: "tailwindcss",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg",
            verified: true,
        },
        content: "Just shipped a new update to Tailwind UI! \n\nCheck out the new application UI overlays and list components. They are wild. 🔥",
        image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2670&auto=format&fit=crop",
        timestamp: "3h",
        stats: {
            comments: 45,
            reposts: 210,
            likes: 1500,
            views: "120K",
        },
    },
    {
        id: 5,
        user: {
            name: "MKBHD",
            handle: "MKBHD",
            avatar: "https://yt3.googleusercontent.com/ytc/AIdro_k7Z_j8J9J_j8J9J_j8J9J_j8J9J_j8J9=s900-c-k-c0x00ffffff-no-rj",
            verified: true,
        },
        content: "The Vision Pro review is finally up. \n\nThis is the hardest video I've ever made. The future is weird.\n\nWatch here: youtu.be/xxxx",
        timestamp: "4h",
        stats: {
            comments: 2100,
            reposts: 4300,
            likes: 65000,
            views: "5.6M",
        },
    },
    {
        id: 6,
        user: {
            name: "OpenAI",
            handle: "OpenAI",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1024px-OpenAI_Logo.svg.png",
            verified: true,
        },
        content: "Announcing GPT-5 (Preview). \n\nMore capable, more reliable, and now with native multimodal capabilities. Available today for Plus users.",
        timestamp: "5h",
        stats: {
            comments: 8900,
            reposts: 25000,
            likes: 150000,
            views: "30M",
        },
    },
    {
        id: 7,
        user: {
            name: "React Team",
            handle: "reactjs",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
            verified: true,
        },
        content: "React Compiler is now open source! ⚛️\n\nNo more useMemo or useCallback. Just write code that runs efficiently by default.",
        timestamp: "6h",
        stats: {
            comments: 560,
            reposts: 3400,
            likes: 12000,
            views: "890K",
        },
    },
    {
        id: 8,
        user: {
            name: "Barack Obama",
            handle: "BarackObama",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/480px-President_Barack_Obama.jpg",
            verified: true,
        },
        content: "Climate change isn't just a distant threat—it's happening now. We need to act boldly to protect our planet for future generations.",
        timestamp: "7h",
        stats: {
            comments: 1500,
            reposts: 12000,
            likes: 95000,
            views: "8.2M",
        },
    },
    {
        id: 9,
        user: {
            name: "TechCrunch",
            handle: "TechCrunch",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/TechCrunch_logo.svg/1024px-TechCrunch_logo.svg.png",
            verified: true,
        },
        content: "Apple just acquired a stealth AI startup for $500M. Here's what we know so far. 🍏🤖",
        timestamp: "8h",
        stats: {
            comments: 230,
            reposts: 890,
            likes: 4500,
            views: "600K",
        },
    },
    {
        id: 10,
        user: {
            name: "Nature Photography",
            handle: "nature_org",
            avatar: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=2670&auto=format&fit=crop",
            verified: false,
        },
        content: "Sunrise in the Dolomites. 🏔️☀️ Simply breathtaking.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2670&auto=format&fit=crop",
        timestamp: "9h",
        stats: {
            comments: 120,
            reposts: 3400,
            likes: 23000,
            views: "1.2M",
        },
    },
    {
        id: 11,
        user: {
            name: "Indie Hacker",
            handle: "indie_dev",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1760&auto=format&fit=crop",
            verified: false,
        },
        content: "Just crossed $10k MRR with my SaaS! 🚀\n\nIt took 3 years of grinding, failed launches, and late nights. \n\nKey takeaway: Consistency > Intensity.",
        timestamp: "10h",
        stats: {
            comments: 89,
            reposts: 120,
            likes: 890,
            views: "45K",
        },
    },
    {
        id: 12,
        user: {
            name: "BBC News",
            handle: "BBCNews",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/1024px-BBC_News_2019.svg.png",
            verified: true,
        },
        content: "Global temperatures hit new record high for the 10th consecutive month, scientists say.",
        timestamp: "11h",
        stats: {
            comments: 3400,
            reposts: 8900,
            likes: 15600,
            views: "4.5M",
        },
    },
    {
        id: 13,
        user: {
            name: "Guillermo Rauch",
            handle: "rauchg",
            avatar: "https://assets.vercel.com/image/upload/v1572248109/front/zeit-day-2019/guillermo-rauch.jpg",
            verified: true,
        },
        content: "If you aren't deploying to the edge, you're living in the past. Latency is the new downtime.",
        timestamp: "12h",
        stats: {
            comments: 140,
            reposts: 560,
            likes: 3200,
            views: "210K",
        },
    },
    {
        id: 14,
        user: {
            name: "Formula 1",
            handle: "F1",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1024px-F1.svg.png",
            verified: true,
        },
        content: "LIGHTS OUT AND AWAY WE GO! 🏎️💨 The 2026 season has officially verified!",
        image: "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?q=80&w=2585&auto=format&fit=crop",
        timestamp: "13h",
        stats: {
            comments: 1200,
            reposts: 8900,
            likes: 67000,
            views: "3.4M",
        },
    },
    {
        id: 15,
        user: {
            name: "GitHub",
            handle: "github",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/1024px-GitHub_Invertocat_Logo.svg.png",
            verified: true,
        },
        content: "Copilot Workspace is changing how developers write code. From issue to pull request in minutes. 💻✨",
        timestamp: "14h",
        stats: {
            comments: 340,
            reposts: 1500,
            likes: 8900,
            views: "900K",
        },
    },
    {
        id: 16,
        user: {
            name: "Netflix",
            handle: "netflix",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1024px-Netflix_2015_logo.svg.png",
            verified: true,
        },
        content: "One more episode. You promise? 📺👀",
        timestamp: "15h",
        stats: {
            comments: 2300,
            reposts: 5600,
            likes: 45000,
            views: "1.5M",
        },
    },
    {
        id: 17,
        user: {
            name: "NASA",
            handle: "NASA",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/1024px-NASA_logo.svg.png",
            verified: true,
        },
        content: "A stunning view of the aurora borealis from the International Space Station. 🌌✨",
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2672&auto=format&fit=crop",
        timestamp: "16h",
        stats: {
            comments: 560,
            reposts: 12000,
            likes: 89000,
            views: "5.6M",
        },
    },
    {
        id: 18,
        user: {
            name: "Coffee Lover",
            handle: "coffeetime",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop",
            verified: false,
        },
        content: "Is it really morning if you haven't had your second cup of coffee yet? ☕️🤔",
        timestamp: "17h",
        stats: {
            comments: 89,
            reposts: 230,
            likes: 1200,
            views: "67K",
        },
    },
    {
        id: 19,
        user: {
            name: "PlayStation",
            handle: "PlayStation",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_logo.svg/1024px-PlayStation_logo.svg.png",
            verified: true,
        },
        content: "The wait is over. GTA VI is coming 2025. 🌴🚗🔫",
        timestamp: "18h",
        stats: {
            comments: 15000,
            reposts: 89000,
            likes: 560000,
            views: "45M",
        },
    },
    {
        id: 20,
        user: {
            name: "TypeScript",
            handle: "typescript",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/1024px-Typescript_logo_2020.svg.png",
            verified: true,
        },
        content: "Did you know? You can use 'satisfies' operator to validate a type without widening it.",
        timestamp: "19h",
        stats: {
            comments: 120,
            reposts: 890,
            likes: 4500,
            views: "230K",
        },
    },
    {
        id: 21,
        user: {
            name: "Ashish",
            handle: "ashish5423",
            avatar: "https://github.com/shadcn.png",
            verified: false
        },
        content: "Just finished building this X clone! It's amazing how fast you can build with React and Tailwind. 🚀 #webdev #coding",
        timestamp: "20h",
        stats: {
            comments: 12,
            reposts: 5,
            likes: 34,
            views: "1.2K"
        }
    },
    {
        id: 22,
        user: {
            name: "Design Daily",
            handle: "designdaily",
            avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=2670&auto=format&fit=crop",
            verified: true
        },
        content: "Typography is the voice of your design. Speak clearly. 🖋️",
        timestamp: "21h",
        stats: {
            comments: 45,
            reposts: 340,
            likes: 2100,
            views: "150K"
        }
    },
    {
        id: 23,
        user: {
            name: "Crypto Whale",
            handle: "cryptowhale",
            avatar: "https://images.unsplash.com/photo-1624969862644-791f3dc98927?q=80&w=2670&auto=format&fit=crop",
            verified: true
        },
        content: "Bitcoin just broke $100k! 🚀🌕 HODL!",
        timestamp: "22h",
        stats: {
            comments: 4500,
            reposts: 12000,
            likes: 45000,
            views: "2.1M"
        }
    },
    {
        id: 24,
        user: {
            name: "Code Memes",
            handle: "codememes",
            avatar: "https://images.unsplash.com/photo-1546027658-7aa750153465?q=80&w=2670&auto=format&fit=crop",
            verified: false
        },
        content: "My code works, I have no idea why. \n\nDon't touch it. ⚠️",
        timestamp: "23h",
        stats: {
            comments: 230,
            reposts: 1500,
            likes: 8900,
            views: "450K"
        }
    },
    {
        id: 25,
        user: {
            name: "React Router",
            handle: "reactrouter",
            avatar: "https://reactrouter.com/_brand/react-router-mark-color.png",
            verified: true
        },
        content: "Client-side routing is just the beginning. 🌍",
        timestamp: "1d",
        stats: {
            comments: 89,
            reposts: 230,
            likes: 1500,
            views: "89K"
        }
    }
];

export const NOTIFICATIONS = [
    {
        id: 1,
        type: 'like',
        user: {
            name: "Elon Musk",
            handle: "elonmusk",
            avatar: "https://github.com/shadcn.png",
            verified: true
        },
        content: "liked your post",
        postText: "Just finished building this X clone! It's amazing how fast you can build with React and Tailwind. 🚀 #webdev #coding",
        timestamp: "2m"
    },
    {
        id: 2,
        type: 'follow',
        user: {
            name: "Vercel",
            handle: "vercel",
            avatar: "https://assets.vercel.com/image/upload/v1607554385/repositories/vercel/logo.png",
            verified: true
        },
        content: "followed you",
        timestamp: "1h"
    },
    {
        id: 3,
        type: 'repost',
        user: {
            name: "Guillermo Rauch",
            handle: "rauchg",
            avatar: "https://assets.vercel.com/image/upload/v1572248109/front/zeit-day-2019/guillermo-rauch.jpg",
            verified: true
        },
        content: "reposted your post",
        postText: "Just finished building this X clone! It's amazing how fast you can build with React and Tailwind. 🚀 #webdev #coding",
        timestamp: "3h"
    },
    {
        id: 4,
        type: 'reply',
        user: {
            name: "Tailwind CSS",
            handle: "tailwindcss",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg",
            verified: true
        },
        content: "replied to your post",
        postText: "Looking slick! 🔥 Make sure to use the new v4 features.",
        replyTo: "Just finished building this X clone! It's amazing how fast...",
        timestamp: "5h"
    },
    {
        id: 5,
        type: 'like',
        user: {
            name: "React Team",
            handle: "reactjs",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
            verified: true
        },
        content: "liked your reply",
        postText: "Can't wait to try the new compiler!",
        timestamp: "1d"
    },
    {
        id: 6,
        type: 'follow',
        user: {
            name: "GitHub",
            handle: "github",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/1024px-GitHub_Invertocat_Logo.svg.png",
            verified: true
        },
        content: "followed you",
        timestamp: "2d"
    },
    {
        id: 7,
        type: 'mention',
        user: {
            name: "MKBHD",
            handle: "MKBHD",
            avatar: "https://yt3.googleusercontent.com/ytc/AIdro_k7Z_j8J9J_j8J9J_j8J9J_j8J9J_j8J9J_j8J9=s900-c-k-c0x00ffffff-no-rj",
            verified: true
        },
        content: "mentioned you",
        postText: "Hey @ashish5423, nice work on that clone! What tech stack did you use?",
        timestamp: "2d"
    },
    {
        id: 8,
        type: 'like',
        user: {
            name: "OpenAI",
            handle: "OpenAI",
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1024px-OpenAI_Logo.svg.png",
            verified: true
        },
        content: "liked your post",
        postText: "AI is changing everything. Adapt or get left behind.",
        timestamp: "3d"
    }
]

export const EXPLORE_DATA = {
    trending: [
        {
            id: 1,
            category: "Technology • Trending",
            name: "#OpenAI",
            posts: "154K posts"
        },
        {
            id: 2,
            category: "Politics • Trending",
            name: "#Elections2026",
            posts: "2.1M posts"
        },
        {
            id: 3,
            category: "Sports • Trending",
            name: "Cristiano Ronaldo",
            posts: "500K posts"
        },
        {
            id: 4,
            category: "Music • Trending",
            name: "Taylor Swift",
            posts: "320K posts"
        },
        {
            id: 5,
            category: "Trending in India",
            name: "#BangaloreTraffic",
            posts: "12K posts"
        }
    ],
    news: [
        {
            id: 101,
            category: "Technology",
            title: "Apple announces new Vision Pro 2 with lighter design and longer battery life.",
            image: "https://picsum.photos/seed/visionpro/400/300",
            source: "The Verge",
            time: "2h ago"
        },
        {
            id: 102,
            category: "Space",
            title: "SpaceX Starship successfully reaches orbit for the first time.",
            image: "https://picsum.photos/seed/spacex/400/300",
            source: "SpaceNews",
            time: "4h ago"
        }
    ],
    sports: [
        {
            id: 201,
            category: "Football",
            title: "Real Madrid signs Mbappe in historic transfer deal.",
            image: "https://picsum.photos/seed/football/400/300",
            source: "ESPN FC",
            time: "1h ago"
        },
        {
            id: 202,
            category: "Cricket",
            title: "India wins the Test series against England with a crushing victory.",
            image: "https://picsum.photos/seed/cricket/400/300",
            source: "Cricinfo",
            time: "3h ago"
        }
    ],
    entertainment: [
        {
            id: 301,
            category: "Movies",
            title: "Christopher Nolan's next movie confirmed: A sci-fi thriller starring Cillian Murphy.",
            image: "https://picsum.photos/seed/nolan/400/300",
            source: "Variety",
            time: "5h ago"
        },
        {
            id: 302,
            category: "Music",
            title: "The Weeknd announces final album as 'The Weeknd'.",
            image: "https://picsum.photos/seed/music/400/300",
            source: "Rolling Stone",
            time: "6h ago"
        }
    ]
}

export const COMMUNITIES_DATA = [
    {
        id: "tech-insiders",
        name: "Tech Insiders",
        description: "The place for deep tech discussions, coding dilemmas, and industry news.",
        avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop",
        banner: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop",
        membersCount: "125K",
        isJoined: true,
        rules: [
            "Be respectful to all members.",
            "No spam or self-promotion.",
            "Keep discussions relevant to technology.",
            "Use appropriate tags for spoilers."
        ],
        moderators: [
            { name: "John Doe", handle: "johndoe", avatar: "https://github.com/shadcn.png" },
            { name: "Jane Smith", handle: "janesmith", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop" }
        ],
        posts: [
            {
                id: 101,
                user: { name: "Alice Dev", handle: "alicedev", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2564&auto=format&fit=crop", verified: false },
                content: "What's everyone's take on the new React compiler? Currently trying it out on a side project.",
                timestamp: "2h",
                stats: { comments: 45, reposts: 12, likes: 340, views: "12K" }
            },
            {
                id: 102,
                user: { name: "Tech Guru", handle: "techguru", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop", verified: true },
                content: "Just dropped a video reviewing the M3 MacBook Air. It's a beast for development! 💻🔥",
                timestamp: "5h",
                stats: { comments: 120, reposts: 50, likes: 1200, views: "45K" }
            }
        ],
        members: [
            { name: "Sarah Connor", handle: "sarahc", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=2576&auto=format&fit=crop" },
            { name: "Kyle Reese", handle: "kyler", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2574&auto=format&fit=crop" }
        ]
    },
    {
        id: "startup-founders",
        name: "Startup Founders",
        description: "Connect with fellow founders, share learnings, and get feedback on your pitch.",
        avatar: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2670&auto=format&fit=crop",
        banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2670&auto=format&fit=crop",
        membersCount: "45K",
        isJoined: false,
        rules: [
            "No solicitation of funds directly.",
            "Constructive criticism only.",
            "Share your wins and losses openly."
        ],
        moderators: [
            { name: "Elon Musk", handle: "elonmusk", avatar: "https://github.com/shadcn.png" }
        ],
        posts: [
            {
                id: 201,
                user: { name: "Indie Hacker", handle: "indie_dev", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1760&auto=format&fit=crop", verified: false },
                content: "How do you handle your first hire? Looking for advice on finding the right engineering lead.",
                timestamp: "1d",
                stats: { comments: 89, reposts: 5, likes: 230, views: "5K" }
            }
        ],
        members: []
    },
    {
        id: "ai-revolution",
        name: "AI Revolution",
        description: "Discussing the latest in LLMs, diffusion models, and the future of AGI.",
        avatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop",
        banner: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2832&auto=format&fit=crop",
        membersCount: "890K",
        isJoined: true,
        rules: ["Cite your sources.", "No doomerism.", "Keep it technical."],
        moderators: [],
        posts: [],
        members: []
    },
    {
        id: "sports-central",
        name: "Sports Central",
        description: "Everything sports. Football, Basketball, Cricket, F1, and more.",
        avatar: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2670&auto=format&fit=crop",
        membersCount: "2.5M",
        isJoined: false,
        rules: [],
        moderators: [],
        posts: [],
        members: []
    },
    {
        id: "movie-buffs",
        name: "Movie Buffs",
        description: "Reviews, trailers, and discussions about cinema.",
        avatar: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop",
        membersCount: "1.2M",
        isJoined: false,
        rules: [],
        moderators: [],
        posts: [],
        members: []
    },
    {
        id: "crypto-talk",
        name: "Crypto Talk",
        description: "Bitcoin, Ethereum, DeFi, and Web3 discussions.",
        avatar: "https://images.unsplash.com/photo-1621504450168-38f6d5ae5884?q=80&w=2670&auto=format&fit=crop",
        membersCount: "670K",
        isJoined: false,
        rules: [],
        moderators: [],
        posts: [],
        members: []
    },
    {
        id: "design-systems",
        name: "Design Systems",
        description: "For UI/UX designers obsessed with consistency and scalability.",
        avatar: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2564&auto=format&fit=crop",
        membersCount: "89K",
        isJoined: true,
        rules: [],
        moderators: [],
        posts: [],
        members: []
    }
]

export const PROFILE_DATA = {
    user: {
        name: "Ashish",
        handle: "ashish5423",
        avatar: "https://github.com/shadcn.png",
        banner: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop",
        bio: "Building the future of web development. 🚀 Full-stack engineer & UI enthusiast. Coffee lover. ☕️",
        location: "San Francisco, CA",
        website: "ashish.dev",
        joinDate: "September 2018",
        following: 245,
        followers: 1250,
        isVerified: true
    },
    posts: [
        {
            id: 'p1',
            user: { name: "Ashish", handle: "ashish5423", avatar: "https://github.com/shadcn.png", verified: true },
            content: "Just shipped a massive update to the platform! The new performance improvements are insane. ⚡️ #webdev #react",
            timestamp: "2h",
            stats: { comments: 12, reposts: 5, likes: 45, views: "1.2K" }
        },
        {
            id: 'p2',
            user: { name: "Ashish", handle: "ashish5423", avatar: "https://github.com/shadcn.png", verified: true },
            content: "Does anyone else feel like CSS Grid is underrated? It literally solves 90% of layout problems.",
            timestamp: "5h",
            stats: { comments: 34, reposts: 12, likes: 128, views: "3.5K" }
        }
    ],
    replies: [
        {
            id: 'r1',
            user: { name: "Ashish", handle: "ashish5423", avatar: "https://github.com/shadcn.png", verified: true },
            content: "Totally agree! It's a game changer.",
            timestamp: "1d",
            rating: "replying to @elonmusk",
            stats: { comments: 2, reposts: 0, likes: 15, views: "500" }
        }
    ],
    media: [
        {
            id: 'm1',
            user: { name: "Ashish", handle: "ashish5423", avatar: "https://github.com/shadcn.png", verified: true },
            content: "Sunset from the office today. 🌇",
            image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop",
            timestamp: "2d",
            stats: { comments: 5, reposts: 2, likes: 89, views: "2K" }
        }
    ],
    likes: [
        {
            id: 'l1',
            user: { name: "Vercel", handle: "vercel", avatar: "https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png", verified: true },
            content: "Next.js 14 is here. Server Actions are now stable.",
            timestamp: "3d",
            stats: { comments: 200, reposts: 1500, likes: 5000, views: "200K" }
        }
    ]
}

export const LISTS_DATA = {
    pinned: [
        { id: 1, name: "Tech News", description: "Latest updates from the tech world", members: "12K Members", avatar: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop" },
        { id: 2, name: "Design Inspiration", description: "UI/UX masterpieces", members: "8.5K Members", avatar: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2564&auto=format&fit=crop" }
    ],
    yours: [
        { id: 3, name: "Startup Founders", description: "People building cool things", members: "15 Members", isPrivate: true },
        { id: 4, name: "React Ecosystem", description: "Libraries and maintainers", members: "45 Members", isPrivate: false },
        { id: 5, name: "Competitors", description: "Keep your friends close...", members: "5 Members", isPrivate: true }
    ],
    discover: [
        { id: 6, name: "Crypto Whales", description: "Big movers in the space", members: "250K Members", owner: "@whale_alert" },
        { id: 7, name: "Formula 1", description: "Drivers, teams, and news", members: "1.2M Members", owner: "@f1_fan" },
        { id: 8, name: "Indie Hackers", description: "Bootstrapping to freedom", members: "89K Members", owner: "@indie_hacker" }
    ]
}

export const BUSINESS_DATA = {
    stats: {
        followers: "+12.5%",
        engagement: "4.8%",
        impressions: "1.2M"
    },
    tools: [
        { title: "Monetization", description: "Generate revenue from your content", icon: "DollarSign", path: null },
        { title: "Promote", description: "Reach a wider audience", icon: "Megaphone", path: "/ads" },
        { title: "Analytics", description: "Understand your audience", icon: "BarChart2", path: "/creator-studio" },
        { title: "Partnerships", description: "Collaborate with brands", icon: "Handshake", path: null }
    ]
}

export const ADS_DATA = {
    campaigns: [
        { id: 1, name: "Summer Sale Promo", status: "Active", budget: ".00", impressions: "45,000", clicks: "1,200" },
        { id: 2, name: "Brand Awareness", status: "Paused", budget: ",200.00", impressions: "120,000", clicks: "850" },
        { id: 3, name: "App Install", status: "Active", budget: ",000.00", impressions: "89,000", clicks: "3,400" }
    ],
    performance: {
        reach: "254K",
        engagement: "12.5K",
        cpc: "/bin/zsh.45"
    }
}

export const SPACES_DATA = {
    upcoming: [
        { id: 1, title: "State of AI 2026", time: "Today, 8:00 PM", host: "Sam Altman", avatar: "https://github.com/shadcn.png" },
        { id: 2, title: "Post-Game Analysis", time: "Tomorrow, 10:00 AM", host: "ESPN", avatar: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2670&auto=format&fit=crop" },
        { id: 3, title: "Indie Hacking 101", time: "Fri, 6:00 PM", host: "Levelsio", avatar: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2670&auto=format&fit=crop" }
    ]
}

export const SETTINGS_DATA = {
    account: {
        username: "@ashish5423",
        email: "ashish***@gmail.com",
        phone: "+1 555-***-**99",
        status: "Active"
    },
    privacy: {
        audience: "Public",
        dm: "Everyone",
        muted: ["@spambot", "@troll123"],
        blocked: []
    },
    security: {
        twoFactor: true,
        passwordLastChanged: "2 months ago",
        activeSessions: 2
    },
    notifications: {
        push: true,
        email: false,
        sms: true
    },
    accessibility: {
        theme: "Dark",
        motion: "Reduce motion"
    }
}
