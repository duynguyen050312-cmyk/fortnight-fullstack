type StepIndicatorProps = {
  steps: string[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Form progress">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const completed = index < currentStep
          const current = index === currentStep

          return (
            <li key={step} className={`flex min-w-0 items-start ${index < steps.length - 1 ? 'flex-1' : ''}`} aria-current={current ? 'step' : undefined}>
              <div className="flex min-w-0 flex-col items-center text-center">
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${completed || current ? 'border-ink-900 bg-ink-900 text-surface' : 'border-ink-300 bg-surface text-ink-600'}`}
                >
                  {index + 1}
                </span>
                <span className={`mt-2 w-full truncate text-xs font-semibold sm:text-sm ${completed || current ? 'text-ink-900' : 'text-ink-600'}`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mx-1 mt-4 h-px min-w-2 flex-1 sm:mx-2 ${completed ? 'bg-ink-900' : 'bg-ink-300'}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}