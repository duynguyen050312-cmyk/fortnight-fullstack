import { ArrowRight } from 'lucide-react'
import type { ButtonHTMLAttributes, MouseEventHandler } from 'react'

type IconButtonProps = {
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  disabled?: boolean
  loading?: boolean
}

export default function IconButton({
  label,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
}: IconButtonProps) {
  const unavailable = disabled || loading
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (unavailable) {
      event.preventDefault()
      return
    }

    onClick?.(event)
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={unavailable}
      aria-busy={loading || undefined}
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 ${unavailable ? 'cursor-not-allowed bg-slate-300 text-slate-500 shadow-none' : 'bg-gradient-to-b from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-700/40 hover:from-primary-600 hover:to-primary-800 active:translate-y-1 active:shadow-sm'}`}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current/40 border-t-current"
        />
      ) : (
        <ArrowRight
          aria-hidden="true"
          className="order-last size-4 transition-transform duration-150 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
          strokeWidth={2}
        />
      )}
      <span>{label}</span>
    </button>
  )
}