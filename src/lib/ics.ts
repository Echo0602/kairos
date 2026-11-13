import { APP } from '@/config'
import type { Todo } from '@/data/types'
import { combineDayTimeStr, taskDueTs, toIcsUtc } from './date'

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

/** RFC 5545 要求单行不超过 75 字节，超长需折行（续行以一个空格开头）。 */
function fold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  for (const ch of line) {
    const test = current + ch
    const limit = parts.length === 0 ? 75 : 74
    if (enc.encode(test).length > limit) {
      parts.push(current)
      current = ` ${ch}`
    } else {
      current = test
    }
  }
  if (current) parts.push(current)
  return parts.join('\r\n')
}

function esc(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function rrule(todo: Todo): string | null {
  if (todo.repeat === 'daily') return 'FREQ=DAILY'
  if (todo.repeat === 'weekly' && todo.startAt != null) {
    return `FREQ=WEEKLY;BYDAY=${BYDAY[new Date(todo.startAt).getDay()]}`
  }
  if (todo.repeat === 'weekdays') return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
  return null
}

/** 生成标准 iCalendar 文本，含 VALARM 提前提醒与 RRULE 重复。 */
export function buildIcs(todos: Todo[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${APP.nameEn}//${APP.nameZh}//CN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  const stamp = toIcsUtc(Date.now())

  for (const todo of todos) {
    const start = todo.kind === 'event' ? todo.startAt : taskDueTs(todo)
    if (start == null) continue
    const end = todo.kind === 'event' ? start + todo.durationMin * 60000 : start + 60000

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${todo.id}@${APP.repo}`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART:${toIcsUtc(start)}`)
    lines.push(`DTEND:${toIcsUtc(end)}`)
    lines.push(`SUMMARY:${esc(todo.tag ? `[${todo.tag}] ${todo.title}` : todo.title)}`)
    if (todo.note) lines.push(`DESCRIPTION:${esc(todo.note)}`)
    const rule = rrule(todo)
    if (rule) {
      const until = todo.repeatUntil ? toIcsUtc(combineDayTimeStr(todo.repeatUntil, '23:59')) : null
      lines.push(`RRULE:${rule}${until ? `;UNTIL=${until}` : ''}`)
    }
    lines.push('BEGIN:VALARM')
    lines.push('ACTION:DISPLAY')
    lines.push(`DESCRIPTION:${esc(todo.title)}`)
    lines.push(`TRIGGER:-PT${todo.leadMin}M`)
    lines.push('END:VALARM')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return `${lines.map(fold).join('\r\n')}\r\n`
}

/** 优先弹系统分享面板（可直接选「日历」导入），不支持时回退为下载文件。 */
export async function shareOrDownloadIcs(
  filename: string,
  todos: Todo[],
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = new Blob([buildIcs(todos)], { type: 'text/calendar;charset=utf-8' })
  const file = new File([blob], filename, { type: 'text/calendar' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: APP.nameZh })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  downloadBlob(filename, blob)
  return 'downloaded'
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
