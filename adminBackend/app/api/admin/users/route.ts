import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Filters
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const role = searchParams.get('role');

        // Build query
        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { name: { contains: search, mode: 'insensitive' } } },
                { profile: { handle: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (status) {
            whereClause.status = status;
        }

        if (role) {
            whereClause.role = role;
        }

        // Execute query
        const [users, totalUsers] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    profile: {
                        select: {
                            name: true,
                            handle: true,
                            avatar: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(totalUsers / limit);

        return apiSuccess({
            users,
            pagination: {
                totalUsers,
                currentPage: page,
                totalPages,
                limit
            }
        }, 'Users fetched successfully');

    } catch (error: any) {
        console.error('Fetch Users Error:', error);
        return apiError('Failed to fetch users', 500);
    }
}
