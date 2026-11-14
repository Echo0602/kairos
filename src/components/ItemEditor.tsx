import { useState } from 'react'
import type { DayItem } from '@/data/types'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import { useToast } from '@/hooks/toast'

export function ItemEditor({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial: DayItem
  onSave: (item: DayItem) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}) {
  const toast = useToast()
  const [item, setItem] = useState<DayItem>({ ...initial })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (patch: Partial<DayItem>) => setItem((prev) => ({ ...prev, ...patch }))

  const save = async () => {
    if (!item.title.trim()) {
      toast('请先填写标题')
      return
    }
    await onSave({ ...item, title: item.title.trim() })
    onClose()
  }

  return (
    <Sheet title="编辑计划条目" onClose={onClose}>
      <div className="form">
        <div className="field">
          <label>标题</label>
          <input
            className="input"
            value={item.title}
            onChange={(e) => set({ title: e.target.value })}
            autoFocus
          />
        </div>

        <div className="field">
          <label>所在日期</label>
          <input
            className="input"
            type="date"
            value={item.dateKey}
            onChange={(e) => {
              if (e.target.value) set({ dateKey: e.target.value })
            }}
          />
        </div>

        <div className="field">
          <label>备注（可选）</label>
          <textarea
            className="textarea"
            value={item.note}
            placeholder="补充说明……"
            onChange={(e) => set({ note: e.target.value })}
          />
        </div>

        <div className="row" style={{ gap: 10 }}>
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
          <button className="btn primary" onClick={() => void save()} style={{ flex: 1 }}>
            <Icon name="check" size={16} />
            保存
          </button>
        </div>
      </div>
    </Sheet>
  )
}
