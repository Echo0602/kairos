import { PRIORITY_LABEL, REPEAT_LABEL } from '@/config'
import type { PlanEntry } from '@/lib/plan'
import { entryDone, entryTitle } from '@/lib/plan'
import { fmtDateZh, fmtTimeRange } from '@/lib/date'
import { Icon } from './Icon'

export function EntryRow({
  entry,
  onToggle,
  onEdit,
}: {
  entry: PlanEntry
  onToggle: () => void
  onEdit?: () => void
}) {
  const done = entryDone(entry)
  const title = entryTitle(entry)

  const meta: React.ReactNode[] = []
  if (entry.type === 'occurrence') {
    meta.push(<span key="t">{fmtTimeRange(entry.occ.startAt, entry.occ.endAt)}</span>)
    if (entry.todo.repeat !== 'none') {
      meta.push(
        <span key="r" className="tag">
          <Icon name="repeat" size={11} /> {REPEAT_LABEL[entry.todo.repeat]}
        </span>,
      )
    }
  } else if (entry.type === 'task') {
    meta.push(
      <span key="d">
        截止 {fmtDateZh(entry.todo.dueDate ?? '')}
        {entry.todo.dueTime ? ` ${entry.todo.dueTime}` : ''}
      </span>,
    )
    if (entry.overdue && !done) {
      meta.push(
        <span key="o" className="tag danger">
          已逾期
        </span>,
      )
    }
  } else {
    meta.push(<span key="i">今日临时计划</span>)
  }

  if (entry.type !== 'item') {
    if (entry.todo.tag) meta.push(<span key="tag" className="tag">{entry.todo.tag}</span>)
    if (entry.todo.priority > 0) {
      meta.push(
        <span key="p" className={entry.todo.priority === 2 ? 'tag danger' : 'tag warn'}>
          {PRIORITY_LABEL[entry.todo.priority]}
        </span>,
      )
    }
    if (entry.todo.remind.includes('alert')) meta.push(<Icon key="al" name="bell" size={13} />)
    if (entry.todo.remind.includes('calendar')) meta.push(<Icon key="cal" name="calendar" size={13} />)
  }

  return (
    <div className={`entry${done ? ' done' : ''}${entry.type === 'task' && entry.overdue && !done ? ' overdue' : ''}`}>
      <button
        className={`check${done ? ' on' : ''}`}
        onClick={onToggle}
        aria-label={done ? '标记为未完成' : '标记为已完成'}
      >
        <Icon name="check" />
      </button>
      <div className="body" onClick={onEdit} style={onEdit ? { cursor: 'pointer' } : undefined}>
        <div className="title">{title}</div>
        <div className="meta">{meta}</div>
      </div>
      {onEdit && (
        <button className="icon-btn" onClick={onEdit} aria-label="编辑">
          <Icon name="edit" />
        </button>
      )}
    </div>
  )
}
