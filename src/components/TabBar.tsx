import { Icon, type IconName } from './Icon'

export type ViewId = 'today' | 'todos' | 'focus' | 'stats' | 'settings'

const TABS: { id: ViewId; label: string; icon: IconName }[] = [
  { id: 'today', label: '今日', icon: 'sun' },
  { id: 'todos', label: '待办', icon: 'list' },
  { id: 'focus', label: '自习室', icon: 'timer' },
  { id: 'stats', label: '统计', icon: 'chart' },
  { id: 'settings', label: '设置', icon: 'sliders' },
]

export function TabBar({ view, onChange }: { view: ViewId; onChange: (v: ViewId) => void }) {
  return (
    <nav className="tabbar" aria-label="主导航">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab${view === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
          aria-current={view === t.id ? 'page' : undefined}
        >
          <Icon name={t.icon} />
          {t.label}
        </button>
      ))}
    </nav>
  )
}
