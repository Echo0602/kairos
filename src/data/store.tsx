import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { newId } from '@/lib/id'
import { todayKey } from '@/lib/date'
import { buildPlan, nextUpcoming, type PlanEntry } from '@/lib/plan'
import * as db from './db'
import type { DayItem, FocusSession, Settings, Todo } from './types'

interface StoreValue {
  loaded: boolean
  now: number
  todos: Todo[]
  items: DayItem[]
  sessions: FocusSession[]
  settings: Settings
  todayEntries: PlanEntry[]
  next: { todo: Todo; occ: import('@/data/types').Occurrence } | null
  saveTodo: (todo: Todo) => Promise<void>
  removeTodo: (id: string) => Promise<void>
  toggleEntry: (entry: PlanEntry) => Promise<void>
  addItem: (dateKey: string, title: string) => Promise<void>
  updateItem: (item: DayItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  saveSettings: (patch: Partial<Settings>) => Promise<void>
  startSession: (label: string, plannedMin: number) => Promise<string>
  endSession: (id: string, completed: boolean) => Promise<void>
  reload: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [todos, setTodos] = useState<Todo[]>([])
  const [items, setItems] = useState<DayItem[]>([])
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const settingsRef = useRef<Settings | null>(null)

  const reload = useCallback(async () => {
    const [t, i, s, cfg] = await Promise.all([
      db.getAllTodos(),
      db.getDayItemsAll(),
      db.getAllSessions(),
      db.getSettings(),
    ])
    settingsRef.current = cfg
    setTodos(t)
    setItems(i)
    setSessions(s)
    setSettings(cfg)
    setLoaded(true)
  }, [])

  // 从 IndexedDB 载入初始数据：这正是「与外部系统同步」的合法用途。
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void reload()
  }, [reload])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const saveTodo = useCallback(async (todo: Todo) => {
    const withId: Todo = { ...todo, id: todo.id || newId(), updatedAt: Date.now() }
    setTodos((prev) => {
      const exists = prev.some((t) => t.id === withId.id)
      return exists ? prev.map((t) => (t.id === withId.id ? withId : t)) : [...prev, withId]
    })
    await db.putTodo(withId)
  }, [])

  const removeTodo = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await db.deleteTodo(id)
  }, [])

  const toggleEntry = useCallback(
    async (entry: PlanEntry) => {
      if (entry.type === 'item') {
        const updated: DayItem = {
          ...entry.item,
          done: !entry.item.done,
          doneAt: entry.item.done ? null : Date.now(),
        }
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
        await db.putDayItem(updated)
        return
      }
      const key = entry.type === 'occurrence' ? entry.occ.dateKey : (entry.todo.dueDate ?? '')
      const has = entry.todo.completions.includes(key)
      const updated: Todo = {
        ...entry.todo,
        completions: has
          ? entry.todo.completions.filter((k) => k !== key)
          : [...entry.todo.completions, key],
        updatedAt: Date.now(),
      }
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      await db.putTodo(updated)
    },
    [],
  )

  const addItem = useCallback(async (dateKey: string, title: string) => {
    const order =
      items.filter((i) => i.dateKey === dateKey).reduce((max, i) => Math.max(max, i.order), 0) + 1
    const item: DayItem = {
      id: newId(),
      dateKey,
      title,
      note: '',
      estimateMin: 0,
      done: false,
      doneAt: null,
      order,
      createdAt: Date.now(),
    }
    setItems((prev) => [...prev, item])
    await db.putDayItem(item)
  }, [items])

  const updateItem = useCallback(async (item: DayItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
    await db.putDayItem(item)
  }, [])

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await db.deleteDayItem(id)
  }, [])

  const saveSettings = useCallback(async (patch: Partial<Settings>) => {
    const prev = settingsRef.current
    if (!prev) return
    const next = { ...prev, ...patch }
    settingsRef.current = next
    setSettings(next)
    await db.putSettings(next)
  }, [])

  const startSession = useCallback(async (label: string, plannedMin: number) => {
    const session: FocusSession = {
      id: newId(),
      startedAt: Date.now(),
      endedAt: null,
      plannedMin,
      label,
      completed: false,
    }
    setSessions((prev) => [...prev, session])
    await db.putSession(session)
    return session.id
  }, [])

  const endSession = useCallback(async (id: string, completed: boolean) => {
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === id ? { ...s, endedAt: Date.now(), completed } : s,
      )
      const done = next.find((s) => s.id === id)
      if (done) void db.putSession(done)
      return next
    })
  }, [])

  const todayEntries = useMemo(() => buildPlan(todos, items, todayKey()), [todos, items])
  const next = useMemo(() => nextUpcoming(todos, now), [todos, now])

  const value = useMemo<StoreValue | null>(() => {
    if (!settings) return null
    return {
      loaded,
      now,
      todos,
      items,
      sessions,
      settings,
      todayEntries,
      next,
      saveTodo,
      removeTodo,
      toggleEntry,
      addItem,
      updateItem,
      removeItem,
      saveSettings,
      startSession,
      endSession,
      reload,
    }
  }, [
    loaded, now, todos, items, sessions, settings, todayEntries, next,
    saveTodo, removeTodo, toggleEntry, addItem, updateItem, removeItem,
    saveSettings, startSession, endSession, reload,
  ])

  // value 是 useMemo 的结果而非 ref，此处为误报。
  // oxlint-disable-next-line react/refs
  if (!value) return null
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// 与 Provider 同文件是为了让「状态与操作」保持单一入口；fast-refresh 粒度影响可忽略。
// oxlint-disable-next-line react/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用')
  return ctx
}
