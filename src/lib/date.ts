import type { Occurrence, Todo } from '@/data/types'

export const WEEKDAY_ZH = ['日', '一', '二', '三', '四', '五', '六']

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** 本地日期键 'YYYY-MM-DD'。 */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function todayKey(): string {
  return dateKey(new Date())
}

/** 日期键 → 本地零点。 */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function addDaysKey(key: string, n: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

export function weekdayOf(key: string): number {
  return parseDateKey(key).getDay()
}

export function diffDays(fromKey: string, toKey: string): number {
  const ms = parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()
  return Math.round(ms / 86400000)
}

export function fmtDateZh(key: string): string {
  const d = parseDateKey(key)
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAY_ZH[d.getDay()]}`
}

export function fmtTime(ts: number): string {
  const d = new Date(ts)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function fmtTimeRange(startAt: number, endAt: number): string {
  return `${fmtTime(startAt)}–${fmtTime(endAt)}`
}

export function relDayLabel(key: string): string {
  const diff = diffDays(todayKey(), key)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  if (diff > 1 && diff < 7) return `周${WEEKDAY_ZH[weekdayOf(key)]}`
  return fmtDateZh(key)
}

export function timeOfDay(ts: number): { h: number; m: number } {
  const d = new Date(ts)
  return { h: d.getHours(), m: d.getMinutes() }
}

export function combineDayTime(key: string, h: number, m: number): number {
  const d = parseDateKey(key)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

/** '14:30' → 毫秒时刻（基于某天）。 */
export function combineDayTimeStr(key: string, hm: string | null): number {
  const [h, m] = (hm ?? '23:59').split(':').map(Number)
  return combineDayTime(key, h, m)
}

/** 剩余毫秒 → '23 分钟' / '1 小时 5 分' / '已开始'。 */
export function fmtCountdown(ms: number): string {
  if (ms <= 0) return '已开始'
  const minutes = Math.ceil(ms / 60000)
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分`
}

/** '23 分钟' 的紧凑形式，用于横幅大数字。 */
export function fmtCountdownParts(ms: number): { main: string; unit: string } {
  if (ms <= 0) return { main: '0', unit: '已开始' }
  const minutes = Math.ceil(ms / 60000)
  if (minutes < 60) return { main: String(minutes), unit: '分钟后' }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? { main: String(h), unit: '小时后' } : { main: `${h}:${pad2(m)}`, unit: '小时后' }
}

/** epoch ms → ICS 的 UTC 时间戳。 */
export function toIcsUtc(ts: number): string {
  const d = new Date(ts)
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  )
}

/** 任务截止时刻；无截止日期返回 null。 */
export function taskDueTs(todo: Todo): number | null {
  if (todo.kind !== 'task' || !todo.dueDate) return null
  return combineDayTimeStr(todo.dueDate, todo.dueTime)
}

/** 展开事件在 [fromKey, toKey] 区间内的所有发生。 */
export function expandEventOccurrences(todo: Todo, fromKey: string, toKey: string): Occurrence[] {
  if (todo.kind !== 'event' || todo.startAt == null) return []
  const baseKey = dateKey(new Date(todo.startAt))
  const { h, m } = timeOfDay(todo.startAt)
  const baseWd = weekdayOf(baseKey)
  const out: Occurrence[] = []
  let cursor = fromKey > baseKey ? fromKey : baseKey
  while (cursor <= toKey) {
    if (todo.repeatUntil && cursor > todo.repeatUntil) break
    const wd = weekdayOf(cursor)
    const match =
      todo.repeat === 'none'
        ? cursor === baseKey
        : todo.repeat === 'daily'
          ? true
          : todo.repeat === 'weekly'
            ? wd === baseWd
            : wd >= 1 && wd <= 5
    if (match) {
      const startAt = combineDayTime(cursor, h, m)
      out.push({
        todoId: todo.id,
        dateKey: cursor,
        startAt,
        endAt: startAt + todo.durationMin * 60000,
        done: todo.completions.includes(cursor),
      })
    }
    if (todo.repeat === 'none') break
    cursor = addDaysKey(cursor, 1)
  }
  return out
}
