import { apiSuccess } from '@/lib/api-response';

export async function GET() {
    const stats = {
        followers: {
            total: "12.4K",
            growth: "+152"
        },
        views: {
            total: "450K",
            growth: "+12%"
        },
        engagement: {
            rate: "4.8%",
            growth: "+0.5%"
        },
        earnings: {
            total: "$248.50",
            growth: "+$42.00"
        }
    };

    return apiSuccess(stats, 'Creator studio stats fetched successfully');
}
