import { useMemo, useState } from 'react'
import type { DayItem, Todo } from '@/data/types'
import { addDaysKey, dateKey, parseDateKey, todayKey } from '@/lib/date'
import { buildPlan } from '@/lib/plan'
import { Icon } from './Icon'

const WEEK_HEAD = ['一', '二', '三', '四', '五', '六', '日']

/** 周一开头的列号（getDay 以周日为 0）。 */
function colOf(key: string): number {
  return (parseDateKey(key).getDay() + 6) % 7
}

export function MonthPicker({
  todos,
  items,
  selected,
  onPick,
}: {
  todos: Todo[]
  items: DayItem[]
  selected: string
  onPick: (key: string) => void
}) {
  const today = todayKey()
  const init = parseDateKey(selected)
  const [ym, setYm] = useState({ y: init.getFullYear(), m: init.getMonth() })

  const monthStart = dateKey(new Date(ym.y, ym.m, 1))
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const monthEnd = dateKey(new Date(ym.y, ym.m, daysInMonth))

  const busy = useMemo(() => {
    const set = new Set<string>()
    for (let k = monthStart; k <= monthEnd; k = addDaysKey(k, 1)) {
      if (buildPlan(todos, items, k).length > 0) set.add(k)
    }
    return set
  }, [todos, items, monthStart, monthEnd])

  const shiftMonth = (n: number) => {
    const d = new Date(ym.y, ym.m + n, 1)
    setYm({ y: d.getFullYear(), m: d.getMonth() })
  }

  const cells: (string | null)[] = []
  for (let i = 0; i < colOf(monthStart); i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(dateKey(new Date(ym.y, ym.m, d)))

  return (
    <div className="card mp">
      <div className="mp-head">
        <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="上个月">
          <Icon name="chevron-left" />
        </button>
        <div style={{ fontWeight: 650 }}>
          {ym.y} 年 {ym.m + 1} 月
        </div>
        <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="下个月">
          <Icon name="chevron-right" />
        </button>
      </div>
      <div className="mp-grid">
        {WEEK_HEAD.map((w) => (
          <div key={w} className="mp-wd">
            {w}
          </div>
        ))}
        {cells.map((key, i) =>
          key === null ? (
            <div key={`b${i}`} />
          ) : (
            <button
              key={key}
              className={`mp-day${key === today ? ' today' : ''}${key === selected ? ' sel' : ''}`}
              onClick={() => onPick(key)}
            >
              {parseDateKey(key).getDate()}
              <span className="dot" style={{ visibility: busy.has(key) ? 'visible' : 'hidden' }} />
            </button>
          ),
        )}
      </div>
      <div className="small muted" style={{ textAlign: 'center' }}>
        带点的日子有安排 · 点今天可回到今天
      </div>
    </div>
  )
}
