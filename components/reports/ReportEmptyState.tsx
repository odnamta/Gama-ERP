'use client'

import { FileX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ReportEmptyStateProps {
  title?: string
  message: string
  icon?: React.ReactNode
}

export function ReportEmptyState({
  title = 'No Data',
  message,
  icon,
}: ReportEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="p-4 bg-muted rounded-full mb-4">
          {icon || <FileX className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-md">{message}</p>
      </CardContent>
    </Card>
  )
}
