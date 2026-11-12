export function ProgressRing({
  rate,
  size = 64,
  stroke = 6,
  label,
}: {
  rate: number
  size?: number
  stroke?: number
  label?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, rate))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`完成度 ${Math.round(clamped * 100)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--text)"
        style={{ font: `700 ${size / 4.2}px var(--font-body)`, fontVariantNumeric: 'tabular-nums' }}
      >
        {label ?? `${Math.round(clamped * 100)}%`}
      </text>
    </svg>
  )
}
