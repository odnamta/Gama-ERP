# Requirements Document

## Introduction

This document defines the requirements for the HSE PPE (Personal Protective Equipment) Management module. The system will track PPE issuance to employees, monitor equipment condition through inspections, manage inventory levels, and ensure compliance with safety requirements by alerting when PPE needs replacement or when employees are missing mandatory equipment.

## Glossary

- **PPE**: Personal Protective Equipment - safety gear worn to minimize exposure to hazards
- **PPE_Type**: A category of protective equipment (e.g., helmet, vest, boots)
- **Issuance**: The act of providing PPE to an employee with tracking details
- **Inspection**: A periodic check of PPE condition to ensure it remains safe for use
- **Replacement_Interval**: The recommended number of days before PPE should be replaced
- **Reorder_Level**: The minimum stock quantity that triggers a reorder alert
- **Compliance_Status**: Whether an employee has all required mandatory PPE

## Requirements

### Requirement 1: PPE Type Configuration

**User Story:** As an HSE administrator, I want to configure PPE types with their properties, so that I can define what equipment is tracked and its replacement schedules.

#### Acceptance Criteria

1. THE PPE_Type_Manager SHALL store PPE types with code, name, description, and category
2. WHEN a PPE type is created, THE PPE_Type_Manager SHALL assign it to one of the predefined categories: head, eye, ear, respiratory, hand, body, foot, or fall_protection
3. THE PPE_Type_Manager SHALL allow setting a replacement interval in days for each PPE type
4. THE PPE_Type_Manager SHALL support marking PPE types as mandatory
5. WHEN a PPE type has sizes, THE PPE_Type_Manager SHALL store available size options
6. THE PPE_Type_Manager SHALL track unit cost for each PPE type
7. THE PPE_Type_Manager SHALL support soft-delete via is_active flag

### Requirement 2: PPE Inventory Management

**User Story:** As an HSE administrator, I want to track PPE inventory levels, so that I can ensure adequate stock is available for issuance.

#### Acceptance Criteria

1. THE Inventory_Manager SHALL track quantity in stock for each PPE type and size combination
2. THE Inventory_Manager SHALL store reorder level thresholds for each inventory item
3. WHEN stock quantity falls below reorder level, THE Inventory_Manager SHALL flag the item for reorder
4. THE Inventory_Manager SHALL record last purchase date, quantity, and cost
5. THE Inventory_Manager SHALL track storage location for each inventory item
6. WHEN PPE is issued, THE Inventory_Manager SHALL decrement the stock quantity
7. WHEN PPE is returned in reusable condition, THE Inventory_Manager SHALL increment the stock quantity

### Requirement 3: PPE Issuance to Employees

**User Story:** As an HSE officer, I want to issue PPE to employees and track what they have, so that I can ensure everyone has the required safety equipment.

#### Acceptance Criteria

1. WHEN issuing PPE, THE Issuance_Manager SHALL record employee, PPE type, quantity, size, and issue date
2. THE Issuance_Manager SHALL capture the issuing officer and condition at issuance
3. WHEN a PPE type has a replacement interval, THE Issuance_Manager SHALL calculate and store the expected replacement date
4. THE Issuance_Manager SHALL support optional serial number tracking for high-value items
5. WHEN PPE is returned, THE Issuance_Manager SHALL record return date, condition, and replacement reason
6. THE Issuance_Manager SHALL track issuance status: active, returned, replaced, lost, or damaged
7. THE Issuance_Manager SHALL maintain a complete history of all PPE issued to each employee

### Requirement 4: PPE Inspection Records

**User Story:** As an HSE officer, I want to record PPE inspection results, so that I can ensure equipment remains safe for use.

#### Acceptance Criteria

1. WHEN inspecting PPE, THE Inspection_Manager SHALL record inspection date, condition, and inspector
2. THE Inspection_Manager SHALL assess condition as: good, fair, poor, or failed
3. WHEN inspection reveals issues, THE Inspection_Manager SHALL record findings and required action
4. THE Inspection_Manager SHALL track actions: none, clean, repair, or replace
5. WHEN action is taken, THE Inspection_Manager SHALL record what action was performed
6. THE Inspection_Manager SHALL link each inspection to a specific PPE issuance record

### Requirement 5: PPE Replacement Tracking

**User Story:** As an HSE administrator, I want to see which PPE is due for replacement, so that I can proactively replace equipment before it becomes unsafe.

#### Acceptance Criteria

1. THE Replacement_Tracker SHALL identify all active PPE issuances with replacement dates within 30 days
2. THE Replacement_Tracker SHALL calculate days overdue for expired PPE
3. THE Replacement_Tracker SHALL display employee name, PPE type, size, issue date, and expected replacement date
4. WHEN PPE is overdue for replacement, THE Replacement_Tracker SHALL highlight it prominently
5. THE Replacement_Tracker SHALL only show PPE for active employees

### Requirement 6: Employee PPE Compliance Status

**User Story:** As an HSE manager, I want to see each employee's PPE compliance status, so that I can ensure everyone has the required safety equipment.

#### Acceptance Criteria

1. THE Compliance_Monitor SHALL show all mandatory PPE types for each active employee
2. WHEN an employee is missing mandatory PPE, THE Compliance_Monitor SHALL flag status as "missing"
3. WHEN PPE replacement date has passed, THE Compliance_Monitor SHALL flag status as "overdue"
4. WHEN PPE replacement is due within 30 days, THE Compliance_Monitor SHALL flag status as "due_soon"
5. WHEN employee has valid active PPE, THE Compliance_Monitor SHALL show status as "issued"
6. THE Compliance_Monitor SHALL provide a summary count of compliance issues per employee

### Requirement 7: PPE Dashboard and Alerts

**User Story:** As an HSE administrator, I want a dashboard showing PPE status and alerts, so that I can quickly identify and address issues.

#### Acceptance Criteria

1. THE PPE_Dashboard SHALL display total PPE items issued and active
2. THE PPE_Dashboard SHALL show count of items due for replacement within 30 days
3. THE PPE_Dashboard SHALL show count of overdue replacements
4. THE PPE_Dashboard SHALL show count of employees missing mandatory PPE
5. THE PPE_Dashboard SHALL display low stock alerts for inventory below reorder level
6. WHEN clicking on an alert, THE PPE_Dashboard SHALL navigate to the relevant detail view
