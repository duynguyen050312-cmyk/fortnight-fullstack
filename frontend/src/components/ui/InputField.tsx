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
}: InputFieldProps) {
  const inputId = `input-${name}`
  const errorId = `${inputId}-error`
  const helperTextId = `${inputId}-helper`
  const hasError = touched && Boolean(error)

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
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
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : helperText ? helperTextId : undefined}
        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm outline-none focus:ring-1 ${hasError ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-slate-300 focus:border-primary-600 focus:ring-primary-600'}`}
      />
      {hasError ? (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperTextId} className="mt-1 text-sm text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}