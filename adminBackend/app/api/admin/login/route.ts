import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { apiSuccess, apiError } from '@/lib/api-response';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_secure_it';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        // TODO: Replace with real database validation
        if (email === 'admin@example.com' && password === 'admin') {
            const secret = new TextEncoder().encode(JWT_SECRET);
            const token = await new SignJWT({
                userId: 'admin-123',
                email: email,
                role: 'ADMIN'
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('24h')
                .sign(secret);

            return apiSuccess({
                user: {
                    id: 'admin-123',
                    email: email,
                    name: 'Admin User',
                    role: 'ADMIN',
                    avatar: 'https://github.com/shadcn.png'
                },
                token
            }, 'Login successful');
        }

        return apiError('Invalid credentials', 401);
    } catch (error) {
        console.error('Login Error:', error);
        return apiError('Login failed', 500);
    }
}
