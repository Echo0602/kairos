import type { ActiveAlert } from '@/hooks/useReminders'
import { Icon } from './Icon'

/** 到点后的全屏强提醒：必须手动确认才会消失，防止「列了却忘记去」。 */
export function AlertOverlay({
  alert,
  onAcknowledge,
  onSnooze,
}: {
  alert: ActiveAlert
  onAcknowledge: () => void
  onSnooze: (minutes: number) => void
}) {
  return (
    <div className="alert-overlay" role="alertdialog" aria-modal="true" aria-label={alert.todo.title}>
      <div className="pulse-ring">
        <Icon name="bell" size={44} />
      </div>
      <div className="big">{alert.todo.title}</div>
      <div className="when">{alert.whenLabel}</div>
      {alert.todo.note && <div className="when" style={{ fontSize: 14 }}>{alert.todo.note}</div>}
      <div className="actions">
        <button className="btn primary block" onClick={onAcknowledge}>
          我知道了，马上去
        </button>
        <button className="btn block" onClick={() => onSnooze(10)}>
          10 分钟后再提醒我
        </button>
        <button className="btn block" onClick={() => onSnooze(60)}>
          1 小时后再提醒我
        </button>
      </div>
    </div>
  )
}
