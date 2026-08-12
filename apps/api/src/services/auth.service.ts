import argon2 from 'argon2';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

import {
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from '../lib/tokens';
import { conflict, unauthorized, badRequest, notFound } from '../lib/errors';
import { RegisterInput, LoginInput, ResetPasswordInput } from '@habit/shared';

/** Public user shape returned to clients (never includes password hash). */
export function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** Register a new user. Throws 409 if the email is already taken. */
export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw conflict('An account with this email already exists');
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
    },
  });

  return issueTokens(user.id, user.email);
}

/** Log in an existing user. Throws 401 on invalid credentials. */
export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    // Use a generic message to avoid user enumeration.
    throw unauthorized('Invalid email or password');
  }

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) {
    throw unauthorized('Invalid email or password');
  }

  // Record the last successful login time.
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return issueTokens(user.id, user.email);
}

/**
 * Issue a new access token + refresh token pair for a user.
 * The refresh token is a signed JWT; we store its SHA-256 hash in the DB so a
 * leaked DB cannot be used to forge tokens.
 */
async function issueTokens(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email });

  const jti = cryptoRandomId();
  const signedRefresh = signRefreshToken({ sub: userId, jti });
  const tokenHash = hashRefreshToken(signedRefresh);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { accessToken, refreshToken: signedRefresh };
}

/** Rotate a refresh token, returning a new token pair. */
export async function refreshUserTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized('Invalid or expired refresh token');
  }

  const storedHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash: storedHash, userId: payload.sub },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw unauthorized('Invalid or expired refresh token');
  }

  // Delete the used token and issue a new pair (rotation).
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw unauthorized('User no longer exists');
  }

  return issueTokens(user.id, user.email);
}

/** Revoke a refresh token (logout). */
export async function logoutUser(refreshToken: string): Promise<void> {
  const storedHash = hashRefreshToken(refreshToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash: storedHash } });
}

/** Initiate a password reset. Returns a reset token (for email delivery). */
export async function requestPasswordReset(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always return a token to avoid user enumeration, but only sign a real one
  // if the user exists.
  if (!user) {
    return cryptoRandomId();
  }
  // Sign a short-lived token carrying the user id.
  return signAccessToken({ sub: user.id, email: user.email });
}

/** Complete a password reset using a token. */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  let payload;
  try {
    payload = verifyAccessToken(input.token);
  } catch {
    throw badRequest('Invalid or expired reset token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw notFound('User not found');
  }

  const passwordHash = await argon2.hash(input.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Invalidate all refresh tokens after a password reset.
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
}

/** Generate a random id for refresh token jti. */
function cryptoRandomId(): string {
  return crypto.randomBytes(16).toString('hex');
}


