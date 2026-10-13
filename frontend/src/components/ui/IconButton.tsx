import { ArrowRight } from 'lucide-react'
import type { ButtonHTMLAttributes, MouseEventHandler } from 'react'

type IconButtonProps = {
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
}

export default function IconButton({
  label,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  loadingLabel,
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
      className={`group inline-flex items-center justify-center gap-2 rounded border px-5 py-3 text-base font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${unavailable ? 'cursor-not-allowed border-ink-300 bg-ink-300 text-ink-600' : 'border-ink-900 bg-ink-900 text-surface hover:-translate-y-px hover:shadow-[0_3px_0_theme(colors.ink.300)] active:translate-y-0 active:shadow-none'}`}
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
      <span>{loading && loadingLabel ? loadingLabel : label}</span>
    </button>
  )
}