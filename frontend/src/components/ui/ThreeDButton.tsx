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
  primary: 'border-ink-900 bg-ink-900 text-surface hover:-translate-y-px hover:shadow-[0_3px_0_theme(colors.ink.300)] active:translate-y-0 active:shadow-none focus-visible:ring-ink-900',
  secondary: 'border-ink-900 bg-surface text-ink-900 hover:bg-paper focus-visible:ring-ink-900',
  danger: 'border-over bg-surface text-over hover:bg-over-bg focus-visible:ring-over',
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
      className={`inline-flex items-center justify-center gap-2 rounded border px-5 py-3 text-base font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${unavailable ? 'cursor-not-allowed border-ink-300 bg-ink-300 text-ink-600' : variantClasses[variant]}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current/40 border-t-current"
        />
      )}
      {label}
    </button>
  )
}