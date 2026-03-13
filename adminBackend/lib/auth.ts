import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_secure_it';

export async function verifyAuthToken(token: string) {
    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );
        return payload;
    } catch (error) {
        return null;
    }
}

export function hasAdminRole(role: string): boolean {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
