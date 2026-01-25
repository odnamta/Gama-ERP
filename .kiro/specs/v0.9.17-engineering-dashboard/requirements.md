# Requirements Document

## Introduction

This document defines the requirements for the Engineering Dashboard feature (v0.9.17) in GAMA ERP. The Engineering Dashboard provides engineers (primary user: Arka Basunjaya) with a centralized view of their daily work including route surveys, Journey Management Plans (JMPs), and engineering assessments. The dashboard follows existing patterns established by the Agency Dashboard and other role-specific dashboards.

## Glossary

- **Engineering_Dashboard**: The main dashboard page for engineers showing surveys, JMPs, assessments, and assignments
- **Route_Survey**: A survey record documenting route feasibility, obstacles, and requirements for heavy-haul transport
- **JMP**: Journey Management Plan - a comprehensive plan for executing a heavy-haul transport journey
- **Engineering_Assessment**: A technical assessment record linked to PJOs or quotations
- **Engineering_Data_Service**: Server-side service that fetches and caches engineering metrics
- **Dashboard_Cache**: 5-minute in-memory cache system for dashboard data
- **Current_User**: The authenticated user viewing the dashboard

## Requirements

### Requirement 1: Survey Overview Metrics

**User Story:** As an engineer, I want to see an overview of route surveys, so that I can understand the current survey workload and status.

#### Acceptance Criteria

1. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the total count of all route surveys
2. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the count of pending surveys (status = 'requested' or 'scheduled')
3. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the count of surveys completed this month
4. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the 5 most recent surveys ordered by created_at descending
5. THE Engineering_Dashboard SHALL display survey metrics in card format showing total, pending, and completed counts

### Requirement 2: JMP Status Metrics

**User Story:** As an engineer, I want to see the status of Journey Management Plans, so that I can track active journeys and upcoming departures.

#### Acceptance Criteria

1. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the count of active JMPs (status = 'active')
2. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the count of JMPs with planned departures in the next 7 days
3. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the count of JMPs pending review (status = 'pending_review')
4. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the 5 most recent JMPs ordered by created_at descending
5. THE Engineering_Dashboard SHALL display JMP metrics in card format showing active, upcoming, and pending review counts

### Requirement 3: Engineering Assessment Metrics

**User Story:** As an engineer, I want to see engineering assessment statistics, so that I can monitor assessment workload and completion rates.

#### Acceptance Criteria

1. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the count of pending assessments (status = 'pending')
2. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the count of assessments completed this month
3. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL calculate the completion rate as (completed / total) * 100
4. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch the 5 most recent assessments ordered by created_at descending
5. THE Engineering_Dashboard SHALL display assessment metrics in card format showing pending, completed, and completion rate

### Requirement 4: My Assignments Section

**User Story:** As an engineer, I want to see work assigned specifically to me, so that I can prioritize my personal tasks.

#### Acceptance Criteria

1. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch surveys assigned to the Current_User (surveyor_id = user_id)
2. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch assessments assigned to the Current_User (assigned_to = user_id)
3. WHEN the Engineering_Dashboard loads, THE Engineering_Data_Service SHALL fetch JMPs where Current_User is the prepared_by or convoy_commander_id
4. THE Engineering_Dashboard SHALL display a combined list of the user's assignments with status indicators
5. THE Engineering_Dashboard SHALL show assignment counts for each category (surveys, assessments, JMPs)

### Requirement 5: Quick Actions

**User Story:** As an engineer, I want quick access to create new surveys, JMPs, and assessments, so that I can efficiently start new work items.

#### Acceptance Criteria

1. THE Engineering_Dashboard SHALL display a Quick Actions section with navigation links
2. WHEN a user clicks "New Survey", THE Engineering_Dashboard SHALL navigate to the route survey creation page
3. WHEN a user clicks "New JMP", THE Engineering_Dashboard SHALL navigate to the JMP creation page
4. WHEN a user clicks "View All Surveys", THE Engineering_Dashboard SHALL navigate to the surveys list page
5. WHEN a user clicks "View All JMPs", THE Engineering_Dashboard SHALL navigate to the JMPs list page

### Requirement 6: Data Caching

**User Story:** As a system, I want to cache dashboard data, so that page loads are fast and database queries are minimized.

#### Acceptance Criteria

1. THE Engineering_Data_Service SHALL use the Dashboard_Cache with a 5-minute TTL
2. WHEN cached data exists and is not expired, THE Engineering_Data_Service SHALL return cached data without querying the database
3. WHEN cached data is expired or missing, THE Engineering_Data_Service SHALL fetch fresh data and update the cache
4. THE Engineering_Data_Service SHALL generate cache keys using the pattern 'engineering-dashboard-metrics:{role}:{date}'

### Requirement 7: Role-Based Access Control

**User Story:** As a system administrator, I want to restrict dashboard access to authorized roles, so that sensitive engineering data is protected.

#### Acceptance Criteria

1. WHEN a user with role 'engineer' accesses the Engineering_Dashboard, THE Engineering_Dashboard SHALL display the full dashboard
2. WHEN a user with role 'owner' or 'director' accesses the Engineering_Dashboard, THE Engineering_Dashboard SHALL display the full dashboard
3. WHEN a user with an unauthorized role accesses the Engineering_Dashboard, THE Engineering_Dashboard SHALL redirect to the default dashboard
4. IF a user is not authenticated, THEN THE Engineering_Dashboard SHALL redirect to the login page

### Requirement 8: Recent Activity Lists

**User Story:** As an engineer, I want to see recent surveys, JMPs, and assessments, so that I can quickly access recently created or updated items.

#### Acceptance Criteria

1. THE Engineering_Dashboard SHALL display a Recent Surveys list showing survey_number, origin, destination, status, and created_at
2. THE Engineering_Dashboard SHALL display a Recent JMPs list showing jmp_number, journey_title, status, and planned_departure
3. THE Engineering_Dashboard SHALL display a Recent Assessments list showing assessment_type, status, risk_level, and created_at
4. WHEN a user clicks on a recent item, THE Engineering_Dashboard SHALL navigate to that item's detail page
5. THE Engineering_Dashboard SHALL format dates using the centralized formatDate utility from lib/utils/format.ts
