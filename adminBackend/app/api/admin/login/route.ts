import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_secure_it';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        // TODO: Replace with real database validation
        // For now, match the frontend's mock credentials
        if (email === 'admin@example.com' && password === 'admin') {

            // Generate a real JWT
            const secret = new TextEncoder().encode(JWT_SECRET);
            const token = await new SignJWT({
                userId: 'admin-123',
                email: email,
                role: 'ADMIN' // Ensure this matches middleware requirement
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('24h')
                .sign(secret);

            return NextResponse.json({
                success: true,
                user: {
                    id: 'admin-123',
                    email: email,
                    name: 'Admin User',
                    role: 'ADMIN',
                    avatar: 'https://github.com/shadcn.png'
                },
                token
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
        );

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}
