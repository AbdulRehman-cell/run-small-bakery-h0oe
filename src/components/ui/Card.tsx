import React from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardVariant = 'default' | 'bordered' | 'flat'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  interactive?: boolean
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', interactive, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'ui-card',
        variant === 'bordered' && 'ui-card-bordered',
        variant === 'flat' && 'ui-card-flat',
        padding !== 'md' && `ui-card-p-${padding}`,
        interactive && 'ui-card-interactive',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'
