import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'
import InputField from '../components/ui/InputField'
import PersonaQuote from '../components/ui/PersonaQuote'
import SweepStrip from '../components/ui/SweepStrip'
import ThreeDButton from '../components/ui/ThreeDButton'

type Props = { onAuthenticated: (token: string) => Promise<void>; sessionError: string }

export default function LoginPage({ onAuthenticated, sessionError }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hasConsent, setHasConsent] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const errors = { email: !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email address.' : '', password: password.length < 8 ? 'Password must be at least 8 characters.' : '', consent: !hasConsent ? 'You need to agree before continuing.' : '' }
  const valid = !Object.values(errors).some(Boolean)

  const submit = async () => {
    if (!valid) return
    setLoading(true)
    setRequestError('')
    try {
      const result = isSignup ? await api.signup(email, password) : await api.login(email, password)
      await onAuthenticated(result.access_token)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Could not continue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="min-h-screen lg:grid lg:grid-cols-2">
    <aside className="hidden bg-paper px-12 pb-16 pt-[15vh] lg:flex lg:items-start xl:px-20">
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">Fortnight</p>
        <p className="mt-3 text-display font-bold text-ink-900">Know your hours before you say yes.</p>
        <p className="mt-4 text-base leading-6 text-ink-600">Track your work hours against your visa limit with a rolling 14-day view.</p>
        <PersonaQuote className="mt-8" />
        <SweepStrip className="mt-12" />
      </div>
    </aside>
    <div className="flex min-h-screen items-center justify-center p-5 sm:p-8 lg:items-start lg:bg-surface lg:px-12 lg:pb-16 lg:pt-[15vh]">
    <div className="w-full max-w-[400px]">
    <section className="w-full border border-ink-300 bg-surface p-5 sm:p-6 lg:border-0 lg:p-0">
      <Link to="/" className="text-sm font-semibold text-ink-900 underline decoration-ink-300 underline-offset-4">← Fortnight</Link>
      <h1 className="mt-6 text-display font-bold text-ink-900">{isSignup ? 'Create an account' : 'Welcome'}</h1>
      <p className="mt-2 text-base leading-6 text-ink-600">{isSignup ? 'Create an account to start tracking.' : 'Sign in to continue tracking.'}</p>
      <div className="mt-8 space-y-5">
        <InputField label="Email address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched({ ...touched, email: true })} error={errors.email} touched={Boolean(touched.email)} required />
        <InputField label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched({ ...touched, password: true })} error={errors.password} touched={Boolean(touched.password)} required helperText="Use at least 8 characters." />
      </div>
      <div className="mt-5"><div className="flex items-start gap-3"><input id="storage-consent" type="checkbox" checked={hasConsent} onChange={(e) => setHasConsent(e.target.checked)} onBlur={() => setTouched({ ...touched, consent: true })} aria-invalid={Boolean(touched.consent && errors.consent)} aria-describedby={touched.consent && errors.consent ? 'storage-consent-error' : undefined} className="mt-1 size-4 shrink-0 rounded border-ink-300 text-ink-900 focus:ring-ink-900" /><label htmlFor="storage-consent" className="text-sm font-normal normal-case leading-6 tracking-normal text-ink-600">I agree to Fortnight storing the shift hours I enter in my account.</label></div>{touched.consent && errors.consent && <p id="storage-consent-error" className="mt-1 text-sm text-over">{errors.consent}</p>}</div>
      {(requestError || sessionError) && <p className="mt-4 text-sm text-over" role="alert">{requestError || sessionError}</p>}
      <div className="mt-8 w-full [&>button]:w-full"><ThreeDButton label={isSignup ? 'Create account' : 'Continue with email'} disabled={!valid} loading={loading} onClick={() => void submit()} /></div>
      <div className="mt-4 text-center text-sm text-ink-600"><button type="button" className="font-semibold text-ink-900 underline decoration-ink-300 underline-offset-4" onClick={() => { setIsSignup((current) => !current); setRequestError('') }}>{isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}</button></div>
    </section>
    <p className="mt-8 hidden text-xs font-semibold uppercase leading-5 tracking-wide text-ink-600 lg:block">Fortnight never asks for your visa number, passport number or employer details.</p>
    </div>
    </div>
  </main>
}