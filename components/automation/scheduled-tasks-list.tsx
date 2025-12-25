'use client';

import { useState } from 'react';
import { ScheduledTask } from '@/types/scheduled-task';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { describeCronExpression, formatExecutionTime } from '@/lib/scheduled-task-utils';

interface ScheduledTasksListProps {
  tasks: ScheduledTask[];
  onToggleStatus: (taskId: string, isActive: boolean) => Promise<void>;
  onTriggerTask: (taskCode: string) => Promise<void>;
  onViewDetails: (task: ScheduledTask) => void;
  isLoading?: boolean;
}

export function ScheduledTasksList({
  tasks,
  onToggleStatus,
  onTriggerTask,
  onViewDetails,
  isLoading = false,
}: ScheduledTasksListProps) {
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [triggeringCodes, setTriggeringCodes] = useState<Set<string>>(new Set());

  const handleToggle = async (taskId: string, isActive: boolean) => {
    setTogglingIds(prev => new Set(prev).add(taskId));
    try {
      await onToggleStatus(taskId, isActive);
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleTrigger = async (taskCode: string) => {
    setTriggeringCodes(prev => new Set(prev).add(taskCode));
    try {
      await onTriggerTask(taskCode);
    } finally {
      setTriggeringCodes(prev => {
        const next = new Set(prev);
        next.delete(taskCode);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'timeout':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Timeout
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Never Run
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading tasks...</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No scheduled tasks found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Task</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="w-[100px]">Active</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onViewDetails(task)}
            >
              <TableCell>
                <div>
                  <div className="font-medium">{task.task_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.task_code}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {describeCronExpression(task.cron_expression)}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {task.cron_expression}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(task.last_run_status)}</TableCell>
              <TableCell>
                {task.last_run_at ? (
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(task.last_run_at), {
                      addSuffix: true,
                    })}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {formatExecutionTime(task.last_run_duration_ms)}
                </span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={task.is_active}
                  disabled={togglingIds.has(task.id)}
                  onCheckedChange={(checked) => handleToggle(task.id, checked)}
                />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!task.is_active || triggeringCodes.has(task.task_code)}
                  onClick={() => handleTrigger(task.task_code)}
                >
                  {triggeringCodes.has(task.task_code) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
