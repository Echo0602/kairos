import type { DayItem, FocusSession, Todo } from '@/data/types'
import { addDaysKey, dateKey, todayKey } from './date'
import { buildPlan, planStats } from './plan'

export interface DayStat {
  dateKey: string
  total: number
  done: number
  rate: number
}

const MAX_HISTORY_DAYS = 400

export function historyStart(todos: Todo[], items: DayItem[]): string {
  let earliest = todayKey()
  const consider = (key: string | null | undefined) => {
    if (key && key < earliest) earliest = key
  }
  for (const t of todos) {
    consider(t.startAt != null ? dateKey(new Date(t.startAt)) : null)
    consider(t.dueDate)
    consider(dateKey(new Date(t.createdAt)))
  }
  for (const i of items) consider(i.dateKey)
  const floor = addDaysKey(todayKey(), -MAX_HISTORY_DAYS)
  return earliest < floor ? floor : earliest
}

export function dayStat(todos: Todo[], items: DayItem[], key: string): DayStat {
  const { total, done, rate } = planStats(buildPlan(todos, items, key))
  return { dateKey: key, total, done, rate }
}

export function daySeries(todos: Todo[], items: DayItem[], fromKey: string, toKey: string): DayStat[] {
  const out: DayStat[] = []
  let key = fromKey
  let guard = 0
  while (key <= toKey && guard++ < MAX_HISTORY_DAYS + 30) {
    out.push(dayStat(todos, items, key))
    key = addDaysKey(key, 1)
  }
  return out
}

/**
 * 连续天数：从今天往回数「达标」的天。
 * 达标 = 当天有计划且完成度 ≥ 阈值；无计划的天跳过，不计也不断。
 * 今天尚未达标时不视为中断（一天还没过完）。
 */
export function computeStreak(todos: Todo[], items: DayItem[], threshold: number): number {
  const start = historyStart(todos, items)
  let key = todayKey()
  const today = dayStat(todos, items, key)
  if (today.total === 0 || today.rate < threshold) key = addDaysKey(key, -1)
  let streak = 0
  while (key >= start) {
    const s = dayStat(todos, items, key)
    if (s.total > 0) {
      if (s.rate < threshold) break
      streak += 1
    }
    key = addDaysKey(key, -1)
  }
  return streak
}

export function countQualifiedDays(todos: Todo[], items: DayItem[], threshold: number): number {
  const series = daySeries(todos, items, historyStart(todos, items), todayKey())
  return series.filter((s) => s.total > 0 && s.rate >= threshold).length
}

export function totalDoneItems(todos: Todo[], items: DayItem[]): number {
  const series = daySeries(todos, items, historyStart(todos, items), todayKey())
  return series.reduce((sum, s) => sum + s.done, 0)
}

export function focusMinutes(sessions: FocusSession[]): number {
  return sessions.reduce((sum, s) => {
    if (!s.endedAt) return sum
    return sum + Math.round((s.endedAt - s.startedAt) / 60000)
  }, 0)
}
