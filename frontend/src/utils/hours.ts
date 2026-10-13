import type { ShiftDraft } from '../types'

const toLocalDate = (date: string) => new Date(`${date}T00:00:00`)
const duration = (start: string, end: string) => { const [a, b] = start.split(':').map(Number); const [c, d] = end.split(':').map(Number); return (c * 60 + d - (a * 60 + b)) / 60 }

export function getShiftDuration(draft: ShiftDraft) { return duration(draft.startTime, draft.endTime) }
export function getLocalToday() { const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` }
export function formatWindowDate(value: string) { return toLocalDate(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) }