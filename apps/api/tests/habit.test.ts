import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { addDays, todayString } from '../src/lib/dates';

const app = createApp();

describe('Habit API', () => {
  const email = `habit-${Date.now()}@example.com`;
  const password = 'Password123!';
  let token = '';
  let habitId = '';

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    const reg = await request(app).post('/api/v1/auth/register').send({
      email,
      password,
      name: 'Habit Tester',
    });
    token = reg.body.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('creates a daily habit', async () => {
    const res = await request(app)
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Drink water',
        color: '#3b82f6',
        frequencyType: 'daily',
        frequencyConfig: { type: 'daily' },
      });
    expect(res.status).toBe(201);
    expect(res.body.habit.name).toBe('Drink water');
    expect(res.body.habit.streak).toBeDefined();
    habitId = res.body.habit.id;
  });

  it('lists habits', async () => {
    const res = await request(app).get('/api/v1/habits').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.habits.length).toBeGreaterThanOrEqual(1);
  });

  it('updates a habit', async () => {
    const res = await request(app)
      .patch(`/api/v1/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Drink 2L water' });
    expect(res.status).toBe(200);
    expect(res.body.habit.name).toBe('Drink 2L water');
  });

  it('checks in a habit for today', async () => {
    const today = todayString();
    const res = await request(app)
      .put(`/api/v1/habits/${habitId}/check-ins`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, completed: true });
    expect(res.status).toBe(200);
    expect(res.body.checkIn.completed).toBe(true);
    expect(res.body.habit.todayCompleted).toBe(true);
    expect(res.body.habit.streak.current).toBeGreaterThanOrEqual(1);

    const uncheck = await request(app)
      .put(`/api/v1/habits/${habitId}/check-ins`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, completed: false });
    expect(uncheck.status).toBe(200);
    expect(uncheck.body.habit.todayCompleted).toBe(false);
    expect(uncheck.body.habit.streak.current).toBe(0);

    const recheck = await request(app)
      .put(`/api/v1/habits/${habitId}/check-ins`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, completed: true });
    expect(recheck.status).toBe(200);
    expect(recheck.body.habit.todayCompleted).toBe(true);
    expect(recheck.body.habit.streak.current).toBeGreaterThanOrEqual(1);
  });

  it('allows a check-in on any past date', async () => {
    const pastDate = '2000-01-01';
    const res = await request(app)
      .put(`/api/v1/habits/${habitId}/check-ins`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: pastDate, completed: true });

    expect(res.status).toBe(200);
    expect(res.body.checkIn.date).toBe(pastDate);
    expect(res.body.checkIn.completed).toBe(true);
  });

  it('still rejects a check-in on a future date', async () => {
    const futureDate = addDays(todayString(), 1);
    const res = await request(app)
      .put(`/api/v1/habits/${habitId}/check-ins`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: futureDate, completed: true });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Cannot check in for a future date');
  });

  it('reflects today completion in the habit', async () => {
    const res = await request(app)
      .get(`/api/v1/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.habit.todayCompleted).toBe(true);
    expect(res.body.habit.streak.current).toBeGreaterThanOrEqual(1);
  });

  it('archives a habit', async () => {
    const res = await request(app)
      .post(`/api/v1/habits/${habitId}/archive`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.habit.isArchived).toBe(true);
  });

  it('excludes archived habits from default list', async () => {
    const res = await request(app).get('/api/v1/habits').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.habits.find((h: { id: string }) => h.id === habitId)).toBeUndefined();
  });

  it('deletes a habit', async () => {
    const res = await request(app)
      .delete(`/api/v1/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('rejects creating a habit with invalid frequency', async () => {
    const res = await request(app)
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Bad habit',
        color: '#000000',
        frequencyType: 'daily',
        frequencyConfig: { type: 'weekly', timesPerWeek: 3 },
      });
    expect(res.status).toBe(400);
  });
});
