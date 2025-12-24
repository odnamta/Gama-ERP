# Design Document: Agency Vessel Tracking & Schedules

## Overview

The Vessel Tracking & Schedules module provides comprehensive visibility into vessel movements, schedules, and shipment milestones. It enables agency operators to track vessels, monitor port calls, and provide customers with real-time shipment status updates.

This module integrates with existing Agency modules:
- **v0.71**: Shipping Line & Agent Management (shipping_lines, ports)
- **v0.72**: Booking Management (freight_bookings, booking_containers)
- **v0.73**: B/L Documentation (bills_of_lading)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                           │
├─────────────────────────────────────────────────────────────────────┤
│  Tracking Page    │  Vessel List    │  Schedule View  │  Map View   │
│  /agency/tracking │  /agency/vessels│  /agency/schedules           │
└─────────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                        Business Logic Layer                         │
├─────────────────────────────────────────────────────────────────────┤
│  vessel-tracking-utils.ts                                           │
│  - Vessel validation (IMO, MMSI)                                    │
│  - Position validation (coordinates, navigation)                    │
│  - Delay calculation                                                │
│  - Milestone progress calculation                                   │
│  - Search and filtering                                             │
├─────────────────────────────────────────────────────────────────────┤
│  vessel-tracking-actions.ts (Server Actions)                        │
│  - CRUD operations for vessels, schedules, positions                │
│  - Tracking event management                                        │
│  - Subscription management                                          │
└─────────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Layer (Supabase)                        │
├─────────────────────────────────────────────────────────────────────┤
│  vessels              │  vessel_schedules    │  vessel_positions    │
│  shipment_tracking    │  tracking_subscriptions                     │
│  upcoming_vessel_arrivals (view)                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### UI Components

```
components/
└── vessel-tracking/
    ├── vessel-card.tsx           # Vessel summary card
    ├── vessel-form.tsx           # Vessel create/edit form
    ├── vessel-list.tsx           # Vessel list with filters
    ├── schedule-card.tsx         # Schedule/port call card
    ├── schedule-form.tsx         # Schedule create/edit form
    ├── schedule-timeline.tsx     # Voyage timeline view
    ├── position-map.tsx          # Vessel position map display
    ├── tracking-search.tsx       # Search by B/L, booking, container
    ├── tracking-timeline.tsx     # Shipment milestone timeline
    ├── tracking-progress.tsx     # Visual progress indicator
    ├── tracking-event-card.tsx   # Individual tracking event
    ├── subscription-form.tsx     # Tracking subscription form
    ├── subscription-list.tsx     # User's active subscriptions
    ├── upcoming-arrivals.tsx     # Upcoming arrivals list
    └── delay-indicator.tsx       # Delay status badge
```

### Server Actions

```typescript
// app/actions/vessel-tracking-actions.ts

// Vessel CRUD
createVessel(data: VesselFormData): Promise<ActionResult<Vessel>>
updateVessel(id: string, data: VesselFormData): Promise<ActionResult<Vessel>>
deleteVessel(id: string): Promise<ActionResult<void>>
getVessel(id: string): Promise<Vessel | null>
getVessels(filters?: VesselFilters): Promise<Vessel[]>

// Schedule CRUD
createSchedule(data: ScheduleFormData): Promise<ActionResult<VesselSchedule>>
updateSchedule(id: string, data: ScheduleFormData): Promise<ActionResult<VesselSchedule>>
deleteSchedule(id: string): Promise<ActionResult<void>>
getSchedule(id: string): Promise<VesselSchedule | null>
getSchedules(filters?: ScheduleFilters): Promise<VesselSchedule[]>
getUpcomingArrivals(filters?: ArrivalFilters): Promise<UpcomingArrival[]>

// Position tracking
recordPosition(data: PositionFormData): Promise<ActionResult<VesselPosition>>
getPositionHistory(vesselId: string, limit?: number): Promise<VesselPosition[]>

// Shipment tracking
recordTrackingEvent(data: TrackingEventFormData): Promise<ActionResult<ShipmentTracking>>
getTrackingEvents(params: TrackingSearchParams): Promise<ShipmentTracking[]>
searchTracking(query: string): Promise<TrackingSearchResult>

// Subscriptions
createSubscription(data: SubscriptionFormData): Promise<ActionResult<TrackingSubscription>>
updateSubscription(id: string, data: Partial<SubscriptionFormData>): Promise<ActionResult<TrackingSubscription>>
deleteSubscription(id: string): Promise<ActionResult<void>>
getUserSubscriptions(userId: string): Promise<TrackingSubscription[]>
```

### Utility Functions

```typescript
// lib/vessel-tracking-utils.ts

// Validation
validateIMO(imo: string): ValidationResult
validateMMSI(mmsi: string): ValidationResult
validateCoordinates(lat: number, lng: number): ValidationResult
validateNavigationData(course: number, speed: number): ValidationResult
validateContainerNumber(containerNo: string): ValidationResult  // Reuse from v0.73

// Calculations
calculateDelayHours(scheduled: Date, actual: Date): number
calculateTimeSinceUpdate(lastUpdate: Date): string
calculateMilestoneProgress(events: ShipmentTracking[]): MilestoneProgress

// Transformations
vesselToRow(vessel: Vessel): VesselRow
rowToVessel(row: VesselRow): Vessel
scheduleToRow(schedule: VesselSchedule): VesselScheduleRow
rowToSchedule(row: VesselScheduleRow): VesselSchedule

// Filtering
filterSchedulesByDelay(schedules: VesselSchedule[], hasDelay: boolean): VesselSchedule[]
filterArrivalsByDateRange(arrivals: UpcomingArrival[], from: Date, to: Date): UpcomingArrival[]
sortArrivalsByTime(arrivals: UpcomingArrival[]): UpcomingArrival[]

// Search
searchTrackingByReference(reference: string, type: 'bl' | 'booking' | 'container'): Promise<ShipmentTracking[]>
```

## Data Models

### TypeScript Types

```typescript
// types/vessel-tracking.ts

// Vessel types
export type VesselType = 'container' | 'bulk_carrier' | 'tanker' | 'general_cargo' | 
                         'ro_ro' | 'heavy_lift' | 'multipurpose';

export type VesselStatus = 'underway' | 'at_anchor' | 'moored' | 'not_under_command';

export type ScheduleType = 'scheduled' | 'omitted' | 'extra_call';

export type ScheduleStatus = 'scheduled' | 'arrived' | 'berthed' | 'working' | 
                             'departed' | 'cancelled';

export type TrackingEventType = 'booked' | 'gate_in' | 'loaded' | 'departed' | 
                                'transshipment' | 'arrived' | 'discharged' | 
                                'gate_out' | 'delivered';

export type TrackingType = 'vessel' | 'container' | 'booking';

export type PositionSource = 'ais' | 'manual' | 'api';

// Position data
export interface VesselPosition {
  lat: number;
  lng: number;
  course?: number;
  speed?: number;
  updatedAt: string;
}

// Vessel
export interface Vessel {
  id: string;
  imoNumber?: string;
  mmsi?: string;
  vesselName: string;
  vesselType?: VesselType;
  flag?: string;
  callSign?: string;
  lengthM?: number;
  beamM?: number;
  draftM?: number;
  grossTonnage?: number;
  deadweightTons?: number;
  teuCapacity?: number;
  owner?: string;
  operator?: string;
  shippingLineId?: string;
  currentStatus?: VesselStatus;
  currentPosition?: VesselPosition;
  lastPort?: string;
  nextPort?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined
  shippingLine?: ShippingLine;
}

// Vessel Schedule
export interface VesselSchedule {
  id: string;
  vesselId: string;
  voyageNumber: string;
  serviceName?: string;
  serviceCode?: string;
  scheduleType: ScheduleType;
  portId?: string;
  portName: string;
  terminal?: string;
  berth?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  cargoCutoff?: string;
  docCutoff?: string;
  vgmCutoff?: string;
  status: ScheduleStatus;
  delayHours: number;
  delayReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  vessel?: Vessel;
  port?: Port;
}

// Vessel Position History
export interface VesselPositionRecord {
  id: string;
  vesselId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  course?: number;
  speedKnots?: number;
  status?: VesselStatus;
  destination?: string;
  source: PositionSource;
  createdAt: string;
}

// Shipment Tracking
export interface ShipmentTracking {
  id: string;
  bookingId?: string;
  blId?: string;
  containerId?: string;
  trackingNumber?: string;
  containerNumber?: string;
  eventType: TrackingEventType;
  eventTimestamp: string;
  locationName?: string;
  locationCode?: string;
  terminal?: string;
  vesselName?: string;
  voyageNumber?: string;
  description?: string;
  isActual: boolean;
  source?: string;
  createdAt: string;
  // Joined
  booking?: FreightBooking;
  bl?: BillOfLading;
}

// Tracking Subscription
export interface TrackingSubscription {
  id: string;
  trackingType: TrackingType;
  referenceId: string;
  referenceNumber?: string;
  userId?: string;
  email?: string;
  notifyDeparture: boolean;
  notifyArrival: boolean;
  notifyDelay: boolean;
  notifyMilestone: boolean;
  isActive: boolean;
  createdAt: string;
}

// Upcoming Arrival (from view)
export interface UpcomingArrival {
  id: string;
  vesselId: string;
  vesselName: string;
  imoNumber?: string;
  vesselType?: VesselType;
  voyageNumber: string;
  portName: string;
  portCode?: string;
  terminal?: string;
  scheduledArrival: string;
  status: ScheduleStatus;
  delayHours: number;
  ourBookingsCount: number;
}

// Milestone Progress
export interface MilestoneProgress {
  currentMilestone: TrackingEventType;
  completedMilestones: TrackingEventType[];
  pendingMilestones: TrackingEventType[];
  progressPercent: number;
}

// Search Result
export interface TrackingSearchResult {
  type: 'bl' | 'booking' | 'container';
  reference: string;
  booking?: FreightBooking;
  bl?: BillOfLading;
  events: ShipmentTracking[];
  vessel?: {
    name: string;
    voyage: string;
    position?: VesselPosition;
  };
}
```

### Database Schema

```sql
-- Vessels
CREATE TABLE vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imo_number VARCHAR(20) UNIQUE,
  mmsi VARCHAR(20) UNIQUE,
  vessel_name VARCHAR(200) NOT NULL,
  vessel_type VARCHAR(50),
  flag VARCHAR(100),
  call_sign VARCHAR(20),
  length_m DECIMAL(8,2),
  beam_m DECIMAL(8,2),
  draft_m DECIMAL(6,2),
  gross_tonnage INTEGER,
  deadweight_tons INTEGER,
  teu_capacity INTEGER,
  owner VARCHAR(200),
  operator VARCHAR(200),
  shipping_line_id UUID REFERENCES shipping_lines(id),
  current_status VARCHAR(30),
  current_position JSONB,
  last_port VARCHAR(200),
  next_port VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vessel Schedules
CREATE TABLE vessel_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID NOT NULL REFERENCES vessels(id),
  voyage_number VARCHAR(50) NOT NULL,
  service_name VARCHAR(200),
  service_code VARCHAR(50),
  schedule_type VARCHAR(20) DEFAULT 'scheduled',
  port_id UUID REFERENCES ports(id),
  port_name VARCHAR(200) NOT NULL,
  terminal VARCHAR(200),
  berth VARCHAR(100),
  scheduled_arrival TIMESTAMPTZ,
  scheduled_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  cargo_cutoff TIMESTAMPTZ,
  doc_cutoff TIMESTAMPTZ,
  vgm_cutoff TIMESTAMPTZ,
  status VARCHAR(30) DEFAULT 'scheduled',
  delay_hours INTEGER DEFAULT 0,
  delay_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vessel_id, voyage_number, port_id)
);

-- Vessel Positions
CREATE TABLE vessel_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID NOT NULL REFERENCES vessels(id),
  timestamp TIMESTAMPTZ NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  course DECIMAL(5,2),
  speed_knots DECIMAL(5,2),
  status VARCHAR(30),
  destination VARCHAR(200),
  source VARCHAR(30) DEFAULT 'ais',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment Tracking
CREATE TABLE shipment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES freight_bookings(id),
  bl_id UUID REFERENCES bills_of_lading(id),
  container_id UUID REFERENCES booking_containers(id),
  tracking_number VARCHAR(100),
  container_number VARCHAR(20),
  event_type VARCHAR(50) NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  location_name VARCHAR(200),
  location_code VARCHAR(20),
  terminal VARCHAR(200),
  vessel_name VARCHAR(200),
  voyage_number VARCHAR(50),
  description TEXT,
  is_actual BOOLEAN DEFAULT TRUE,
  source VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking Subscriptions
CREATE TABLE tracking_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_type VARCHAR(30) NOT NULL,
  reference_id UUID NOT NULL,
  reference_number VARCHAR(100),
  user_id UUID REFERENCES user_profiles(id),
  email VARCHAR(200),
  notify_departure BOOLEAN DEFAULT TRUE,
  notify_arrival BOOLEAN DEFAULT TRUE,
  notify_delay BOOLEAN DEFAULT TRUE,
  notify_milestone BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tracking_type, reference_id, user_id)
);

-- Indexes
CREATE INDEX idx_vessels_imo ON vessels(imo_number);
CREATE INDEX idx_vessels_shipping_line ON vessels(shipping_line_id);
CREATE INDEX idx_vessel_schedules_vessel ON vessel_schedules(vessel_id);
CREATE INDEX idx_vessel_schedules_port ON vessel_schedules(port_id);
CREATE INDEX idx_vessel_schedules_dates ON vessel_schedules(scheduled_arrival);
CREATE INDEX idx_vessel_positions_vessel ON vessel_positions(vessel_id);
CREATE INDEX idx_vessel_positions_time ON vessel_positions(timestamp);
CREATE INDEX idx_shipment_tracking_booking ON shipment_tracking(booking_id);
CREATE INDEX idx_shipment_tracking_bl ON shipment_tracking(bl_id);
CREATE INDEX idx_shipment_tracking_container ON shipment_tracking(container_number);
CREATE INDEX idx_tracking_subscriptions_user ON tracking_subscriptions(user_id);

-- View for upcoming arrivals
CREATE OR REPLACE VIEW upcoming_vessel_arrivals AS
SELECT 
  vs.id,
  vs.vessel_id,
  v.vessel_name,
  v.imo_number,
  v.vessel_type,
  vs.voyage_number,
  vs.port_name,
  p.port_code,
  vs.terminal,
  vs.scheduled_arrival,
  vs.status,
  vs.delay_hours,
  (SELECT COUNT(*) FROM freight_bookings fb 
   WHERE fb.vessel_name = v.vessel_name 
   AND fb.voyage_number = vs.voyage_number) as our_bookings_count
FROM vessel_schedules vs
JOIN vessels v ON vs.vessel_id = v.id
LEFT JOIN ports p ON vs.port_id = p.id
WHERE vs.status IN ('scheduled', 'arrived', 'berthed')
AND vs.scheduled_arrival >= NOW()
ORDER BY vs.scheduled_arrival;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vessel Data Round-Trip

*For any* valid vessel data, creating a vessel and then retrieving it should return equivalent data for all fields.

**Validates: Requirements 1.1, 1.2, 1.3, 1.6**

### Property 2: IMO Number Uniqueness

*For any* two vessels with the same non-null IMO number, the system should reject the second creation attempt.

**Validates: Requirements 1.4**

### Property 3: MMSI Uniqueness

*For any* two vessels with the same non-null MMSI, the system should reject the second creation attempt.

**Validates: Requirements 1.5**

### Property 4: Vessel Deactivation Preserves Data

*For any* vessel that is deactivated, the vessel data should remain retrievable by ID but should not appear in active vessel lists.

**Validates: Requirements 1.7**

### Property 5: Schedule Data Round-Trip

*For any* valid schedule data, creating a schedule and then retrieving it should return equivalent data for all fields including times and cutoffs.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 6: Schedule Uniqueness

*For any* two schedules with the same vessel, voyage number, and port combination, the system should reject the second creation attempt.

**Validates: Requirements 2.5**

### Property 7: Delay Calculation

*For any* schedule with both scheduled and actual arrival times, the delay hours should equal the difference in hours between actual and scheduled times (positive for late, negative for early).

**Validates: Requirements 2.6, 8.1**

### Property 8: Position Recording Updates Vessel

*For any* position recorded for a vessel, the vessel's current_position field should be updated to reflect the new position data.

**Validates: Requirements 3.4**

### Property 9: Position History Preservation

*For any* vessel with multiple position records, all position records should be preserved and retrievable in chronological order.

**Validates: Requirements 3.5**

### Property 10: Tracking Event Data Round-Trip

*For any* valid tracking event data, creating an event and then retrieving it should return equivalent data including timestamps and location.

**Validates: Requirements 4.1, 4.3, 4.4, 4.5**

### Property 11: Tracking Event Chronological Ordering

*For any* set of tracking events for a shipment, retrieving events should return them sorted by event timestamp in ascending order.

**Validates: Requirements 4.6**

### Property 12: Search by Reference Returns Linked Events

*For any* tracking event linked to a booking, B/L, or container, searching by that reference should include the event in results.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 13: Subscription Uniqueness Per User

*For any* user attempting to subscribe to the same reference twice, the system should reject the duplicate subscription.

**Validates: Requirements 6.6**

### Property 14: Upcoming Arrivals Date Filtering

*For any* date range filter applied to upcoming arrivals, all returned arrivals should have scheduled arrival times within the specified range.

**Validates: Requirements 7.5**

### Property 15: Upcoming Arrivals Sorting

*For any* list of upcoming arrivals, the results should be sorted by scheduled arrival time in ascending order.

**Validates: Requirements 7.6**

### Property 16: Booking Count Aggregation

*For any* upcoming arrival, the booking count should equal the actual number of bookings linked to that vessel and voyage combination.

**Validates: Requirements 7.4**

### Property 17: IMO Format Validation

*For any* string, IMO validation should return valid only if the string consists of exactly 7 digits.

**Validates: Requirements 9.1**

### Property 18: MMSI Format Validation

*For any* string, MMSI validation should return valid only if the string consists of exactly 9 digits.

**Validates: Requirements 9.2**

### Property 19: Coordinate Validation

*For any* latitude and longitude pair, coordinate validation should return valid only if latitude is between -90 and 90 and longitude is between -180 and 180.

**Validates: Requirements 9.3, 9.4**

### Property 20: Navigation Data Validation

*For any* course and speed values, navigation validation should return valid only if speed is non-negative and course is between 0 and 360.

**Validates: Requirements 9.5, 9.6**

### Property 21: Container Number Validation

*For any* string, container number validation should return valid only if it matches ISO 6346 format (4 letters + 7 digits with valid check digit).

**Validates: Requirements 4.7, 9.7**

## Error Handling

### Validation Errors

| Error Code | Description | User Message |
|------------|-------------|--------------|
| INVALID_IMO | IMO number format invalid | "IMO number must be exactly 7 digits" |
| INVALID_MMSI | MMSI format invalid | "MMSI must be exactly 9 digits" |
| INVALID_COORDINATES | Coordinates out of range | "Invalid coordinates: latitude must be -90 to 90, longitude -180 to 180" |
| INVALID_COURSE | Course out of range | "Course must be between 0 and 360 degrees" |
| INVALID_SPEED | Speed negative | "Speed cannot be negative" |
| INVALID_CONTAINER | Container number format invalid | "Invalid container number format" |
| DUPLICATE_IMO | IMO already exists | "A vessel with this IMO number already exists" |
| DUPLICATE_MMSI | MMSI already exists | "A vessel with this MMSI already exists" |
| DUPLICATE_SCHEDULE | Schedule already exists | "A schedule for this vessel/voyage/port already exists" |
| DUPLICATE_SUBSCRIPTION | Subscription already exists | "You are already subscribed to this shipment" |
| REFERENCE_NOT_FOUND | Tracking reference not found | "The specified reference was not found" |

### Database Errors

| Error Code | Description | Recovery |
|------------|-------------|----------|
| FK_VIOLATION | Foreign key constraint | Verify referenced entity exists |
| UNIQUE_VIOLATION | Unique constraint | Check for duplicates |
| NOT_NULL_VIOLATION | Required field missing | Provide required fields |

## Testing Strategy

### Unit Tests

Unit tests will cover:
- Validation functions (IMO, MMSI, coordinates, navigation, container)
- Delay calculation
- Time since update calculation
- Milestone progress calculation
- Data transformation functions (row to model, model to row)
- Filter and sort functions

### Property-Based Tests

Property-based tests will use **fast-check** library with minimum 100 iterations per property.

Each property test will be tagged with:
- Feature name: vessel-tracking-schedules
- Property number and title
- Requirements reference

Test file: `__tests__/vessel-tracking-utils.property.test.ts`

Properties to implement:
1. Vessel data round-trip
2. IMO uniqueness
3. MMSI uniqueness
4. Vessel deactivation preserves data
5. Schedule data round-trip
6. Schedule uniqueness
7. Delay calculation
8. Position recording updates vessel
9. Position history preservation
10. Tracking event data round-trip
11. Tracking event chronological ordering
12. Search by reference returns linked events
13. Subscription uniqueness per user
14. Upcoming arrivals date filtering
15. Upcoming arrivals sorting
16. Booking count aggregation
17. IMO format validation
18. MMSI format validation
19. Coordinate validation
20. Navigation data validation
21. Container number validation (reuse from v0.73)

### Integration Tests

Integration tests will verify:
- Database operations (CRUD for all entities)
- View queries (upcoming_vessel_arrivals)
- Cross-entity relationships
- RLS policies
