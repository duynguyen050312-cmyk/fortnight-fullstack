import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import * as api from './api'
import type { HomeSummary, Profile, Shift, ShiftDraft, StudyBreak, StudyBreakDraft } from './types'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import LogShiftsPage from './pages/LogShiftsPage'
import ShiftCheckPage from './pages/ShiftCheckPage'
import ResultPage from './pages/ResultPage'
import HomePage from './pages/HomePage'
import AppHeader from './components/ui/AppHeader'

const emptyProfile: Profile = { visaType: '', studyPeriodStart: '', studyPeriodEnd: '' }
const emptyShift: ShiftDraft = { date: '', startTime: '', endTime: '', employer: '' }

function ProtectedRoute({ authenticated, onLogout, children }: { authenticated: boolean; onLogout: () => Promise<void>; children: React.ReactNode }) {
  if (!authenticated) return <Navigate to="/login" replace />
  return <><AppHeader onLogout={onLogout} />{children}</>
}

export default function App() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [homeSummary, setHomeSummary] = useState<HomeSummary | null>(null)
  const [breaks, setBreaks] = useState<StudyBreak[]>([])
  const [workedShiftDraft, setWorkedShiftDraft] = useState<ShiftDraft>(emptyShift)
  const [proposedShift, setProposedShift] = useState<ShiftDraft>(emptyShift)
  const [authenticated, setAuthenticated] = useState(Boolean(api.getAccessToken()))
  const [loadingData, setLoadingData] = useState(Boolean(api.getAccessToken()))
  const [loadError, setLoadError] = useState('')

  const resetSession = useCallback((message = '') => {
    api.clearAccessToken()
    setAuthenticated(false)
    setProfile(emptyProfile)
    setShifts([])
    setHomeSummary(null)
    setBreaks([])
    setWorkedShiftDraft(emptyShift)
    setProposedShift(emptyShift)
    setLoadError(message)
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    api.setUnauthorizedHandler(() => resetSession('Your session has ended. Please sign in again.'))
    return () => api.setUnauthorizedHandler(null)
  }, [resetSession])

  const loadAccountData = useCallback(async (): Promise<Profile | null> => {
    if (!api.getAccessToken()) return null
    setLoadingData(true)
    setLoadError('')
    try {
      const [savedProfile, savedShifts, savedBreaks] = await Promise.all([api.getProfile(), api.getShifts(), api.getBreaks()])
      setProfile(savedProfile ?? emptyProfile)
      setShifts(savedShifts)
      setBreaks(savedBreaks)
      setHomeSummary(savedProfile ? await api.getHomeSummary() : null)
      return savedProfile
    } catch (error) {
      if ((error as { status?: number }).status !== 401) setLoadError(error instanceof Error ? error.message : 'Could not load your saved data.')
      return null
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { void loadAccountData() }, [loadAccountData])

  const completeAuthentication = async (token: string) => {
    api.setAccessToken(token)
    setAuthenticated(true)
    const savedProfile = await loadAccountData()
    navigate(savedProfile?.visaType ? '/home' : '/profile', { replace: true })
  }

  const saveCurrentProfile = async (nextProfile: Profile) => {
    const savedProfile = await api.saveProfile(nextProfile)
    setProfile(savedProfile)
    setHomeSummary(await api.getHomeSummary())
  }

  const addShift = async (draft: ShiftDraft) => {
    const shift = await api.createShift(draft)
    // The shift is saved at this point, so a failed summary refresh keeps the previous total rather than failing the add
    const summary = await api.getHomeSummary().catch(() => null)
    setShifts((current) => [...current, shift])
    setWorkedShiftDraft(emptyShift)
    if (summary) setHomeSummary(summary)
  }

  const removeShift = async (id: string) => {
    await api.deleteShift(id)
    setShifts((current) => current.filter((shift) => shift.id !== id))
    setHomeSummary(await api.getHomeSummary())
  }

  const clearAllShifts = async () => {
    await api.clearShifts()
    const summary = await api.getHomeSummary().catch(() => null)
    setShifts([])
    setWorkedShiftDraft(emptyShift)
    if (summary) setHomeSummary(summary)
  }

  const addBreak = async (draft: StudyBreakDraft) => {
    const created = await api.createBreak(draft)
    setBreaks((current) => [...current, created].sort((a, b) => a.startDate.localeCompare(b.startDate)))
    setHomeSummary(await api.getHomeSummary())
  }

  const removeBreak = async (id: string) => {
    await api.deleteBreak(id)
    setBreaks((current) => current.filter((period) => period.id !== id))
    setHomeSummary(await api.getHomeSummary())
  }

  const logOut = async () => {
    try {
      await api.logout()
    } catch (error) {
      if ((error as { status?: number }).status !== 401) setLoadError(error instanceof Error ? error.message : 'Could not log out.')
    } finally {
      resetSession()
    }
  }

  const protectedPage = (page: React.ReactNode) => <ProtectedRoute authenticated={authenticated} onLogout={logOut}>{page}</ProtectedRoute>

  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={authenticated ? <Navigate to={profile.visaType ? '/home' : '/profile'} replace /> : <LoginPage onAuthenticated={completeAuthentication} sessionError={loadError} />} />
    <Route path="/home" element={protectedPage(<HomePage summary={homeSummary} breaks={breaks} onAddBreak={addBreak} onDeleteBreak={removeBreak} loadingData={loadingData} loadError={loadError} />)} />
    <Route path="/profile" element={protectedPage(<ProfilePage profile={profile} onChange={setProfile} onSave={saveCurrentProfile} loadingData={loadingData} loadError={loadError} />)} />
    <Route path="/log-shifts" element={protectedPage(<LogShiftsPage shifts={shifts} summary={homeSummary} draft={workedShiftDraft} onDraftChange={setWorkedShiftDraft} onAddShift={addShift} onDeleteShift={removeShift} onClearData={clearAllShifts} />)} />
    <Route path="/shift-check" element={protectedPage(<ShiftCheckPage proposedShift={proposedShift} onComplete={setProposedShift} onCheck={api.checkShift} />)} />
    <Route path="/result" element={protectedPage(<ResultPage />)} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}