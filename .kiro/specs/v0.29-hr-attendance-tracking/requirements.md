# Requirements Document

## Introduction

This document defines the requirements for the HR Attendance Tracking module (v0.29) for Gama ERP. The module enables daily attendance tracking for all employees with clock-in/out functionality, automatic late detection, work hour calculations, and comprehensive reporting for administrators and employees.

## Glossary

- **Attendance_System**: The module responsible for tracking employee attendance, clock-in/out times, and generating attendance reports
- **Clock_In_Service**: The service that records when an employee starts their work day
- **Clock_Out_Service**: The service that records when an employee ends their work day
- **Work_Schedule**: Configuration defining standard work hours, break times, and grace periods for late arrival
- **Attendance_Record**: A single day's attendance data for an employee including clock times, status, and calculated hours
- **Holiday_Manager**: The service that manages company and national holidays
- **Attendance_Status**: The classification of an attendance record (present, late, absent, on_leave, holiday, wfh, early_leave, half_day)
- **Grace_Period**: The allowed minutes after scheduled start time before marking as late
- **Overtime_Hours**: Work hours exceeding the standard 8-hour workday

## Requirements

### Requirement 1: Employee Clock-In

**User Story:** As an employee, I want to clock in when I arrive at work, so that my attendance is recorded accurately.

#### Acceptance Criteria

1. WHEN an employee clicks the clock-in button, THE Clock_In_Service SHALL record the current timestamp as clock_in time
2. WHEN an employee clocks in after the scheduled start time plus grace period, THE Attendance_System SHALL mark the status as 'late' and calculate late_minutes
3. WHEN an employee clocks in within the grace period, THE Attendance_System SHALL mark the status as 'present'
4. WHEN an employee attempts to clock in twice on the same day, THE Clock_In_Service SHALL prevent duplicate entries and display an error message
5. IF an employee has already clocked in today, THEN THE Attendance_System SHALL display the existing clock-in time instead of the clock-in button

### Requirement 2: Employee Clock-Out

**User Story:** As an employee, I want to clock out when I leave work, so that my work hours are calculated correctly.

#### Acceptance Criteria

1. WHEN an employee clicks the clock-out button, THE Clock_Out_Service SHALL record the current timestamp as clock_out time
2. WHEN clock_out is recorded, THE Attendance_System SHALL calculate work_hours by subtracting clock_in from clock_out minus 1 hour for lunch break
3. WHEN calculated work_hours exceeds 8 hours, THE Attendance_System SHALL set work_hours to 8 and calculate overtime_hours as the excess
4. IF an employee has not clocked in today, THEN THE Clock_Out_Service SHALL prevent clock-out and display an error message
5. IF an employee has already clocked out today, THEN THE Attendance_System SHALL display the existing clock-out time instead of the clock-out button

### Requirement 3: View Personal Attendance

**User Story:** As an employee, I want to view my own attendance history, so that I can track my work hours and attendance status.

#### Acceptance Criteria

1. WHEN an employee navigates to My Attendance page, THE Attendance_System SHALL display today's clock-in/out status and current work hours
2. WHEN viewing monthly attendance, THE Attendance_System SHALL display a calendar view with status indicators for each day
3. THE Attendance_System SHALL display monthly summary statistics including days worked, late days, total hours, and overtime hours
4. WHEN a day is marked as late, THE Attendance_System SHALL display a warning indicator on the calendar
5. THE Attendance_System SHALL display weekend and holiday days with distinct visual indicators

### Requirement 4: Admin Attendance Management

**User Story:** As an HR administrator, I want to view and manage all employee attendance, so that I can ensure accurate attendance records.

#### Acceptance Criteria

1. WHEN an admin navigates to the Attendance page, THE Attendance_System SHALL display all employee attendance for the selected date
2. THE Attendance_System SHALL display summary cards showing total staff, present count, late count, absent count, and on-leave count
3. WHEN an admin filters by department, THE Attendance_System SHALL display only employees from that department
4. WHEN an admin filters by status, THE Attendance_System SHALL display only employees with that attendance status
5. WHEN an admin clicks Manual Entry, THE Attendance_System SHALL allow creating or editing attendance records for any employee
6. WHEN an admin marks an employee as absent, THE Attendance_System SHALL create an attendance record with status 'absent'

### Requirement 5: Work Schedule Configuration

**User Story:** As an HR administrator, I want to configure work schedules, so that attendance rules are applied correctly.

#### Acceptance Criteria

1. THE Work_Schedule SHALL define work_start time, work_end time, break_start time, and break_end time
2. THE Work_Schedule SHALL define late_grace_minutes for determining late arrivals
3. THE Work_Schedule SHALL define work_days as an array of day numbers (0=Sunday through 6=Saturday)
4. WHEN a schedule is marked as default, THE Attendance_System SHALL apply it to employees without a specific schedule assignment
5. WHEN an employee has a schedule_id assigned, THE Attendance_System SHALL use that schedule instead of the default

### Requirement 6: Holiday Management

**User Story:** As an HR administrator, I want to manage holidays, so that attendance is not required on those days.

#### Acceptance Criteria

1. WHEN an admin creates a holiday, THE Holiday_Manager SHALL store the date, name, and type (national or company)
2. WHEN a date is marked as a holiday, THE Attendance_System SHALL automatically mark employee attendance as 'holiday' status
3. THE Holiday_Manager SHALL prevent duplicate holiday entries for the same date
4. WHEN viewing the attendance calendar, THE Attendance_System SHALL display holidays with distinct visual indicators

### Requirement 7: Attendance Corrections

**User Story:** As an HR administrator, I want to correct attendance records, so that errors can be fixed with proper audit trail.

#### Acceptance Criteria

1. WHEN an admin edits an attendance record, THE Attendance_System SHALL mark is_corrected as true
2. WHEN an attendance record is corrected, THE Attendance_System SHALL record the corrected_by user and correction_reason
3. THE Attendance_System SHALL preserve the original timestamps while allowing corrections to clock_in and clock_out times
4. WHEN a corrected record is saved, THE Attendance_System SHALL recalculate work_hours and overtime_hours

### Requirement 8: Attendance Dashboard Widget

**User Story:** As an employee, I want to see my attendance status on the dashboard, so that I can quickly clock in/out without navigating away.

#### Acceptance Criteria

1. THE Attendance_System SHALL display a compact attendance widget on the employee dashboard
2. THE widget SHALL show current clock-in status, clock-in time if clocked in, and current work hours
3. WHEN not clocked in, THE widget SHALL display a Clock In button
4. WHEN clocked in but not clocked out, THE widget SHALL display a Clock Out button
5. WHEN both clock-in and clock-out are recorded, THE widget SHALL display the total work hours for the day

### Requirement 9: Attendance Reporting

**User Story:** As a manager, I want to generate attendance reports, so that I can analyze team attendance patterns.

#### Acceptance Criteria

1. WHEN a manager requests an attendance report, THE Attendance_System SHALL generate data for the specified date range
2. THE report SHALL include employee details, attendance dates, clock times, work hours, overtime, and status
3. WHEN filtering by department, THE report SHALL include only employees from that department
4. THE Attendance_System SHALL support exporting attendance data for further analysis
5. THE report SHALL calculate aggregate statistics including total present days, late days, and absent days per employee

### Requirement 10: Role-Based Access Control

**User Story:** As a system administrator, I want to control who can access attendance features, so that data privacy is maintained.

#### Acceptance Criteria

1. THE Attendance_System SHALL allow all employees to view their own attendance and clock in/out
2. THE Attendance_System SHALL allow HR, Admin, and Owner roles to view all employee attendance
3. THE Attendance_System SHALL allow only HR, Admin, and Owner roles to create manual entries and edit records
4. THE Attendance_System SHALL allow Managers to view attendance only for their department
5. THE Attendance_System SHALL allow only HR, Admin, and Owner roles to manage schedules and holidays
