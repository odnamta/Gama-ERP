# Requirements Document

## Introduction

This document defines the requirements for a comprehensive Route Survey Management system for heavy-haul logistics. The system enables engineering teams to conduct road assessments, document obstacles, measure clearances, and generate route feasibility reports. This is critical for heavy and over-dimension cargo transport where road conditions, bridge capacities, overhead obstacles, and turning radii must be assessed before transport to avoid costly delays or accidents.

## Glossary

- **Route_Survey**: A formal assessment of a transportation route including road conditions, obstacles, clearances, and feasibility determination
- **Waypoint**: A specific location along a route that requires assessment (bridges, underpasses, intersections, obstacles)
- **Feasibility**: The determination of whether a route can accommodate the cargo transport ('feasible', 'feasible_with_conditions', 'not_feasible')
- **Transport_Configuration**: The combined dimensions and specifications of cargo plus transport vehicle
- **Clearance**: The available space (vertical or horizontal) at a specific point along the route
- **Survey_Checklist**: A standardized list of items that must be verified during a route survey
- **Surveyor**: An employee assigned to conduct the physical route assessment
- **Escort**: Police or private vehicles required to accompany oversized cargo transport

## Requirements

### Requirement 1: Route Survey Request Creation

**User Story:** As a sales or engineering user, I want to create route survey requests, so that I can initiate the assessment process for heavy cargo transport routes.

#### Acceptance Criteria

1. WHEN a user creates a route survey request, THE System SHALL generate a unique survey number in format RSV-YYYY-NNNN
2. WHEN a route survey is created, THE System SHALL capture cargo dimensions (length, width, height in meters) and weight (in tons)
3. WHEN a route survey is created, THE System SHALL capture transport configuration including total dimensions, axle configuration, ground clearance, and turning radius
4. WHEN a route survey is created, THE System SHALL require origin and destination locations with optional coordinates
5. WHEN a route survey is created, THE System SHALL allow linking to a quotation, project, or job order
6. WHEN a route survey is created, THE System SHALL set initial status to 'requested'
7. WHEN a route survey is created, THE System SHALL automatically initialize the survey checklist from the template

### Requirement 2: Route Survey Scheduling and Assignment

**User Story:** As an engineering manager, I want to schedule surveys and assign surveyors, so that route assessments are conducted by qualified personnel.

#### Acceptance Criteria

1. WHEN a survey is scheduled, THE System SHALL allow assignment of a surveyor from the employees list
2. WHEN a survey is scheduled, THE System SHALL capture the planned survey date
3. WHEN a surveyor is assigned, THE System SHALL update the survey status to 'scheduled'
4. WHEN a survey begins, THE System SHALL allow updating status to 'in_progress'
5. WHEN a survey status changes, THE System SHALL record the timestamp of the change

### Requirement 3: Route Waypoint Documentation

**User Story:** As a surveyor, I want to document waypoints along the route, so that all critical points are assessed and recorded.

#### Acceptance Criteria

1. WHEN adding a waypoint, THE System SHALL capture waypoint type (start, checkpoint, obstacle, bridge, intersection, underpass, overhead, turn, rest_point, destination)
2. WHEN adding a waypoint, THE System SHALL capture location name, coordinates, and distance from start (km)
3. WHEN adding a waypoint, THE System SHALL capture road condition (good, fair, poor, impassable) and road surface type
4. WHEN adding a waypoint, THE System SHALL capture vertical and horizontal clearance measurements in meters
5. WHEN adding a bridge waypoint, THE System SHALL capture bridge name, capacity (tons), width, and length
6. WHEN adding a turn/intersection waypoint, THE System SHALL capture available turn radius and turn feasibility
7. WHEN adding a waypoint, THE System SHALL allow specifying required actions, responsible party, and cost estimates
8. WHEN adding a waypoint, THE System SHALL allow uploading photos for documentation
9. WHEN waypoints are added, THE System SHALL automatically assign sequential order numbers

### Requirement 4: Waypoint Passability Assessment

**User Story:** As a surveyor, I want the system to assess waypoint passability, so that I can identify potential issues based on transport dimensions.

#### Acceptance Criteria

1. WHEN assessing a waypoint, THE System SHALL compare vertical clearance against transport height plus 0.3m safety margin
2. WHEN assessing a waypoint, THE System SHALL compare horizontal clearance against transport width plus 0.5m safety margin
3. WHEN assessing a bridge waypoint, THE System SHALL compare bridge capacity against total transport weight
4. WHEN assessing a turn waypoint, THE System SHALL compare available turn radius against required turn radius
5. WHEN clearance is insufficient, THE System SHALL flag the waypoint as not passable and list specific issues
6. WHEN all clearances are adequate, THE System SHALL mark the waypoint as passable

### Requirement 5: Survey Checklist Management

**User Story:** As a surveyor, I want to work through a standardized checklist, so that all required assessments are completed consistently.

#### Acceptance Criteria

1. WHEN a survey is created, THE System SHALL initialize checklist items from the template
2. THE System SHALL organize checklist items by category (road_condition, clearances, bridges, utilities, traffic, permits, access)
3. WHEN checking an item, THE System SHALL allow marking status as 'pending', 'ok', 'warning', or 'fail'
4. WHEN checking an item, THE System SHALL capture notes and the user who performed the check
5. WHEN checking an item, THE System SHALL record the timestamp of the check

### Requirement 6: Survey Completion and Feasibility Assessment

**User Story:** As a surveyor, I want to complete the survey with a feasibility assessment, so that stakeholders know if the route is viable.

#### Acceptance Criteria

1. WHEN completing a survey, THE System SHALL require a feasibility determination ('feasible', 'feasible_with_conditions', 'not_feasible')
2. WHEN completing a survey, THE System SHALL capture feasibility notes explaining the assessment
3. WHEN completing a survey, THE System SHALL capture total route distance (km) and estimated travel time (hours)
4. WHEN completing a survey, THE System SHALL capture permit requirements including type, authority, estimated days, and cost
5. WHEN completing a survey, THE System SHALL capture escort requirements (required, type, vehicle count)
6. WHEN completing a survey, THE System SHALL capture travel time restrictions (e.g., night travel only)
7. WHEN completing a survey, THE System SHALL capture cost estimates (survey, permits, escort, road repairs, total)
8. WHEN a survey is completed, THE System SHALL update status to 'completed' and record completion timestamp
9. WHEN a survey is completed, THE System SHALL notify the original requestor

### Requirement 7: Route Survey List and Filtering

**User Story:** As an engineering user, I want to view and filter route surveys, so that I can manage and track survey progress.

#### Acceptance Criteria

1. WHEN viewing the survey list, THE System SHALL display summary cards showing counts by status (requested, scheduled, in_progress, completed)
2. WHEN viewing the survey list, THE System SHALL display survey number, customer, cargo description, route, and status
3. WHEN viewing the survey list, THE System SHALL allow filtering by status
4. WHEN viewing the survey list, THE System SHALL allow filtering by surveyor
5. WHEN viewing the survey list, THE System SHALL allow searching by survey number, customer, or cargo description
6. WHEN displaying completed surveys, THE System SHALL show the feasibility result

### Requirement 8: Route Survey Detail View

**User Story:** As an engineering user, I want to view complete survey details, so that I can review all assessment information.

#### Acceptance Criteria

1. WHEN viewing survey details, THE System SHALL display cargo dimensions and transport configuration
2. WHEN viewing survey details, THE System SHALL display route overview with origin, destination, and key waypoints
3. WHEN viewing survey details, THE System SHALL display all waypoints with their assessments in a table
4. WHEN viewing survey details, THE System SHALL display the checklist with item statuses
5. WHEN viewing survey details, THE System SHALL provide tabs for Details, Route Map, Waypoints, Checklist, and Report
6. WHEN viewing survey details, THE System SHALL allow editing survey information based on status

### Requirement 9: Survey Report Generation

**User Story:** As an engineering user, I want to generate survey reports, so that I can share findings with stakeholders.

#### Acceptance Criteria

1. WHEN generating a report, THE System SHALL include all survey details, waypoints, and checklist results
2. WHEN generating a report, THE System SHALL include the feasibility assessment and recommendations
3. WHEN generating a report, THE System SHALL include cost estimates and permit requirements
4. WHEN a report is generated, THE System SHALL save the document URL to the survey record

### Requirement 10: Data Integrity and Validation

**User Story:** As a system administrator, I want data integrity enforced, so that survey data is accurate and complete.

#### Acceptance Criteria

1. THE System SHALL require cargo description, origin location, and destination location for all surveys
2. THE System SHALL validate that numeric measurements are positive values
3. WHEN a waypoint references a survey, THE System SHALL cascade delete waypoints if the survey is deleted
4. WHEN a checklist item references a survey, THE System SHALL cascade delete checklist items if the survey is deleted
5. THE System SHALL maintain referential integrity for customer, quotation, project, and job order relationships
