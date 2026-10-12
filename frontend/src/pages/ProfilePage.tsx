import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormSection from '../components/ui/FormSection'
import InputField from '../components/ui/InputField'
import StepIndicator from '../components/ui/StepIndicator'
import ThreeDButton from '../components/ui/ThreeDButton'
import type { Profile } from '../types'

type Props = { profile: Profile; onComplete: (profile: Profile) => void }
const flowSteps = ['Profile', 'Shifts', 'Check', 'Result']

export default function ProfilePage({ profile, onComplete }: Props) {
  const navigate = useNavigate()
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const errors = {
    visaType: !profile.visaType ? 'Choose a visa type.' : '',
    studyPeriodStart: !profile.studyPeriodStart ? 'Enter a study period start date.' : '',
    studyPeriodEnd: !profile.studyPeriodEnd
      ? 'Enter a study period end date.'
      : profile.studyPeriodEnd < profile.studyPeriodStart
        ? 'End date must be after the start date.'
        : '',
  }
  const valid = !Object.values(errors).some(Boolean)
  const update = (key: keyof Profile, value: string) => onComplete({ ...profile, [key]: value })
  const field = (key: keyof Profile) => touched[key] && errors[key]

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <StepIndicator steps={flowSteps} currentStep={0} />
      </div>
      <FormSection
        title="Set up your profile"
        subtitle="Only the details needed to help you track your limit."
      >
        <p className="text-sm leading-6 text-slate-500">Fortnight never asks for your visa number, passport number or employer details.</p>
        <div className="mt-5 space-y-5">
          <label>
            Visa type
            <select value={profile.visaType} onChange={(e) => update('visaType', e.target.value)} onBlur={() => setTouched({ ...touched, visaType: true })}>
              <option value="">Select visa type</option>
              <option>Student visa (subclass 500)</option>
              <option>Other student visa</option>
            </select>
            {field('visaType') && <p className="mt-1 text-sm text-red-600">{errors.visaType}</p>}
            {!field('visaType') && <p className="mt-1 text-sm text-slate-500">Used only to apply the correct hours limit.</p>}
          </label>
          <InputField label="Study period starts" name="studyPeriodStart" type="date" value={profile.studyPeriodStart} onChange={(e) => update('studyPeriodStart', e.target.value)} onBlur={() => setTouched({ ...touched, studyPeriodStart: true })} error={errors.studyPeriodStart} touched={Boolean(touched.studyPeriodStart)} required helperText="Used only to know when the limit applies." />
          <InputField label="Study period ends" name="studyPeriodEnd" type="date" value={profile.studyPeriodEnd} onChange={(e) => update('studyPeriodEnd', e.target.value)} onBlur={() => setTouched({ ...touched, studyPeriodEnd: true })} error={errors.studyPeriodEnd} touched={Boolean(touched.studyPeriodEnd)} required helperText="Used only to know when the limit applies." />
        </div>
        <div className="mt-8 w-full [&>button]:w-full">
          <ThreeDButton label="Continue" disabled={!valid} onClick={() => navigate('/log-shifts')} />
        </div>
      </FormSection>
    </main>
  )
}