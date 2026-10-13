import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import IconButton from '../components/ui/IconButton'
import ThreeDButton from '../components/ui/ThreeDButton'

// Loaded separately so three.js stays out of the main app bundle.
const FortnightScene = lazy(() => import('../components/FortnightScene'))

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center p-5 sm:p-8">
      <section className="w-full border border-ink-300 bg-surface p-6 sm:p-10">
        <div className="mb-8 empty:hidden"><Suspense fallback={null}><FortnightScene /></Suspense></div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">Fortnight</p>
        <h1 className="mt-3 max-w-2xl text-display font-bold text-ink-900">Know your hours before you say yes.</h1>
        <p className="mt-4 max-w-xl text-base leading-6 text-ink-600">Track work against Australia’s 48-hour student visa limit with a rolling 14-day view.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <IconButton label="Get started" onClick={() => navigate('/login')} />
          <ThreeDButton label="Check a shift" variant="secondary" onClick={() => navigate('/shift-check')} />
        </div>
      </section>
    </main>
  )
}