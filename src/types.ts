export type Category = 'health' | 'mind' | 'business' | 'avoid'
export type Frequency = 'daily' | 'per_week' | 'limit_week'
export type LogStatus = 'done' | 'missed'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime'

export interface User {
  id: string
  name: string
  timezone: string
  started_on: string
  challenge_days: number
  onboarded: boolean
  character_set: string
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
  time_of_day: TimeOfDay
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
export interface GroupCategoryTally extends Tally {
  category: Category
}
export interface GroupUser {
  id: string
  name: string
  onboarded: boolean
  overall: Tally
  categories: GroupCategoryTally[]
}
export interface GroupStats {
  categories: GroupCategoryTally[]
  users: GroupUser[]
}
export interface GroupHabit {
  habit_id: string
  user_id: string
  user_name: string
  category: Category
  title: string
  frequency: Frequency
  target_count: number
  time_of_day: TimeOfDay
  week_count: number
  status: 'done' | 'missed' | 'open' | 'over' | 'ok'
}
export interface Excuse {
  date: string
  user_id: string
  user_name: string
  habit: string
  category: Category
  reason: string
}

export interface Friend extends User {
  pct: number
  hits: number
  misses: number
  unlogged: number
  day_number: number
  habit_count: number
  streak: { current: number; best: number }
  missed_run: number
}
export interface Member {
  id: string
  name: string
  character_set: string
}

export const CATEGORIES: { key: Category; label: string; blurb: string; color: string }[] = [
  { key: 'health', label: 'Health', blurb: 'Body. Supplements, gym, cardio, sleep.', color: 'var(--color-health)' },
  { key: 'mind', label: 'Mind', blurb: 'Productivity and growth. Reading, chess, meditation.', color: 'var(--color-mind)' },
  { key: 'business', label: 'Business', blurb: 'Money moves. Outreach, building, learning.', color: 'var(--color-business)' },
  { key: 'avoid', label: 'Do Not', blurb: 'Limits. Max 5 games a week, one cheat meal, one rest day.', color: 'var(--color-avoid)' },
]
export const categoryMeta = (c: Category) => CATEGORIES.find((x) => x.key === c)!

/** Time-of-day palette. Validated for colorblind separation and contrast on the dark surface. */
export const TIMES: { key: TimeOfDay; label: string; blurb: string; color: string; icon: string }[] = [
  { key: 'morning', label: 'Morning', blurb: 'Before the day gets you', color: 'var(--color-morning)', icon: '\u2600' },
  { key: 'afternoon', label: 'Afternoon', blurb: 'Midday block', color: 'var(--color-afternoon)', icon: '\u25d0' },
  { key: 'evening', label: 'Evening', blurb: 'Wind-down', color: 'var(--color-evening)', icon: '\u263e' },
  { key: 'anytime', label: 'Anytime', blurb: 'No fixed slot', color: 'var(--color-ink-3)', icon: '\u223c' },
]
export const timeMeta = (t: TimeOfDay) => TIMES.find((x) => x.key === t) ?? TIMES[3]
