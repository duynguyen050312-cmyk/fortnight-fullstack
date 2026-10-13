import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import IconButton from '../components/ui/IconButton'
import ThreeDButton from '../components/ui/ThreeDButton'

// Loaded separately so three.js stays out of the main app bundle.
const FortnightScene = lazy(() => import('../components/FortnightScene'))

const steps = [
  { title: 'Log the shifts you have worked', body: 'Add each shift once. Fortnight works out the hours for you.' },
  { title: 'Check a shift before you say yes', body: 'Test a new shift against your limit before you accept it.' },
  { title: 'See your rolling 14-day window at a glance', body: 'Every day of the current window, with the hours you have left.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center p-5 sm:p-8">
      <section className="w-full overflow-hidden border border-ink-300 bg-surface p-6 sm:p-10">
        <div className="-mx-6 -mt-6 mb-8 empty:hidden sm:-mx-10 sm:-mt-10"><Suspense fallback={null}><FortnightScene /></Suspense></div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">Fortnight</p>
        <h1 className="mt-3 max-w-2xl text-display font-bold text-ink-900">Know your hours before you say yes.</h1>
        <p className="mt-4 max-w-xl text-base leading-6 text-ink-600">Track work against Australia’s 48-hour student visa limit with a rolling 14-day view.</p>
        {/* Illustrative persona quote, not a real citation. */}
        <figure className="mt-6 max-w-xl border-l-2 border-ink-300 pl-4">
          <blockquote className="text-base italic leading-6 text-ink-600">“I kept turning down shifts because I was not sure if I had room.”</blockquote>
          <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">International student, hospitality, Melbourne</figcaption>
        </figure>
        <div className="mt-8 flex flex-wrap gap-3">
          <IconButton label="Get started" onClick={() => navigate('/login')} />
          <ThreeDButton label="Check a shift" variant="secondary" onClick={() => navigate('/shift-check')} />
        </div>
        <section className="mt-10 border-t border-ink-300 pt-8" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">How it works</h2>
          <ol className="mt-5 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => <li key={step.title} className="flex gap-3 sm:flex-col">
              <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-900 font-mono text-sm font-medium text-surface">{index + 1}</span>
              <div><p className="text-base font-semibold leading-6 text-ink-900">{step.title}</p><p className="mt-1 text-sm leading-5 text-ink-600">{step.body}</p></div>
            </li>)}
          </ol>
        </section>
      </section>
    </main>
  )
}
