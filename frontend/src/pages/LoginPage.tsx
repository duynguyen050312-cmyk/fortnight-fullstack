import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputField from '../components/ui/InputField'
import ThreeDButton from '../components/ui/ThreeDButton'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hasConsent, setHasConsent] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const errors = {
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address.' : '',
    password: password.length < 8 ? 'Password must be at least 8 characters.' : '',
    consent: !hasConsent ? 'You need to agree before continuing.' : '',
  }
  const valid = !Object.values(errors).some(Boolean)

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <section className="w-full rounded-2xl bg-white p-8 shadow-sm">
        <Link to="/" className="text-sm font-semibold text-primary-700">← Fortnight</Link>
        <h1 className="mt-5 text-3xl font-bold text-slate-900">Welcome</h1>
        <p className="mt-2 text-slate-600">Sign in or create an account to start tracking.</p>
        <div className="mt-8 space-y-5">
          <InputField label="Email address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched({ ...touched, email: true })} error={errors.email} touched={Boolean(touched.email)} required />
          <InputField label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched({ ...touched, password: true })} error={errors.password} touched={Boolean(touched.password)} required helperText="Use at least 8 characters." />
        </div>
        <div className="mt-5">
          <div className="flex items-start gap-3">
            <input
              id="storage-consent"
              type="checkbox"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              onBlur={() => setTouched({ ...touched, consent: true })}
              aria-invalid={Boolean(touched.consent && errors.consent)}
              aria-describedby={touched.consent && errors.consent ? 'storage-consent-error' : undefined}
              className="mt-1 size-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            />
            <label htmlFor="storage-consent" className="text-sm font-medium leading-6 text-slate-700">
              I agree to Fortnight storing the shift hours I enter on this device.
            </label>
          </div>
          {touched.consent && errors.consent && <p id="storage-consent-error" className="mt-1 text-sm text-red-600">{errors.consent}</p>}
        </div>
        <div className="mt-8 w-full [&>button]:w-full">
          <ThreeDButton label="Continue with email" disabled={!valid} onClick={() => { /* TODO: Replace this mock navigation with Supabase Auth sign-in/sign-up. */ navigate('/profile') }} />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">Authentication is UI-only in this MVP.</p>
      </section>
    </main>
  )
}