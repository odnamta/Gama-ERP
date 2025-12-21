// =====================================================
// v0.34: WIDGET SYSTEM TYPES
// =====================================================

// Widget type enumeration
export type WidgetType = 'stat_card' | 'chart' | 'list' | 'table' | 'calendar' | 'progress';

// Valid widget types array for validation
export const VALID_WIDGET_TYPES: WidgetType[] = ['stat_card', 'chart', 'list', 'table', 'calendar', 'progress'];

// Widget dimension constraints
export const WIDGET_CONSTRAINTS = {
  MIN_WIDTH: 1,
  MAX_WIDTH: 4,
  MIN_HEIGHT: 1,
  MAX_HEIGHT: 3,
} as const;

// Widget definition from database
export interface Widget {
  id: string;
  widget_code: string;
  widget_name: string;
  description: string | null;
  widget_type: WidgetType;
  data_source: string | null;
  default_width: number;
  default_height: number;
  allowed_roles: string[];
  settings_schema: Record<string, unknown>;
  is_active: boolean;
  display_order: number;
  created_at?: string;
}

// Widget configuration (user or default)
export interface WidgetConfig {
  widgetId: string;
  widget: Widget;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  settings: Record<string, unknown>;
  isVisible: boolean;
}

// Grid position for layout
export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// =====================================================
// WIDGET DATA STRUCTURES
// =====================================================

// StatCard widget data
export interface StatCardData {
  value: number | string;
  label: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period: string;
  };
  icon?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

// Chart widget data
export type ChartType = 'bar' | 'line' | 'pie' | 'funnel';

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface ChartData {
  type: ChartType;
  labels: string[];
  datasets: ChartDataset[];
}

// List widget data
export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  href?: string;
  timestamp?: string;
}

export interface ListData {
  items: ListItem[];
  totalCount: number;
}

// Table widget data
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  totalCount: number;
}

// Progress widget data
export interface ProgressSegment {
  label: string;
  value: number;
  color: string;
}

export interface ProgressData {
  current: number;
  target: number;
  label: string;
  segments?: ProgressSegment[];
}

// Calendar widget data
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type?: string;
  color?: string;
}

export interface CalendarData {
  events: CalendarEvent[];
  month: number;
  year: number;
}

// Union type for all widget data
export type WidgetData = StatCardData | ChartData | ListData | TableData | ProgressData | CalendarData;

// Widget data state
export interface WidgetDataState<T = WidgetData> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// =====================================================
// WIDGET RENDERER PROPS
// =====================================================

export interface BaseWidgetProps {
  config: WidgetConfig;
  onRefresh?: () => void;
}

export interface StatCardWidgetProps extends BaseWidgetProps {
  data: StatCardData | null;
  isLoading: boolean;
  error: string | null;
}

export interface ChartWidgetProps extends BaseWidgetProps {
  data: ChartData | null;
  isLoading: boolean;
  error: string | null;
}

export interface ListWidgetProps extends BaseWidgetProps {
  data: ListData | null;
  isLoading: boolean;
  error: string | null;
}

export interface TableWidgetProps extends BaseWidgetProps {
  data: TableData | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProgressWidgetProps extends BaseWidgetProps {
  data: ProgressData | null;
  isLoading: boolean;
  error: string | null;
}

export interface CalendarWidgetProps extends BaseWidgetProps {
  data: CalendarData | null;
  isLoading: boolean;
  error: string | null;
}

// =====================================================
// WIDGET GRID PROPS
// =====================================================

export interface WidgetGridProps {
  configs: WidgetConfig[];
  onLayoutChange?: (configs: WidgetConfig[]) => void;
  isEditing?: boolean;
}

export interface WidgetRendererProps {
  config: WidgetConfig;
  onRefresh?: () => void;
}
