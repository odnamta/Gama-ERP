# Requirements Document

## Introduction

This document defines the requirements for the Journey Management Plan (JMP) module in Gama ERP. JMPs are detailed operational plans for heavy-haul movements that include schedules, convoy configurations, communication plans, checkpoints, risk assessments, and emergency procedures. This module enables engineering teams to create comprehensive journey plans that ensure safe and coordinated execution of complex cargo transport operations.

## Glossary

- **JMP**: Journey Management Plan - A comprehensive document detailing all aspects of a heavy-haul journey
- **Convoy**: A group of vehicles traveling together including cargo transport, escort vehicles, and support vehicles
- **Convoy_Commander**: The person responsible for overall journey coordination and decision-making
- **Checkpoint**: A designated location along the route where the convoy stops for specific activities
- **Movement_Window**: The permitted time period during which the convoy can travel (often night-only for heavy loads)
- **Risk_Assessment**: Evaluation of potential hazards with likelihood, consequence, and control measures
- **Route_Survey**: A prior assessment of the route (from v0.56) that may be linked to a JMP
- **Go_No_Go_Criteria**: Conditions that must be met before a journey can proceed

## Requirements

### Requirement 1: JMP Database Schema

**User Story:** As a system administrator, I want the database to store journey management plans with all related data, so that journey information is persisted and queryable.

#### Acceptance Criteria

1. THE Database SHALL store journey_management_plans with unique auto-generated JMP numbers in format JMP-YYYY-NNNN
2. THE Database SHALL support relationships to route_surveys, job_orders, projects, and customers
3. THE Database SHALL store cargo details including dimensions (length, width, height in meters) and weight in tons
4. THE Database SHALL store route information including origin, destination, and distance
5. THE Database SHALL store schedule information including planned departure, arrival, and duration
6. THE Database SHALL store convoy configuration as JSONB including lead vehicle, cargo transport, escort vehicles, chase vehicle, and support vehicles
7. THE Database SHALL store team information including convoy commander reference and drivers array
8. THE Database SHALL store communication details including radio frequencies and emergency contacts
9. THE Database SHALL store checkpoint reporting schedule as JSONB array
10. THE Database SHALL store contingency plans, emergency procedures, nearest hospitals, and nearest workshops
11. THE Database SHALL store permit information as JSONB array with permit type, number, authority, and validity dates
12. THE Database SHALL track approval workflow with prepared_by, reviewed_by, approved_by references and timestamps
13. THE Database SHALL track status with values: draft, pending_review, approved, active, completed, cancelled
14. THE Database SHALL store actual departure and arrival times for execution tracking
15. THE Database SHALL store post-journey information including journey log, incidents occurred flag, incident summary, and lessons learned

### Requirement 2: JMP Checkpoints Schema

**User Story:** As a system administrator, I want checkpoint data stored separately with detailed scheduling, so that journey progress can be tracked at each stop.

#### Acceptance Criteria

1. THE Database SHALL store jmp_checkpoints linked to journey_management_plans with cascade delete
2. THE Database SHALL store checkpoint order as integer for sequencing
3. THE Database SHALL store location details including name, type, km from start, and coordinates
4. THE Database SHALL support location types: departure, waypoint, rest_stop, checkpoint, fuel_stop, arrival
5. THE Database SHALL store planned arrival and departure times per checkpoint
6. THE Database SHALL store stop duration in minutes
7. THE Database SHALL store actual arrival and departure times for tracking
8. THE Database SHALL store activities description for each checkpoint
9. THE Database SHALL store reporting requirements including report_required flag and report_to contact
10. THE Database SHALL track checkpoint status: pending, arrived, departed, skipped

### Requirement 3: JMP Risk Assessment Schema

**User Story:** As a system administrator, I want risk assessment data stored with likelihood and consequence ratings, so that journey risks are formally documented.

#### Acceptance Criteria

1. THE Database SHALL store jmp_risk_assessment linked to journey_management_plans with cascade delete
2. THE Database SHALL store risk category from: road_condition, weather, traffic, mechanical, security, health, environmental, schedule, permit
3. THE Database SHALL store risk description as text
4. THE Database SHALL store likelihood rating: rare, unlikely, possible, likely, almost_certain
5. THE Database SHALL store consequence rating: insignificant, minor, moderate, major, catastrophic
6. THE Database SHALL store calculated risk level: low, medium, high, extreme
7. THE Database SHALL store control measures as text
8. THE Database SHALL store residual risk level after controls applied
9. THE Database SHALL store responsible person for each risk

### Requirement 4: JMP Creation

**User Story:** As an engineer, I want to create journey management plans with all necessary details, so that heavy-haul movements are properly planned.

#### Acceptance Criteria

1. WHEN an engineer creates a new JMP, THE System SHALL auto-generate a unique JMP number
2. WHEN creating a JMP, THE System SHALL allow linking to an existing route survey to pre-populate route data
3. WHEN creating a JMP, THE System SHALL allow linking to a job order and project
4. WHEN creating a JMP, THE System SHALL require journey title, cargo description, origin, and destination
5. WHEN creating a JMP, THE System SHALL allow entry of cargo dimensions and weight
6. WHEN creating a JMP, THE System SHALL allow configuration of convoy composition
7. WHEN creating a JMP, THE System SHALL allow assignment of convoy commander from employees
8. WHEN creating a JMP, THE System SHALL allow entry of movement windows with day, start time, end time, and notes
9. WHEN creating a JMP, THE System SHALL set initial status to draft
10. WHEN a JMP is saved, THE System SHALL record created_at timestamp

### Requirement 5: Convoy Configuration

**User Story:** As an engineer, I want to configure the convoy composition, so that all vehicles and their roles are documented.

#### Acceptance Criteria

1. WHEN configuring convoy, THE System SHALL allow specification of lead/pilot vehicle details
2. WHEN configuring convoy, THE System SHALL allow specification of cargo transport vehicle and trailer details
3. WHEN configuring convoy, THE System SHALL allow specification of escort vehicle count and type
4. WHEN configuring convoy, THE System SHALL allow specification of chase/rear pilot vehicle
5. WHEN configuring convoy, THE System SHALL allow specification of support vehicles (service, fuel, etc.)
6. WHEN configuring convoy, THE System SHALL display a visual representation of convoy order

### Requirement 6: Team Assignment

**User Story:** As an engineer, I want to assign team members to the journey, so that responsibilities are clear.

#### Acceptance Criteria

1. WHEN assigning team, THE System SHALL allow selection of convoy commander from employees list
2. WHEN assigning team, THE System SHALL allow adding multiple drivers with employee reference, vehicle assignment, role, and phone number
3. WHEN assigning team, THE System SHALL allow entry of escort details including type, company, contact, and vehicle count
4. WHEN assigning team, THE System SHALL validate that convoy commander is assigned before approval

### Requirement 7: Checkpoint Management

**User Story:** As an engineer, I want to define checkpoints along the route, so that the journey schedule is detailed and trackable.

#### Acceptance Criteria

1. WHEN managing checkpoints, THE System SHALL allow adding checkpoints with location name, type, and km from start
2. WHEN managing checkpoints, THE System SHALL allow entry of planned arrival and departure times
3. WHEN managing checkpoints, THE System SHALL calculate stop duration from arrival and departure times
4. WHEN managing checkpoints, THE System SHALL allow entry of activities at each checkpoint
5. WHEN managing checkpoints, THE System SHALL allow marking checkpoints as requiring reports
6. WHEN managing checkpoints, THE System SHALL automatically order checkpoints by km from start
7. WHEN managing checkpoints, THE System SHALL validate that departure checkpoint exists at km 0
8. WHEN managing checkpoints, THE System SHALL validate that arrival checkpoint exists at route end

### Requirement 8: Risk Assessment

**User Story:** As an engineer, I want to document and assess journey risks, so that hazards are identified and controlled.

#### Acceptance Criteria

1. WHEN assessing risks, THE System SHALL allow adding risk items with category and description
2. WHEN assessing risks, THE System SHALL require selection of likelihood rating
3. WHEN assessing risks, THE System SHALL require selection of consequence rating
4. WHEN assessing risks, THE System SHALL calculate risk level from likelihood and consequence matrix
5. WHEN assessing risks, THE System SHALL require entry of control measures for each risk
6. WHEN assessing risks, THE System SHALL allow entry of residual risk level after controls
7. WHEN assessing risks, THE System SHALL allow assignment of responsible person per risk
8. WHEN a risk is rated as high or extreme, THE System SHALL highlight it visually

### Requirement 9: Emergency Information

**User Story:** As an engineer, I want to document emergency contacts and procedures, so that the team can respond to incidents.

#### Acceptance Criteria

1. WHEN documenting emergency info, THE System SHALL allow adding emergency contacts with name, role, phone, and available hours
2. WHEN documenting emergency info, THE System SHALL allow entry of radio frequencies with channel, frequency, and usage
3. WHEN documenting emergency info, THE System SHALL allow entry of nearest hospitals with name, address, and phone
4. WHEN documenting emergency info, THE System SHALL allow entry of nearest workshops with name, address, and phone
5. WHEN documenting emergency info, THE System SHALL allow entry of contingency plans with scenario, response, and contacts
6. WHEN documenting emergency info, THE System SHALL allow entry of general emergency procedures text
7. WHEN documenting emergency info, THE System SHALL allow entry of go/no-go criteria

### Requirement 10: Permit Tracking

**User Story:** As an engineer, I want to track permits required for the journey, so that compliance is ensured.

#### Acceptance Criteria

1. WHEN tracking permits, THE System SHALL allow adding permits with type, number, issuing authority, and validity dates
2. WHEN tracking permits, THE System SHALL display permit validity status (valid, expiring soon, expired)
3. IF a permit expires before planned journey date, THEN THE System SHALL display a warning

### Requirement 11: JMP Approval Workflow

**User Story:** As a manager, I want to review and approve journey management plans, so that only properly planned journeys proceed.

#### Acceptance Criteria

1. WHEN a JMP is submitted for review, THE System SHALL change status to pending_review
2. WHEN a JMP is submitted, THE System SHALL record prepared_by and prepared_at
3. WHEN a reviewer reviews a JMP, THE System SHALL record reviewed_by and reviewed_at
4. WHEN an approver approves a JMP, THE System SHALL change status to approved and record approved_by and approved_at
5. IF a JMP is rejected, THEN THE System SHALL return status to draft with rejection notes
6. WHEN a JMP is approved, THE System SHALL enable the Start Journey action

### Requirement 12: Journey Execution

**User Story:** As an operations user, I want to track journey progress in real-time, so that actual times and status are recorded.

#### Acceptance Criteria

1. WHEN a journey is started, THE System SHALL change JMP status to active and record actual_departure
2. WHEN a checkpoint is reached, THE System SHALL allow marking arrival with actual time
3. WHEN departing a checkpoint, THE System SHALL allow marking departure with actual time
4. WHEN the final checkpoint is reached, THE System SHALL record actual_arrival
5. WHEN a journey is completed, THE System SHALL change status to completed
6. WHEN a journey is cancelled, THE System SHALL change status to cancelled with reason

### Requirement 13: Post-Journey Documentation

**User Story:** As an engineer, I want to document journey outcomes, so that lessons are captured for future planning.

#### Acceptance Criteria

1. WHEN completing a journey, THE System SHALL allow entry of journey log notes
2. WHEN completing a journey, THE System SHALL allow marking if incidents occurred
3. IF incidents occurred, THEN THE System SHALL require incident summary entry
4. WHEN completing a journey, THE System SHALL allow entry of lessons learned
5. WHEN completing a journey, THE System SHALL calculate and display variance between planned and actual times

### Requirement 14: JMP List and Search

**User Story:** As a user, I want to view and search journey management plans, so that I can find specific JMPs quickly.

#### Acceptance Criteria

1. WHEN viewing JMP list, THE System SHALL display JMP number, title, customer, status, and planned dates
2. WHEN viewing JMP list, THE System SHALL allow filtering by status
3. WHEN viewing JMP list, THE System SHALL allow filtering by date range
4. WHEN viewing JMP list, THE System SHALL allow filtering by customer
5. WHEN viewing JMP list, THE System SHALL allow searching by JMP number or title
6. WHEN viewing JMP list, THE System SHALL show status with color-coded badges

### Requirement 15: Active Journeys View

**User Story:** As an operations manager, I want to see all active journeys at a glance, so that I can monitor ongoing operations.

#### Acceptance Criteria

1. THE System SHALL provide an active journeys view showing only JMPs with status active
2. WHEN viewing active journeys, THE System SHALL display progress as checkpoints completed vs total
3. WHEN viewing active journeys, THE System SHALL display convoy commander name and contact
4. WHEN viewing active journeys, THE System SHALL highlight journeys that are behind schedule
5. WHEN viewing active journeys, THE System SHALL auto-refresh data periodically

### Requirement 16: JMP Print/Export

**User Story:** As an engineer, I want to print or export the JMP, so that physical copies can be distributed to the team.

#### Acceptance Criteria

1. WHEN printing a JMP, THE System SHALL generate a formatted document with all journey details
2. WHEN printing a JMP, THE System SHALL include convoy configuration diagram
3. WHEN printing a JMP, THE System SHALL include checkpoint schedule table
4. WHEN printing a JMP, THE System SHALL include emergency contacts section
5. WHEN printing a JMP, THE System SHALL include risk assessment summary
6. WHEN printing a JMP, THE System SHALL include space for signatures
