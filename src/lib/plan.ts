import type { DayItem, Occurrence, Todo } from '@/data/types'
import { addDaysKey, expandEventOccurrences, taskDueTs, todayKey } from './date'

export type PlanEntry =
  | { type: 'occurrence'; id: string; todo: Todo; occ: Occurrence }
  | { type: 'task'; id: string; todo: Todo; dueTs: number; overdue: boolean }
  | { type: 'item'; id: string; item: DayItem }

export function entryTitle(e: PlanEntry): string {
  return e.type === 'item' ? e.item.title : e.todo.title
}

export function entryDone(e: PlanEntry): boolean {
  if (e.type === 'occurrence') return e.occ.done
  if (e.type === 'task') return e.todo.completions.includes(e.todo.dueDate ?? '')
  return e.item.done
}

export function entryTime(e: PlanEntry): number {
  if (e.type === 'occurrence') return e.occ.startAt
  if (e.type === 'task') return e.dueTs
  return Number.MAX_SAFE_INTEGER - e.item.order
}

/** 某一天「计划里有什么」：当天发生的事件 + 到期/逾期的任务 + 当天临时项。 */
export function buildPlan(todos: Todo[], items: DayItem[], dateKey: string): PlanEntry[] {
  const entries: PlanEntry[] = []
  for (const todo of todos) {
    if (todo.archived) continue
    if (todo.kind === 'event') {
      for (const occ of expandEventOccurrences(todo, dateKey, dateKey)) {
        entries.push({ type: 'occurrence', id: `occ:${todo.id}:${occ.dateKey}`, todo, occ })
      }
    } else {
      if (!todo.dueDate || todo.dueDate > dateKey) continue
      const completed = todo.completions.length > 0
      if (todo.dueDate !== dateKey && completed) continue
      const dueTs = taskDueTs(todo) ?? 0
      entries.push({ type: 'task', id: `task:${todo.id}`, todo, dueTs, overdue: todo.dueDate < dateKey && !completed })
    }
  }
  for (const item of items) {
    if (item.dateKey === dateKey) entries.push({ type: 'item', id: `item:${item.id}`, item })
  }
  entries.sort((a, b) => entryTime(a) - entryTime(b))
  return entries
}

export function planStats(entries: PlanEntry[]): { total: number; done: number; rate: number } {
  const total = entries.length
  const done = entries.filter(entryDone).length
  return { total, done, rate: total === 0 ? 0 : done / total }
}

/** 下一次尚未开始、且未完成的定时事件，用于「下一件事」横幅。 */
export function nextUpcoming(
  todos: Todo[],
  now: number,
  horizonDays = 14,
): { todo: Todo; occ: Occurrence } | null {
  const today = todayKey()
  let best: { todo: Todo; occ: Occurrence } | null = null
  for (const todo of todos) {
    if (todo.archived || todo.kind !== 'event' || todo.startAt == null) continue
    const endKey = addDaysKey(today, horizonDays)
    for (const occ of expandEventOccurrences(todo, today, endKey)) {
      if (occ.done || occ.endAt <= now) continue
      if (!best || occ.startAt < best.occ.startAt) best = { todo, occ }
    }
  }
  return best
}
