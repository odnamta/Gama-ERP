'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFeeTypes } from '@/lib/fee-actions';
import { CustomsFeeType, FeeCategory, FEE_CATEGORY_LABELS } from '@/types/customs-fees';

interface FeeTypeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  filterCategory?: FeeCategory;
  disabled?: boolean;
}

export function FeeTypeSelect({
  value,
  onValueChange,
  filterCategory,
  disabled = false,
}: FeeTypeSelectProps) {
  const [feeTypes, setFeeTypes] = useState<CustomsFeeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeeTypes() {
      const types = await getFeeTypes();
      setFeeTypes(types);
      setLoading(false);
    }
    loadFeeTypes();
  }, []);

  // Group fee types by category
  const groupedTypes = feeTypes
    .filter((ft) => !filterCategory || ft.fee_category === filterCategory)
    .reduce((acc, ft) => {
      const category = ft.fee_category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(ft);
      return acc;
    }, {} as Record<FeeCategory, CustomsFeeType[]>);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? 'Loading...' : 'Select fee type'} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedTypes).map(([category, types]) => (
          <SelectGroup key={category}>
            <SelectLabel>{FEE_CATEGORY_LABELS[category as FeeCategory]}</SelectLabel>
            {types.map((ft) => (
              <SelectItem key={ft.id} value={ft.id}>
                {ft.fee_name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
