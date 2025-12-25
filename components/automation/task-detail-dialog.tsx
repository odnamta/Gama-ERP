'use client';

import { ScheduledTask, TaskExecution } from '@/types/scheduled-task';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TaskExecutionHistory } from './task-execution-history';
import {
  Clock,
  Calendar,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { describeCronExpression, formatExecutionTime } from '@/lib/scheduled-task-utils';

interface TaskDetailDialogProps {
  task: ScheduledTask | null;
  executions: TaskExecution[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (executionId: string) => Promise<void>;
  isLoadingExecutions?: boolean;
}

export function TaskDetailDialog({
  task,
  executions,
  open,
  onOpenChange,
  onRetry,
  isLoadingExecutions = false,
}: TaskDetailDialogProps) {
  if (!task) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task.task_name}
            <Badge variant={task.is_active ? 'default' : 'secondary'}>
              {task.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
          <DialogDescription>{task.description || 'No description'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Task Code</div>
              <div className="font-mono text-sm">{task.task_code}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Last Status</div>
              <div>{getStatusBadge(task.last_run_status)}</div>
            </div>
          </div>

          <Separator />

          {/* Schedule Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Schedule</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Cron Expression</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {task.cron_expression}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {describeCronExpression(task.cron_expression)}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Timezone</div>
                  <div className="text-sm text-muted-foreground">{task.timezone}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Run Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Run Information</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Last Run</div>
                  <div className="text-sm text-muted-foreground">
                    {task.last_run_at
                      ? formatDistanceToNow(new Date(task.last_run_at), { addSuffix: true })
                      : 'Never'}
                  </div>
                  {task.last_run_at && (
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(task.last_run_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Next Run</div>
                  <div className="text-sm text-muted-foreground">
                    {task.next_run_at
                      ? formatDistanceToNow(new Date(task.next_run_at), { addSuffix: true })
                      : 'Not scheduled'}
                  </div>
                  {task.next_run_at && (
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(task.next_run_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Last Duration</div>
                  <div className="text-sm text-muted-foreground">
                    {formatExecutionTime(task.last_run_duration_ms)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Execution History */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Recent Executions</h4>
            <TaskExecutionHistory
              executions={executions}
              onRetry={onRetry}
              isLoading={isLoadingExecutions}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
