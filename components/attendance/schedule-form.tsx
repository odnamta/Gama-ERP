'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { WorkSchedule, WorkScheduleInput } from '@/types/attendance';
import { upsertWorkSchedule } from '@/app/(main)/hr/attendance/schedule-actions';
import { toast } from 'sonner';

interface ScheduleFormProps {
  schedule?: WorkSchedule;
  onSuccess: () => void;
  onCancel: () => void;
}

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function ScheduleForm({ schedule, onSuccess, onCancel }: ScheduleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isDefault, setIsDefault] = useState(false);

  const isEditing = !!schedule;

  useEffect(() => {
    if (schedule) {
      setName(schedule.schedule_name);
      setWorkStart(schedule.work_start);
      setWorkEnd(schedule.work_end);
      setBreakStart(schedule.break_start || '12:00');
      setBreakEnd(schedule.break_end || '13:00');
      setGraceMinutes(schedule.late_grace_minutes);
      setWorkDays(schedule.work_days);
      setIsDefault(schedule.is_default);
    }
  }, [schedule]);

  const toggleWorkDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Schedule name is required');
      return;
    }

    if (workDays.length === 0) {
      toast.error('Select at least one work day');
      return;
    }

    startTransition(async () => {
      const data: WorkScheduleInput = {
        schedule_name: name.trim(),
        work_start: workStart,
        work_end: workEnd,
        break_start: breakStart || undefined,
        break_end: breakEnd || undefined,
        late_grace_minutes: graceMinutes,
        work_days: workDays,
        is_default: isDefault,
      };

      const result = await upsertWorkSchedule(data, schedule?.id);

      if (result.success) {
        toast.success(isEditing ? 'Schedule updated' : 'Schedule created');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to save schedule');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Schedule' : 'New Schedule'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Schedule Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Schedule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Office Hours"
            />
          </div>

          {/* Work Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workStart">Work Start</Label>
              <Input
                id="workStart"
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workEnd">Work End</Label>
              <Input
                id="workEnd"
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Break Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breakStart">Break Start</Label>
              <Input
                id="breakStart"
                type="time"
                value={breakStart}
                onChange={(e) => setBreakStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakEnd">Break End</Label>
              <Input
                id="breakEnd"
                type="time"
                value={breakEnd}
                onChange={(e) => setBreakEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Grace Period */}
          <div className="space-y-2">
            <Label htmlFor="graceMinutes">Late Grace Period (minutes)</Label>
            <Input
              id="graceMinutes"
              type="number"
              min={0}
              max={60}
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Work Days */}
          <div className="space-y-2">
            <Label>Work Days</Label>
            <div className="flex flex-wrap gap-4">
              {WEEKDAYS.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={workDays.includes(day.value)}
                    onCheckedChange={() => toggleWorkDay(day.value)}
                  />
                  <label
                    htmlFor={`day-${day.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {day.label.slice(0, 3)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Default Schedule */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isDefault"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="isDefault">Set as default schedule</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
