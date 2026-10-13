import { useEffect, useState } from 'react'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(reducedMotionQuery).matches)
  useEffect(() => {
    const query = window.matchMedia(reducedMotionQuery)
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/** Counts from 0 up to `target` with an ease-out curve; returns `target` immediately under reduced motion. */
export function useCountUp(target: number, duration = 500) {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(reduced ? target : 0)
  useEffect(() => {
    if (reduced) { setValue(target); return }
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setValue(target * (1 - (1 - progress) ** 3))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, reduced])
  return value
}

/** False on the first paint and true just after, so CSS transitions can run from their initial state. */
export function useHasEntered() {
  const reduced = usePrefersReducedMotion()
  const [entered, setEntered] = useState(reduced)
  useEffect(() => {
    if (reduced) { setEntered(true); return }
    let inner = 0
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(() => setEntered(true)) })
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner) }
  }, [reduced])
  return entered
}
