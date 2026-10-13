import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormSection from '../components/ui/FormSection'
import IconButton from '../components/ui/IconButton'
import InputField from '../components/ui/InputField'
import StepIndicator from '../components/ui/StepIndicator'
import ThreeDButton from '../components/ui/ThreeDButton'
import type { HomeSummary, Shift, ShiftDraft } from '../types'
import { formatWindowDate, getShiftDuration } from '../utils/hours'

type Props = { shifts: Shift[]; summary: HomeSummary | null; draft: ShiftDraft; onDraftChange: (draft: ShiftDraft) => void; onAddShift: (draft: ShiftDraft) => Promise<void>; onDeleteShift: (id: string) => Promise<void>; onClearData: () => Promise<void>; onLogout: () => Promise<void> }
const flowSteps = ['Profile', 'Shifts', 'Check', 'Result']

export default function LogShiftsPage({ shifts, summary, draft, onDraftChange, onAddShift, onDeleteShift, onClearData, onLogout }: Props) {
  const navigate = useNavigate()
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loadingAction, setLoadingAction] = useState('')
  const [error, setError] = useState('')
  const hours = draft.startTime && draft.endTime ? getShiftDuration(draft) : 0
  const errors = { date: !draft.date ? 'Enter the shift date.' : '', startTime: !draft.startTime ? 'Enter a start time.' : '', endTime: !draft.endTime ? 'Enter an end time.' : hours <= 0 ? 'End time must be after start time.' : hours > 16 ? 'A shift cannot be longer than 16 hours.' : '' }
  const valid = !Object.values(errors).some(Boolean)
  const update = (key: keyof ShiftDraft, value: string) => onDraftChange({ ...draft, [key]: value })
  const run = async (action: string, task: () => Promise<void>) => { setLoadingAction(action); setError(''); try { await task() } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not save your shifts.') } finally { setLoadingAction('') } }
  const add = () => { if (valid) void run('add', () => onAddShift(draft)) }
  const clearData = () => { if (window.confirm('Clear all saved shifts from your account? This cannot be undone.')) void run('clear', onClearData) }

  return <main className="mx-auto max-w-2xl p-5 sm:p-8">
    <div className="mb-6 flex items-center justify-between"><StepIndicator steps={flowSteps} currentStep={1} /><ThreeDButton label="Log out" variant="secondary" onClick={() => void onLogout()} /></div>
    <FormSection title="Log worked shifts" subtitle="Add shifts from the last 14 days. You can check a future shift next.">
      {error && <p className="mb-4 text-sm text-over" role="alert">{error}</p>}
      <div className="grid gap-5 sm:grid-cols-3"><InputField label="Date" name="date" type="date" value={draft.date} onChange={(e) => update('date', e.target.value)} onBlur={() => setTouched({ ...touched, date: true })} error={errors.date} touched={Boolean(touched.date)} required /><InputField label="Start time" name="startTime" type="time" value={draft.startTime} onChange={(e) => update('startTime', e.target.value)} onBlur={() => setTouched({ ...touched, startTime: true })} error={errors.startTime} touched={Boolean(touched.startTime)} required /><InputField label="End time" name="endTime" type="time" value={draft.endTime} onChange={(e) => update('endTime', e.target.value)} onBlur={() => setTouched({ ...touched, endTime: true })} error={errors.endTime} touched={Boolean(touched.endTime)} required /></div>
      {draft.startTime && draft.endTime && <p className="mt-4 text-sm text-ink-600">Duration: <span className="font-mono">{hours > 0 ? `${hours.toFixed(2)} hours` : 'not valid'}</span></p>}
      <div className="mt-5"><ThreeDButton label="Add shift" disabled={!valid} loading={loadingAction === 'add'} onClick={add} /></div>
      <div className="mt-8 border-t border-ink-300 pt-6">{summary && <p className="text-ink-900"><span className="font-mono text-numeral-xl font-medium tracking-tight">{summary.currentHours}</span> <span className="text-base text-ink-600">hours in the 14 days {formatWindowDate(summary.windowStart)} – {formatWindowDate(summary.windowEnd)}</span></p>}<h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-600">Saved shifts (<span className="font-mono">{shifts.length}</span>)</h2>{shifts.length === 0 ? <p className="mt-2 text-sm text-ink-600">No shifts logged yet.</p> : <ul className="mt-3 space-y-2">{shifts.map((shift) => <li key={shift.id} className="flex flex-wrap items-center justify-between gap-3 border border-ink-300 bg-surface px-3 py-3 text-sm"><span className="font-mono tracking-tight">{shift.date} · {shift.startTime}–{shift.endTime}</span><div className="flex items-center gap-3"><strong className="font-mono tracking-tight">{shift.hours.toFixed(2)} h</strong><ThreeDButton label="Delete" variant="danger" loading={loadingAction === `delete-${shift.id}`} onClick={() => void run(`delete-${shift.id}`, () => onDeleteShift(shift.id))} /></div></li>)}</ul>}</div>
      <div className="mt-8 flex gap-4"><ThreeDButton label="Back" variant="secondary" onClick={() => navigate('/profile')} /><IconButton label="Continue to shift check" onClick={() => navigate('/shift-check')} /></div>
      <div className="mt-8 border-t border-ink-300 pt-6"><ThreeDButton label="Clear all my shifts" variant="danger" loading={loadingAction === 'clear'} onClick={clearData} /></div>
    </FormSection>
  </main>
}