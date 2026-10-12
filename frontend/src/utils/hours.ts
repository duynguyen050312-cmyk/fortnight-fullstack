import type { Shift, ShiftDraft } from '../types'

const toLocalDate = (date: string) => new Date(`${date}T00:00:00`)
const duration = (start: string, end: string) => { const [a, b] = start.split(':').map(Number); const [c, d] = end.split(':').map(Number); return (c * 60 + d - (a * 60 + b)) / 60 }

export function getRollingTotal(shifts: Shift[], endDate: string): number { const end = toLocalDate(endDate); const start = new Date(end); start.setDate(end.getDate() - 13); return shifts.reduce((total, shift) => { const date = toLocalDate(shift.date); return date >= start && date <= end ? total + shift.hours : total }, 0) }
export function getShiftDuration(draft: ShiftDraft) { return duration(draft.startTime, draft.endTime) }