import type { Priority, RemindMethod, Repeat, ThemeId } from '@/config'

/** 定时事件（有具体时刻，如课堂、会议）或截止任务（某日期前完成，如交报告）。 */
export interface Todo {
  id: string
  kind: 'event' | 'task'
  title: string
  note: string
  tag: string
  priority: Priority
  repeat: Repeat
  /** 事件：首次发生的时刻（epoch ms）。 */
  startAt: number | null
  durationMin: number
  /** 事件重复的结束日期，null 表示无限。 */
  repeatUntil: string | null
  /** 任务：截止日期 'YYYY-MM-DD'。 */
  dueDate: string | null
  /** 任务：截止时刻 'HH:mm'，null 视为 23:59。 */
  dueTime: string | null
  remind: RemindMethod[]
  leadMin: number
  /** 已完成的发生日期键。事件按次完成，任务完成即含其截止日。 */
  completions: string[]
  archived: boolean
  createdAt: number
  updatedAt: number
}

/** 某一天的临时计划项，不属于任何长期待办。 */
export interface DayItem {
  id: string
  dateKey: string
  title: string
  note: string
  estimateMin: number
  done: boolean
  doneAt: number | null
  order: number
  createdAt: number
}

export interface FocusSession {
  id: string
  startedAt: number
  endedAt: number | null
  plannedMin: number
  label: string
  completed: boolean
}

export interface Settings {
  theme: ThemeId
  accent: string | null
  defaultRemind: RemindMethod[]
  defaultLeadMin: number
  soundEnabled: boolean
  vibrateEnabled: boolean
  focusMin: number
  displayName: string
}

/** 事件在某一天的一次发生。 */
export interface Occurrence {
  todoId: string
  dateKey: string
  startAt: number
  endAt: number
  done: boolean
}

export interface Backup {
  app: 'kairos'
  version: 1
  exportedAt: number
  todos: Todo[]
  dayItems: DayItem[]
  sessions: FocusSession[]
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'sage',
  accent: null,
  defaultRemind: ['banner'],
  defaultLeadMin: 15,
  soundEnabled: true,
  vibrateEnabled: true,
  focusMin: 25,
  displayName: '',
}

export function emptyTodo(now: number): Todo {
  return {
    id: '',
    kind: 'event',
    title: '',
    note: '',
    tag: '',
    priority: 0,
    repeat: 'none',
    startAt: null,
    durationMin: 60,
    repeatUntil: null,
    dueDate: null,
    dueTime: null,
    remind: ['banner'],
    leadMin: 15,
    completions: [],
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
}
