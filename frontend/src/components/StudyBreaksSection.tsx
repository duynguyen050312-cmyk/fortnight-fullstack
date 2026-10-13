import { useState } from 'react'
import InputField from './ui/InputField'
import ThreeDButton from './ui/ThreeDButton'
import type { StudyBreak, StudyBreakDraft } from '../types'
import { formatWindowDate } from '../utils/hours'

type Props = { breaks: StudyBreak[]; onAdd: (draft: StudyBreakDraft) => Promise<void>; onDelete: (id: string) => Promise<void> }

const emptyDraft: StudyBreakDraft = { label: '', startDate: '', endDate: '' }
const formatBreakDate = (value: string) => `${formatWindowDate(value)} ${value.slice(0, 4)}`

export default function StudyBreaksSection({ breaks, onAdd, onDelete }: Props) {
  const [draft, setDraft] = useState<StudyBreakDraft>(emptyDraft)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loadingAction, setLoadingAction] = useState('')
  const [error, setError] = useState('')
  const errors = { startDate: !draft.startDate ? 'Enter the first day of the break.' : '', endDate: !draft.endDate ? 'Enter the last day of the break.' : draft.endDate < draft.startDate ? 'The break must end on or after its start date.' : '' }
  const valid = !Object.values(errors).some(Boolean)
  const update = (key: keyof StudyBreakDraft, value: string) => setDraft({ ...draft, [key]: value })
  const run = async (action: string, task: () => Promise<void>) => { setLoadingAction(action); setError(''); try { await task(); return true } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not save your study breaks.'); return false } finally { setLoadingAction('') } }
  const add = async () => {
    if (!valid) { setTouched({ startDate: true, endDate: true }); return }
    if (await run('add', () => onAdd(draft))) { setDraft(emptyDraft); setTouched({}) }
  }

  return <section className="mt-8 border-t border-ink-300 pt-6" aria-labelledby="study-breaks">
    <h2 id="study-breaks" className="text-xs font-semibold uppercase tracking-wide text-ink-600">Study breaks</h2>
    <p className="mt-2 max-w-xl text-sm leading-5 text-ink-600">Hours worked during your provider’s official course breaks are not limited, so they are left out of your fortnightly total. Add only the break dates your education provider has published.</p>
    {error && <p className="mt-3 text-sm text-over" role="alert">{error}</p>}
    {breaks.length > 0 && <ul className="mt-4 space-y-2">{breaks.map((period) => <li key={period.id} className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-ink-300 bg-surface px-3 py-3 text-sm transition-colors duration-150 hover:border-ink-600 hover:bg-paper">
      <span className="min-w-0"><span className="block truncate font-semibold text-ink-900">{period.label || 'Study break'}</span><span className="mt-0.5 block font-mono tracking-tight text-ink-600">{formatBreakDate(period.startDate)} – {formatBreakDate(period.endDate)}</span></span>
      <ThreeDButton label="Delete" variant="danger" loading={loadingAction === `delete-${period.id}`} onClick={() => void run(`delete-${period.id}`, () => onDelete(period.id))} />
    </li>)}</ul>}
    <div className="mt-4 border border-ink-300 bg-surface p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <InputField label="Label (optional)" name="breakLabel" type="text" value={draft.label} onChange={(e) => update('label', e.target.value)} onBlur={() => setTouched({ ...touched, label: true })} error="" touched={false} required={false} maxLength={60} />
        <InputField label="First day" name="breakStart" type="date" value={draft.startDate} onChange={(e) => update('startDate', e.target.value)} onBlur={() => setTouched({ ...touched, startDate: true })} error={errors.startDate} touched={Boolean(touched.startDate)} required />
        <InputField label="Last day" name="breakEnd" type="date" value={draft.endDate} onChange={(e) => update('endDate', e.target.value)} onBlur={() => setTouched({ ...touched, endDate: true })} error={errors.endDate} touched={Boolean(touched.endDate)} required />
      </div>
      <div className="mt-4"><ThreeDButton label="Add break" variant="secondary" loading={loadingAction === 'add'} onClick={() => void add()} /></div>
    </div>
  </section>
}
