'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleForm } from '@/components/attendance/schedule-form';
import { ScheduleList } from '@/components/attendance/schedule-list';
import { getWorkSchedules } from '../schedule-actions';
import { WorkSchedule } from '@/types/attendance';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | undefined>();

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    const result = await getWorkSchedules();
    setSchedules(result.data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleEdit = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingSchedule(undefined);
    loadSchedules();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSchedule(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Schedules</h1>
          <p className="text-muted-foreground">
            Manage work schedules for attendance tracking
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        )}
      </div>

      {showForm ? (
        <ScheduleForm
          schedule={editingSchedule}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      ) : (
        <ScheduleList
          schedules={schedules}
          onEdit={handleEdit}
          onRefresh={loadSchedules}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
