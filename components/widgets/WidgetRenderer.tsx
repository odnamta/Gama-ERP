'use client';

/**
 * WidgetRenderer Component
 * v0.34: Dashboard Widgets & Customization
 * 
 * Dispatches to the correct widget type component based on widget_type.
 * Handles loading and error states, supports refresh functionality.
 */

import { useWidgetData } from '@/hooks/useWidgetData';
import { StatCardWidget } from './StatCardWidget';
import { ChartWidget } from './ChartWidget';
import { ListWidget } from './ListWidget';
import { TableWidget } from './TableWidget';
import { ProgressWidget } from './ProgressWidget';
import { CalendarWidget } from './CalendarWidget';
import type { 
  WidgetRendererProps, 
  StatCardData, 
  ChartData, 
  ListData, 
  TableData, 
  ProgressData,
  CalendarData,
} from '@/types/widgets';

export function WidgetRenderer({ config, onRefresh }: WidgetRendererProps) {
  const { data, isLoading, error, refresh } = useWidgetData(config.widget.widget_code, config.settings);

  const handleRefresh = () => {
    refresh();
    onRefresh?.();
  };

  switch (config.widget.widget_type) {
    case 'stat_card':
      return (
        <StatCardWidget
          data={data as StatCardData | null}
          isLoading={isLoading}
          error={error}
          config={config}
          onRefresh={handleRefresh}
        />
      );

    case 'chart':
      return (
        <ChartWidget
          data={data as ChartData | null}
          isLoading={isLoading}
          error={error}
          config={config}
          onRefresh={handleRefresh}
        />
      );

    case 'list':
      return (
        <ListWidget
          data={data as ListData | null}
          isLoading={isLoading}
          error={error}
          config={config}
          onRefresh={handleRefresh}
        />
      );

    case 'table':
      return (
        <TableWidget
          data={data as TableData | null}
          isLoading={isLoading}
          error={error}
          config={config}
          onRefresh={handleRefresh}
        />
      );

    case 'progress':
      return (
        <ProgressWidget
          data={data as ProgressData | null}
          isLoading={isLoading}
          error={error}
          config={config}
          onRefresh={handleRefresh}
        />
      );

    case 'calendar':
      return (
        <CalendarWidget
          data={data as CalendarData | null}
          isLoading={isLoading}
          error={error}
          config={config}
          onRefresh={handleRefresh}
        />
      );

    default:
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Unknown widget type: {config.widget.widget_type}
        </div>
      );
  }
}

export default WidgetRenderer;
