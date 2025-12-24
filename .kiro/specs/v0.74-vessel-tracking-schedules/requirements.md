# Requirements Document

## Introduction

This document specifies the requirements for the Agency Vessel Tracking & Schedules module (v0.74) of the Gama ERP system. This module enables tracking of vessel schedules, positions, and ETAs for shipments under management. It builds upon the existing Agency modules (v0.71 Shipping Line Management, v0.72 Booking Management, v0.73 B/L Documentation) to provide comprehensive shipment visibility.

## Glossary

- **Vessel**: A ship identified by IMO number, MMSI, and vessel name used for cargo transportation
- **Vessel_Schedule**: A planned or actual port call for a vessel on a specific voyage
- **Vessel_Position**: A geographic location record for a vessel at a specific timestamp
- **Shipment_Tracking**: An event milestone in the lifecycle of a shipment (container, booking, or B/L)
- **Tracking_Subscription**: A user's subscription to receive notifications about a tracked entity
- **IMO_Number**: International Maritime Organization unique vessel identifier (7 digits)
- **MMSI**: Maritime Mobile Service Identity (9 digits) for vessel radio identification
- **AIS**: Automatic Identification System for vessel position tracking
- **ETA**: Estimated Time of Arrival
- **ETD**: Estimated Time of Departure
- **Cutoff_Time**: Deadline for cargo, documentation, or VGM submission before vessel departure
- **VGM**: Verified Gross Mass - mandatory container weight declaration
- **Voyage_Number**: Unique identifier for a vessel's journey between ports

## Requirements

### Requirement 1: Vessel Database Management

**User Story:** As an agency operator, I want to maintain a database of vessels, so that I can track vessel details and link them to schedules and shipments.

#### Acceptance Criteria

1. THE Vessel_Database SHALL store vessel identification including IMO number, MMSI, vessel name, and call sign
2. THE Vessel_Database SHALL store vessel specifications including type, flag, length, beam, draft, gross tonnage, deadweight, and TEU capacity
3. THE Vessel_Database SHALL store vessel ownership information including owner, operator, and linked shipping line
4. WHEN a vessel is created, THE System SHALL validate that IMO number is unique if provided
5. WHEN a vessel is created, THE System SHALL validate that MMSI is unique if provided
6. THE Vessel_Database SHALL track current vessel status including position, last port, and next port
7. WHEN a vessel is deactivated, THE System SHALL preserve historical data while hiding from active lists

### Requirement 2: Vessel Schedule Management

**User Story:** As an agency operator, I want to manage vessel schedules and port calls, so that I can plan shipments and track vessel movements.

#### Acceptance Criteria

1. THE Vessel_Schedule SHALL store voyage information including vessel reference, voyage number, and service details
2. THE Vessel_Schedule SHALL store port call details including port, terminal, berth, and schedule type
3. THE Vessel_Schedule SHALL store scheduled and actual arrival/departure times
4. THE Vessel_Schedule SHALL store cutoff times for cargo, documentation, and VGM
5. WHEN a schedule is created, THE System SHALL validate that vessel and voyage combination with port is unique
6. WHEN actual times differ from scheduled times, THE System SHALL calculate and store delay hours
7. THE System SHALL support schedule statuses: scheduled, arrived, berthed, working, departed, cancelled
8. WHEN a schedule status changes, THE System SHALL record the transition timestamp

### Requirement 3: Vessel Position Tracking

**User Story:** As an agency operator, I want to track vessel positions, so that I can monitor vessel movements and estimate arrival times.

#### Acceptance Criteria

1. THE Vessel_Position SHALL store geographic coordinates (latitude, longitude) with timestamp
2. THE Vessel_Position SHALL store navigation data including course, speed, and destination
3. THE Vessel_Position SHALL record the data source (AIS, manual, API)
4. WHEN a position is recorded, THE System SHALL update the vessel's current position
5. THE System SHALL maintain position history for historical analysis
6. WHEN displaying vessel position, THE System SHALL show time since last update

### Requirement 4: Shipment Tracking Events

**User Story:** As an agency operator, I want to track shipment milestones, so that I can monitor cargo progress from booking to delivery.

#### Acceptance Criteria

1. THE Shipment_Tracking SHALL link events to bookings, B/Ls, or containers
2. THE Shipment_Tracking SHALL support event types: booked, gate_in, loaded, departed, transshipment, arrived, discharged, gate_out, delivered
3. THE Shipment_Tracking SHALL store event location including name, code, and terminal
4. THE Shipment_Tracking SHALL store vessel and voyage information for vessel-related events
5. WHEN an event is recorded, THE System SHALL distinguish between actual and estimated events
6. THE System SHALL display tracking events in chronological timeline format
7. WHEN tracking by container number, THE System SHALL validate ISO 6346 format

### Requirement 5: Tracking Search and Display

**User Story:** As an agency operator, I want to search and view tracking information, so that I can quickly find shipment status.

#### Acceptance Criteria

1. WHEN a user enters a B/L number, THE System SHALL display all related tracking events
2. WHEN a user enters a booking number, THE System SHALL display all related tracking events
3. WHEN a user enters a container number, THE System SHALL display all related tracking events
4. THE System SHALL display a visual progress indicator showing shipment milestones
5. THE System SHALL display vessel position on a map when available
6. WHEN displaying tracking results, THE System SHALL show linked booking and B/L information

### Requirement 6: Tracking Subscriptions

**User Story:** As an agency operator, I want to subscribe to shipment updates, so that I can receive notifications about important events.

#### Acceptance Criteria

1. THE Tracking_Subscription SHALL support subscription types: vessel, container, booking
2. THE Tracking_Subscription SHALL store notification preferences for departure, arrival, delay, and milestone events
3. WHEN a user subscribes, THE System SHALL validate the reference exists
4. THE System SHALL allow users to manage active subscriptions
5. WHEN a subscription is deactivated, THE System SHALL stop sending notifications
6. THE System SHALL prevent duplicate subscriptions for the same reference by the same user

### Requirement 7: Upcoming Arrivals View

**User Story:** As an agency operator, I want to view upcoming vessel arrivals, so that I can prepare for cargo operations.

#### Acceptance Criteria

1. THE System SHALL display a list of vessels with scheduled arrivals
2. THE System SHALL show vessel details including name, IMO, type, and voyage number
3. THE System SHALL show port and terminal information for each arrival
4. THE System SHALL show the count of bookings linked to each vessel/voyage
5. WHEN filtering arrivals, THE System SHALL support date range selection
6. THE System SHALL sort arrivals by scheduled arrival time ascending

### Requirement 8: Schedule Delay Tracking

**User Story:** As an agency operator, I want to track schedule delays, so that I can inform customers and adjust plans.

#### Acceptance Criteria

1. WHEN actual arrival differs from scheduled arrival, THE System SHALL calculate delay in hours
2. THE System SHALL store delay reason when provided
3. WHEN a delay exceeds threshold, THE System SHALL highlight the schedule visually
4. THE System SHALL support filtering schedules by delay status
5. WHEN displaying delays, THE System SHALL show both scheduled and actual times

### Requirement 9: Data Validation

**User Story:** As a system administrator, I want data validation rules enforced, so that vessel and tracking data remains accurate.

#### Acceptance Criteria

1. WHEN validating IMO number, THE System SHALL verify 7-digit format
2. WHEN validating MMSI, THE System SHALL verify 9-digit format
3. WHEN validating coordinates, THE System SHALL verify latitude is between -90 and 90
4. WHEN validating coordinates, THE System SHALL verify longitude is between -180 and 180
5. WHEN validating speed, THE System SHALL verify non-negative value
6. WHEN validating course, THE System SHALL verify value is between 0 and 360 degrees
7. WHEN validating container number, THE System SHALL verify ISO 6346 format (4 letters + 7 digits with check digit)
