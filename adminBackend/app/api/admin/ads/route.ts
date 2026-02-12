import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const campaigns = await prisma.campaign.findMany({
            include: {
                adAccount: {
                    include: {
                        business: {
                            include: {
                                user: {
                                    include: { profile: true }
                                }
                            }
                        }
                    }
                },
                ads: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(campaigns);
    } catch (error) {
        console.error('Error fetching admin campaigns:', error);
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, status } = await req.json();
        const campaign = await prisma.campaign.update({
            where: { id },
            data: { status }
        });
        return NextResponse.json(campaign);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }
}
