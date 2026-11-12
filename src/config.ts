/** 应用身份与全局常量。改名、改版本号只需要动这里。 */
export const APP = {
  nameZh: '知时',
  nameEn: 'Kairos',
  tagline: '别错过任何一件重要的事',
  version: '0.1.0',
  repo: 'kairos',
} as const

/** 提醒方式，每条待办可多选。 */
export const REMIND_METHODS = {
  banner: '置顶横幅',
  alert: '全屏强提醒',
  calendar: '系统日历',
} as const
export type RemindMethod = keyof typeof REMIND_METHODS

export const REMIND_METHOD_HINT: Record<RemindMethod, string> = {
  banner: '首页顶部常驻，带实时倒计时',
  alert: '到点整屏提醒，需手动确认，适合绝不能错过的事',
  calendar: '导出 .ics 导入手机日历，由系统准时响铃',
}

export type Repeat = 'none' | 'daily' | 'weekly' | 'weekdays'

export const REPEAT_LABEL: Record<Repeat, string> = {
  none: '不重复',
  daily: '每天',
  weekly: '每周',
  weekdays: '每个工作日',
}

export type Priority = 0 | 1 | 2

export const PRIORITY_LABEL: Record<Priority, string> = {
  0: '普通',
  1: '重要',
  2: '紧急',
}

export const DEFAULTS = {
  leadMin: 15,
  focusMin: 25,
  /** 完成度达到该比例即计入连续天数，规则在统计页明确展示。 */
  streakThreshold: 0.6,
} as const

export const THEMES = {
  sage: '清雅米绿',
  dark: '深色专注',
  paper: '纸质手账',
  mono: '极简黑白',
} as const
export type ThemeId = keyof typeof THEMES
