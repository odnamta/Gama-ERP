'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScheduledTask, TaskExecution } from '@/types/scheduled-task';
import {
  ScheduledTasksList,
  TaskDetailDialog,
} from '@/components/automation';
import {
  getScheduledTasks,
  toggleTaskStatus,
  getTaskExecutions,
} from '@/lib/scheduled-task-actions';
import { runScheduledTaskAction } from '@/lib/scheduled-task-runner-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getScheduledTasks();
      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        return;
      }
      setTasks(data || []);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadExecutions = useCallback(async (taskId: string) => {
    setIsLoadingExecutions(true);
    try {
      const { data, error } = await getTaskExecutions(taskId, { limit: 10 });
      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        return;
      }
      setExecutions(data || []);
    } finally {
      setIsLoadingExecutions(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleToggleStatus = async (taskId: string, isActive: boolean) => {
    const { success, error } = await toggleTaskStatus(taskId, isActive);
    if (!success) {
      toast({
        title: 'Error',
        description: error || 'Failed to update task status',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Success',
      description: `Task ${isActive ? 'enabled' : 'disabled'} successfully`,
    });
    await loadTasks();
  };

  const handleTriggerTask = async (taskCode: string) => {
    const result = await runScheduledTaskAction(taskCode, 'manual');
    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to trigger task',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Task Triggered',
      description: `Task completed. Processed ${result.recordsProcessed} records.`,
    });
    await loadTasks();
  };

  const handleViewDetails = async (task: ScheduledTask) => {
    setSelectedTask(task);
    setDialogOpen(true);
    await loadExecutions(task.id);
  };

  // Calculate stats
  const activeTasks = tasks.filter(t => t.is_active).length;
  const completedToday = tasks.filter(t => {
    if (!t.last_run_at || t.last_run_status !== 'completed') return false;
    const lastRun = new Date(t.last_run_at);
    const today = new Date();
    return lastRun.toDateString() === today.toDateString();
  }).length;
  const failedTasks = tasks.filter(t => 
    t.last_run_status === 'failed' || t.last_run_status === 'timeout'
  ).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Tasks</h1>
          <p className="text-muted-foreground">
            Manage automated tasks and view execution history
          </p>
        </div>
        <Button variant="outline" onClick={loadTasks} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{tasks.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-1" />
              Registered tasks
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeTasks}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Scheduled to run
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Today</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{completedToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Successful runs
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-600">{failedTasks}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <XCircle className="w-4 h-4 mr-1" />
              Need attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            Click on a task to view details and execution history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduledTasksList
            tasks={tasks}
            onToggleStatus={handleToggleStatus}
            onTriggerTask={handleTriggerTask}
            onViewDetails={handleViewDetails}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        executions={executions}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoadingExecutions={isLoadingExecutions}
      />
    </div>
  );
}
