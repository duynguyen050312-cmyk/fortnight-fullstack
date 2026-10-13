import { getLocalToday } from './utils/hours'
import type { CheckResult, HomeSummary, Profile, Shift, ShiftDraft, StudyBreak, StudyBreakDraft, VisaTypeOption } from './types'

const tokenStorageKey = 'fortnight-access-token'

type AuthResponse = { access_token: string; token_type: string; user: Record<string, unknown> }
type ApiError = Error & { status?: number }

let onUnauthorized: (() => void) | null = null

const normaliseTime = (time: string) => time.slice(0, 5)
const normaliseShift = (shift: Shift): Shift => ({ ...shift, startTime: normaliseTime(shift.startTime), endTime: normaliseTime(shift.endTime) })

export const getAccessToken = () => sessionStorage.getItem(tokenStorageKey)
export const setAccessToken = (token: string) => sessionStorage.setItem(tokenStorageKey, token)
export const clearAccessToken = () => sessionStorage.removeItem(tokenStorageKey)
export const setUnauthorizedHandler = (handler: (() => void) | null) => { onUnauthorized = handler }

async function request<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')

  if (authenticated) {
    const token = getAccessToken()
    if (!token) {
      onUnauthorized?.()
      const error = new Error('Your session has ended. Please sign in again.') as ApiError
      error.status = 401
      throw error
    }
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, { ...options, headers })
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const detail = typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string' ? body.detail : `Request failed (${response.status}).`
    const error = new Error(detail) as ApiError
    error.status = response.status
    if (response.status === 401) onUnauthorized?.()
    throw error
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const login = (email: string, password: string) => request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
export const signup = (email: string, password: string) => request<AuthResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
export const logout = () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }, true)
export const getVisaTypes = () => request<VisaTypeOption[]>('/api/visa-types')
export const getProfile = () => request<Profile | null>('/api/profile', {}, true)
export const saveProfile = (profile: Profile) => request<Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(profile) }, true)
export const getShifts = async () => (await request<Shift[]>('/api/shifts', {}, true)).map(normaliseShift)
export const createShift = async (draft: ShiftDraft) => normaliseShift(await request<Shift>('/api/shifts', { method: 'POST', body: JSON.stringify(draft) }, true))
export const deleteShift = (id: string) => request<{ message: string }>(`/api/shifts/${id}`, { method: 'DELETE' }, true)
export const clearShifts = () => request<{ message: string; deletedCount: number }>('/api/shifts', { method: 'DELETE' }, true)
export const checkShift = (draft: ShiftDraft) => request<CheckResult>('/api/shift-check', { method: 'POST', body: JSON.stringify(draft) }, true)
export const getBreaks = () => request<StudyBreak[]>('/api/breaks', {}, true)
export const createBreak = (draft: StudyBreakDraft) => request<StudyBreak>('/api/breaks', { method: 'POST', body: JSON.stringify(draft) }, true)
export const deleteBreak = (id: string) => request<{ message: string }>(`/api/breaks/${id}`, { method: 'DELETE' }, true)
export const getHomeSummary = async () => {
  const summary = await request<HomeSummary>(`/api/home-summary?today=${getLocalToday()}`, {}, true)
  return { ...summary, recentShifts: summary.recentShifts.map(normaliseShift) }
}