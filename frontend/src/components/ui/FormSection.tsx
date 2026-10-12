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
      className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <header>
        <div className="flex items-start gap-3">
          {icon && (
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"
            >
              {icon}
            </span>
          )}
          <div>
            <h1 id={titleId} className="text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-slate-600">{subtitle}</p>
          </div>
        </div>
      </header>
      <div className="mt-7">{children}</div>
    </section>
  )
}