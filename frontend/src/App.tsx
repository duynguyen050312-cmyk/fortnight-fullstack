/*
 * HOW DATA FLOWS
 * Props down: App passes profile, shifts, and proposedShift to the pages that need them.
 * Callbacks up: ProfilePage calls onComplete(profile), LogShiftsPage calls onAddShift(shift) and onDeleteShift(id),
 * and ShiftCheckPage calls onComplete(proposedShift), so App remains the source of saved data.
 * Router state: ShiftCheckPage sends safe, currentHours, projectedHours, and reason one time
 * to /result using navigate state; ResultPage reads that state with useLocation.
 */
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Profile, Shift, ShiftDraft } from './types'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import LogShiftsPage from './pages/LogShiftsPage'
import ShiftCheckPage from './pages/ShiftCheckPage'
import ResultPage from './pages/ResultPage'

const emptyProfile: Profile = { visaType: '', studyPeriodStart: '', studyPeriodEnd: '' }
const emptyShift: ShiftDraft = { date: '', startTime: '', endTime: '' }
const profileStorageKey = 'fortnight-profile'
const shiftsStorageKey = 'fortnight-shifts'

const isProfile = (value: unknown): value is Profile => typeof value === 'object' && value !== null && 'visaType' in value && 'studyPeriodStart' in value && 'studyPeriodEnd' in value && typeof value.visaType === 'string' && typeof value.studyPeriodStart === 'string' && typeof value.studyPeriodEnd === 'string'
const isShift = (value: unknown): value is Shift => typeof value === 'object' && value !== null && 'id' in value && 'date' in value && 'startTime' in value && 'endTime' in value && 'hours' in value && typeof value.id === 'string' && typeof value.date === 'string' && typeof value.startTime === 'string' && typeof value.endTime === 'string' && typeof value.hours === 'number'

const loadProfile = (): Profile => {
  try {
    const savedProfile = localStorage.getItem(profileStorageKey)
    if (!savedProfile) return emptyProfile

    const parsedProfile: unknown = JSON.parse(savedProfile)
    return isProfile(parsedProfile) ? parsedProfile : emptyProfile
  } catch {
    return emptyProfile
  }
}

const loadShifts = (): Shift[] => {
  try {
    const savedShifts = localStorage.getItem(shiftsStorageKey)
    if (!savedShifts) return []

    const parsedShifts: unknown = JSON.parse(savedShifts)
    return Array.isArray(parsedShifts) && parsedShifts.every(isShift) ? parsedShifts : []
  } catch {
    return []
  }
}

const hasProfileData = (profile: Profile) => Boolean(profile.visaType || profile.studyPeriodStart || profile.studyPeriodEnd)

export default function App() {
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [shifts, setShifts] = useState<Shift[]>(loadShifts)
  const [workedShiftDraft, setWorkedShiftDraft] = useState<ShiftDraft>(emptyShift)
  const [proposedShift, setProposedShift] = useState<ShiftDraft>(emptyShift)

  useEffect(() => {
    try {
      if (hasProfileData(profile)) {
        localStorage.setItem(profileStorageKey, JSON.stringify(profile))
      } else {
        localStorage.removeItem(profileStorageKey)
      }
    } catch {
      // Storage may be unavailable or full; state remains usable for this session.
    }
  }, [profile])

  useEffect(() => {
    try {
      if (shifts.length > 0) {
        localStorage.setItem(shiftsStorageKey, JSON.stringify(shifts))
      } else {
        localStorage.removeItem(shiftsStorageKey)
      }
    } catch {
      // Storage may be unavailable or full; state remains usable for this session.
    }
  }, [shifts])

  const clearData = () => {
    setProfile(emptyProfile)
    setShifts([])

    try {
      localStorage.removeItem(profileStorageKey)
      localStorage.removeItem(shiftsStorageKey)
    } catch {
      // Storage may be unavailable; the in-memory data has still been cleared.
    }
  }

  return <Routes>
    <Route path="/" element={<LandingPage />} /><Route path="/login" element={<LoginPage />} />
    <Route path="/profile" element={<ProfilePage profile={profile} onComplete={setProfile} />} />
    <Route path="/log-shifts" element={<LogShiftsPage shifts={shifts} draft={workedShiftDraft} onDraftChange={setWorkedShiftDraft} onAddShift={(shift) => { setShifts((current) => [...current, shift]); setWorkedShiftDraft(emptyShift) }} onDeleteShift={(id) => setShifts((current) => current.filter((shift) => shift.id !== id))} onClearData={clearData} />} />
    <Route path="/shift-check" element={<ShiftCheckPage shifts={shifts} proposedShift={proposedShift} onComplete={setProposedShift} />} />
    <Route path="/result" element={<ResultPage />} /><Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}