import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_secure_it';

const AUTH_GATEWAY_URL_RAW =
  process.env.AUTH_GATEWAY_URL ||
  process.env.GATEWAY_URL ||
  'http://127.0.0.1:3001';

const AUTH_GATEWAY_URL = /^https?:\/\//i.test(AUTH_GATEWAY_URL_RAW) ? AUTH_GATEWAY_URL_RAW : 'http://127.0.0.1:3001';

const AUTH_LOGIN_URL = `${AUTH_GATEWAY_URL.replace(/\/+$/, '')}/api/auth/login`;

function normalizeEmail(email: unknown) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        const raw = await req.text(); // Read body only once.

        let email: unknown = null;
        let password: unknown = null;

        if (contentType.includes('application/json')) {
            try {
                const parsed = raw ? JSON.parse(raw) : {};
                email = parsed?.email;
                password = parsed?.password;
            } catch {
                // fall through to urlencoded parsing
            }
        }

        if (typeof email !== 'string' || typeof password !== 'string') {
            // Handle `application/x-www-form-urlencoded` or even a plain `email=...&password=...` string.
            try {
                const params = new URLSearchParams(raw);
                email = params.get('email');
                password = params.get('password');
            } catch {
                // keep as null
            }
        }

        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail || typeof password !== 'string') {
            return apiError('Invalid credentials', 401);
        }

        // 1) Validate credentials using the main auth service (it already hashes passwords correctly).
        //    This avoids needing bcrypt in adminBackend.
        let authOk = false;
        try {
            const r = await fetch(AUTH_LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail, password }),
            });
            if (!r.ok) {
                const payload = await r.json().catch(() => null);
                const msg = payload?.message || 'Invalid credentials';
                return apiError(msg, r.status || 401);
            }
            authOk = true;
        } catch (e) {
            console.error('[AdminLogin] Failed to reach auth service:', e);
            return apiError('Login failed (auth service unreachable)', 500);
        }

        if (!authOk) return apiError('Invalid credentials', 401);

        // 2) Fetch user from DB and ensure they have an admin role.
        let user = null;
        try {
            user = await prisma.user.findFirst({
                where: { email: normalizedEmail },
                include: { profile: true },
            });
        } catch (e) {
            console.error('[AdminLogin] Prisma user lookup failed:', e);
            return apiError('Login failed (user lookup error)', 500);
        }

        if (!user) return apiError('Invalid credentials', 401);

        const role = user.role;
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            return apiError('Forbidden: Insufficient permissions', 403);
        }

        // 3) Issue admin JWT (middleware expects payload.role + payload.userId).
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({
            userId: user.id,
            email: user.email,
            role,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);

        return apiSuccess(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.profile?.name || 'Admin User',
                    role,
                    avatar: user.profile?.avatar || null,
                },
                token,
            },
            'Login successful'
        );
    } catch (error) {
        console.error('Login Error:', error);
        const errMsg = error instanceof Error ? error.message : String(error);
        return apiError(`Login failed: ${errMsg}`, 500);
    }
}
