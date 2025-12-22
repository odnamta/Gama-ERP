'use client';

import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { JmpCheckpoint } from '@/types/jmp';
import { formatLocationType, getLocationTypeIcon, formatDuration } from '@/lib/jmp-utils';

interface CheckpointTableProps {
  checkpoints: JmpCheckpoint[];
  onEdit?: (checkpoint: JmpCheckpoint) => void;
  onDelete?: (id: string) => void;
  readonly?: boolean;
}

export function CheckpointTable({ checkpoints, onEdit, onDelete, readonly }: CheckpointTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'departed':
        return 'bg-green-100 text-green-800';
      case 'arrived':
        return 'bg-blue-100 text-blue-800';
      case 'skipped':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">KM</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Arrive</TableHead>
            <TableHead>Depart</TableHead>
            <TableHead>Stop</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Status</TableHead>
            {!readonly && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkpoints.length === 0 ? (
            <TableRow>
              <TableCell colSpan={readonly ? 7 : 8} className="text-center py-8 text-muted-foreground">
                No checkpoints defined
              </TableCell>
            </TableRow>
          ) : (
            checkpoints.map((cp) => (
              <TableRow key={cp.id}>
                <TableCell className="font-medium">
                  {cp.kmFromStart !== undefined ? cp.kmFromStart : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{getLocationTypeIcon(cp.locationType)}</span>
                    <div>
                      <div className="font-medium">{cp.locationName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatLocationType(cp.locationType)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {cp.plannedArrival ? (
                    <div>
                      <div>{format(new Date(cp.plannedArrival), 'HH:mm')}</div>
                      {cp.actualArrival && (
                        <div className="text-xs text-muted-foreground">
                          Actual: {format(new Date(cp.actualArrival), 'HH:mm')}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {cp.plannedDeparture ? (
                    <div>
                      <div>{format(new Date(cp.plannedDeparture), 'HH:mm')}</div>
                      {cp.actualDeparture && (
                        <div className="text-xs text-muted-foreground">
                          Actual: {format(new Date(cp.actualDeparture), 'HH:mm')}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {cp.stopDurationMinutes ? formatDuration(cp.stopDurationMinutes) : '-'}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {cp.activities || '-'}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(cp.status)}>
                    {cp.status.charAt(0).toUpperCase() + cp.status.slice(1)}
                  </Badge>
                </TableCell>
                {!readonly && (
                  <TableCell>
                    <div className="flex gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(cp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(cp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
