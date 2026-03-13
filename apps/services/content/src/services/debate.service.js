/**
 * Debate Service
 * Handles the business logic for the Global Debate Framework Module.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIO } = require('./websocket.service');

class DebateService {

    // ----------------------------------------------------------------------
    // Session Management
    // ----------------------------------------------------------------------

    /**
     * Create a new debate session
     */
    async createSession(data) {
        const session = await prisma.debateSession.create({
            data: {
                title: data.title,
                topic: data.topic,
                participantAId: data.participantAId,
                participantBId: data.participantBId,
                moderatorId: data.moderatorId,
                roundDurationMinutes: data.roundDurationMinutes || 5,
                totalRounds: data.totalRounds || 3,
                status: 'scheduled',
                startTime: data.startTime ? new Date(data.startTime) : null
            }
        });
        return session;
    }

    /**
     * Get a debate session by ID
     */
    async getSessionById(id) {
        return prisma.debateSession.findUnique({
            where: { id },
            include: {
                rounds: {
                    include: {
                        arguments: {
                            include: { factChecks: true }
                        }
                    },
                    orderBy: { roundNumber: 'asc' }
                },
                votes: true
            }
        });
    }

    /**
     * List debate sessions with optional filtering
     */
    async listSessions(filters = {}) {
        return prisma.debateSession.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Update session status (e.g., scheduled -> live -> completed -> archived)
     */
    async updateSessionStatus(id, status) {
        const session = await prisma.debateSession.update({
            where: { id },
            data: { status }
        });

        // Broadcast to WebSocket clients
        if (status === 'live') {
            await prisma.debateSession.update({
                where: { id },
                data: { startTime: new Date() }
            });
            this.emitDebateEvent(id, 'debate.started', session);
        } else if (status === 'completed') {
            await prisma.debateSession.update({
                where: { id },
                data: { endTime: new Date() }
            });
            this.emitDebateEvent(id, 'debate.ended', session);
            // Trigger background job for transcript and summary generation here
            this.generateTranscriptAndSummary(id).catch(err => console.error("Error generating transcript:", err));
        }

        return session;
    }

    // ----------------------------------------------------------------------
    // Round Management
    // ----------------------------------------------------------------------

    /**
     * Start a new round
     */
    async startRound(sessionId, roundNumber, speakerId) {
        const session = await prisma.debateSession.findUnique({ where: { id: sessionId } });
        if (!session || session.status !== 'live') {
            throw new Error('Session is not live.');
        }

        // Close any currently active round
        await prisma.debateRound.updateMany({
            where: { sessionId, status: 'active' },
            data: { status: 'completed', endTime: new Date() }
        });

        const roundDurationMs = session.roundDurationMinutes * 60 * 1000;
        const endTime = new Date(Date.now() + roundDurationMs);

        const round = await prisma.debateRound.create({
            data: {
                sessionId,
                roundNumber,
                speakerId,
                status: 'active',
                startTime: new Date(),
                endTime
            }
        });

        this.emitDebateEvent(sessionId, 'round.started', round);

        // Schedule auto-end of round based on duration
        setTimeout(async () => {
            const currentRound = await prisma.debateRound.findUnique({ where: { id: round.id } });
            if (currentRound && currentRound.status === 'active') {
                await this.endRound(round.id);
            }
        }, roundDurationMs);

        return round;
    }

    /**
     * End a round explicitly
     */
    async endRound(roundId) {
        const round = await prisma.debateRound.update({
            where: { id: roundId },
            data: { status: 'completed', endTime: new Date() }
        });

        this.emitDebateEvent(round.sessionId, 'round.ended', round);
        return round;
    }

    /**
     * Get rounds for a session
     */
    async getRounds(sessionId) {
        return prisma.debateRound.findMany({
            where: { sessionId },
            orderBy: { roundNumber: 'asc' },
            include: { arguments: true }
        });
    }

    // ----------------------------------------------------------------------
    // Argument & Fact-Checking Management
    // ----------------------------------------------------------------------

    /**
     * Post a new argument in the current active round
     */
    async postArgument(roundId, speakerId, argumentText) {
        const round = await prisma.debateRound.findUnique({ where: { id: roundId } });
        if (!round || round.status !== 'active') {
            throw new Error('Round is not active.');
        }
        if (round.speakerId !== speakerId) {
            throw new Error('Not authorized to speak in this round.');
        }
        if (new Date() > round.endTime) {
            await this.endRound(roundId);
            throw new Error('Round time has expired.');
        }

        const argument = await prisma.debateArgument.create({
            data: {
                roundId,
                speakerId,
                argumentText,
                timestamp: new Date()
            }
        });

        this.emitDebateEvent(round.sessionId, 'argument.posted', argument);
        return argument;
    }

    /**
     * Attach a fact check to an argument
     */
    async attachFactCheck(argumentId, reviewerId, data) {
        const factCheck = await prisma.debateFactCheck.create({
            data: {
                argumentId,
                reviewerId,
                referenceTitle: data.referenceTitle,
                referenceUrl: data.referenceUrl,
                notes: data.notes,
                verificationStatus: data.verificationStatus || 'pending'
            },
            include: { argument: true }
        });

        this.emitDebateEvent(factCheck.argument.round.sessionId, 'factcheck.added', factCheck);
        return factCheck;
    }

    // ----------------------------------------------------------------------
    // Voting Management
    // ----------------------------------------------------------------------

    /**
     * Submit a vote structure
     */
    async submitVote(sessionId, userId, voteChoice) {
        const session = await prisma.debateSession.findUnique({ where: { id: sessionId } });
        if (!session || session.status !== 'completed') {
            // Cannot vote on an debate that has not finished
            throw new Error('Voting is only allowed after the debate is completed.');
        }

        const existingVote = await prisma.debateVote.findUnique({
            where: { sessionId_userId: { sessionId, userId } }
        });

        if (existingVote) {
            throw new Error('User has already voted for this session.');
        }

        return prisma.debateVote.create({
            data: {
                sessionId,
                userId,
                voteChoice
            }
        });
    }

    /**
     * Retrieve voting results
     */
    async getResults(sessionId) {
        const votes = await prisma.debateVote.findMany({ where: { sessionId } });
        const results = {
            participant_a: 0,
            participant_b: 0,
            inconclusive: 0,
            total: votes.length
        };

        for (const v of votes) {
            if (results[v.voteChoice] !== undefined) {
                results[v.voteChoice]++;
            }
        }
        return results;
    }

    // ----------------------------------------------------------------------
    // Helper Methods
    // ----------------------------------------------------------------------

    /**
     * Helper to broadcast websocket events for a specific debate room
     */
    emitDebateEvent(sessionId, event, data) {
        const io = getIO();
        if (io) {
            // Debate-level WebSocket room is typically `debate-${sessionId}`
            io.of('/debate-live').to(sessionId).emit(event, data);
        }
    }

    /**
     * Generate transcript and AI summary for a completed session
     */
    async generateTranscriptAndSummary(sessionId) {
        // Fetch session with all rounds and arguments
        const session = await prisma.debateSession.findUnique({
            where: { id: sessionId },
            include: {
                rounds: {
                    include: { arguments: { orderBy: { timestamp: 'asc' } } },
                    orderBy: { roundNumber: 'asc' }
                }
            }
        });

        if (!session) return;

        let transcript = `Transcript for Debate: ${session.title}\nTopic: ${session.topic}\n\n`;

        for (const round of session.rounds) {
            transcript += `--- Round ${round.roundNumber} (Speaker: ${round.speakerId}) ---\n`;
            for (const arg of round.arguments) {
                transcript += `[${arg.timestamp.toISOString()}] ${arg.argumentText}\n\n`;
            }
        }

        // Mock AI Summary for now, actual implementation would call an LLM service via api or utility
        const aiSummary = "This debate covered the core topic effectively. Participant A argued [POINT], while Participant B countered with [POINT]. The moderation was balanced, and a total of " + session.rounds.length + " rounds were conducted.";

        await prisma.debateSession.update({
            where: { id: sessionId },
            data: { transcriptText: transcript, aiSummary }
        });

        console.log(`[DebateService] Transcript and Summary generated for session: ${sessionId}`);
    }
}

module.exports = new DebateService();
