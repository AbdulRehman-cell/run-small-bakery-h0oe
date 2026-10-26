import React from 'react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  required?: boolean
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, iconRight, required, className, id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className={cn('ui-field', error && 'ui-has-err', className)}>
        {label && (
          <label className={cn('ui-label', required && 'ui-label-req')} htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className="ui-input-wrap">
          {iconLeft && <span className="ui-icon-l">{iconLeft}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn('ui-input', iconLeft && 'ui-input-pl', iconRight && 'ui-input-pr')}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
            {...rest}
          />
          {iconRight && <span className="ui-icon-r">{iconRight}</span>}
        </div>
        {error && <span id={`${inputId}-err`} className="ui-err-msg" role="alert">⚠ {error}</span>}
        {!error && hint && <span id={`${inputId}-hint`} className="ui-hint">{hint}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
