/**
 * Shared domain types for the habit tracker app.
 * These types are used by both the API and the web frontend.
 */

/** Frequency types supported by a habit. */
export type FrequencyType = 'daily' | 'weekly' | 'specific_days';

/** Configuration for a habit's frequency. */
export type FrequencyConfig =
  | { type: 'daily' }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'specific_days'; days: number[] }; // 0 = Sunday ... 6 = Saturday

/** A user account. */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** A category used to group habits. */
export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  /** Number of habits in this category (optional, populated by the API). */
  _count?: { habits: number };
}

/** A habit. */
export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  frequencyType: FrequencyType;
  frequencyConfig: FrequencyConfig;
  categoryId: string | null;
  startDate: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A single check-in for a habit on a given date. */
export interface CheckIn {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note: string | null;
  createdAt: string;
}

/** Streak information for a habit. */
export interface StreakInfo {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}

/** A habit enriched with streak and category data for display. */
export interface HabitWithMeta extends Habit {
  streak: StreakInfo;
  category: Category | null;
  todayCompleted: boolean;
}

/** A single cell in the calendar heatmap. */
export interface HeatmapCell {
  date: string;
  completed: boolean;
  count: number;
}

/** Completion statistics for a habit over a period. */
export interface HabitStats {
  habitId: string;
  period: 'week' | 'month' | 'year';
  totalDue: number;
  totalCompleted: number;
  totalCompletions: number;
  completionRate: number; // 0-100
  currentStreak: number;
  longestStreak: number;
  heatmap: HeatmapCell[];
}

/** Aggregate dashboard statistics. */
export interface DashboardStats {
  totalHabits: number;
  totalCurrentStreak: number;
  totalLongestStreak: number;
  completedToday: number;
  completedThisWeek: number;
}

/** Dashboard payload returned to the frontend. */
export interface DashboardData {
  habits: HabitWithMeta[];
  categories: Category[];
  today: string;
  weekCompletionRate: number;
  monthCompletionRate: number;
  stats: DashboardStats;
}

/** Auth response payload. */
export interface AuthResponse {
  user: User;
  accessToken: string;
}
