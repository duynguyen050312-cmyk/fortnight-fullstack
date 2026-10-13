import { Link, useLocation } from 'react-router-dom'
import ThreeDButton from './ThreeDButton'

type Props = { onLogout: () => Promise<void> }

export default function AppHeader({ onLogout }: Props) {
  const { pathname } = useLocation()
  return <header className="border-b border-ink-300 bg-surface">
    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
      <Link
        to="/home"
        aria-current={pathname === '/home' ? 'page' : undefined}
        aria-label="Fortnight dashboard"
        className="-mx-2 rounded px-2 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-600 underline decoration-transparent underline-offset-4 transition-colors duration-150 hover:text-ink-900 hover:decoration-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
      >
        Fortnight
      </Link>
      <ThreeDButton label="Log out" variant="secondary" onClick={() => void onLogout()} />
    </div>
  </header>
}
