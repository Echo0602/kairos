import { useStore } from '@/data/store'
import { fmtCountdownParts, fmtDateZh, fmtTimeRange } from '@/lib/date'

/** 首页置顶的「下一件事」横幅，带实时倒计时。 */
export function NextBanner() {
  const { next, now } = useStore()
  if (!next) return null
  const toStart = next.occ.startAt - now
  const ongoing = toStart <= 0 && now < next.occ.endAt
  const parts = fmtCountdownParts(toStart)
  const leftMin = Math.max(1, Math.ceil((next.occ.endAt - now) / 60000))

  return (
    <div className="banner">
      <div className="what">
        <div className="label">{ongoing ? '正在进行' : '下一件事'}</div>
        <div className="title">{next.todo.title}</div>
        <div className="when">
          {fmtDateZh(next.occ.dateKey)} {fmtTimeRange(next.occ.startAt, next.occ.endAt)}
        </div>
      </div>
      <div className="count">
        <div className="num">{ongoing ? String(leftMin) : parts.main}</div>
        <div className="unit">{ongoing ? '分钟后结束' : parts.unit}</div>
      </div>
    </div>
  )
}
