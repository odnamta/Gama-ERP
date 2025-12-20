'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, AttendanceRecordInput } from '@/types/attendance';
import { upsertAttendanceRecord } from '@/app/(main)/hr/attendance/actions';
import { toast } from 'sonner';

interface ManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName?: string;
  date: string;
  existingRecord?: AttendanceRecord | null;
  onSuccess: () => void;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent', label: 'Absent' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'wfh', label: 'Work From Home' },
  { value: 'holiday', label: 'Holiday' },
];

export function ManualEntryDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  date,
  existingRecord,
  onSuccess,
}: ManualEntryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  const isEditing = !!existingRecord;

  // Reset form when dialog opens or record changes
  useEffect(() => {
    if (open) {
      if (existingRecord) {
        // Extract time from ISO timestamp
        const clockInTime = existingRecord.clock_in
          ? new Date(existingRecord.clock_in).toTimeString().slice(0, 5)
          : '';
        const clockOutTime = existingRecord.clock_out
          ? new Date(existingRecord.clock_out).toTimeString().slice(0, 5)
          : '';
        setClockIn(clockInTime);
        setClockOut(clockOutTime);
        setStatus(existingRecord.status);
        setNotes(existingRecord.notes || '');
        setCorrectionReason('');
      } else {
        setClockIn('');
        setClockOut('');
        setStatus('present');
        setNotes('');
        setCorrectionReason('');
      }
    }
  }, [open, existingRecord]);

  const handleSubmit = () => {
    // Validate times
    if (clockIn && clockOut) {
      const [inH, inM] = clockIn.split(':').map(Number);
      const [outH, outM] = clockOut.split(':').map(Number);
      const inMinutes = inH * 60 + inM;
      const outMinutes = outH * 60 + outM;

      if (outMinutes <= inMinutes) {
        toast.error('Clock-out time must be after clock-in time');
        return;
      }
    }

    // Require correction reason when editing
    if (isEditing && !correctionReason.trim()) {
      toast.error('Please provide a reason for the correction');
      return;
    }

    startTransition(async () => {
      // Build full timestamps
      let clockInTimestamp: string | undefined;
      let clockOutTimestamp: string | undefined;

      if (clockIn) {
        clockInTimestamp = `${date}T${clockIn}:00`;
      }
      if (clockOut) {
        clockOutTimestamp = `${date}T${clockOut}:00`;
      }

      const data: AttendanceRecordInput = {
        employee_id: employeeId,
        attendance_date: date,
        clock_in: clockInTimestamp,
        clock_out: clockOutTimestamp,
        status,
        notes: notes || undefined,
        correction_reason: isEditing ? correctionReason : undefined,
      };

      const result = await upsertAttendanceRecord(data);

      if (result.success) {
        toast.success(isEditing ? 'Attendance record updated' : 'Attendance record created');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to save attendance record');
      }
    });
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Attendance Record' : 'Add Attendance Record'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee & Date Info */}
          <div className="space-y-2">
            {employeeName && (
              <div>
                <Label className="text-muted-foreground">Employee</Label>
                <p className="font-medium">{employeeName}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="font-medium">{formatDateDisplay(date)}</p>
            </div>
          </div>

          {/* Clock In Time */}
          <div className="space-y-2">
            <Label htmlFor="clockIn">Clock In Time</Label>
            <Input
              id="clockIn"
              type="time"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
            />
          </div>

          {/* Clock Out Time */}
          <div className="space-y-2">
            <Label htmlFor="clockOut">Clock Out Time</Label>
            <Input
              id="clockOut"
              type="time"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {/* Correction Reason (only when editing) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="correctionReason">
                Correction Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="correctionReason"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Why is this record being corrected?"
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
