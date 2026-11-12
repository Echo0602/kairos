let ctx: AudioContext | null = null
let alarmTimer: number | null = null

/** 在用户首次交互时调用，提前解锁音频上下文，否则到点时浏览器会拒绝出声。 */
export function armAudio(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function beep(at: number, freq: number, dur: number): void {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

function pattern(): void {
  if (!ctx) return
  const t = ctx.currentTime
  beep(t, 880, 0.16)
  beep(t + 0.22, 660, 0.16)
  beep(t + 0.44, 880, 0.2)
}

export function startAlarm(): void {
  armAudio()
  if (alarmTimer != null) return
  pattern()
  alarmTimer = window.setInterval(pattern, 1500)
}

export function stopAlarm(): void {
  if (alarmTimer != null) {
    clearInterval(alarmTimer)
    alarmTimer = null
  }
}

export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}
