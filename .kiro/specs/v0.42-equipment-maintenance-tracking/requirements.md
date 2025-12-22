# Requirements Document

## Introduction

This feature implements maintenance tracking for the Equipment/Asset Registry module. It enables tracking of scheduled and unscheduled maintenance activities for all assets including service records, parts replacement, and maintenance costs. The system supports both time-based and kilometer-based maintenance scheduling with automatic due date calculations.

## Glossary

- **Maintenance_System**: The module responsible for tracking, scheduling, and recording maintenance activities for assets
- **Maintenance_Type**: A category of maintenance work (e.g., Oil Change, KIR Inspection, Brake Service)
- **Maintenance_Schedule**: A planned maintenance interval for an asset based on kilometers, hours, or time
- **Maintenance_Record**: A completed maintenance activity with costs, parts, and work details
- **Maintenance_Part**: A replacement part used during a maintenance activity
- **Asset**: A piece of equipment (truck, crane, trailer) registered in the asset registry
- **BKK**: Bukti Kas Keluar (Cash Disbursement Voucher) for payment tracking
- **KIR**: Indonesian vehicle roadworthiness inspection certificate

## Requirements

### Requirement 1: Maintenance Type Management

**User Story:** As an operations manager, I want to have predefined maintenance types, so that maintenance activities are categorized consistently.

#### Acceptance Criteria

1. THE Maintenance_System SHALL provide default maintenance types including: Oil Change, Tire Rotation/Replacement, Brake Service, Filter Replacement, Transmission Service, Coolant Flush, Battery Check/Replace, KIR Inspection, General Service, Repair, Accident Repair, and Breakdown Repair
2. WHEN a maintenance type is scheduled THEN THE Maintenance_System SHALL store default intervals (km, hours, or days) for that type
3. THE Maintenance_System SHALL distinguish between scheduled maintenance (preventive) and unscheduled maintenance (reactive/repairs)
4. WHEN displaying maintenance types THEN THE Maintenance_System SHALL show them in a configurable display order

### Requirement 2: Maintenance Schedule Creation

**User Story:** As an operations manager, I want to create maintenance schedules for assets, so that preventive maintenance is tracked automatically.

#### Acceptance Criteria

1. WHEN creating a maintenance schedule THEN THE Maintenance_System SHALL require an asset, maintenance type, and trigger type (km, hours, days, or specific date)
2. WHEN a km-based schedule is created THEN THE Maintenance_System SHALL track the next due kilometer reading
3. WHEN a time-based schedule is created THEN THE Maintenance_System SHALL track the next due date
4. THE Maintenance_System SHALL allow configurable warning thresholds (default: 1000 km or 14 days before due)
5. WHEN a schedule is created THEN THE Maintenance_System SHALL calculate and store the initial next due value

### Requirement 3: Upcoming Maintenance Display

**User Story:** As an operations manager, I want to see upcoming and overdue maintenance, so that I can plan maintenance activities proactively.

#### Acceptance Criteria

1. THE Maintenance_System SHALL display a count of overdue maintenance items
2. THE Maintenance_System SHALL display a count of due-soon maintenance items
3. WHEN maintenance is past its due date or km THEN THE Maintenance_System SHALL mark it as "overdue" with red highlighting
4. WHEN maintenance is within the warning threshold THEN THE Maintenance_System SHALL mark it as "due_soon" with yellow highlighting
5. WHEN displaying upcoming maintenance THEN THE Maintenance_System SHALL show asset code, asset name, registration number, maintenance type, and remaining days/km
6. THE Maintenance_System SHALL provide quick actions to log completion or schedule service from the upcoming list

### Requirement 4: Maintenance Record Logging

**User Story:** As an operations staff member, I want to log completed maintenance activities, so that maintenance history is tracked accurately.

#### Acceptance Criteria

1. WHEN logging maintenance THEN THE Maintenance_System SHALL require asset selection, maintenance type, date, and description
2. WHEN logging maintenance THEN THE Maintenance_System SHALL auto-generate a unique record number in format MNT-YYYY-NNNNN
3. WHEN an odometer reading is provided THEN THE Maintenance_System SHALL update the asset's current_units field
4. THE Maintenance_System SHALL allow specifying where maintenance was performed: internal, external workshop, or field
5. WHEN external workshop is selected THEN THE Maintenance_System SHALL allow entering workshop name and address
6. THE Maintenance_System SHALL allow recording findings and recommendations from the maintenance work
7. THE Maintenance_System SHALL allow selecting a technician (internal employee or external name)

### Requirement 5: Parts Tracking

**User Story:** As an operations staff member, I want to record parts used during maintenance, so that parts costs and usage are tracked.

#### Acceptance Criteria

1. WHEN logging maintenance THEN THE Maintenance_System SHALL allow adding multiple parts with part name, quantity, unit, and unit price
2. THE Maintenance_System SHALL automatically calculate total price for each part (quantity × unit price)
3. THE Maintenance_System SHALL automatically sum all parts to calculate total parts cost
4. THE Maintenance_System SHALL allow recording part number, supplier, and warranty information for each part

### Requirement 6: Maintenance Cost Tracking

**User Story:** As a finance manager, I want to track maintenance costs, so that I can monitor equipment operating expenses.

#### Acceptance Criteria

1. WHEN logging maintenance THEN THE Maintenance_System SHALL allow entering labor cost, parts cost, and external cost separately
2. THE Maintenance_System SHALL automatically calculate total cost as sum of labor, parts, and external costs
3. THE Maintenance_System SHALL display month-to-date (MTD) maintenance cost on the dashboard
4. THE Maintenance_System SHALL allow linking a maintenance record to a BKK for payment tracking
5. WHEN viewing cost summary THEN THE Maintenance_System SHALL show costs grouped by asset and by month

### Requirement 7: Schedule Auto-Update After Completion

**User Story:** As an operations manager, I want maintenance schedules to automatically update after completion, so that the next due date/km is calculated correctly.

#### Acceptance Criteria

1. WHEN a scheduled maintenance is completed THEN THE Maintenance_System SHALL automatically calculate the next due value based on the schedule's trigger type and interval
2. WHEN a km-based maintenance is completed THEN THE Maintenance_System SHALL set next_due_km to current_km plus the interval
3. WHEN a days-based maintenance is completed THEN THE Maintenance_System SHALL set next_due_date to completion_date plus the interval days
4. WHEN a KIR inspection is completed THEN THE Maintenance_System SHALL set next_due_date to 6 months from completion

### Requirement 8: Maintenance History

**User Story:** As an operations manager, I want to view maintenance history for assets, so that I can review past maintenance activities.

#### Acceptance Criteria

1. THE Maintenance_System SHALL display maintenance history with filters for asset, maintenance type, and date range
2. WHEN viewing history THEN THE Maintenance_System SHALL show record number, date, type, description, and total cost
3. THE Maintenance_System SHALL allow viewing full details of any maintenance record including parts used
4. THE Maintenance_System SHALL support exporting maintenance history to Excel format

### Requirement 9: Maintenance Dashboard

**User Story:** As an operations manager, I want a maintenance dashboard, so that I can monitor overall maintenance status at a glance.

#### Acceptance Criteria

1. THE Maintenance_System SHALL display summary cards showing: overdue count, due soon count, in-progress count, and cost MTD
2. THE Maintenance_System SHALL provide tabs for: Upcoming, History, Costs, and Schedules views
3. WHEN viewing the Costs tab THEN THE Maintenance_System SHALL show maintenance costs by asset with totals
4. WHEN viewing the Schedules tab THEN THE Maintenance_System SHALL show all active maintenance schedules

### Requirement 10: Photo and Document Attachments

**User Story:** As an operations staff member, I want to attach photos and documents to maintenance records, so that visual evidence is preserved.

#### Acceptance Criteria

1. WHEN logging maintenance THEN THE Maintenance_System SHALL allow uploading multiple photos
2. THE Maintenance_System SHALL store photo references in a JSONB array field
3. THE Maintenance_System SHALL allow uploading supporting documents (invoices, receipts)
4. THE Maintenance_System SHALL store document references in a JSONB array field
