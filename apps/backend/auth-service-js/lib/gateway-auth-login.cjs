/**
 * Login handler callable from Express (server.js). Mirrors app/api/auth/login/route.js
 * so POST /api/auth/login works even when Next.js does not handle the route on the custom server.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

function jsonError(message, statusCode, data = null) {
  return { status: statusCode, json: { status: false, message, data } };
}

function jsonSuccess(data, message = 'Success', statusCode = 200) {
  return { status: statusCode, json: { status: true, message, data: data ?? null } };
}

async function gatewayLogin(body) {
  if (!body || typeof body !== 'object') {
    return jsonError('Request body required', 400, null);
  }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = body.password;
  if (!email || password === undefined || password === null) {
    return jsonError('Validation error', 400, { details: [{ path: ['email', 'password'], message: 'Required' }] });
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return jsonError('Validation error', 400, { details: [{ path: ['email'], message: 'Invalid email' }] });
  }
  if (typeof password !== 'string') {
    return jsonError('Validation error', 400, { details: [{ path: ['password'], message: 'Invalid' }] });
  }

  const p = getPrisma();
  const rows = await p.$queryRaw`SELECT id, email, "passwordHash", "role" FROM "User" WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
  const user = rows[0] || null;
  let profile = null;
  if (user) {
    try {
      const prof = await p.$queryRaw`SELECT * FROM "Profile" WHERE "userId" = ${user.id} LIMIT 1`;
      profile = prof[0] || null;
    } catch (_) {
      /* ignore */
    }
  }

  if (!user) {
    return jsonError('Invalid credentials', 401, null);
  }
  if (!user.passwordHash) {
    return jsonError('Account setup incomplete (no password set)', 400, null);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return jsonError('Invalid credentials', 401, null);
  }

  const { SignJWT } = await import('jose');
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

  const userRole = user.role || 'USER';
  const accessToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: userRole,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRY || '15m')
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: userRole,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(randomUUID())
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRY || '7d')
    .sign(JWT_SECRET);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await p.$executeRaw`
    INSERT INTO "RefreshToken" (id, "userId", token, "expiresAt", "createdAt")
    VALUES (${randomUUID()}, ${user.id}, ${refreshToken}, ${expiresAt}, NOW())
  `;

  return jsonSuccess(
    {
      accessToken,
      refreshToken,
      id: user.id,
      email: user.email,
      profile,
      institutionType: null,
      institutionalProfile: null,
      preferredLanguage: 'en',
    },
    'Login successful'
  );
}

module.exports = { gatewayLogin };
