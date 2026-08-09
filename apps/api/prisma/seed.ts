import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { addDays, todayString, fromDateString } from '../src/lib/dates';

const prisma = new PrismaClient();

/** Seed a demo user with sample habits, categories, and check-ins. */
async function main() {
  const email = 'demo@habit.app';
  const password = 'password123';

  // Upsert demo user.
  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: 'Demo User' },
  });

  // Clean existing data for the demo user to make the seed idempotent.
  await prisma.checkIn.deleteMany({ where: { habit: { userId: user.id } } });
  await prisma.habit.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });

  // Categories.
  const health = await prisma.category.create({
    data: { userId: user.id, name: 'Health', color: '#10b981' },
  });
  const productivity = await prisma.category.create({
    data: { userId: user.id, name: 'Productivity', color: '#3b82f6' },
  });
  const learning = await prisma.category.create({
    data: { userId: user.id, name: 'Learning', color: '#8b5cf6' },
  });

  const today = todayString();

  // Helper to create a habit and backfill check-ins.
  async function createHabitWithHistory(
    data: {
      name: string;
      color: string;
      frequencyType: 'daily' | 'specific_days' | 'weekly';
      frequencyConfig: unknown;
      categoryId: string;
      startDaysAgo: number;
      completionRate: number; // 0..1
    },
  ) {
    const startDate = addDays(today, -data.startDaysAgo);
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: data.name,
        color: data.color,
        frequencyType: data.frequencyType,
        frequencyConfig: JSON.stringify(data.frequencyConfig),
        categoryId: data.categoryId,
        startDate: fromDateString(startDate),
      },
    });

    // Backfill check-ins with a pseudo-random completion pattern.
    for (let i = 0; i < data.startDaysAgo; i++) {
      const date = addDays(today, -i);
      const completed = Math.random() < data.completionRate;
      await prisma.checkIn.create({
        data: { habitId: habit.id, date: fromDateString(date), completed },
      });
    }
    return habit;
  }

  await createHabitWithHistory({
    name: 'Morning Run',
    color: '#10b981',
    frequencyType: 'daily',
    frequencyConfig: { type: 'daily' },
    categoryId: health.id,
    startDaysAgo: 60,
    completionRate: 0.8,
  });

  await createHabitWithHistory({
    name: 'Read 20 pages',
    color: '#8b5cf6',
    frequencyType: 'daily',
    frequencyConfig: { type: 'daily' },
    categoryId: learning.id,
    startDaysAgo: 45,
    completionRate: 0.7,
  });

  await createHabitWithHistory({
    name: 'Gym workout',
    color: '#f59e0b',
    frequencyType: 'specific_days',
    frequencyConfig: { type: 'specific_days', days: [1, 3, 5] }, // Mon, Wed, Fri
    categoryId: health.id,
    startDaysAgo: 90,
    completionRate: 0.75,
  });

  await createHabitWithHistory({
    name: 'Deep work session',
    color: '#3b82f6',
    frequencyType: 'weekly',
    frequencyConfig: { type: 'weekly', timesPerWeek: 4 },
    categoryId: productivity.id,
    startDaysAgo: 30,
    completionRate: 0.85,
  });

  await createHabitWithHistory({
    name: 'Meditate',
    color: '#ec4899',
    frequencyType: 'daily',
    frequencyConfig: { type: 'daily' },
    categoryId: health.id,
    startDaysAgo: 120,
    completionRate: 0.9,
  });

  console.log(`Seeded demo user: ${email} / ${password}`);
  console.log('Categories:', [health.name, productivity.name, learning.name].join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
