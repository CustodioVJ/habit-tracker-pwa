import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

describe('Auth API', () => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    // Ensure a clean slate.
    await prisma.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('registers a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email,
      password,
      name: 'Test User',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email,
      password,
      name: 'Test User',
    });
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    const token = login.body.accessToken;
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('validates input and returns 400 for bad payloads', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'short',
      name: '',
    });
    expect(res.status).toBe(400);
  });
});
