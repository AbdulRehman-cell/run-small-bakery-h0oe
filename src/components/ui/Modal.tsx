import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  children?: React.ReactNode
  closeOnOverlay?: boolean
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="ui-modal-footer">{children}</div>
}

const ModalInner: React.FC<ModalProps> = ({ open, onClose, title, size = 'md', children, closeOnOverlay = true }) => {
  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }, [onClose])
  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [open, handleKey])
  if (!open) return null
  return (
    <div className="ui-modal-overlay" onClick={closeOnOverlay ? onClose : undefined} aria-modal role="dialog">
      <div className={`ui-modal ui-modal-${size}`} onClick={e => e.stopPropagation()}>
        {(title != null) && (
          <div className="ui-modal-hd">
            <div className="ui-modal-title">{title}</div>
            <button className="ui-modal-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export const Modal = Object.assign(
  (props: ModalProps) => createPortal(<ModalInner {...props} />, document.body),
  { Footer }
)
Modal.displayName = 'Modal'
