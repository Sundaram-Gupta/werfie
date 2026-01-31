import { prisma } from './prisma';
import crypto from 'crypto';

/**
 * Validates an API key from the request headers.
 * Should be used in external-facing microservices.
 */
export async function validateApiKey(apiKey: string) {
    if (!apiKey) return { valid: false, error: 'API key missing' };

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const keyData = await prisma.apiKey.findUnique({
        where: { keyHash }
    });

    if (!keyData) {
        return { valid: false, error: 'Invalid API key' };
    }

    if (keyData.status !== 'active') {
        return { valid: false, error: `API key is ${keyData.status}` };
    }

    if (keyData.expiresAt && new Date() > keyData.expiresAt) {
        return { valid: false, error: 'API key has expired' };
    }

    // Update last used timestamp (async)
    prisma.apiKey.update({
        where: { id: keyData.id },
        data: { lastUsedAt: new Date() }
    }).catch(console.error);

    return {
        valid: true,
        scopes: keyData.scopes,
        environment: keyData.environment,
        rateLimit: keyData.rateLimit
    };
}
