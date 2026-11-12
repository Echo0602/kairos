import { openDB, type IDBPDatabase } from 'idb'
import { DEFAULT_SETTINGS, type Backup, type DayItem, type FocusSession, type Settings, type Todo } from './types'

const DB_NAME = 'kairos'
const DB_VERSION = 1

/**
 * 全部数据只存在本机浏览器的 IndexedDB 中，不上传任何服务器。
 * 若将来要加多人协作或云同步，只需新增一个实现相同函数的远程模块，
 * 业务层（useStore）不感知存储位置。
 */
let dbp: Promise<IDBPDatabase> | null = null

function db(): Promise<IDBPDatabase> {
  dbp ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(d) {
      d.createObjectStore('todos', { keyPath: 'id' })
      const items = d.createObjectStore('dayItems', { keyPath: 'id' })
      items.createIndex('byDate', 'dateKey')
      const sessions = d.createObjectStore('sessions', { keyPath: 'id' })
      sessions.createIndex('byStart', 'startedAt')
      d.createObjectStore('kv')
    },
  })
  return dbp
}

export async function getAllTodos(): Promise<Todo[]> {
  return (await db()).getAll('todos')
}

export async function putTodo(todo: Todo): Promise<void> {
  await (await db()).put('todos', todo)
}

export async function deleteTodo(id: string): Promise<void> {
  await (await db()).delete('todos', id)
}

export async function getDayItems(dateKey: string): Promise<DayItem[]> {
  const items = await (await db()).getAllFromIndex('dayItems', 'byDate', dateKey)
  return items.sort((a, b) => a.order - b.order)
}

export async function getDayItemsAll(): Promise<DayItem[]> {
  return (await db()).getAll('dayItems')
}

export async function putDayItem(item: DayItem): Promise<void> {
  await (await db()).put('dayItems', item)
}

export async function deleteDayItem(id: string): Promise<void> {
  await (await db()).delete('dayItems', id)
}

export async function getAllSessions(): Promise<FocusSession[]> {
  return (await db()).getAll('sessions')
}

export async function putSession(s: FocusSession): Promise<void> {
  await (await db()).put('sessions', s)
}

export async function getSettings(): Promise<Settings> {
  const stored = await (await db()).get('kv', 'settings')
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) }
}

export async function putSettings(s: Settings): Promise<void> {
  await (await db()).put('kv', s, 'settings')
}

export async function exportBackup(): Promise<Backup> {
  const [todos, dayItems, sessions, settings] = await Promise.all([
    getAllTodos(),
    (await db()).getAll('dayItems'),
    getAllSessions(),
    getSettings(),
  ])
  return { app: 'kairos', version: 1, exportedAt: Date.now(), todos, dayItems, sessions, settings }
}

export async function importBackup(backup: Backup, mode: 'merge' | 'replace'): Promise<void> {
  if (backup.app !== 'kairos' || !Array.isArray(backup.todos)) throw new Error('不是知时的备份文件')
  const d = await db()
  if (mode === 'replace') {
    await d.clear('todos')
    await d.clear('dayItems')
    await d.clear('sessions')
  }
  const tx = d.transaction(['todos', 'dayItems', 'sessions', 'kv'], 'readwrite')
  for (const t of backup.todos) await tx.objectStore('todos').put(t)
  for (const i of backup.dayItems) await tx.objectStore('dayItems').put(i)
  for (const s of backup.sessions) await tx.objectStore('sessions').put(s)
  await tx.objectStore('kv').put(backup.settings, 'settings')
  await tx.done
}
