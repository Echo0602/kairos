import { useEffect, useState } from 'react'
import { AlertOverlay } from '@/components/AlertOverlay'
import { TabBar, type ViewId } from '@/components/TabBar'
import { ToastProvider } from '@/components/Toast'
import { APP } from '@/config'
import { useStore } from '@/data/store'
import { useReminders } from '@/hooks/useReminders'
import { armAudio } from '@/lib/sound'
import { FocusView } from '@/views/FocusView'
import { SettingsView } from '@/views/SettingsView'
import { StatsView } from '@/views/StatsView'
import { TodayView } from '@/views/TodayView'
import { TodoView } from '@/views/TodoView'

const TITLES: Record<ViewId, string> = {
  today: '今日',
  todos: '待办',
  focus: '自习室',
  stats: '统计',
  settings: '设置',
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}

function mix(a: string, b: string, t: number): string {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  const c = ra.map((v, i) => Math.round(v + (rb[i] - v) * t))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}

function Shell() {
  const store = useStore()
  const [view, setView] = useState<ViewId>('today')
  const reminders = useReminders(
    store.todos,
    store.now,
    store.settings.soundEnabled,
    store.settings.vibrateEnabled,
  )

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', store.settings.theme)
    const dark = store.settings.theme === 'dark'
    if (store.settings.accent) {
      const a = store.settings.accent
      root.style.setProperty('--accent', a)
      root.style.setProperty('--accent-strong', mix(a, '#000000', 0.22))
      root.style.setProperty('--accent-soft', mix(a, dark ? '#101614' : '#ffffff', dark ? 0.78 : 0.88))
      root.style.setProperty('--accent-contrast', isLight(a) ? '#15201b' : '#fafaf8')
    } else {
      for (const k of ['--accent', '--accent-strong', '--accent-soft', '--accent-contrast']) {
        root.style.removeProperty(k)
      }
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', store.settings.accent ?? (dark ? '#101614' : '#31594B'))
  }, [store.settings.theme, store.settings.accent])

  // 浏览器要求先有用户手势才能播放声音，首次点按即解锁音频。
  useEffect(() => {
    const arm = () => armAudio()
    window.addEventListener('pointerdown', arm, { once: true })
    return () => window.removeEventListener('pointerdown', arm)
  }, [])

  const active = reminders.active

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>{TITLES[view]}</h1>
          <div className="sub">
            {APP.nameZh} {APP.nameEn} · {APP.tagline}
          </div>
        </div>
      </header>
      <main className="app-main">
        {view === 'today' && <TodayView />}
        {view === 'todos' && <TodoView />}
        {view === 'focus' && <FocusView />}
        {view === 'stats' && <StatsView />}
        {view === 'settings' && <SettingsView />}
      </main>
      <TabBar view={view} onChange={setView} />
      {active && (
        <AlertOverlay
          alert={active}
          onAcknowledge={() => reminders.acknowledge(active.key)}
          onSnooze={(m) => reminders.snooze(active.key, m)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}
