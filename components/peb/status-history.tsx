'use client'

import { PEBStatusHistory, PEB_STATUS_LABELS, PEBStatus } from '@/types/peb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { History, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

interface StatusHistoryProps {
  history: PEBStatusHistory[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return format(new Date(dateStr), 'dd/MM/yyyy')
}

export function StatusHistory({ history }: StatusHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No status changes recorded.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary" />
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  {entry.previous_status ? (
                    <>
                      <span className="font-medium">
                        {PEB_STATUS_LABELS[entry.previous_status as PEBStatus]}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-primary">
                        {PEB_STATUS_LABELS[entry.new_status]}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium text-primary">
                      Created as {PEB_STATUS_LABELS[entry.new_status]}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(entry.changed_at)}
                  {entry.changed_at && (
                    <span className="ml-2">
                      {new Date(entry.changed_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {entry.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
