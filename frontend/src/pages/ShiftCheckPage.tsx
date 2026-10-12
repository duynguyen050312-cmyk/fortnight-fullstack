import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormSection from '../components/ui/FormSection'
import IconButton from '../components/ui/IconButton'
import InputField from '../components/ui/InputField'
import StepIndicator from '../components/ui/StepIndicator'
import type { Shift, ShiftDraft } from '../types'
import { checkShift, getShiftDuration } from '../utils/hours'

type Props = { shifts: Shift[]; proposedShift: ShiftDraft; onComplete: (shift: ShiftDraft) => void }
const flowSteps = ['Profile', 'Shifts', 'Check', 'Result']

export default function ShiftCheckPage({ shifts, proposedShift, onComplete }: Props) {
  const navigate = useNavigate()
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const hours = proposedShift.startTime && proposedShift.endTime ? getShiftDuration(proposedShift) : 0
  const errors = {
    date: !proposedShift.date ? 'Enter the proposed shift date.' : '',
    startTime: !proposedShift.startTime ? 'Enter a start time.' : '',
    endTime: !proposedShift.endTime ? 'Enter an end time.' : hours <= 0 ? 'End time must be after start time.' : hours > 16 ? 'A shift cannot be longer than 16 hours.' : '',
  }
  const valid = !Object.values(errors).some(Boolean)
  const update = (key: keyof ShiftDraft, value: string) => onComplete({ ...proposedShift, [key]: value })

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <StepIndicator steps={flowSteps} currentStep={2} />
      </div>
      <FormSection title="Check a proposed shift" subtitle="We will test it against the rolling 14 days ending on this date.">
        <div className="grid gap-5 sm:grid-cols-3">
          <InputField label="Date" name="date" type="date" value={proposedShift.date} onChange={(e) => update('date', e.target.value)} onBlur={() => setTouched({ ...touched, date: true })} error={errors.date} touched={Boolean(touched.date)} required />
          <InputField label="Start time" name="startTime" type="time" value={proposedShift.startTime} onChange={(e) => update('startTime', e.target.value)} onBlur={() => setTouched({ ...touched, startTime: true })} error={errors.startTime} touched={Boolean(touched.startTime)} required />
          <InputField label="End time" name="endTime" type="time" value={proposedShift.endTime} onChange={(e) => update('endTime', e.target.value)} onBlur={() => setTouched({ ...touched, endTime: true })} error={errors.endTime} touched={Boolean(touched.endTime)} required />
        </div>
        <div className="mt-8 w-full [&>button]:w-full">
          <IconButton label="Check this shift" disabled={!valid} onClick={() => navigate('/result', { state: checkShift(shifts, proposedShift) })} />
        </div>
      </FormSection>
    </main>
  )
}