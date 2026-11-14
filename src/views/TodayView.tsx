import { useMemo, useState } from 'react'
import { EntryRow } from '@/components/EntryRow'
import { Icon } from '@/components/Icon'
import { ItemEditor } from '@/components/ItemEditor'
import { MonthPicker } from '@/components/MonthPicker'
import { NextBanner } from '@/components/NextBanner'
import { ProgressRing } from '@/components/ProgressRing'
import { SharePreview } from '@/components/SharePreview'
import { TodoEditor } from '@/components/TodoEditor'
import { useToast } from '@/hooks/toast'
import { DEFAULTS } from '@/config'
import { useStore } from '@/data/store'
import type { DayItem, Todo } from '@/data/types'
import { addDaysKey, fmtDateZh, fmtTimeRange, todayKey } from '@/lib/date'
import { buildPlan, entryDone, entryTitle, planStats } from '@/lib/plan'
import { renderCard, type CardLine } from '@/lib/sharecard'
import { computeStreak } from '@/lib/stats'

export function TodayView() {
  const store = useStore()
  const toast = useToast()
  const today = todayKey()
  const [dateKey, setDateKey] = useState(today)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [quick, setQuick] = useState('')
  const [editing, setEditing] = useState<Todo | null | 'new'>(null)
  const [editingItem, setEditingItem] = useState<DayItem | null>(null)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  const entries = useMemo(
    () => buildPlan(store.todos, store.items, dateKey),
    [store.todos, store.items, dateKey],
  )
  const stats = planStats(entries)
  const streak = useMemo(
    () => computeStreak(store.todos, store.items, DEFAULTS.streakThreshold),
    [store.todos, store.items],
  )

  const lines: CardLine[] = entries.map((e) => ({
    text: entryTitle(e),
    done: entryDone(e),
    meta:
      e.type === 'occurrence'
        ? fmtTimeRange(e.occ.startAt, e.occ.endAt)
        : e.type === 'task'
          ? `截止 ${e.todo.dueDate ?? ''}`
          : '临时计划',
  }))

  const exportPlan = () => {
    const url = renderCard({
      title: '今日计划',
      dateLabel: `${dateKey.slice(0, 4)}年${fmtDateZh(dateKey)}`,
      lines: lines.map((l) => ({ ...l, done: false })),
      stats: [
        { label: '计划项', value: String(entries.length) },
        { label: '定时事件', value: String(entries.filter((e) => e.type === 'occurrence').length) },
        { label: '截止任务', value: String(entries.filter((e) => e.type === 'task').length) },
      ],
      footerNote: '列于一天开始之前 · 完成度规则：全部勾选即 100%',
      signature: store.settings.displayName,
    })
    setPreview({ url, name: `kairos-plan-${dateKey}.png` })
  }

  const exportReport = () => {
    const url = renderCard({
      title: '今日完成报告',
      dateLabel: `${dateKey.slice(0, 4)}年${fmtDateZh(dateKey)}`,
      lines,
      stats: [
        { label: '完成度', value: `${Math.round(stats.rate * 100)}%` },
        { label: '已完成', value: `${stats.done}/${stats.total}` },
        { label: '连续天数', value: String(streak) },
      ],
      footerNote: `完成度 ≥ ${Math.round(DEFAULTS.streakThreshold * 100)}% 计入连续天数`,
      signature: store.settings.displayName,
    })
    setPreview({ url, name: `kairos-report-${dateKey}.png` })
  }

  const addQuick = async () => {
    const text = quick.trim()
    if (!text) return
    await store.addItem(dateKey, text)
    setQuick('')
    toast('已加入今日计划')
  }

  return (
    <>
      {dateKey === today && <NextBanner />}

      <div className="row">
        <button className="icon-btn" onClick={() => setDateKey(addDaysKey(dateKey, -1))} aria-label="前一天">
          <Icon name="chevron-left" />
        </button>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            className="btn ghost small"
            style={{ fontSize: 15, fontWeight: 650 }}
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((v) => !v)}
          >
            <Icon name="calendar" size={14} />
            {fmtDateZh(dateKey)}
          </button>
          {dateKey !== today && !pickerOpen && (
            <button className="btn ghost small" onClick={() => setDateKey(today)}>
              回到今天
            </button>
          )}
        </div>
        <button className="icon-btn" onClick={() => setDateKey(addDaysKey(dateKey, 1))} aria-label="后一天">
          <Icon name="chevron-right" />
        </button>
      </div>

      {pickerOpen && (
        <MonthPicker
          todos={store.todos}
          items={store.items}
          selected={dateKey}
          onPick={(key) => {
            setDateKey(key)
            setPickerOpen(false)
          }}
        />
      )}

      <div className="card">
        <div className="row">
          <div>
            <div style={{ fontSize: 15, fontWeight: 650 }}>今日完成度</div>
            <div className="small muted" style={{ marginTop: 4 }}>
              已完成 {stats.done} / {stats.total} 项 · 连续 {streak} 天
            </div>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <button className="btn small" onClick={exportPlan}>
                <Icon name="image" size={14} />
                导出计划
              </button>
              <button className="btn small" onClick={exportReport}>
                <Icon name="image" size={14} />
                导出报告
              </button>
            </div>
          </div>
          <ProgressRing rate={stats.rate} size={84} stroke={8} />
        </div>
      </div>

      <div className="row" style={{ gap: 8 }}>
        <input
          className="input"
          placeholder="临时加一件事，回车确认"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void addQuick()
          }}
        />
        <button className="btn primary" onClick={() => void addQuick()} aria-label="添加">
          <Icon name="plus" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <Icon name="calendar-check" />
          <div>这一天还没有安排</div>
          <button className="btn primary small" onClick={() => setEditing('new')}>
            新建一个待办
          </button>
        </div>
      ) : (
        entries.map((e) => (
          <EntryRow
            key={e.id}
            entry={e}
            onToggle={() => void store.toggleEntry(e)}
            onEdit={e.type === 'item' ? () => setEditingItem(e.item) : () => setEditing(e.todo)}
          />
        ))
      )}

      {editing !== null && (
        <TodoEditor
          initial={editing === 'new' ? null : editing}
          defaultRemind={store.settings.defaultRemind}
          defaultLeadMin={store.settings.defaultLeadMin}
          onSave={store.saveTodo}
          onDelete={store.removeTodo}
          onClose={() => setEditing(null)}
        />
      )}
      {editingItem && (
        <ItemEditor
          initial={editingItem}
          onSave={store.updateItem}
          onDelete={store.removeItem}
          onClose={() => setEditingItem(null)}
        />
      )}
      {preview && <SharePreview dataUrl={preview.url} filename={preview.name} onClose={() => setPreview(null)} />}
    </>
  )
}
