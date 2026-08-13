import { Prisma } from '@prisma/client';
import { CreateHabitInput, UpdateHabitInput, HabitWithMeta, FrequencyConfig } from '@habit/shared';
import { prisma } from '../lib/prisma';
import { notFound, forbidden } from '../lib/errors';
import { computeStreaks } from './streak.service';
import { todayString, fromDateString, toDateString } from '../lib/dates';

/** Prisma habit type including relations we need. */
type HabitWithRelations = Prisma.HabitGetPayload<{
  include: { category: true; checkIns: true };
}>;

/** Convert a Prisma habit to the shared Habit type. */
function toHabitDto(habit: HabitWithRelations) {
  return {
    id: habit.id,
    userId: habit.userId,
    name: habit.name,
    description: habit.description,
    icon: habit.icon,
    color: habit.color,
    frequencyType: habit.frequencyType as HabitWithMeta['frequencyType'],
    frequencyConfig: JSON.parse(habit.frequencyConfig) as FrequencyConfig,
    categoryId: habit.categoryId,
    startDate: toDateString(habit.startDate),
    isArchived: habit.isArchived,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
  };
}

/** Enrich a habit with streak info, category, and today's completion. */
function toHabitWithMeta(habit: HabitWithRelations, today: string): HabitWithMeta {
  const base = toHabitDto(habit);
  const completedDates = habit.checkIns
    .filter((c) => c.completed)
    .map((c) => c.date);

  const streak = computeStreaks(base.startDate, base.frequencyConfig, completedDates, today);

  const todayCheckIn = habit.checkIns.find((c) => c.date === today);

  return {
    ...base,
    streak,
    category: habit.category
      ? {
          id: habit.category.id,
          userId: habit.category.userId,
          name: habit.category.name,
          color: habit.category.color,
          createdAt: habit.category.createdAt.toISOString(),
          updatedAt: habit.category.updatedAt.toISOString(),
        }
      : null,
    todayCompleted: todayCheckIn?.completed ?? false,
  };
}

/** Ensure a habit belongs to the given user, else throw 404/403. */
async function getOwnedHabit(habitId: string, userId: string): Promise<HabitWithRelations> {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { category: true, checkIns: true },
  });
  if (!habit) {
    throw notFound('Habit not found');
  }
  if (habit.userId !== userId) {
    throw forbidden();
  }
  return habit;
}

/** List habits for a user, optionally filtered. */
export async function listHabits(
  userId: string,
  opts: { includeArchived?: boolean; categoryId?: string; today?: string } = {},
): Promise<HabitWithMeta[]> {
  const today = opts.today ?? todayString();
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isArchived: opts.includeArchived ? true : false,
      categoryId: opts.categoryId,
    },
    include: { category: true, checkIns: true },
    orderBy: { createdAt: 'asc' },
  });
  return habits.map((h) => toHabitWithMeta(h, today));
}

/** Get a single habit with meta. */
export async function getHabit(
  habitId: string,
  userId: string,
  today?: string,
): Promise<HabitWithMeta> {
  const habit = await getOwnedHabit(habitId, userId);
  return toHabitWithMeta(habit, today ?? todayString());
}

/** Create a habit. */
export async function createHabit(userId: string, input: CreateHabitInput) {
  const startDate = input.startDate ? fromDateString(input.startDate) : new Date();

  // Validate category ownership if provided.
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category || category.userId !== userId) {
      throw notFound('Category not found');
    }
  }

  const habit = await prisma.habit.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      color: input.color,
      frequencyType: input.frequencyType,
      frequencyConfig: JSON.stringify(input.frequencyConfig),
      categoryId: input.categoryId ?? null,
      startDate,
    },
    include: { category: true, checkIns: true },
  });

  return toHabitWithMeta(habit, todayString());
}

/** Update a habit. */
export async function updateHabit(habitId: string, userId: string, input: UpdateHabitInput) {
  const existing = await getOwnedHabit(habitId, userId);

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category || category.userId !== userId) {
      throw notFound('Category not found');
    }
  }

  const data: Prisma.HabitUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.color !== undefined) data.color = input.color;
  if (input.frequencyType !== undefined) data.frequencyType = input.frequencyType;
  if (input.frequencyConfig !== undefined) {
    data.frequencyConfig = JSON.stringify(input.frequencyConfig);
  }
  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }
  if (input.startDate !== undefined) data.startDate = fromDateString(input.startDate);

  const habit = await prisma.habit.update({
    where: { id: existing.id },
    data,
    include: { category: true, checkIns: true },
  });

  return toHabitWithMeta(habit, todayString());
}

/** Archive (soft-delete) a habit. */
export async function archiveHabit(habitId: string, userId: string) {
  const existing = await getOwnedHabit(habitId, userId);
  const habit = await prisma.habit.update({
    where: { id: existing.id },
    data: { isArchived: true },
    include: { category: true, checkIns: true },
  });
  return toHabitWithMeta(habit, todayString());
}

/** Unarchive a habit. */
export async function unarchiveHabit(habitId: string, userId: string) {
  const existing = await getOwnedHabit(habitId, userId);
  const habit = await prisma.habit.update({
    where: { id: existing.id },
    data: { isArchived: false },
    include: { category: true, checkIns: true },
  });
  return toHabitWithMeta(habit, todayString());
}

/** Permanently delete a habit. */
export async function deleteHabit(habitId: string, userId: string): Promise<void> {
  const existing = await getOwnedHabit(habitId, userId);
  await prisma.habit.delete({ where: { id: existing.id } });
}
