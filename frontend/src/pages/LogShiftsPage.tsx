import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormSection from '../components/ui/FormSection'
import IconButton from '../components/ui/IconButton'
import InputField from '../components/ui/InputField'
import StepIndicator from '../components/ui/StepIndicator'
import ThreeDButton from '../components/ui/ThreeDButton'
import type { Shift, ShiftDraft } from '../types'
import { getRollingTotal, getShiftDuration } from '../utils/hours'

type Props = { shifts: Shift[]; draft: ShiftDraft; onDraftChange: (draft: ShiftDraft) => void; onAddShift: (shift: Shift) => void; onDeleteShift: (id: string) => void; onClearData: () => void }
const flowSteps = ['Profile', 'Shifts', 'Check', 'Result']

export default function LogShiftsPage({ shifts, draft, onDraftChange, onAddShift, onDeleteShift, onClearData }: Props) {
  const navigate = useNavigate()
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const hours = draft.startTime && draft.endTime ? getShiftDuration(draft) : 0
  const errors = {
    date: !draft.date ? 'Enter the shift date.' : '',
    startTime: !draft.startTime ? 'Enter a start time.' : '',
    endTime: !draft.endTime ? 'Enter an end time.' : hours <= 0 ? 'End time must be after start time.' : hours > 16 ? 'A shift cannot be longer than 16 hours.' : '',
  }
  const valid = !Object.values(errors).some(Boolean)
  const today = new Date()
  const currentWindowEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const currentWindowHours = getRollingTotal(shifts, currentWindowEnd)
  const update = (key: keyof ShiftDraft, value: string) => onDraftChange({ ...draft, [key]: value })
  const add = () => {
    if (!valid) return
    onAddShift({ ...draft, id: crypto.randomUUID(), hours })
    setTouched({})
  }
  const clearData = () => {
    if (!window.confirm('Clear your profile and all saved shifts from this device? This cannot be undone.')) return

    onClearData()
    navigate('/')
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <StepIndicator steps={flowSteps} currentStep={1} />
      </div>
      <FormSection title="Log worked shifts" subtitle="Add shifts from the last 14 days. You can check a future shift next.">
        <div className="grid gap-5 sm:grid-cols-3">
          <InputField label="Date" name="date" type="date" value={draft.date} onChange={(e) => update('date', e.target.value)} onBlur={() => setTouched({ ...touched, date: true })} error={errors.date} touched={Boolean(touched.date)} required />
          <InputField label="Start time" name="startTime" type="time" value={draft.startTime} onChange={(e) => update('startTime', e.target.value)} onBlur={() => setTouched({ ...touched, startTime: true })} error={errors.startTime} touched={Boolean(touched.startTime)} required />
          <InputField label="End time" name="endTime" type="time" value={draft.endTime} onChange={(e) => update('endTime', e.target.value)} onBlur={() => setTouched({ ...touched, endTime: true })} error={errors.endTime} touched={Boolean(touched.endTime)} required />
        </div>
        {draft.startTime && draft.endTime && <p className="mt-4 text-sm text-slate-600">Duration: {hours > 0 ? `${hours.toFixed(2)} hours` : 'not valid'}</p>}
        <div className="mt-5">
          <ThreeDButton label="Add shift" disabled={!valid} onClick={add} />
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-3xl font-bold tracking-tight text-primary-700">{Number(currentWindowHours.toFixed(2))} hours in your current 14-day window</p>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-600">Saved shifts ({shifts.length})</h2>
          {shifts.length === 0 ? <p className="mt-2 text-sm text-slate-500">No shifts logged yet.</p> : <ul className="mt-3 space-y-2">{shifts.map((shift) => <li key={shift.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"><span>{shift.date} · {shift.startTime}–{shift.endTime}</span><div className="flex items-center gap-3"><strong>{shift.hours.toFixed(2)} h</strong><ThreeDButton label="Delete" variant="danger" onClick={() => onDeleteShift(shift.id)} /></div></li>)}</ul>}
        </div>
        <div className="mt-8 flex gap-4">
          <ThreeDButton label="Back" variant="secondary" onClick={() => navigate('/profile')} />
          <IconButton label="Continue to shift check" onClick={() => navigate('/shift-check')} />
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6">
          <ThreeDButton label="Clear all my data" variant="danger" onClick={clearData} />
        </div>
      </FormSection>
    </main>
  )
}