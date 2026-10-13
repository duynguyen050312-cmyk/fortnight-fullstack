import type { ChangeEventHandler, FocusEventHandler } from 'react'

type InputType = 'text' | 'email' | 'password' | 'date' | 'time'

type InputFieldProps = {
  label: string
  name: string
  type: InputType
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  onBlur: FocusEventHandler<HTMLInputElement>
  error: string
  touched: boolean
  required: boolean
  helperText?: string
  maxLength?: number
}

export default function InputField({
  label,
  name,
  type,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  helperText,
  maxLength,
}: InputFieldProps) {
  const inputId = `input-${name}`
  const errorId = `${inputId}-error`
  const helperTextId = `${inputId}-helper`
  const hasError = touched && Boolean(error)

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wide text-ink-600">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        maxLength={maxLength}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : helperText ? helperTextId : undefined}
        className={`mt-1 block w-full rounded border bg-surface px-3 py-3 text-base text-ink-900 outline-none transition focus:ring-1 ${hasError ? 'border-over focus:border-over focus:ring-over' : 'border-ink-300 focus:border-ink-900 focus:ring-ink-900'}`}
      />
      {hasError ? (
          <p id={errorId} className="mt-1 text-sm text-over">
          {error}
        </p>
      ) : helperText ? (
          <p id={helperTextId} className="mt-1 text-sm text-ink-600">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}