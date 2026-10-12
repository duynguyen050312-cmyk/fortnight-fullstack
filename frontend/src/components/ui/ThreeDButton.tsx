import type { ButtonHTMLAttributes, MouseEventHandler } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ThreeDButtonProps = {
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  variant?: ButtonVariant
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  disabled?: boolean
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-b from-primary-600 to-primary-700 shadow-lg shadow-primary-700/40 hover:from-primary-600 hover:to-primary-800 focus-visible:ring-primary-600',
  secondary: 'bg-gradient-to-b from-success-600 to-success-700 shadow-lg shadow-success-700/40 hover:from-success-600 hover:to-success-700 focus-visible:ring-success-600',
  danger: 'bg-gradient-to-b from-red-500 to-red-600 shadow-lg shadow-red-700/40 hover:from-red-500 hover:to-red-700 focus-visible:ring-red-600',
}

export default function ThreeDButton({
  label,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
}: ThreeDButtonProps) {
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${unavailable ? 'cursor-not-allowed bg-slate-300 text-slate-500 shadow-none' : `text-white active:translate-y-1 active:shadow-sm ${variantClasses[variant]}`}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {label}
    </button>
  )
}