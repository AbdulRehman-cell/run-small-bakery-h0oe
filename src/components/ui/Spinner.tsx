import React from 'react'

export type SpinnerSize = 'sm' | 'md' | 'lg'
export type SpinnerColor = 'primary' | 'white'

export interface SpinnerProps {
  size?: SpinnerSize
  color?: SpinnerColor
  className?: string
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'primary', className }) => (
  <span
    className={cn('ui-spinner', `ui-spinner-${size}`, color === 'white' && 'ui-spinner-white', className)}
    role="status"
    aria-label="Loading"
  />
)
Spinner.displayName = 'Spinner'
