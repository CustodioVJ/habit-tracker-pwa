import { z } from 'zod';

/**
 * Shared Zod validation schemas.
 * These are used by the API for input validation and by the web app for forms.
 */

const emailSchema = z.string().trim().email('A valid email is required').max(255);

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const nameSchema = z.string().trim().min(1, 'Name is required').max(100);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/** Register a new user. */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

/** Log in an existing user. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/** Request a password reset. */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/** Reset a password using a token. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

/** Frequency configuration for a habit. */
export const frequencyConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('daily') }),
  z.object({ type: z.literal('weekly'), timesPerWeek: z.number().int().min(1).max(7) }),
  z.object({
    type: z.literal('specific_days'),
    days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  }),
]);

/** Create a habit. */
export const createHabitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value').default('#6366f1'),
  frequencyType: z.enum(['daily', 'weekly', 'specific_days']),
  frequencyConfig: frequencyConfigSchema,
  categoryId: z.string().uuid().optional().nullable(),
  startDate: dateSchema.optional(),
});

/** Update a habit. All fields optional. */
export const updateHabitSchema = createHabitSchema.partial();

/** Create a category. */
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value').default('#6366f1'),
});

/** Update a category. */
export const updateCategorySchema = createCategorySchema.partial();

/** Create or update a check-in. */
export const upsertCheckInSchema = z.object({
  date: dateSchema,
  completed: z.boolean(),
  note: z.string().trim().max(500).optional().nullable(),
});

/** Query params for statistics. */
export const statsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('month'),
});

/** A single date path/query parameter (YYYY-MM-DD). */
export const dateParamSchema = z.object({
  date: dateSchema,
});

/** Query params for listing habits. */
export const listHabitsQuerySchema = z.object({
  includeArchived: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  categoryId: z.string().uuid().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpsertCheckInInput = z.infer<typeof upsertCheckInSchema>;
