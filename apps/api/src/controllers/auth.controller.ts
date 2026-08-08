import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshUserTokens,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  toPublicUser,
} from '../services/auth.service';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

/** Cookie name for the refresh token. */
const REFRESH_COOKIE = 'refreshToken';

/** Set the refresh token as an httpOnly, secure cookie. */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/** Clear the refresh token cookie. */
function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

/** POST /auth/register */
export async function register(req: Request, res: Response) {
  const { accessToken, refreshToken } = await registerUser(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { email: req.body.email.toLowerCase() } });
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user: toPublicUser(user), accessToken });
}

/** POST /auth/login */
export async function login(req: Request, res: Response) {
  const { accessToken, refreshToken } = await loginUser(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { email: req.body.email.toLowerCase() } });
  setRefreshCookie(res, refreshToken);
  res.json({ user: toPublicUser(user), accessToken });
}

/** POST /auth/refresh */
export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing refresh token' } });
    return;
  }
  const { accessToken, refreshToken } = await refreshUserTokens(token);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
}

/** POST /auth/logout */
export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await logoutUser(token);
  }
  clearRefreshCookie(res);
  res.status(204).send();
}

/** POST /auth/forgot-password */
export async function forgotPassword(req: Request, res: Response) {
  const token = await requestPasswordReset(req.body.email);
  // In a real deployment this token would be emailed. For local dev we return
  // it so the reset flow can be exercised end-to-end.
  res.json({ message: 'If an account exists, a reset link has been sent.', resetToken: token });
}

/** POST /auth/reset-password */
export async function resetPasswordHandler(req: Request, res: Response) {
  await resetPassword(req.body);
  res.json({ message: 'Password has been reset successfully' });
}

/** GET /auth/me */
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json({ user: toPublicUser(user) });
}
