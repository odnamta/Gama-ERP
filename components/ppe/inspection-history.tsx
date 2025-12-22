'use client';

import { PPEInspection } from '@/types/ppe';
import { formatPPEDate, formatCondition, formatInspectionAction, getConditionSeverity } from '@/lib/ppe-utils';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface InspectionHistoryProps {
  inspections: PPEInspection[];
}

export function InspectionHistory({ inspections }: InspectionHistoryProps) {
  const getConditionIcon = (condition: string) => {
    const severity = getConditionSeverity(condition);
    switch (severity) {
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getConditionColor = (condition: string) => {
    const severity = getConditionSeverity(condition);
    switch (severity) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'danger':
        return 'bg-red-100 text-red-800';
    }
  };

  if (inspections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardCheck className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No inspections recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inspections.map(inspection => (
        <div
          key={inspection.id}
          className="border rounded-lg p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConditionIcon(inspection.condition)}
              <span className="font-medium">
                {formatPPEDate(inspection.inspection_date)}
              </span>
            </div>
            <Badge className={getConditionColor(inspection.condition)}>
              {formatCondition(inspection.condition)}
            </Badge>
          </div>

          {inspection.findings && (
            <div className="text-sm">
              <span className="font-medium">Findings:</span>{' '}
              <span className="text-muted-foreground">{inspection.findings}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="font-medium">Action Required:</span>{' '}
              <span className="text-muted-foreground">
                {formatInspectionAction(inspection.action_required || 'none')}
              </span>
            </div>
            {inspection.action_taken && (
              <div>
                <span className="font-medium">Action Taken:</span>{' '}
                <span className="text-muted-foreground">{inspection.action_taken}</span>
              </div>
            )}
          </div>

          {inspection.inspected_by_user && (
            <div className="text-xs text-muted-foreground">
              Inspected by: {inspection.inspected_by_user.full_name || inspection.inspected_by_user.email}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
