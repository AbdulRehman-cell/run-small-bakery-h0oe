import React from 'react'

export interface TabsProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export interface TabProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

function Tab({ value: tabValue, children, disabled, className }: TabProps & { _active?: boolean; _onChange?: (v: string) => void }) {
  return null
}

function TabsRoot({ value, onChange, children, className }: TabsProps) {
  return (
    <div className={['ui-tabs', className].filter(Boolean).join(' ')} role="tablist">
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return null
        const { value: tv, children: label, disabled } = child.props as TabProps
        const active = tv === value
        return (
          <button
            role="tab"
            aria-selected={active}
            className={['ui-tab', active && 'ui-tab-active'].filter(Boolean).join(' ')}
            onClick={() => !disabled && onChange(tv)}
            disabled={disabled}
            tabIndex={active ? 0 : -1}
            key={tv}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export const Tabs = Object.assign(TabsRoot, { Tab })
Tabs.displayName = 'Tabs'
