import { useMemo } from 'react'
import { Icon } from '@/components/Icon'
import { DEFAULTS } from '@/config'
import { useStore } from '@/data/store'
import { addDaysKey, todayKey, WEEKDAY_ZH, weekdayOf } from '@/lib/date'
import {
  computeStreak,
  countQualifiedDays,
  daySeries,
  focusMinutes,
  historyStart,
  totalDoneItems,
} from '@/lib/stats'

export function StatsView() {
  const store = useStore()
  const today = todayKey()

  const streak = useMemo(
    () => computeStreak(store.todos, store.items, DEFAULTS.streakThreshold),
    [store.todos, store.items],
  )
  const qualified = useMemo(
    () => countQualifiedDays(store.todos, store.items, DEFAULTS.streakThreshold),
    [store.todos, store.items],
  )
  const doneTotal = useMemo(() => totalDoneItems(store.todos, store.items), [store.todos, store.items])
  const series = useMemo(
    () => daySeries(store.todos, store.items, addDaysKey(today, -13), today),
    [store.todos, store.items, today],
  )
  const start = useMemo(() => historyStart(store.todos, store.items), [store.todos, store.items])

  return (
    <>
      <div className="stat-grid">
        <div className="stat">
          <div className="num">{streak}</div>
          <div className="label">当前连续天数</div>
        </div>
        <div className="stat">
          <div className="num">{qualified}</div>
          <div className="label">累计达标天数</div>
        </div>
        <div className="stat">
          <div className="num">{doneTotal}</div>
          <div className="label">累计完成项</div>
        </div>
        <div className="stat">
          <div className="num">{focusMinutes(store.sessions)}</div>
          <div className="label">累计专注分钟</div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 650 }}>最近 14 天完成度</div>
          <span className="small muted">从 {start} 开始记录</span>
        </div>
        <div className="bars">
          {series.map((s) => (
            <div key={s.dateKey} className={`bar${s.total === 0 ? ' empty' : ''}`}>
              <div
                className="fill"
                style={{ height: `${s.total === 0 ? 4 : Math.max(6, Math.round(s.rate * 100))}%` }}
                title={`${s.dateKey} 完成 ${s.done}/${s.total}`}
              />
              <div className="day">{WEEKDAY_ZH[weekdayOf(s.dateKey)]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <Icon name="flame" size={18} />
          <div style={{ fontWeight: 650 }}>连续天数怎么算</div>
        </div>
        <ul className="small muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>当天有计划且完成度 ≥ {Math.round(DEFAULTS.streakThreshold * 100)}%，记为达标一天。</li>
          <li>没有安排任何计划的天会跳过，既不计入也不会打断连续。</li>
          <li>今天还没过完时不达标不算中断，给你留到睡前。</li>
        </ul>
      </div>
    </>
  )
}
