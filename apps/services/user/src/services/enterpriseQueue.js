const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const options = process.env.REDIS_URL ? process.env.REDIS_URL : { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD, maxRetriesPerRequest: null };
const connection = new Redis(options);

// Create queues
const alertQueue = new Queue('enterpriseAlerts', { connection });
const emailQueue = new Queue('enterpriseEmails', { connection });

// Alert Worker
const alertWorker = new Worker('enterpriseAlerts', async (job) => {
    console.log(`[Alert Worker] Processing Signal ${job.data.signalId} for rule ${job.data.ruleId}`);
    // Simulated processing inside worker
    const { rule, signal } = job.data;
    const method = rule.deliveryMethod || 'web';

    // Store in DB
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.enterpriseAlertLog.create({
        data: {
            ruleId: rule.id,
            signalId: signal.id,
            deliveryStatus: 'delivered', 
        }
    });

    if (method === 'email') {
        await emailQueue.add('sendEmail', { ruleId: rule.id, userId: rule.userId, signal });
    }
}, { connection });

// Email Worker (Real-time simulation)
const emailWorker = new Worker('enterpriseEmails', async (job) => {
    const { ruleId, userId, signal } = job.data;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            select: { email: true }
        });
        
        console.log(`[Email Worker] REAL-TIME ALERT SENT!`);
        console.log(`[Email Worker] Recipient: ${user?.email || 'Unknown'}`);
        console.log(`[Email Worker] Subject: Alert - Market Signal Detected: ${signal.category}`);
        console.log(`[Email Worker] Body: A ${signal.category} signal was detected in ${signal.region} with an impact score of ${signal.impactScore}.`);
    } catch (e) {
        console.error("[Email Worker] Failed to send email simulation:", e);
    }
}, { connection });


module.exports = {
    alertQueue,
    emailQueue
};
