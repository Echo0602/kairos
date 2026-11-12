import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { SharePreview } from '@/components/SharePreview'
import { useToast } from '@/hooks/toast'
import { DEFAULTS } from '@/config'
import { useStore } from '@/data/store'
import { dateKey, fmtDateZh, pad2, todayKey } from '@/lib/date'
import { renderCard } from '@/lib/sharecard'
import { computeStreak, focusMinutes } from '@/lib/stats'

const PRESETS = [15, 25, 45, 60]

export function FocusView() {
  const store = useStore()
  const toast = useToast()
  const [minutes, setMinutes] = useState(store.settings.focusMin || DEFAULTS.focusMin)
  const [label, setLabel] = useState('')
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  const active = store.sessions.find((s) => s.endedAt == null) ?? null
  const remaining = active ? active.startedAt + active.plannedMin * 60000 - store.now : 0

  const todaySessions = useMemo(
    () => store.sessions.filter((s) => s.endedAt != null && dateKey(new Date(s.startedAt)) === todayKey()),
    [store.sessions],
  )

  const makeCert = (sessionMin: number) => {
    const baseToday = store.sessions
      .filter((s) => s.endedAt != null && dateKey(new Date(s.startedAt)) === todayKey())
      .reduce((sum, s) => sum + Math.round(((s.endedAt ?? 0) - s.startedAt) / 60000), 0)
    const todayMin = baseToday + sessionMin
    const url = renderCard({
      title: '专注凭证',
      dateLabel: `${todayKey().slice(0, 4)}年${fmtDateZh(todayKey())}`,
      lines: [{ text: label.trim() || '一段专注时光', done: true, meta: `${sessionMin} 分钟 · 已完成` }],
      stats: [
        { label: '本次专注', value: `${sessionMin}′` },
        { label: '今日累计', value: `${todayMin}′` },
        { label: '连续天数', value: String(computeStreak(store.todos, store.items, DEFAULTS.streakThreshold)) },
      ],
      footerNote: '自习室 · 把这张图发到学习群，互相监督',
      signature: store.settings.displayName,
    })
    setPreview({ url, name: `kairos-focus-${todayKey()}.png` })
  }

  useEffect(() => {
    if (active && remaining <= 0) {
      const planned = active.plannedMin
      void store.endSession(active.id, true)
      makeCert(planned)
      toast('专注完成，凭证已生成')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, remaining <= 0])

  const mm = Math.max(0, Math.floor(remaining / 60000))
  const ss = Math.max(0, Math.floor((remaining % 60000) / 1000))

  return (
    <>
      <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
        {active ? (
          <>
            <div className="small muted">{active.label || '专注中'}</div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 750,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                margin: '10px 0',
                color: 'var(--accent)',
              }}
            >
              {pad2(mm)}:{pad2(ss)}
            </div>
            <div className="small muted" style={{ marginBottom: 18 }}>
              计划 {active.plannedMin} 分钟 · 放下手机，去做那件事
            </div>
            <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
              <button
                className="btn danger"
                onClick={() => {
                  void store.endSession(active.id, false)
                  toast('已放弃本次专注')
                }}
              >
                <Icon name="stop" size={16} />
                放弃
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  const actual = Math.max(1, Math.round((Date.now() - active.startedAt) / 60000))
                  void store.endSession(active.id, true)
                  makeCert(actual)
                }}
              >
                <Icon name="check" size={16} />
                提前完成
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 650 }}>开始一段专注</div>
            <p className="small muted" style={{ margin: '8px 0 16px' }}>
              自习室没有视频、没有房间，只有一张可以晒出去的专注凭证。
              <br />
              和同学约定同一时段开始，结束后互发凭证，就是最轻的监督。
            </p>
            <div className="field" style={{ textAlign: 'left' }}>
              <label>这段时间要做什么（可选）</label>
              <input
                className="input"
                value={label}
                placeholder="例如：复变函数第三章习题"
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="segment" style={{ margin: '14px 0' }}>
              {PRESETS.map((p) => (
                <button key={p} className={minutes === p ? 'on' : ''} onClick={() => setMinutes(p)}>
                  {p} 分
                </button>
              ))}
            </div>
            <button
              className="btn primary block"
              onClick={() => {
                void store.startSession(label, minutes)
                void store.saveSettings({ focusMin: minutes })
              }}
            >
              <Icon name="play" size={16} />
              开始 {minutes} 分钟
            </button>
          </>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="num">{todaySessions.length}</div>
          <div className="label">今日专注次数</div>
        </div>
        <div className="stat">
          <div className="num">{focusMinutes(todaySessions)}</div>
          <div className="label">今日专注分钟</div>
        </div>
        <div className="stat">
          <div className="num">{store.sessions.filter((s) => s.completed).length}</div>
          <div className="label">累计完成次数</div>
        </div>
        <div className="stat">
          <div className="num">{focusMinutes(store.sessions)}</div>
          <div className="label">累计专注分钟</div>
        </div>
      </div>

      {preview && <SharePreview dataUrl={preview.url} filename={preview.name} onClose={() => setPreview(null)} />}
    </>
  )
}
