import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET() {
    try {
        const templates = await prisma.pushTemplate.findMany({
            orderBy: { name: 'asc' }
        });
        return apiSuccess(templates, 'Push templates fetched successfully');
    } catch (error) {
        return apiError('Failed to fetch push templates', 500);
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

        return apiSuccess(template, 'Push template created successfully');
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
