import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const profiles = await prisma.businessProfile.findMany({
            include: {
                user: {
                    include: { profile: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(profiles);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, status } = await req.json();
        const profile = await prisma.businessProfile.update({
            where: { id },
            data: { status }
        });
        return NextResponse.json(profile);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
