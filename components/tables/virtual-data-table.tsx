'use client'

import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useIsDesktop } from '@/hooks/use-media-query'

export interface VirtualColumn<T> {
  key: keyof T | string
  header: string
  width?: string
  className?: string
  headerClassName?: string
  render?: (item: T, index: number) => React.ReactNode
}

export interface VirtualDataTableProps<T> {
  columns: VirtualColumn<T>[]
  data: T[]
  rowHeight?: number
  maxHeight?: number
  onRowClick?: (item: T) => void
  getRowKey: (item: T) => string
  emptyMessage?: string
  stickyHeader?: boolean
  /** Render function for mobile card view. When provided, cards are shown below md breakpoint. */
  mobileCardRender?: (item: T) => React.ReactNode
}

export function VirtualDataTable<T>({
  columns,
  data,
  rowHeight = 52,
  maxHeight = 600,
  onRowClick,
  getRowKey,
  emptyMessage = 'No results.',
  stickyHeader = true,
  mobileCardRender,
}: VirtualDataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktop()

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const handleRowClick = useCallback(
    (item: T) => {
      onRowClick?.(item)
    },
    [onRowClick]
  )

  if (data.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  // Mobile card view
  if (!isDesktop && mobileCardRender) {
    return (
      <div className="space-y-3" style={{ maxHeight, overflow: 'auto' }}>
        {data.map((item) => (
          <div
            key={getRowKey(item)}
            onClick={() => onRowClick?.(item)}
            className={onRowClick ? 'cursor-pointer' : ''}
          >
            {mobileCardRender(item)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      {/* Sticky header outside scroll container */}
      {stickyHeader && (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  style={{ width: column.width }}
                  className={column.headerClassName}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      )}

      {/* Scrollable virtualized body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight: stickyHeader ? maxHeight - 40 : maxHeight, minHeight: Math.min(data.length * rowHeight + 2, 200) }}
      >
        {!stickyHeader && (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    style={{ width: column.width }}
                    className={column.headerClassName}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        )}

        <div style={{ height: totalSize, position: 'relative' }}>
          <Table>
            <TableBody>
              {virtualRows.map((virtualRow) => {
                const item = data[virtualRow.index]
                return (
                  <TableRow
                    key={getRowKey(item)}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => handleRowClick(item)}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        style={{ width: column.width }}
                        className={column.className}
                      >
                        {column.render
                          ? column.render(item, virtualRow.index)
                          : String(item[column.key as keyof T] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
