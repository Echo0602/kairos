import { dataUrlToBlob } from '@/lib/sharecard'
import { downloadBlob } from '@/lib/ics'
import { Icon } from './Icon'

/** 导出图片的预览层：电脑上点下载，手机上可长按图片直接保存或分享。 */
export function SharePreview({
  dataUrl,
  filename,
  onClose,
}: {
  dataUrl: string
  filename: string
  onClose: () => void
}) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet"
        style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="grab" />
        <img
          src={dataUrl}
          alt="导出的计划卡片"
          style={{ width: '100%', maxWidth: 340, borderRadius: 12, border: '1px solid var(--border)' }}
        />
        <p className="small muted" style={{ margin: 0 }}>
          手机上可长按图片保存或发给同学
        </p>
        <div className="row" style={{ width: '100%' }}>
          <button className="btn" onClick={onClose}>
            关闭
          </button>
          <button
            className="btn primary"
            style={{ flex: 1 }}
            onClick={() => downloadBlob(filename, dataUrlToBlob(dataUrl))}
          >
            <Icon name="download" size={16} />
            下载图片
          </button>
        </div>
      </div>
    </>
  )
}
