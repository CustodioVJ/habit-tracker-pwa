import { CreateCategoryInput, UpdateCategoryInput } from '@habit/shared';
import { prisma } from '../lib/prisma';
import { notFound, forbidden, conflict } from '../lib/errors';

/** Convert a Prisma category to the shared Category type. */
function toCategoryDto(category: {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { habits: number };
}) {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    color: category.color,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    ...(category._count ? { _count: category._count } : {}),
  };
}

/** List categories for a user. */
export async function listCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { habits: true } } },
  });
  return categories.map(toCategoryDto);
}

/** Get a single category owned by the user. */
async function getOwnedCategory(categoryId: string, userId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw notFound('Category not found');
  }
  if (category.userId !== userId) {
    throw forbidden();
  }
  return category;
}

/** Create a category. */
export async function createCategory(userId: string, input: CreateCategoryInput) {
  try {
    const category = await prisma.category.create({
      data: { userId, name: input.name, color: input.color },
    });
    return toCategoryDto(category);
  } catch (err) {
    // Unique constraint on (userId, name).
    if (err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002') {
      throw conflict('A category with this name already exists');
    }
    throw err;
  }
}

/** Update a category. */
export async function updateCategory(categoryId: string, userId: string, input: UpdateCategoryInput) {
  const existing = await getOwnedCategory(categoryId, userId);
  try {
    const category = await prisma.category.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
    });
    return toCategoryDto(category);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002') {
      throw conflict('A category with this name already exists');
    }
    throw err;
  }
}

/** Delete a category. Habits referencing it get categoryId set to null. */
export async function deleteCategory(categoryId: string, userId: string): Promise<void> {
  const existing = await getOwnedCategory(categoryId, userId);
  await prisma.category.delete({ where: { id: existing.id } });
}
