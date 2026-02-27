const { PrismaClient } = require('@prisma/client');
const websocketService = require('./websocket.service');

const prisma = new PrismaClient();

class SoapboxService {
    /**
     * Create a new soapbox session.
     */
    static async createSession(data) {
        const session = await prisma.soapboxSession.create({
            data: {
                institutionId: data.institutionId,
                leaderId: data.leaderId,
                title: data.title,
                description: data.description,
                startTime: new Date(data.startTime),
                durationMinutes: parseInt(data.durationMinutes),
                status: 'scheduled',
                videoUrl: data.videoUrl
            }
        });

        // Broadcast notification if needed (e.g. system-wide alert)
        // websocketService.broadcastSystemAlert(...)

        return session;
    }

    /**
     * Update an existing session.
     */
    static async updateSession(id, data) {
        return await prisma.soapboxSession.update({
            where: { id },
            data: {
                ...data,
                startTime: data.startTime ? new Date(data.startTime) : undefined,
                durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes) : undefined,
                updatedAt: new Date()
            }
        });
    }

    /**
     * Start a session (Manual or auto).
     */
    static async startSession(id) {
        const session = await prisma.soapboxSession.findUnique({ where: { id } });
        if (!session) throw new Error('Session not found');

        const countdownEndTime = new Date(Date.now() + session.durationMinutes * 60000);

        const updatedSession = await prisma.soapboxSession.update({
            where: { id },
            data: {
                status: 'live',
                countdownEndTime
            }
        });

        websocketService.broadcastSoapboxEvent(updatedSession, 'soapbox.started');
        return updatedSession;
    }

    /**
     * End a session (Manual or auto).
     */
    static async endSession(id) {
        const session = await prisma.soapboxSession.findUnique({
            where: { id },
            include: { statements: { orderBy: { sequenceOrder: 'asc' } } }
        });
        if (!session) throw new Error('Session not found');

        // 1. Generate Transcript
        const transcriptText = session.statements.map(s => {
            const time = new Date(s.timestamp).toLocaleTimeString();
            return `[${time}] Speaker ${s.speakerId}: ${s.content}`;
        }).join('\n\n');

        // 2. Generate AI Summary (Mock)
        const aiSummary = `This session titled "${session.title}" lasted ${session.durationMinutes} minutes. ` +
            `It contained ${session.statements.length} key statements. ` +
            `Key takeaway: The institution addressed public concerns regarding their recent announcements.`;

        const updatedSession = await prisma.soapboxSession.update({
            where: { id },
            data: {
                status: 'completed',
                transcriptText,
                aiSummary
            }
        });

        websocketService.broadcastSoapboxEvent(updatedSession, 'soapbox.ended');
        return updatedSession;
    }

    /**
     * Add a statement to a live session.
     */
    static async addStatement(sessionId, data) {
        const session = await prisma.soapboxSession.findUnique({ where: { id: sessionId } });
        if (!session || session.status !== 'live') {
            throw new Error('Can only add statements to live sessions');
        }

        const lastStatement = await prisma.soapboxStatement.findFirst({
            where: { sessionId },
            orderBy: { sequenceOrder: 'desc' }
        });

        const sequenceOrder = (lastStatement?.sequenceOrder || 0) + 1;

        const statement = await prisma.soapboxStatement.create({
            data: {
                sessionId,
                speakerId: data.speakerId,
                content: data.content,
                sequenceOrder
            }
        });

        websocketService.broadcastSoapboxEvent(statement, 'soapbox.statement_added');
        return statement;
    }

    /**
     * Add a rebuttal to a completed session.
     */
    static async addRebuttal(sessionId, data) {
        const session = await prisma.soapboxSession.findUnique({ where: { id: sessionId } });
        if (!session || session.status !== 'completed') {
            throw new Error('Rebuttals can only be submitted for completed sessions');
        }

        return await prisma.soapboxRebuttal.create({
            data: {
                sessionId,
                institutionId: data.institutionId,
                userId: data.userId,
                rebuttalText: data.rebuttalText,
                moderationStatus: 'pending'
            }
        });
    }

    /**
     * List sessions.
     */
    static async listSessions(filters = {}) {
        return await prisma.soapboxSession.findMany({
            where: filters,
            orderBy: { startTime: 'desc' },
            include: {
                _count: {
                    select: { statements: true, rebuttals: true }
                }
            }
        });
    }

    /**
     * Get session details.
     */
    static async getSession(id) {
        return await prisma.soapboxSession.findUnique({
            where: { id },
            include: {
                statements: { orderBy: { sequenceOrder: 'asc' } },
                rebuttals: {
                    where: { moderationStatus: 'approved' },
                    orderBy: { submittedAt: 'desc' }
                }
            }
        });
    }
}

module.exports = SoapboxService;
