import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { TodoEditor } from '@/components/TodoEditor'
import { useToast } from '@/hooks/toast'
import { REPEAT_LABEL } from '@/config'
import { useStore } from '@/data/store'
import type { Todo } from '@/data/types'
import { addDaysKey, expandEventOccurrences, fmtDateZh, fmtTime, taskDueTs, todayKey } from '@/lib/date'
import { shareOrDownloadIcs } from '@/lib/ics'

type Filter = 'all' | 'event' | 'task' | 'archived'

export function TodoView() {
  const store = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<Todo | null | 'new'>(null)
  const today = todayKey()

  const list = useMemo(() => {
    const all = [...store.todos].sort((a, b) => b.createdAt - a.createdAt)
    if (filter === 'archived') return all.filter((t) => t.archived)
    const active = all.filter((t) => !t.archived)
    if (filter === 'event') return active.filter((t) => t.kind === 'event')
    if (filter === 'task') return active.filter((t) => t.kind === 'task')
    return active
  }, [store.todos, filter])

  const exportable = store.todos.filter(
    (t) => !t.archived && (t.kind === 'task' ? taskDueTs(t) != null : t.startAt != null),
  )

  const describe = (t: Todo): string => {
    if (t.kind === 'event' && t.startAt != null) {
      const occ = expandEventOccurrences(t, today, addDaysKey(today, 60))[0]
      const when = occ ? `${fmtDateZh(occ.dateKey)} ${fmtTime(occ.startAt)}` : '已无后续安排'
      return t.repeat !== 'none' ? `${when} · ${REPEAT_LABEL[t.repeat]}重复` : when
    }
    if (t.dueDate) {
      const overdue = t.dueDate < today && t.completions.length === 0
      return `${overdue ? '已逾期 · 截止 ' : '截止 '}${fmtDateZh(t.dueDate)}${t.dueTime ? ` ${t.dueTime}` : ''}`
    }
    return ''
  }

  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <button
          className="btn"
          style={{ flex: 1 }}
          disabled={exportable.length === 0}
          onClick={async () => {
            const result = await shareOrDownloadIcs(`kairos-${today}.ics`, exportable)
            if (result === 'shared') toast('在分享面板中选择「日历」即完成导入')
            else if (result === 'downloaded')
              toast(`已下载 ${exportable.length} 条日历文件，到「下载/文件」中点开它导入系统日历`)
          }}
        >
          <Icon name="calendar" size={16} />
          导出到系统日历
        </button>
        <button className="btn primary" onClick={() => setEditing('new')}>
          <Icon name="plus" />
          新建
        </button>
      </div>

      <div className="segment">
        {(
          [
            ['all', '全部'],
            ['event', '事件'],
            ['task', '任务'],
            ['archived', '已归档'],
          ] as [Filter, string][]
        ).map(([id, label]) => (
          <button key={id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <Icon name="list" />
          <div>{filter === 'archived' ? '没有已归档的待办' : '还没有待办，点右上角新建一个'}</div>
        </div>
      ) : (
        list.map((t) => {
          const done = t.kind === 'task' && t.completions.length > 0
          return (
            <div className={`entry${done ? ' done' : ''}`} key={t.id}>
              {t.kind === 'task' ? (
                <button
                  className={`check${done ? ' on' : ''}`}
                  aria-label={done ? '标记未完成' : '标记完成'}
                  onClick={() =>
                    void store.saveTodo({
                      ...t,
                      completions: done ? [] : [t.dueDate ?? todayKey()],
                    })
                  }
                >
                  <Icon name="check" />
                </button>
              ) : (
                <span className="check" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  <Icon name="clock" size={13} />
                </span>
              )}
              <div className="body" style={{ cursor: 'pointer' }} onClick={() => setEditing(t)}>
                <div className="title">{t.title}</div>
                <div className="meta">
                  <span>{describe(t)}</span>
                  {t.tag && <span className="tag">{t.tag}</span>}
                  {t.remind.includes('alert') && <Icon name="bell" size={13} />}
                  {t.remind.includes('calendar') && <Icon name="calendar" size={13} />}
                </div>
              </div>
              <button
                className="icon-btn"
                aria-label={t.archived ? '取消归档' : '归档'}
                onClick={() => void store.saveTodo({ ...t, archived: !t.archived })}
              >
                <Icon name={t.archived ? 'repeat' : 'x'} size={16} />
              </button>
            </div>
          )
        })
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
    </>
  )
}
