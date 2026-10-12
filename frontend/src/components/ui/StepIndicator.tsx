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
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${completed ? 'bg-primary-600 text-white' : current ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-slate-200 text-slate-600'}`}
                >
                  {index + 1}
                </span>
                <span className={`mt-2 w-full truncate text-xs font-semibold sm:text-sm ${completed || current ? 'text-primary-700' : 'text-slate-500'}`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mx-1 mt-4 h-0.5 min-w-2 flex-1 sm:mx-2 ${completed ? 'bg-primary-600' : 'bg-slate-200'}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}