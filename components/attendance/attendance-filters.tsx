'use client';

import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttendanceStatus } from '@/types/attendance';
import { formatAttendanceDate } from '@/lib/attendance-utils';

interface Department {
  id: string;
  department_name: string;
}

interface AttendanceFiltersProps {
  date: Date;
  onDateChange: (date: Date) => void;
  departments: Department[];
  selectedDepartment: string | null;
  onDepartmentChange: (departmentId: string | null) => void;
  selectedStatus: AttendanceStatus | null;
  onStatusChange: (status: AttendanceStatus | null) => void;
  onExport?: () => void;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent', label: 'Absent' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'wfh', label: 'WFH' },
  { value: 'holiday', label: 'Holiday' },
];

export function AttendanceFilters({
  date,
  onDateChange,
  departments,
  selectedDepartment,
  onDepartmentChange,
  selectedStatus,
  onStatusChange,
  onExport,
}: AttendanceFiltersProps) {
  const handlePrevDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[140px] text-center font-medium">
          {formatAttendanceDate(date)}
        </div>
        <Button variant="outline" size="icon" onClick={handleNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isToday() && (
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        )}
      </div>

      {/* Department Filter */}
      <Select
        value={selectedDepartment || 'all'}
        onValueChange={(value) => onDepartmentChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.department_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={selectedStatus || 'all'}
        onValueChange={(value) =>
          onStatusChange(value === 'all' ? null : (value as AttendanceStatus))
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Export Button */}
      {onExport && (
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      )}
    </div>
  );
}
