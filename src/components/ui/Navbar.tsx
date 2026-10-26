import React from 'react'

export interface NavbarProps {
  logo?: React.ReactNode
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

function NavLink({ href, active, children, className, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { active?: boolean }) {
  return (
    <a
      href={href}
      className={['ui-nav-link', active && 'ui-nav-link-active', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </a>
  )
}

function NavbarRoot({ logo, children, actions, className }: NavbarProps) {
  return (
    <header className={['ui-navbar', className].filter(Boolean).join(' ')}>
      {logo && <div className="ui-navbar-logo">{logo}</div>}
      {children && <nav className="ui-navbar-nav" aria-label="Main navigation">{children}</nav>}
      {actions && <div className="ui-navbar-actions">{actions}</div>}
    </header>
  )
}

export const Navbar = Object.assign(NavbarRoot, { Link: NavLink })
Navbar.displayName = 'Navbar'
