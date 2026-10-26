import React from 'react'

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', size = 'md', dot, className, children, ...rest }) => (
  <span className={cn('ui-badge', `ui-badge-${variant}`, size !== 'md' && `ui-badge-${size}`, className)} {...rest}>
    {dot && <span className="ui-badge-dot" aria-hidden="true" />}
    {children}
  </span>
)
Badge.displayName = 'Badge'
