import { supabase } from './supabase'
import { getToken } from './session'
import type { Category, DayHabit, Excuse, Frequency, Friend, GroupHabit, GroupStats, Habit, LogStatus, Me, Stats, TimeOfDay } from '../types'

async function rpc<T>(fn: string, args: Record<string, unknown> = {}, token = getToken()): Promise<T> {
  if (!token) throw new Error('No login token. Open your personal link.')
  const { data, error } = await supabase.rpc(fn, { p_token: token, ...args })
  if (error) throw new Error(friendly(error.message))
  return data as T
}

function friendly(msg: string) {
  if (/invalid token/i.test(msg)) return 'That link is not valid.'
  if (/reason required/i.test(msg)) return 'Write a reason first.'
  if (/cannot log the future/i.test(msg)) return "You can't log a day that hasn't happened yet."
  if (/Failed to fetch/i.test(msg)) return 'No connection. Try again.'
  return msg
}

export const api = {
  me: (token?: string) => rpc<Me>('me', {}, token ?? getToken()),
  updateProfile: (name: string, timezone: string) => rpc<Me>('update_profile', { p_name: name, p_timezone: timezone }),
  completeOnboarding: () => rpc<Me>('complete_onboarding'),
  setCharacter: (set: string) => rpc<Me>('set_character', { p_set: set }),
  myHabits: () => rpc<Habit[]>('my_habits'),
  upsertHabit: (h: { id?: string | null; category: Category; title: string; frequency: Frequency; target_count: number; sort_order?: number; time_of_day?: TimeOfDay }) =>
    rpc<Habit>('upsert_habit', {
      p_id: h.id ?? null, p_category: h.category, p_title: h.title,
      p_frequency: h.frequency, p_target_count: h.target_count, p_sort_order: h.sort_order ?? 0,
      p_time_of_day: h.time_of_day ?? 'anytime',
    }),
  setHabitTime: (id: string, time: TimeOfDay) => rpc<Habit>('set_habit_time', { p_id: id, p_time_of_day: time }),
  deleteHabit: (id: string) => rpc<void>('delete_habit', { p_id: id }),
  logHabit: (habitId: string, date: string, status: LogStatus, reason?: string | null, count = 1) =>
    rpc<unknown>('log_habit', { p_habit_id: habitId, p_date: date, p_status: status, p_reason: reason ?? null, p_count: count }),
  clearLog: (habitId: string, date: string) => rpc<void>('clear_log', { p_habit_id: habitId, p_date: date }),
  dayView: (date: string, userId?: string) => rpc<DayHabit[]>('day_view', { p_date: date, p_user_id: userId ?? null }),
  stats: (userId?: string) => rpc<Stats>('stats', { p_user_id: userId ?? null }),
  friends: () => rpc<Friend[]>('friends'),
  groupStats: () => rpc<GroupStats>('group_stats'),
  groupReasons: () => rpc<Excuse[]>('group_reasons'),
  groupHabits: () => rpc<GroupHabit[]>('group_habits'),
}
