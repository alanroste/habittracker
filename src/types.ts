export type Category = 'health' | 'mind' | 'business' | 'avoid'
export type Frequency = 'daily' | 'per_week' | 'limit_week'
export type LogStatus = 'done' | 'missed'

export interface User {
  id: string
  name: string
  timezone: string
  started_on: string
  challenge_days: number
  onboarded: boolean
}
export interface Me extends User {
  today: string
  login_token: string
}
export interface Habit {
  id: string
  category: Category
  title: string
  frequency: Frequency
  target_count: number
  sort_order: number
  starts_on: string
}
export interface DayHabit extends Habit {
  log: { status: LogStatus; count: number; reason: string | null } | null
  week_count: number
}
export interface Tally {
  hits: number
  misses: number
  unlogged: number
  pending: number
  pct: number | null
}
export interface HabitStats extends Habit, Tally {
  week_count: number
}
export interface Stats {
  user: User
  today: string
  day_number: number
  days_total: number
  days_left: number
  end_date: string
  days_logged: number
  days_elapsed: number
  missed_days: { date: string; unlogged: number }[]
  overall: Tally
  categories: (Tally & { category: Category })[]
  habits: HabitStats[]
  daily_history: { date: string; hits: number; misses: number; unlogged: number; pending: number }[]
  weekly_history: { week_start: string; hits: number; misses: number; pending: number }[]
  streak: { current: number; best: number }
  reasons: { date: string; habit: string; category: Category; reason: string }[]
}
export interface Friend extends User {
  pct: number
  hits: number
  misses: number
  unlogged: number
  day_number: number
  habit_count: number
}

export const CATEGORIES: { key: Category; label: string; blurb: string; color: string }[] = [
  { key: 'health', label: 'Health', blurb: 'Body. Supplements, gym, cardio, sleep.', color: 'var(--color-health)' },
  { key: 'mind', label: 'Mind', blurb: 'Productivity and growth. Reading, chess, meditation.', color: 'var(--color-mind)' },
  { key: 'business', label: 'Business', blurb: 'Money moves. Outreach, building, learning.', color: 'var(--color-business)' },
  { key: 'avoid', label: 'Do Not', blurb: 'Limits. Max 5 games a week, one cheat meal, one rest day.', color: 'var(--color-avoid)' },
]
export const categoryMeta = (c: Category) => CATEGORIES.find((x) => x.key === c)!
