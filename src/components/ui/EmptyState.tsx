import React from 'react'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <div className={cn('ui-empty', className)}>
    {icon && <div className="ui-empty-icon" aria-hidden="true">{icon}</div>}
    <div className="ui-empty-title">{title}</div>
    {description && <div className="ui-empty-desc">{description}</div>}
    {action}
  </div>
)
EmptyState.displayName = 'EmptyState'
