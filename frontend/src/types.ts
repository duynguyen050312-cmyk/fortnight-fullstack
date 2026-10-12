export type Profile = { visaType: string; studyPeriodStart: string; studyPeriodEnd: string }
export type Shift = { id: string; date: string; startTime: string; endTime: string; hours: number }
export type ShiftDraft = { date: string; startTime: string; endTime: string }
export type CheckResult = { safe: boolean; currentHours: number; projectedHours: number; reason: string }