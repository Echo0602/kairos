import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Todo } from '@/data/types'
import { addDaysKey, expandEventOccurrences, fmtTime, fmtDateZh, taskDueTs, todayKey } from '@/lib/date'
import { startAlarm, stopAlarm, vibrate } from '@/lib/sound'

const ACK_KEY = 'kairos:acked'
const SNOOZE_KEY = 'kairos:snoozed'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export interface ActiveAlert {
  key: string
  todo: Todo
  whenLabel: string
  triggerAt: number
}

/**
 * 全屏强提醒引擎。
 * 到点（提前 leadMin 分钟）触发，必须手动「确认」或「稍后」才会停；
 * 关掉页面再打开，未确认的提醒会再次弹出——这是「列了却忘记去」的最后一道保险。
 * 确认记录存 localStorage，避免同一次提醒反复打扰。
 */
export function useReminders(
  todos: Todo[],
  now: number,
  soundOn: boolean,
  vibrateOn: boolean,
) {
  const [acked, setAcked] = useState<string[]>(() => readJson<string[]>(ACK_KEY, []))
  const [snoozed, setSnoozed] = useState<Record<string, number>>(() =>
    readJson<Record<string, number>>(SNOOZE_KEY, {}),
  )

  const alerts = useMemo(() => {
    const out: ActiveAlert[] = []
    const today = todayKey()
    const horizon = addDaysKey(today, 7)
    for (const todo of todos) {
      if (todo.archived || !todo.remind.includes('alert')) continue
      const lead = todo.leadMin * 60000
      if (todo.kind === 'event' && todo.startAt != null) {
        for (const occ of expandEventOccurrences(todo, today, horizon)) {
          if (occ.done) continue
          const triggerAt = occ.startAt - lead
          if (now >= triggerAt && now <= occ.endAt) {
            out.push({
              key: `${todo.id}:${occ.dateKey}`,
              todo,
              whenLabel: `${fmtDateZh(occ.dateKey)} ${fmtTime(occ.startAt)} 开始`,
              triggerAt,
            })
          }
        }
      } else {
        const due = taskDueTs(todo)
        if (due == null || todo.completions.length > 0) continue
        const triggerAt = due - lead
        if (now >= triggerAt && now <= due) {
          out.push({
            key: `${todo.id}:${todo.dueDate}`,
            todo,
            whenLabel: `${fmtDateZh(todo.dueDate ?? '')} ${fmtTime(due)} 截止`,
            triggerAt,
          })
        }
      }
    }
    return out
      .filter((a) => !acked.includes(a.key) && !(snoozed[a.key] && now < snoozed[a.key]))
      .sort((a, b) => a.triggerAt - b.triggerAt)
  }, [todos, now, acked, snoozed])

  const active = alerts[0] ?? null
  const activeKey = active?.key ?? null

  useEffect(() => {
    if (!activeKey) {
      stopAlarm()
      return
    }
    if (soundOn) startAlarm()
    if (vibrateOn) vibrate([500, 220, 500, 220, 700])
    return () => stopAlarm()
  }, [activeKey, soundOn, vibrateOn])

  const acknowledge = useCallback((key: string) => {
    setAcked((prev) => {
      const next = [...prev, key].slice(-500)
      localStorage.setItem(ACK_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const snooze = useCallback((key: string, minutes: number) => {
    setSnoozed((prev) => {
      const next = { ...prev, [key]: Date.now() + minutes * 60000 }
      localStorage.setItem(SNOOZE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { active, acknowledge, snooze }
}
