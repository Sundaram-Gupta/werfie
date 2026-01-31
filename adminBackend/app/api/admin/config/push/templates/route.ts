import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/audit';

export async function GET() {
    try {
        const templates = await prisma.pushTemplate.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const adminId = req.headers.get('x-admin-id') || 'unknown';
        const body = await req.json();
        const { name, title, body: templateBody, category } = body;

        const template = await prisma.pushTemplate.create({
            data: { name, title, body: templateBody, category }
        });

        await logAdminAction(adminId, 'CREATE_PUSH_TEMPLATE', 'PushTemplate', template.id, { name });

        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
