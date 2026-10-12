import { useNavigate } from 'react-router-dom'
import IconButton from '../components/ui/IconButton'
import ThreeDButton from '../components/ui/ThreeDButton'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center p-6">
      <section className="w-full rounded-2xl bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Fortnight</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Know your hours before you say yes.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Track work against Australia’s 48-hour student visa limit with a rolling 14-day view.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <IconButton label="Get started" onClick={() => navigate('/login')} />
          <ThreeDButton label="Check a shift" variant="secondary" onClick={() => navigate('/shift-check')} />
        </div>
      </section>
    </main>
  )
}