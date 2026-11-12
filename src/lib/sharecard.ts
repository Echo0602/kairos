/**
 * 把「今日计划 / 完成报告 / 专注凭证」绘制成一张可分享的图片。
 * 直接读当前主题的 CSS 变量，导出的图和界面同色系。
 */

export interface CardLine {
  text: string
  done: boolean
  meta?: string
}

export interface CardStat {
  label: string
  value: string
}

export interface CardData {
  title: string
  dateLabel: string
  lines: CardLine[]
  stats: CardStat[]
  footerNote?: string
  signature?: string
}

interface Palette {
  bg: string
  surface: string
  text: string
  muted: string
  accent: string
  contrast: string
  border: string
  font: string
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    bg: v('--bg', '#f7f8f5'),
    surface: v('--surface', '#ffffff'),
    text: v('--text', '#2c352f'),
    muted: v('--text-muted', '#8a9189'),
    accent: v('--accent', '#31594b'),
    contrast: v('--accent-contrast', '#fafaf8'),
    border: v('--border', '#e4e8df'),
    font: v('--font-body', 'sans-serif'),
  }
}

const W = 380
const PAD = 26

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = []
  let line = ''
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      out.push(line)
      line = ch
    } else {
      line += ch
    }
  }
  if (line) out.push(line)
  return out.length ? out : ['']
}

export function renderCard(data: CardData): string {
  const p = readPalette()
  const scale = 3

  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = `500 15px ${p.font}`
  const textWidth = W - PAD * 2 - 34
  const wrappedLines = data.lines.map((l) => ({
    ...l,
    wrapped: wrap(measure, l.text, textWidth),
  }))

  let h = PAD
  h += 30 // 标题
  h += 20 // 日期
  h += 18 // 间隔
  for (const l of wrappedLines) {
    h += l.wrapped.length * 22
    if (l.meta) h += 16
    h += 12
  }
  if (wrappedLines.length === 0) h += 34
  h += 14
  h += 74 // 统计区
  if (data.footerNote) h += 22
  h += 26 // 署名
  h += PAD

  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  ctx.fillStyle = p.bg
  ctx.fillRect(0, 0, W, h)
  roundRect(ctx, 10, 10, W - 20, h - 20, 18)
  ctx.fillStyle = p.surface
  ctx.fill()
  ctx.strokeStyle = p.border
  ctx.lineWidth = 1
  ctx.stroke()

  let y = PAD + 8

  // 顶部色条 + 标题
  ctx.fillStyle = p.accent
  roundRect(ctx, PAD, y - 4, 4, 24, 2)
  ctx.fill()
  ctx.fillStyle = p.text
  ctx.font = `700 21px ${p.font}`
  ctx.textBaseline = 'middle'
  ctx.fillText(data.title, PAD + 14, y + 8)
  y += 30

  ctx.fillStyle = p.muted
  ctx.font = `400 12px ${p.font}`
  ctx.fillText(data.dateLabel, PAD + 14, y + 4)
  y += 20 + 14

  ctx.strokeStyle = p.border
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(W - PAD, y)
  ctx.stroke()
  y += 16

  // 条目
  for (const l of wrappedLines) {
    const cx = PAD + 9
    const cy = y + 10
    ctx.beginPath()
    ctx.arc(cx, cy, 9, 0, Math.PI * 2)
    if (l.done) {
      ctx.fillStyle = p.accent
      ctx.fill()
      ctx.strokeStyle = p.contrast
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - 4, cy)
      ctx.lineTo(cx - 1, cy + 3.5)
      ctx.lineTo(cx + 4.5, cy - 3.5)
      ctx.stroke()
    } else {
      ctx.strokeStyle = p.border
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.fillStyle = l.done ? p.muted : p.text
    ctx.font = `500 15px ${p.font}`
    l.wrapped.forEach((line, i) => {
      ctx.fillText(line, PAD + 28, y + 10 + i * 22)
      if (l.done && i === 0) {
        const w = ctx.measureText(line).width
        ctx.strokeStyle = p.muted
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(PAD + 28, y + 10)
        ctx.lineTo(PAD + 28 + w, y + 10)
        ctx.stroke()
      }
    })
    y += l.wrapped.length * 22
    if (l.meta) {
      ctx.fillStyle = p.muted
      ctx.font = `400 11px ${p.font}`
      ctx.fillText(l.meta, PAD + 28, y + 6)
      y += 16
    }
    y += 12
  }

  if (wrappedLines.length === 0) {
    ctx.fillStyle = p.muted
    ctx.font = `400 14px ${p.font}`
    ctx.fillText('今天还没有安排', PAD, y + 10)
    y += 34
  }

  // 统计区
  y += 6
  const boxW = (W - PAD * 2 - (data.stats.length - 1) * 10) / data.stats.length
  data.stats.forEach((s, i) => {
    const x = PAD + i * (boxW + 10)
    roundRect(ctx, x, y, boxW, 62, 10)
    ctx.fillStyle = p.bg
    ctx.fill()
    ctx.fillStyle = p.accent
    ctx.font = `700 22px ${p.font}`
    ctx.fillText(s.value, x + 12, y + 24)
    ctx.fillStyle = p.muted
    ctx.font = `400 11px ${p.font}`
    ctx.fillText(s.label, x + 12, y + 46)
  })
  y += 74

  if (data.footerNote) {
    ctx.fillStyle = p.muted
    ctx.font = `400 11px ${p.font}`
    ctx.fillText(data.footerNote, PAD, y + 4)
    y += 22
  }

  ctx.fillStyle = p.muted
  ctx.font = `500 11px ${p.font}`
  const sig = data.signature ? `${data.signature} · 知时 Kairos` : '知时 Kairos'
  ctx.fillText(sig, PAD, y + 8)

  return canvas.toDataURL('image/png')
}

export function dataUrlToBlob(url: string): Blob {
  const [head, b64] = url.split(',')
  const mime = head.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
