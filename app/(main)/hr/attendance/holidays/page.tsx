'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HolidayForm } from '@/components/attendance/holiday-form';
import { HolidayList } from '@/components/attendance/holiday-list';
import { getHolidays } from '../holiday-actions';
import { Holiday } from '@/types/attendance';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | undefined>();

  // Get current year range
  const currentYear = new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  const loadHolidays = useCallback(async () => {
    setIsLoading(true);
    const result = await getHolidays(startDate, endDate);
    setHolidays(result.data || []);
    setIsLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingHoliday(undefined);
    loadHolidays();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHoliday(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holidays</h1>
          <p className="text-muted-foreground">
            Manage holidays for {currentYear}
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Holiday
          </Button>
        )}
      </div>

      {showForm ? (
        <HolidayForm
          holiday={editingHoliday}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      ) : (
        <HolidayList
          holidays={holidays}
          onEdit={handleEdit}
          onRefresh={loadHolidays}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
