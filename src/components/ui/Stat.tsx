import React from 'react'

export type DeltaType = 'up' | 'down' | 'neutral'

export interface StatProps {
  value: string | number
  label: string
  delta?: string
  deltaType?: DeltaType
  className?: string
}

const ARROW = { up: '↑', down: '↓', neutral: '→' } as const
function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Stat: React.FC<StatProps> = ({ value, label, delta, deltaType = 'neutral', className }) => (
  <div className={cn('ui-stat', className)}>
    <div className="ui-stat-label">{label}</div>
    <div className="ui-stat-value">{value}</div>
    {delta && (
      <div className={cn('ui-stat-delta', `ui-stat-${deltaType}`)} aria-label={`${deltaType}: ${delta}`}>
        <span aria-hidden="true">{ARROW[deltaType]}</span> {delta}
      </div>
    )}
  </div>
)
Stat.displayName = 'Stat'
