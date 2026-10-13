import type { DailyHours, UsageStatus } from '../../types'
import { formatWindowDate } from '../../utils/hours'
import { useHasEntered } from '../../utils/motion'

type Props = { windowStart: string; windowEnd: string; dailyHours: DailyHours[]; status: UsageStatus }

// Cells share a fixed 12-hour scale so heights are comparable; it stretches if a day exceeds 12 hours.
const baseScaleHours = 12
// 13 × 12ms stagger + 420ms growth keeps the whole entrance under 600ms.
const staggerMs = 12

const statusClasses: Record<UsageStatus, string> = {
  safe: 'border-safe bg-safe-bg',
  tight: 'border-tight bg-tight-bg',
  over: 'border-over bg-over-bg',
}

export default function FortnightStrip({ windowStart, windowEnd, dailyHours, status }: Props) {
  const entered = useHasEntered()
  const scaleHours = Math.max(...dailyHours.map((day) => day.hours), baseScaleHours)
  const hasBreakDays = dailyHours.some((day) => day.inBreak)
  return <section className={`w-full border px-3 py-1 ${statusClasses[status]}`} aria-label="Fortnight work hours">
    <div className="flex h-[60px] w-full items-end gap-[3px] sm:gap-1" role="list" aria-label={`Hours from ${formatWindowDate(windowStart)} to ${formatWindowDate(windowEnd)}`}>
      {dailyHours.map((day, index) => <div key={day.date} className={`flex h-full min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-sm border border-ink-300 ${day.inBreak ? 'border-dashed bg-paper' : 'bg-surface'}`} role="listitem" aria-label={`${formatWindowDate(day.date)}: ${day.hours} hours${day.inBreak ? ', study break, not counted' : ''}`}>
        <div className={`w-full ${day.inBreak ? 'bg-ink-300' : 'bg-ink-900'} motion-safe:transition-[height] motion-safe:duration-[420ms] motion-safe:ease-out`} style={{ height: entered ? `${(day.hours / scaleHours) * 100}%` : '0%', transitionDelay: `${index * staggerMs}ms` }} />
      </div>)}
    </div>
    <p className="mt-1.5 flex justify-between font-mono text-xs leading-4 text-ink-600"><span>{formatWindowDate(windowStart)}</span><span>{formatWindowDate(windowEnd)}</span></p>
    {hasBreakDays && <p className="mt-1 flex items-center gap-1.5 text-xs leading-4 text-ink-600"><span aria-hidden="true" className="inline-block h-2.5 w-2 shrink-0 rounded-sm border border-dashed border-ink-300 bg-paper" />Dashed, lighter days are study breaks: hours shown but not counted toward the cap.</p>}
  </section>
}
