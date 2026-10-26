import React, { useState } from 'react'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  src?: string
  name?: string
  size?: AvatarSize
  ring?: boolean
  className?: string
  style?: React.CSSProperties
}

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#e85d04','#84cc16']
function nameColor(name: string) {
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase()
}
function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

export const Avatar: React.FC<AvatarProps> = ({ src, name = '', size = 'md', ring, className, style }) => {
  const [failed, setFailed] = useState(false)
  const showImg = src && !failed
  return (
    <span
      className={cn('ui-avatar', `ui-avatar-${size}`, ring && 'ui-avatar-ring', className)}
      style={!showImg ? { background: nameColor(name), ...style } : style}
      aria-label={name || undefined}
    >
      {showImg
        ? <img src={src} alt={name} onError={() => setFailed(true)} />
        : <span aria-hidden="true">{name ? initials(name) : '?'}</span>}
    </span>
  )
}
Avatar.displayName = 'Avatar'
