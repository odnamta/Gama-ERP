'use client';

import { useState } from 'react';
import { TaskExecution, ExecutionStatus, TriggerType } from '@/types/scheduled-task';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  Play,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatExecutionTime } from '@/lib/scheduled-task-utils';

interface TaskExecutionHistoryProps {
  executions: TaskExecution[];
  onFilterChange?: (filters: { status?: ExecutionStatus; triggeredBy?: TriggerType }) => void;
  onRetry?: (executionId: string) => Promise<void>;
  isLoading?: boolean;
}

export function TaskExecutionHistory({
  executions,
  onFilterChange,
  onRetry,
  isLoading = false,
}: TaskExecutionHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onFilterChange?.({
      status: value === 'all' ? undefined : (value as ExecutionStatus),
      triggeredBy: triggerFilter === 'all' ? undefined : (triggerFilter as TriggerType),
    });
  };

  const handleTriggerChange = (value: string) => {
    setTriggerFilter(value);
    onFilterChange?.({
      status: statusFilter === 'all' ? undefined : (statusFilter as ExecutionStatus),
      triggeredBy: value === 'all' ? undefined : (value as TriggerType),
    });
  };

  const handleRetry = async (executionId: string) => {
    if (!onRetry) return;
    setRetryingIds(prev => new Set(prev).add(executionId));
    try {
      await onRetry(executionId);
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(executionId);
        return next;
      });
    }
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    const variants: Record<ExecutionStatus, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      completed: 'default',
      failed: 'destructive',
      timeout: 'destructive',
      running: 'secondary',
    };
    return (
      <Badge variant={variants[status]} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const getTriggerIcon = (triggeredBy: TriggerType) => {
    switch (triggeredBy) {
      case 'schedule':
        return <Calendar className="w-3 h-3" />;
      case 'manual':
        return <Play className="w-3 h-3" />;
      case 'retry':
        return <RotateCcw className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="timeout">Timeout</SelectItem>
            <SelectItem value="running">Running</SelectItem>
          </SelectContent>
        </Select>

        <Select value={triggerFilter} onValueChange={handleTriggerChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            <SelectItem value="schedule">Scheduled</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="retry">Retry</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {executions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No execution history found.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(execution.started_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(execution.started_at), 'HH:mm:ss')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(execution.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm capitalize">
                      {getTriggerIcon(execution.triggered_by)}
                      {execution.triggered_by}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {execution.records_processed ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatExecutionTime(execution.execution_time_ms)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {execution.error_message ? (
                      <span className="text-sm text-red-500 truncate max-w-[200px] block">
                        {execution.error_message}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(execution.status === 'failed' || execution.status === 'timeout') && onRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={retryingIds.has(execution.id)}
                        onClick={() => handleRetry(execution.id)}
                      >
                        {retryingIds.has(execution.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
