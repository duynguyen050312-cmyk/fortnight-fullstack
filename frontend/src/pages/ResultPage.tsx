import { useLocation, useNavigate } from 'react-router-dom'
import StepIndicator from '../components/ui/StepIndicator'
import ThreeDButton from '../components/ui/ThreeDButton'
import type { CheckResult } from '../types'

const flowSteps = ['Profile', 'Shifts', 'Check', 'Result']

export default function ResultPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const result = state as CheckResult | null

  if (!result) {
    return (
      <main className="mx-auto max-w-2xl p-6">
          <div className="mb-6">
            <StepIndicator steps={flowSteps} currentStep={3} />
          </div>
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">No shift check to show</h1>
          <div className="mt-6">
            <ThreeDButton label="Check a shift" onClick={() => navigate('/shift-check')} />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <StepIndicator steps={flowSteps} currentStep={3} />
      </div>
      <section className={`rounded-2xl p-8 shadow-sm ${result.safe ? 'bg-success-50' : 'bg-white'}`}>
        <p className={`text-sm font-semibold uppercase tracking-widest ${result.safe ? 'text-success-700' : 'text-red-600'}`}>
          {result.safe ? 'Safe to accept' : 'Would breach the cap'}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{result.projectedHours} hours projected</h1>
        <p className="mt-4 leading-7 text-slate-700">{result.reason}</p>
        <p className="mt-3 text-sm text-slate-600">Hours already in this rolling window: {result.currentHours}</p>
        <div className="mt-8 flex gap-3">
          <ThreeDButton label="Check another shift" onClick={() => navigate('/shift-check')} />
          <ThreeDButton label="View shifts" variant="secondary" onClick={() => navigate('/log-shifts')} />
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-500">Fortnight is a planning tool, not legal advice. Always confirm your conditions with your education provider or the Department of Home Affairs.</p>
      </section>
    </main>
  )
}