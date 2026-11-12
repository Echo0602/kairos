import { useState } from 'react'
import {
  DEFAULTS,
  PRIORITY_LABEL,
  REMIND_METHODS,
  REMIND_METHOD_HINT,
  REPEAT_LABEL,
  type Priority,
  type RemindMethod,
  type Repeat,
} from '@/config'
import { emptyTodo, type Todo } from '@/data/types'
import { combineDayTime, dateKey, fmtTime, todayKey } from '@/lib/date'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import { useToast } from '@/hooks/toast'

const PRIORITIES: Priority[] = [0, 1, 2]
const REPEATS: Repeat[] = ['none', 'daily', 'weekly', 'weekdays']

export function TodoEditor({
  initial,
  defaultRemind,
  defaultLeadMin,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Todo | null
  defaultRemind: RemindMethod[]
  defaultLeadMin: number
  onSave: (t: Todo) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onClose: () => void
}) {
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [todo, setTodo] = useState<Todo>(() => {
    if (initial) return { ...initial }
    const base = emptyTodo(Date.now())
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 1)
    base.startAt = d.getTime()
    base.remind = [...defaultRemind]
    base.leadMin = defaultLeadMin
    return base
  })

  const set = (patch: Partial<Todo>) => setTodo((prev) => ({ ...prev, ...patch }))

  const dateValue = todo.startAt != null ? dateKey(new Date(todo.startAt)) : todayKey()
  const timeValue = todo.startAt != null ? fmtTime(todo.startAt) : '09:00'

  const toggleRemind = (m: RemindMethod) => {
    set({
      remind: todo.remind.includes(m) ? todo.remind.filter((r) => r !== m) : [...todo.remind, m],
    })
  }

  const save = async () => {
    if (!todo.title.trim()) {
      toast('请先填写标题')
      return
    }
    if (todo.kind === 'event' && todo.startAt == null) {
      toast('请选择开始时间')
      return
    }
    if (todo.kind === 'task' && !todo.dueDate) {
      toast('请选择截止日期')
      return
    }
    await onSave({ ...todo, title: todo.title.trim() })
    onClose()
  }

  return (
    <Sheet title={initial ? '编辑待办' : '新建待办'} onClose={onClose}>
      <div className="form">
        <div className="segment">
          <button className={todo.kind === 'event' ? 'on' : ''} onClick={() => set({ kind: 'event' })}>
            定时事件
          </button>
          <button className={todo.kind === 'task' ? 'on' : ''} onClick={() => set({ kind: 'task' })}>
            截止任务
          </button>
        </div>
        <p className="small muted" style={{ margin: '-6px 0 0' }}>
          {todo.kind === 'event'
            ? '有明确开始时刻的事：上课、开会、面试。'
            : '某天前完成即可的事：交报告、填申请表。'}
        </p>

        <div className="field">
          <label>标题</label>
          <input
            className="input"
            value={todo.title}
            placeholder="例如：复变函数课 / 提交实验报告"
            onChange={(e) => set({ title: e.target.value })}
            autoFocus
          />
        </div>

        {todo.kind === 'event' ? (
          <>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>日期</label>
                <input
                  className="input"
                  type="date"
                  value={dateValue}
                  onChange={(e) => {
                    if (!e.target.value) return
                    const [h, m] = timeValue.split(':').map(Number)
                    set({ startAt: combineDayTime(e.target.value, h, m) })
                  }}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>开始</label>
                <input
                  className="input"
                  type="time"
                  value={timeValue}
                  onChange={(e) => {
                    if (!e.target.value) return
                    const [h, m] = e.target.value.split(':').map(Number)
                    set({ startAt: combineDayTime(dateValue, h, m) })
                  }}
                />
              </div>
              <div className="field" style={{ width: 86 }}>
                <label>时长(分)</label>
                <input
                  className="input"
                  type="number"
                  min={5}
                  step={5}
                  value={todo.durationMin}
                  onChange={(e) => set({ durationMin: Math.max(5, Number(e.target.value) || 5) })}
                />
              </div>
            </div>
            <div className="field">
              <label>重复</label>
              <div className="segment">
                {REPEATS.map((r) => (
                  <button key={r} className={todo.repeat === r ? 'on' : ''} onClick={() => set({ repeat: r })}>
                    {REPEAT_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
            {todo.repeat !== 'none' && (
              <div className="field">
                <label>重复到（可选，例如学期末）</label>
                <input
                  className="input"
                  type="date"
                  value={todo.repeatUntil ?? ''}
                  onChange={(e) => set({ repeatUntil: e.target.value || null })}
                />
              </div>
            )}
          </>
        ) : (
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>截止日期</label>
              <input
                className="input"
                type="date"
                value={todo.dueDate ?? todayKey()}
                onChange={(e) => set({ dueDate: e.target.value || null })}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>截止时刻（可选）</label>
              <input
                className="input"
                type="time"
                value={todo.dueTime ?? ''}
                onChange={(e) => set({ dueTime: e.target.value || null })}
              />
            </div>
          </div>
        )}

        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>分类（可选）</label>
            <input
              className="input"
              value={todo.tag}
              placeholder="课程 / 作业 / 社团"
              onChange={(e) => set({ tag: e.target.value })}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>优先级</label>
            <div className="segment">
              {PRIORITIES.map((p) => (
                <button key={p} className={todo.priority === p ? 'on' : ''} onClick={() => set({ priority: p })}>
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <label>提醒方式（可多选）</label>
          <div className="card" style={{ padding: 4, boxShadow: 'none' }}>
            {(Object.keys(REMIND_METHODS) as RemindMethod[]).map((m) => (
              <div className="row" key={m} style={{ padding: '10px 10px' }}>
                <div>
                  <div style={{ fontWeight: 550, fontSize: 14 }}>{REMIND_METHODS[m]}</div>
                  <div className="small muted">{REMIND_METHOD_HINT[m]}</div>
                </div>
                <button
                  className={`switch${todo.remind.includes(m) ? ' on' : ''}`}
                  onClick={() => toggleRemind(m)}
                  aria-label={REMIND_METHODS[m]}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label>提前提醒（分钟）</label>
          <input
            className="input"
            type="number"
            min={0}
            step={5}
            value={todo.leadMin}
            onChange={(e) => set({ leadMin: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>

        <div className="field">
          <label>备注（可选）</label>
          <textarea
            className="textarea"
            value={todo.note}
            placeholder="地点、要带的东西、链接……"
            onChange={(e) => set({ note: e.target.value })}
          />
        </div>

        <div className="row" style={{ gap: 10 }}>
          {initial && onDelete ? (
            <button
              className="btn danger"
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true)
                  return
                }
                await onDelete(initial.id)
                onClose()
              }}
            >
              <Icon name="trash" size={16} />
              {confirmDelete ? '确认删除' : '删除'}
            </button>
          ) : (
            <span />
          )}
          <button className="btn primary" onClick={() => void save()} style={{ flex: 1 }}>
            <Icon name="check" size={16} />
            保存
          </button>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          默认提前 {DEFAULTS.leadMin} 分钟提醒，可在设置里改。
        </p>
      </div>
    </Sheet>
  )
}
