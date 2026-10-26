import React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, id, rows = 4, ...rest }, ref) => {
    const tid = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className={cn('ui-field', error && 'ui-has-err', className)}>
        {label && <label className={cn('ui-label', required && 'ui-label-req')} htmlFor={tid}>{label}</label>}
        <textarea ref={ref} id={tid} rows={rows} className="ui-textarea" aria-invalid={!!error} {...rest} />
        {error && <span className="ui-err-msg" role="alert">⚠ {error}</span>}
        {!error && hint && <span className="ui-hint">{hint}</span>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
