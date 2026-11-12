import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="grab" />
        <div className="row" style={{ marginBottom: 16 }}>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
