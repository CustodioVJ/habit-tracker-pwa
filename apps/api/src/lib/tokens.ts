import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

/** Payload embedded in access tokens. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
}

/** Payload embedded in refresh tokens. */
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

/** Sign a short-lived JWT access token. */
export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/** Verify and decode an access token. Throws on invalid/expired tokens. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  return { sub: decoded.sub as string, email: decoded.email as string };
}

/** Generate a random opaque refresh token and its SHA-256 hash. */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/** Hash a refresh token for storage/comparison. */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Sign a refresh token JWT (used to carry the user id + jti). */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

/** Verify a refresh token JWT. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  return { sub: decoded.sub as string, jti: decoded.jti as string };
}

/** Generate a random token for password reset flows. */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
