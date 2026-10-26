import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  iconOnly?: boolean
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, iconLeft, iconRight, iconOnly, children, className, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'ui-btn',
        `ui-btn-${variant}`,
        `ui-btn-${size}`,
        iconOnly && 'ui-btn-icon',
        fullWidth && 'ui-btn-full',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading
        ? <span className="ui-btn__spinner" aria-hidden="true" />
        : iconLeft && <span aria-hidden="true">{iconLeft}</span>}
      {!iconOnly && children && <span>{children}</span>}
      {!loading && iconRight && <span aria-hidden="true">{iconRight}</span>}
    </button>
  )
)
Button.displayName = 'Button'
