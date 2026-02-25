import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const profiles = await prisma.institutionalProfile.findMany({
            where: status ? { status } : {},
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(profiles);
    } catch (error: any) {
        console.error('[Institutional List] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
