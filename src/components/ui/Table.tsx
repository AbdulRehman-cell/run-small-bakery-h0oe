import React from 'react'

function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' ') }

function Th({ children, sortable, className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement> & { sortable?: boolean }) {
  return (
    <th className={cn('ui-table-th', sortable && 'ui-table-th-sort', className)} {...rest}>
      {children}
      {sortable && <span className="ui-table-th-sort-icon" aria-hidden>↕</span>}
    </th>
  )
}

function Td({ children, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('ui-table-td', className)} {...rest}>{children}</td>
}

function Head({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>
}

function Body({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

function Row({ children, clickable, className, onClick, ...rest }: React.HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }) {
  return (
    <tr
      className={cn('ui-table-tr', clickable && 'ui-table-tr-clickable', className)}
      onClick={onClick}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? e => { if (e.key === 'Enter' || e.key === ' ') onClick?.(e as unknown as React.MouseEvent<HTMLTableRowElement>) } : undefined}
      {...rest}
    >
      {children}
    </tr>
  )
}

function TableRoot({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('ui-table-wrap', className)}>
      <table className="ui-table">{children}</table>
    </div>
  )
}

export const Table = Object.assign(TableRoot, { Head, Body, Row, Th, Td })
Table.displayName = 'Table'
