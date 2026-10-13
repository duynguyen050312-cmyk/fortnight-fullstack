import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormSection from '../components/ui/FormSection'
import InputField from '../components/ui/InputField'
import StepIndicator from '../components/ui/StepIndicator'
import ThreeDButton from '../components/ui/ThreeDButton'
import * as api from '../api'
import type { Profile } from '../types'

type Props = { profile: Profile; onChange: (profile: Profile) => void; onSave: (profile: Profile) => Promise<void>; onLogout: () => Promise<void>; loadingData: boolean; loadError: string }
const flowSteps = ['Profile', 'Shifts', 'Check', 'Result']

export default function ProfilePage({ profile, onChange, onSave, onLogout, loadingData, loadError }: Props) {
  const navigate = useNavigate()
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [visaTypes, setVisaTypes] = useState<string[]>([])
  useEffect(() => { api.getVisaTypes().then((options) => setVisaTypes(options.map((option) => option.label))).catch(() => setError('Could not load visa types.')) }, [])
  const visaOptions = profile.visaType && !visaTypes.includes(profile.visaType) ? [...visaTypes, profile.visaType] : visaTypes
  const errors = { visaType: !profile.visaType ? 'Choose a visa type.' : '', studyPeriodStart: !profile.studyPeriodStart ? 'Enter a study period start date.' : '', studyPeriodEnd: !profile.studyPeriodEnd ? 'Enter a study period end date.' : profile.studyPeriodEnd < profile.studyPeriodStart ? 'End date must be after the start date.' : '' }
  const valid = !Object.values(errors).some(Boolean)
  const update = (key: keyof Profile, value: string) => onChange({ ...profile, [key]: value })
  const field = (key: keyof Profile) => touched[key] && errors[key]
  const save = async () => { if (!valid) return; setSaving(true); setError(''); try { await onSave(profile); navigate('/home') } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not save your profile.') } finally { setSaving(false) } }

  return <main className="mx-auto max-w-2xl p-5 sm:p-8">
    <div className="mb-6 flex items-center justify-between"><StepIndicator steps={flowSteps} currentStep={0} /><ThreeDButton label="Log out" variant="secondary" onClick={() => void onLogout()} /></div>
    <FormSection title="Set up your profile" subtitle="Only the details needed to help you track your limit.">
      <p className="text-sm leading-5 text-ink-600">Fortnight never asks for your visa number, passport number or employer details.</p>
      {loadingData && <p className="mt-4 text-sm text-ink-600">Loading your saved data…</p>}
      {(error || loadError) && <p className="mt-4 text-sm text-over" role="alert">{error || loadError}</p>}
      <div className="mt-5 space-y-5">
        <label>Visa type<select value={profile.visaType} onChange={(e) => update('visaType', e.target.value)} onBlur={() => setTouched({ ...touched, visaType: true })}><option value="">Select visa type</option>{visaOptions.map((visaType) => <option key={visaType}>{visaType}</option>)}</select>{field('visaType') && <p className="mt-1 text-sm text-over">{errors.visaType}</p>}{!field('visaType') && <p className="mt-1 text-sm text-ink-600">Used only to apply the correct hours limit.</p>}</label>
        <InputField label="Study period starts" name="studyPeriodStart" type="date" value={profile.studyPeriodStart} onChange={(e) => update('studyPeriodStart', e.target.value)} onBlur={() => setTouched({ ...touched, studyPeriodStart: true })} error={errors.studyPeriodStart} touched={Boolean(touched.studyPeriodStart)} required helperText="Used only to know when the limit applies." />
        <InputField label="Study period ends" name="studyPeriodEnd" type="date" value={profile.studyPeriodEnd} onChange={(e) => update('studyPeriodEnd', e.target.value)} onBlur={() => setTouched({ ...touched, studyPeriodEnd: true })} error={errors.studyPeriodEnd} touched={Boolean(touched.studyPeriodEnd)} required helperText="Used only to know when the limit applies." />
      </div>
      <div className="mt-8 w-full [&>button]:w-full"><ThreeDButton label="Continue" disabled={!valid || loadingData} loading={saving} onClick={() => void save()} /></div>
    </FormSection>
  </main>
}