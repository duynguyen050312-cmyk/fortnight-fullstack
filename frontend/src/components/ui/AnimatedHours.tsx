import { useCountUp } from '../../utils/motion'

// Show the same number of decimals as the final value so the figure does not jitter in width.
const decimalsOf = (value: number) => (Number.isInteger(value) ? 0 : Number.isInteger(value * 10) ? 1 : 2)

export default function AnimatedHours({ value }: { value: number }) {
  const current = useCountUp(value)
  return <>{current.toFixed(decimalsOf(value))}</>
}
