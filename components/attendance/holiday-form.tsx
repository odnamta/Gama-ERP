'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Holiday, HolidayInput } from '@/types/attendance';
import { createHoliday, updateHoliday } from '@/app/(main)/hr/attendance/holiday-actions';
import { toast } from 'sonner';

interface HolidayFormProps {
  holiday?: Holiday;
  onSuccess: () => void;
  onCancel: () => void;
}

export function HolidayForm({ holiday, onSuccess, onCancel }: HolidayFormProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [isNational, setIsNational] = useState(true);
  const [isCompany, setIsCompany] = useState(false);

  const isEditing = !!holiday;

  useEffect(() => {
    if (holiday) {
      setDate(holiday.holiday_date);
      setName(holiday.holiday_name);
      setIsNational(holiday.is_national);
      setIsCompany(holiday.is_company);
    }
  }, [holiday]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error('Date is required');
      return;
    }

    if (!name.trim()) {
      toast.error('Holiday name is required');
      return;
    }

    startTransition(async () => {
      const data: HolidayInput = {
        holiday_date: date,
        holiday_name: name.trim(),
        is_national: isNational,
        is_company: isCompany,
      };

      const result = isEditing
        ? await updateHoliday(holiday.id, data)
        : await createHoliday(data);

      if (result.success) {
        toast.success(isEditing ? 'Holiday updated' : 'Holiday created');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to save holiday');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Holiday' : 'New Holiday'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Holiday Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Holiday Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Independence Day"
            />
          </div>

          {/* National Holiday */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isNational"
              checked={isNational}
              onCheckedChange={setIsNational}
            />
            <Label htmlFor="isNational">National Holiday</Label>
          </div>

          {/* Company Holiday */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isCompany"
              checked={isCompany}
              onCheckedChange={setIsCompany}
            />
            <Label htmlFor="isCompany">Company Holiday</Label>
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
