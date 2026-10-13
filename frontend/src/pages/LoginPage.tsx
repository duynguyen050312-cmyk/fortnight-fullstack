import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'
import InputField from '../components/ui/InputField'
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

  return <main className="mx-auto flex min-h-screen max-w-md items-center p-5 sm:p-8">
    <section className="w-full border border-ink-300 bg-surface p-5 sm:p-6">
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
  </main>
}