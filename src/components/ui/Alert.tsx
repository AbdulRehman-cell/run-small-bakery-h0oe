import React, { useState } from 'react'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: React.ReactNode
  dismissible?: boolean
  className?: string
}

const ICONS: Record<AlertVariant, string> = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' }

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, dismissible, className }) => {
  const [gone, setGone] = useState(false)
  if (gone) return null
  return (
    <div className={cn('ui-alert', `ui-alert-${variant}`, className)} role="alert">
      <span className="ui-alert-icon" aria-hidden="true">{ICONS[variant]}</span>
      <div className="ui-alert-body">
        {title && <div className="ui-alert-title">{title}</div>}
        {children && <div className="ui-alert-desc">{children}</div>}
      </div>
      {dismissible && (
        <button className="ui-alert-dismiss" onClick={() => setGone(true)} aria-label="Dismiss">×</button>
      )}
    </div>
  )
}
Alert.displayName = 'Alert'
