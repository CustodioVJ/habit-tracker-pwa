import { UpsertCheckInInput } from '@habit/shared';
import { prisma } from '../lib/prisma';
import { notFound, forbidden, badRequest } from '../lib/errors';
import { fromDateString, toDateString, todayString, addDays } from '../lib/dates';

/** Maximum number of days in the past a check-in can be backfilled. */
const BACKFILL_WINDOW_DAYS = 90;

/** Ensure a habit belongs to the user, else throw. */
async function getOwnedHabit(habitId: string, userId: string) {
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) {
    throw notFound('Habit not found');
  }
  if (habit.userId !== userId) {
    throw forbidden();
  }
  return habit;
}

/** Upsert a check-in for a habit on a given date. */
export async function upsertCheckIn(
  habitId: string,
  userId: string,
  input: UpsertCheckInInput,
  today?: string,
) {
  const habit = await getOwnedHabit(habitId, userId);

  // Enforce backfill window: cannot check in too far in the past or future.
  const todayStr = today ?? todayString();
  const earliest = addDays(todayStr, -BACKFILL_WINDOW_DAYS);
  if (input.date < earliest) {
    throw badRequest(`Cannot backfill more than ${BACKFILL_WINDOW_DAYS} days in the past`);
  }
  if (input.date > todayStr) {
    throw badRequest('Cannot check in for a future date');
  }

  const date = fromDateString(input.date);

  const checkIn = await prisma.checkIn.upsert({
    where: { habitId_date: { habitId, date } },
    create: {
      habitId,
      date,
      completed: input.completed,
      note: input.note ?? null,
    },
    update: {
      completed: input.completed,
      ...(input.note !== undefined ? { note: input.note } : {}),
    },
  });

  return {
    id: checkIn.id,
    habitId: checkIn.habitId,
    date: toDateString(checkIn.date),
    completed: checkIn.completed,
    note: checkIn.note,
    createdAt: checkIn.createdAt.toISOString(),
  };
}

/** Get all check-ins for a habit. */
export async function listCheckIns(habitId: string, userId: string) {
  await getOwnedHabit(habitId, userId);
  const checkIns = await prisma.checkIn.findMany({
    where: { habitId },
    orderBy: { date: 'asc' },
  });
  return checkIns.map((c) => ({
    id: c.id,
    habitId: c.habitId,
    date: toDateString(c.date),
    completed: c.completed,
    note: c.note,
    createdAt: c.createdAt.toISOString(),
  }));
}

/** Delete a check-in for a habit on a given date. */
export async function deleteCheckIn(habitId: string, userId: string, date: string): Promise<void> {
  await getOwnedHabit(habitId, userId);
  await prisma.checkIn.deleteMany({
    where: { habitId, date: fromDateString(date) },
  });
}
