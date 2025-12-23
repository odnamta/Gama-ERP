'use client';

// =====================================================
// v0.61: Dashboard Export Dialog Component
// Requirements: 15.1, 15.2, 15.3
// =====================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { KPIValue, PeriodType } from '@/types/executive-dashboard';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpis: KPIValue[];
  period: PeriodType;
}

type ExportFormat = 'csv' | 'json';

interface ExportOptions {
  includeTarget: boolean;
  includeStatus: boolean;
  includeTrend: boolean;
  includeChange: boolean;
}

export function ExportDialog({
  open,
  onOpenChange,
  kpis,
  period,
}: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeTarget: true,
    includeStatus: true,
    includeTrend: true,
    includeChange: true,
  });

  // Generate CSV content (Requirement 15.2)
  const generateCSV = (): string => {
    const headers = ['KPI Code', 'KPI Name', 'Category', 'Current Value', 'Unit'];
    
    if (options.includeTarget) headers.push('Target');
    if (options.includeStatus) headers.push('Status');
    if (options.includeTrend) headers.push('Trend');
    if (options.includeChange) headers.push('Change %');

    const rows = kpis.map(kpi => {
      const row = [
        kpi.kpiCode,
        `"${kpi.kpiName}"`,
        kpi.category,
        kpi.currentValue.toString(),
        kpi.unit,
      ];

      if (options.includeTarget) row.push(kpi.targetValue.toString());
      if (options.includeStatus) row.push(kpi.status);
      if (options.includeTrend) row.push(kpi.trend);
      if (options.includeChange) row.push(kpi.changePercentage.toString());

      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Generate JSON content (Requirement 15.2)
  const generateJSON = (): string => {
    const exportData = kpis.map(kpi => {
      const data: Record<string, unknown> = {
        kpiCode: kpi.kpiCode,
        kpiName: kpi.kpiName,
        category: kpi.category,
        currentValue: kpi.currentValue,
        unit: kpi.unit,
      };

      if (options.includeTarget) data.targetValue = kpi.targetValue;
      if (options.includeStatus) data.status = kpi.status;
      if (options.includeTrend) data.trend = kpi.trend;
      if (options.includeChange) data.changePercentage = kpi.changePercentage;

      return data;
    });

    return JSON.stringify({
      exportDate: new Date().toISOString(),
      period,
      kpis: exportData,
    }, null, 2);
  };

  // Handle export (Requirement 15.1)
  const handleExport = async () => {
    setExporting(true);

    try {
      const content = exportFormat === 'csv' ? generateCSV() : generateJSON();
      const mimeType = exportFormat === 'csv' ? 'text/csv' : 'application/json';
      const extension = exportFormat === 'csv' ? 'csv' : 'json';
      const filename = `executive-dashboard-${period}-${format(new Date(), 'yyyy-MM-dd')}.${extension}`;

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Dashboard Data
          </DialogTitle>
          <DialogDescription>
            Export KPI data in your preferred format. Includes {kpis.length} KPIs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  JSON
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export Options (Requirement 15.3) */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTarget"
                  checked={options.includeTarget}
                  onCheckedChange={() => toggleOption('includeTarget')}
                />
                <Label htmlFor="includeTarget" className="cursor-pointer">
                  Target Value
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStatus"
                  checked={options.includeStatus}
                  onCheckedChange={() => toggleOption('includeStatus')}
                />
                <Label htmlFor="includeStatus" className="cursor-pointer">
                  Status (exceeded, on_track, warning, critical)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTrend"
                  checked={options.includeTrend}
                  onCheckedChange={() => toggleOption('includeTrend')}
                />
                <Label htmlFor="includeTrend" className="cursor-pointer">
                  Trend Direction (up, down, stable)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeChange"
                  checked={options.includeChange}
                  onCheckedChange={() => toggleOption('includeChange')}
                />
                <Label htmlFor="includeChange" className="cursor-pointer">
                  Change Percentage
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || kpis.length === 0}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {kpis.length} KPIs
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
