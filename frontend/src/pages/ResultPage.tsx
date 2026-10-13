import { useLocation, useNavigate } from 'react-router-dom'
import StepIndicator from '../components/ui/StepIndicator'
import ThreeDButton from '../components/ui/ThreeDButton'
import FortnightStrip from '../components/ui/FortnightStrip'
import type { CheckResult } from '../types'
import { formatWindowDate } from '../utils/hours'

type Props = { onLogout: () => Promise<void> }
const flowSteps = ['Profile', 'Shifts', 'Check', 'Result']
const statusClasses = { safe: 'border-safe bg-safe-bg text-safe', tight: 'border-tight bg-tight-bg text-tight', over: 'border-over bg-over-bg text-over' }

export default function ResultPage({ onLogout }: Props) {
  const { state } = useLocation()
  const navigate = useNavigate()
  const result = state as CheckResult | null
  if (!result) return <main className="mx-auto max-w-2xl p-5 sm:p-8"><div className="mb-6 flex items-center justify-between"><StepIndicator steps={flowSteps} currentStep={3} /><ThreeDButton label="Log out" variant="secondary" onClick={() => void onLogout()} /></div><section className="border border-ink-300 bg-surface p-5 sm:p-6"><h1 className="text-[22px] font-bold leading-7 text-ink-900">No shift check to show</h1><div className="mt-6"><ThreeDButton label="Check a shift" onClick={() => navigate('/shift-check')} /></div></section></main>
  return <main className="mx-auto max-w-2xl p-5 sm:p-8"><div className="mb-6 flex items-center justify-between"><StepIndicator steps={flowSteps} currentStep={3} /><ThreeDButton label="Log out" variant="secondary" onClick={() => void onLogout()} /></div><section className={`border p-5 sm:p-6 ${statusClasses[result.status]}`}><p className="inline-flex rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide">{result.status}</p><h1 className="mt-5 text-ink-900"><span className="font-mono text-numeral-xl font-medium tracking-tight">{result.projectedHours}</span> <span className="text-[22px] font-bold">hours projected</span></h1><p className="mt-4 leading-6 text-ink-900">{result.reason}</p><p className="mt-3 text-sm text-ink-600">Hours already logged in the 14 days ending {formatWindowDate(result.windowEnd)} ({formatWindowDate(result.windowStart)} – {formatWindowDate(result.windowEnd)}): <span className="font-mono tracking-tight">{result.currentHours}</span>{result.unlimited ? ' · No fortnightly cap in place for your visa type.' : <> · <span className="font-mono tracking-tight">{result.remainingHours}</span> hours remaining of <span className="font-mono tracking-tight">{result.limitHours}</span>.</>}</p><div className="mt-6"><FortnightStrip windowStart={result.windowStart} windowEnd={result.windowEnd} dailyHours={result.dailyHours} status={result.status} /></div><div className="mt-8 flex flex-wrap gap-3"><ThreeDButton label="Check another shift" onClick={() => navigate('/shift-check')} /><ThreeDButton label="View shifts" variant="secondary" onClick={() => navigate('/log-shifts')} /></div><p className="mt-6 border-t border-ink-300 pt-5 text-sm leading-5 text-ink-600">Fortnight is a planning tool, not legal advice. Always confirm your conditions with your education provider or the Department of Home Affairs.</p></section></main>
}