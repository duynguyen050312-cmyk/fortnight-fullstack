import { useId, type ReactNode } from 'react'

type FormSectionProps = {
  title: string
  subtitle: string
  icon?: ReactNode
  children: ReactNode
}

export default function FormSection({ title, subtitle, icon, children }: FormSectionProps) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className="border border-ink-300 bg-surface p-5 sm:p-6"
    >
      <header>
        <div className="flex items-start gap-3">
          {icon && (
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-safe-bg text-safe"
            >
              {icon}
            </span>
          )}
          <div>
            <h1 id={titleId} className="text-[22px] font-bold leading-7 text-ink-900">
              {title}
            </h1>
            <p className="mt-1 text-base leading-6 text-ink-600">{subtitle}</p>
          </div>
        </div>
      </header>
      <div className="mt-6">{children}</div>
    </section>
  )
}