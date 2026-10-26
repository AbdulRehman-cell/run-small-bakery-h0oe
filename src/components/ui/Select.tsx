import React from 'react'

export interface SelectOption { value: string; label: string; disabled?: boolean }

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, hint, required, className, id, ...rest }, ref) => {
    const sid = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className={cn('ui-field', error && 'ui-has-err', className)}>
        {label && <label className={cn('ui-label', required && 'ui-label-req')} htmlFor={sid}>{label}</label>}
        <select ref={ref} id={sid} className="ui-select" aria-invalid={!!error} {...rest}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
        {error && <span className="ui-err-msg" role="alert">⚠ {error}</span>}
        {!error && hint && <span className="ui-hint">{hint}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'
