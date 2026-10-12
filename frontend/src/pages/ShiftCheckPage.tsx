import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormSection from '../components/ui/FormSection'
import IconButton from '../components/ui/IconButton'
import InputField from '../components/ui/InputField'
import StepIndicator from '../components/ui/StepIndicator'
import ThreeDButton from '../components/ui/ThreeDButton'
import type { CheckResult, ShiftDraft } from '../types'
import { getShiftDuration } from '../utils/hours'

type Props = { proposedShift: ShiftDraft; onComplete: (shift: ShiftDraft) => void; onCheck: (draft: ShiftDraft) => Promise<CheckResult>; onLogout: () => Promise<void> }
const flowSteps = ['Profile', 'Shifts', 'Check', 'Result']

export default function ShiftCheckPage({ proposedShift, onComplete, onCheck, onLogout }: Props) {
  const navigate = useNavigate()
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const hours = proposedShift.startTime && proposedShift.endTime ? getShiftDuration(proposedShift) : 0
  const errors = { date: !proposedShift.date ? 'Enter the proposed shift date.' : '', startTime: !proposedShift.startTime ? 'Enter a start time.' : '', endTime: !proposedShift.endTime ? 'Enter an end time.' : hours <= 0 ? 'End time must be after start time.' : hours > 16 ? 'A shift cannot be longer than 16 hours.' : '' }
  const valid = !Object.values(errors).some(Boolean)
  const update = (key: keyof ShiftDraft, value: string) => onComplete({ ...proposedShift, [key]: value })
  const submit = async () => { if (!valid) return; setLoading(true); setError(''); try { const result = await onCheck(proposedShift); navigate('/result', { state: result }) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not check this shift.') } finally { setLoading(false) } }

  return <main className="mx-auto max-w-2xl p-6"><div className="mb-6 flex items-center justify-between"><StepIndicator steps={flowSteps} currentStep={2} /><ThreeDButton label="Log out" variant="secondary" onClick={() => void onLogout()} /></div><FormSection title="Check a proposed shift" subtitle="We will test it against the rolling 14 days ending on this date.">{error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}<div className="grid gap-5 sm:grid-cols-3"><InputField label="Date" name="date" type="date" value={proposedShift.date} onChange={(e) => update('date', e.target.value)} onBlur={() => setTouched({ ...touched, date: true })} error={errors.date} touched={Boolean(touched.date)} required /><InputField label="Start time" name="startTime" type="time" value={proposedShift.startTime} onChange={(e) => update('startTime', e.target.value)} onBlur={() => setTouched({ ...touched, startTime: true })} error={errors.startTime} touched={Boolean(touched.startTime)} required /><InputField label="End time" name="endTime" type="time" value={proposedShift.endTime} onChange={(e) => update('endTime', e.target.value)} onBlur={() => setTouched({ ...touched, endTime: true })} error={errors.endTime} touched={Boolean(touched.endTime)} required /></div><div className="mt-8 w-full [&>button]:w-full"><IconButton label="Check this shift" disabled={!valid} loading={loading} onClick={() => void submit()} /></div></FormSection></main>
}