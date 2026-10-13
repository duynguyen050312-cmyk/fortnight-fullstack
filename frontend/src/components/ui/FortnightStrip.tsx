import type { DailyHours, UsageStatus } from '../../types'
import { formatWindowDate } from '../../utils/hours'

type Props = { windowStart: string; windowEnd: string; dailyHours: DailyHours[]; status: UsageStatus }

// Cells share a fixed 12-hour scale so heights are comparable; it stretches if a day exceeds 12 hours.
const baseScaleHours = 12

const statusClasses: Record<UsageStatus, string> = {
  safe: 'border-safe bg-safe-bg',
  tight: 'border-tight bg-tight-bg',
  over: 'border-over bg-over-bg',
}

export default function FortnightStrip({ windowStart, windowEnd, dailyHours, status }: Props) {
  const scaleHours = Math.max(...dailyHours.map((day) => day.hours), baseScaleHours)
  return <section className={`w-full border px-3 py-1 ${statusClasses[status]}`} aria-label="Fortnight work hours">
    <div className="flex h-[60px] w-full items-end gap-[3px] sm:gap-1" role="list" aria-label={`Hours from ${formatWindowDate(windowStart)} to ${formatWindowDate(windowEnd)}`}>
      {dailyHours.map((day) => <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-sm border border-ink-300 bg-surface" role="listitem" aria-label={`${formatWindowDate(day.date)}: ${day.hours} hours`}>
        <div className="w-full bg-ink-900" style={{ height: `${(day.hours / scaleHours) * 100}%` }} />
      </div>)}
    </div>
    <p className="mt-1.5 flex justify-between font-mono text-xs leading-4 tracking-tight text-ink-600"><span>{formatWindowDate(windowStart)}</span><span>{formatWindowDate(windowEnd)}</span></p>
  </section>
}
