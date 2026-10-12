import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import * as api from './api'
import type { CheckResult, Profile, Shift, ShiftDraft } from './types'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import LogShiftsPage from './pages/LogShiftsPage'
import ShiftCheckPage from './pages/ShiftCheckPage'
import ResultPage from './pages/ResultPage'

const emptyProfile: Profile = { visaType: '', studyPeriodStart: '', studyPeriodEnd: '' }
const emptyShift: ShiftDraft = { date: '', startTime: '', endTime: '' }

function ProtectedRoute({ authenticated, children }: { authenticated: boolean; children: React.ReactNode }) {
  return authenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [shifts, setShifts] = useState<Shift[]>([])
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
    setWorkedShiftDraft(emptyShift)
    setProposedShift(emptyShift)
    setLoadError(message)
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    api.setUnauthorizedHandler(() => resetSession('Your session has ended. Please sign in again.'))
    return () => api.setUnauthorizedHandler(null)
  }, [resetSession])

  const loadAccountData = useCallback(async () => {
    if (!api.getAccessToken()) return
    setLoadingData(true)
    setLoadError('')
    try {
      const [savedProfile, savedShifts] = await Promise.all([api.getProfile(), api.getShifts()])
      setProfile(savedProfile ?? emptyProfile)
      setShifts(savedShifts)
    } catch (error) {
      if ((error as { status?: number }).status !== 401) setLoadError(error instanceof Error ? error.message : 'Could not load your saved data.')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { void loadAccountData() }, [loadAccountData])

  const completeAuthentication = async (token: string) => {
    api.setAccessToken(token)
    setAuthenticated(true)
    await loadAccountData()
    navigate('/profile', { replace: true })
  }

  const saveCurrentProfile = async (nextProfile: Profile) => {
    const savedProfile = await api.saveProfile(nextProfile)
    setProfile(savedProfile)
  }

  const addShift = async (draft: ShiftDraft) => {
    const shift = await api.createShift(draft)
    setShifts((current) => [...current, shift])
    setWorkedShiftDraft(emptyShift)
  }

  const removeShift = async (id: string) => {
    await api.deleteShift(id)
    setShifts((current) => current.filter((shift) => shift.id !== id))
  }

  const clearAllShifts = async () => {
    await api.clearShifts()
    setShifts([])
    setWorkedShiftDraft(emptyShift)
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

  const protectedPage = (page: React.ReactNode) => <ProtectedRoute authenticated={authenticated}>{page}</ProtectedRoute>

  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={authenticated ? <Navigate to="/profile" replace /> : <LoginPage onAuthenticated={completeAuthentication} sessionError={loadError} />} />
    <Route path="/profile" element={protectedPage(<ProfilePage profile={profile} onChange={setProfile} onSave={saveCurrentProfile} onLogout={logOut} loadingData={loadingData} loadError={loadError} />)} />
    <Route path="/log-shifts" element={protectedPage(<LogShiftsPage shifts={shifts} draft={workedShiftDraft} onDraftChange={setWorkedShiftDraft} onAddShift={addShift} onDeleteShift={removeShift} onClearData={clearAllShifts} onLogout={logOut} />)} />
    <Route path="/shift-check" element={protectedPage(<ShiftCheckPage proposedShift={proposedShift} onComplete={setProposedShift} onCheck={api.checkShift} onLogout={logOut} />)} />
    <Route path="/result" element={protectedPage(<ResultPage onLogout={logOut} />)} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}