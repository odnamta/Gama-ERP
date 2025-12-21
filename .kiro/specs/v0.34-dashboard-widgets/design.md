# Design Document: Dashboard Widgets & Customization

## Overview

This design describes a reusable widget system for composing customizable dashboards in Gama ERP. The system provides a database-driven widget catalog, role-based access control, default layouts per role, and user-specific customization. Each widget type has a dedicated renderer and fetches data independently, enabling responsive and performant dashboards.

## Architecture

The widget system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Page                            │
├─────────────────────────────────────────────────────────────┤
│                  WidgetGrid Component                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Widget  │ │ Widget  │ │ Widget  │ │ Widget  │           │
│  │ Slot 1  │ │ Slot 2  │ │ Slot 3  │ │ Slot 4  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
├───────┼──────────┼──────────┼──────────┼────────────────────┤
│       │          │          │          │                     │
│  ┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐              │
│  │ Widget  │ │ Widget │ │ Widget │ │ Widget │              │
│  │Renderer │ │Renderer│ │Renderer│ │Renderer│              │
│  └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘              │
├───────┼──────────┼──────────┼──────────┼────────────────────┤
│       │          │          │          │                     │
│  ┌────▼──────────▼──────────▼──────────▼────┐               │
│  │           Widget Data Fetcher             │               │
│  └────────────────────┬─────────────────────┘               │
├───────────────────────┼─────────────────────────────────────┤
│                       │                                      │
│  ┌────────────────────▼─────────────────────┐               │
│  │              Supabase                     │               │
│  │  ┌──────────────┐ ┌──────────────────┐   │               │
│  │  │ dashboard_   │ │ user_widget_     │   │               │
│  │  │ widgets      │ │ configs          │   │               │
│  │  └──────────────┘ └──────────────────┘   │               │
│  │  ┌──────────────────────────────────┐    │               │
│  │  │ default_widget_layouts           │    │               │
│  │  └──────────────────────────────────┘    │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User loads dashboard → System checks for user_widget_configs
2. If no user config → Load default_widget_layouts for user's role
3. Filter widgets by allowed_roles
4. Render WidgetGrid with positioned widgets
5. Each widget independently fetches its data via data_source
6. User customizations saved to user_widget_configs

## Components and Interfaces

### Database Tables

#### dashboard_widgets
Stores widget definitions available in the system.

```sql
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_code VARCHAR(50) UNIQUE NOT NULL,
  widget_name VARCHAR(100) NOT NULL,
  description TEXT,
  widget_type VARCHAR(30) NOT NULL,
  data_source VARCHAR(100),
  default_width INTEGER DEFAULT 1,
  default_height INTEGER DEFAULT 1,
  allowed_roles TEXT[] DEFAULT '{}',
  settings_schema JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_widget_configs
Stores user-specific widget configurations.

```sql
CREATE TABLE user_widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id),
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  settings JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, widget_id)
);
```

#### default_widget_layouts
Stores default layouts per role.

```sql
CREATE TABLE default_widget_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(30) NOT NULL,
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id),
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  UNIQUE(role, widget_id)
);
```

### TypeScript Interfaces

```typescript
// Widget type enumeration
type WidgetType = 'stat_card' | 'chart' | 'list' | 'table' | 'calendar' | 'progress';

// Widget definition from database
interface Widget {
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
}

// Widget configuration (user or default)
interface WidgetConfig {
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
interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}
```

### React Components

#### WidgetGrid
Main container that renders widgets in a responsive grid.

```typescript
interface WidgetGridProps {
  configs: WidgetConfig[];
  onLayoutChange?: (configs: WidgetConfig[]) => void;
  isEditing?: boolean;
}
```

#### WidgetRenderer
Dispatches to appropriate widget type renderer.

```typescript
interface WidgetRendererProps {
  config: WidgetConfig;
  onRefresh?: () => void;
}
```

#### Widget Type Components
- `StatCardWidget`: Displays key metric with optional trend indicator
- `ChartWidget`: Renders charts (bar, line, pie, funnel)
- `ListWidget`: Scrollable list with action items
- `TableWidget`: Tabular data with sorting
- `ProgressWidget`: Progress bars or gauges
- `CalendarWidget`: Date-based event display

### Utility Functions

```typescript
// lib/widget-utils.ts

// Get widgets for current user
async function getUserWidgets(userId: string, role: string): Promise<WidgetConfig[]>

// Save user widget configuration
async function saveWidgetLayout(userId: string, widgets: WidgetConfig[]): Promise<void>

// Reset user layout to defaults
async function resetWidgetLayout(userId: string): Promise<void>

// Fetch widget data by code
async function fetchWidgetData(widgetCode: string, settings?: Record<string, unknown>): Promise<unknown>

// Filter widgets by role
function filterWidgetsByRole(widgets: Widget[], role: string): Widget[]

// Calculate grid positions
function calculateGridPositions(configs: WidgetConfig[], columns: number): GridPosition[]

// Validate widget configuration
function validateWidgetConfig(config: WidgetConfig): boolean
```

## Data Models

### Widget Types and Their Data Structures

#### StatCard Data
```typescript
interface StatCardData {
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
```

#### Chart Data
```typescript
interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'funnel';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}
```

#### List Data
```typescript
interface ListData {
  items: {
    id: string;
    title: string;
    subtitle?: string;
    status?: string;
    href?: string;
    timestamp?: string;
  }[];
  totalCount: number;
}
```

#### Table Data
```typescript
interface TableData {
  columns: {
    key: string;
    label: string;
    sortable?: boolean;
  }[];
  rows: Record<string, unknown>[];
  totalCount: number;
}
```

#### Progress Data
```typescript
interface ProgressData {
  current: number;
  target: number;
  label: string;
  segments?: {
    label: string;
    value: number;
    color: string;
  }[];
}
```

### Default Widget Catalog

| Widget Code | Name | Type | Roles |
|-------------|------|------|-------|
| fin_cash_position | Cash Position | stat_card | owner, admin, finance |
| fin_ar_summary | AR Summary | stat_card | owner, admin, manager, finance |
| fin_ap_summary | AP Summary | stat_card | owner, admin, manager, finance |
| fin_ar_aging_chart | AR Aging Chart | chart | owner, admin, manager, finance |
| fin_revenue_trend | Revenue Trend | chart | owner, admin, manager, finance |
| fin_pending_approvals | Pending Approvals | list | owner, admin, manager, finance |
| sales_pipeline_summary | Pipeline Summary | stat_card | owner, admin, manager, sales |
| sales_pipeline_funnel | Pipeline Funnel | chart | owner, admin, manager, sales |
| sales_quotation_list | Active Quotations | list | owner, admin, manager, sales |
| sales_win_rate | Win Rate | stat_card | owner, admin, manager, sales |
| eng_workload | Engineering Workload | stat_card | owner, admin, manager, sales |
| eng_assessments_list | Pending Assessments | list | owner, admin, manager, sales |
| ops_active_jobs | Active Jobs | stat_card | owner, admin, manager, ops |
| ops_jobs_list | Jobs List | table | owner, admin, manager, ops |
| ops_delivery_schedule | Delivery Schedule | list | owner, admin, manager, ops |
| ops_cost_tracker | Cost Tracker | progress | owner, admin, manager, ops |
| ops_pending_actions | Pending Actions | list | owner, admin, manager, ops |
| hr_attendance_today | Attendance Today | stat_card | owner, admin, manager |
| hr_leave_requests | Leave Requests | list | owner, admin, manager |
| hr_skills_gap | Skills Gap | chart | owner, admin, manager |
| exec_company_health | Company Health | stat_card | owner, admin |
| exec_department_scores | Department Scores | chart | owner, admin |
| exec_kpi_summary | KPI Summary | table | owner, admin |



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Widget Definition Validity

*For any* widget definition stored in the database, the widget_code SHALL be unique, widget_type SHALL be one of the valid types (stat_card, chart, list, table, calendar, progress), default_width SHALL be between 1-4, and default_height SHALL be between 1-3.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Role-Based Widget Filtering

*For any* user with a given role and any widget with an allowed_roles array, the widget SHALL be included in the user's available widgets if and only if the user's role is contained in the widget's allowed_roles array. Widgets with empty allowed_roles SHALL never be included.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Default Layout Fallback

*For any* user without custom widget configurations, the system SHALL return the default layout for their role with all position and dimension fields populated. The returned widgets SHALL be ordered by position_y ascending, then position_x ascending.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: User Configuration Precedence

*For any* user with custom widget configurations, the user's position, size, and visibility settings SHALL override the default layout values. Widgets with is_visible set to false SHALL be excluded from the rendered dashboard.

**Validates: Requirements 4.1, 4.2, 4.4**

### Property 5: Configuration Persistence Round-Trip

*For any* valid widget configuration saved by a user, retrieving the user's widgets SHALL return configurations equivalent to what was saved, preserving all position, size, and settings values.

**Validates: Requirements 4.3**

### Property 6: Layout Reset Restores Defaults

*For any* user who resets their layout, the system SHALL delete all user configurations and subsequent widget retrieval SHALL return the default layout for their role.

**Validates: Requirements 4.5**

### Property 7: Widget Type Renderer Selection

*For any* widget configuration, the WidgetRenderer SHALL select the correct renderer component based on widget_type: stat_card → StatCardWidget, chart → ChartWidget, list → ListWidget, table → TableWidget, progress → ProgressWidget, calendar → CalendarWidget.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 8: Data Source Invocation

*For any* widget with a data_source, fetching widget data SHALL invoke the function corresponding to that data_source. When widget settings change, the data SHALL be re-fetched with the new settings.

**Validates: Requirements 6.1, 6.5**

### Property 9: Grid Dimension Constraints

*For any* widget configuration, the width SHALL be between 1-4 grid units and height SHALL be between 1-3 grid units. Configurations outside these bounds SHALL be rejected or clamped to valid values.

**Validates: Requirements 7.4**

## Error Handling

### Database Errors
- Widget definition insert with duplicate widget_code: Return constraint violation error
- User config save failure: Rollback transaction, return error to client
- Invalid widget_type: Reject with validation error

### Data Fetching Errors
- Data source function not found: Display "Widget unavailable" message
- Data source returns error: Display error state with retry button
- Network timeout: Display timeout message with retry option

### Configuration Errors
- Invalid position values: Clamp to valid grid bounds
- Invalid dimension values: Use widget defaults
- Missing widget reference: Skip widget, log warning

### Authorization Errors
- User attempts to access unauthorized widget: Filter out from results
- Role not found: Return empty widget list

## Testing Strategy

### Unit Tests
- Widget utility functions (filterWidgetsByRole, calculateGridPositions, validateWidgetConfig)
- Data transformation functions for each widget type
- Configuration validation logic

### Property-Based Tests
Using `fast-check` library with minimum 100 iterations per property:

1. **Widget Definition Validity**: Generate random widget definitions and verify constraints
2. **Role-Based Filtering**: Generate random widgets and roles, verify correct filtering
3. **Default Layout Fallback**: Generate users without configs, verify default loading
4. **User Configuration Precedence**: Generate user configs and defaults, verify override behavior
5. **Configuration Round-Trip**: Save and retrieve configs, verify equivalence
6. **Layout Reset**: Save configs, reset, verify defaults restored
7. **Widget Type Renderer**: Generate widget types, verify correct renderer selection
8. **Data Source Invocation**: Generate widgets with data sources, verify correct function calls
9. **Grid Dimension Constraints**: Generate dimension values, verify bounds enforcement

### Integration Tests
- Full dashboard loading flow with Supabase
- Widget data fetching with real data sources
- User configuration persistence across sessions

### Component Tests
- Each widget type renderer with mock data
- WidgetGrid responsive behavior
- Loading and error states
