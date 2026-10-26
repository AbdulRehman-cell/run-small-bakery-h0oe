import React from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, children, className }) => (
  <div className={cn('ui-page-hd', className)}>
    <div className="ui-page-hd-left">
      {badge && <div>{badge}</div>}
      <h1 className="ui-page-hd-title">{title}</h1>
      {subtitle && <p className="ui-page-hd-sub">{subtitle}</p>}
    </div>
    {children && <div className="ui-page-hd-right">{children}</div>}
  </div>
)
PageHeader.displayName = 'PageHeader'
