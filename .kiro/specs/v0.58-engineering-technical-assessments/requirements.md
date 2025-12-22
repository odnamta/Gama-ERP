# Requirements Document

## Introduction

This document defines the requirements for the Engineering Technical Assessments module (v0.58). The system enables engineering teams to create, manage, and review technical assessments including lifting studies, load calculations, equipment specifications, structural assessments, and transport feasibility studies. These assessments are critical for ensuring safe and compliant heavy-haul logistics operations.

## Glossary

- **Technical_Assessment**: A formal engineering document that evaluates technical feasibility, safety, and requirements for logistics operations
- **Assessment_Type**: A category of technical assessment with predefined template sections (e.g., Lifting Study, Load Calculation)
- **Lifting_Plan**: Detailed specifications for crane operations including load data, crane selection, rigging configuration, and safety factors
- **Axle_Load_Calculation**: Engineering analysis of weight distribution across vehicle axles for transport compliance
- **COG**: Center of Gravity - the point where the weight of cargo is concentrated
- **Utilization_Percentage**: The ratio of actual load to maximum capacity, expressed as a percentage
- **WLL**: Working Load Limit - the maximum load that equipment is rated to handle safely
- **Ground_Bearing**: The pressure exerted on the ground surface, measured in kPa
- **Rigging**: Equipment used to lift and move loads (slings, shackles, spreader beams)
- **Assessment_Workflow**: The review and approval process for technical assessments

## Requirements

### Requirement 1: Assessment Type Management

**User Story:** As an engineering manager, I want to manage assessment types with predefined templates, so that engineers can create consistent and complete technical assessments.

#### Acceptance Criteria

1. THE System SHALL store assessment types with type_code, type_name, description, and template_sections
2. WHEN the system initializes, THE System SHALL provide default assessment types: Lifting Study, Load Calculation, Equipment Specification, Structural Assessment, and Transport Feasibility Study
3. WHEN an assessment type is created, THE System SHALL define template sections as a structured list with section identifiers and titles
4. THE System SHALL allow assessment types to be activated or deactivated via is_active flag
5. THE System SHALL maintain display_order for consistent presentation of assessment types

### Requirement 2: Technical Assessment Creation

**User Story:** As an engineer, I want to create technical assessments linked to quotations, projects, or job orders, so that I can document engineering analysis for specific work.

#### Acceptance Criteria

1. WHEN an engineer creates a new assessment, THE System SHALL auto-generate a unique assessment_number in format {TYPE_PREFIX}-YYYY-NNNN
2. THE System SHALL allow assessments to be linked to quotations, projects, job_orders, route_surveys, and customers
3. WHEN creating an assessment, THE System SHALL require assessment_type_id and title
4. THE System SHALL store cargo specifications including description, weight_tons, and dimensions (length, width, height, cog_x, cog_y, cog_z)
5. THE System SHALL store flexible assessment_data as JSON based on the assessment type template
6. THE System SHALL support calculations storage with name, formula, inputs, result, and unit for each calculation
7. THE System SHALL store equipment recommendations with equipment_type, specification, quantity, and notes

### Requirement 3: Assessment Conclusions and Recommendations

**User Story:** As an engineer, I want to document conclusions and recommendations, so that stakeholders understand the assessment outcome and any conditions.

#### Acceptance Criteria

1. THE System SHALL support conclusion values: approved, approved_with_conditions, not_approved, further_study
2. WHEN an assessment is concluded, THE System SHALL store conclusion_notes explaining the decision
3. THE System SHALL store recommendations text for suggested actions
4. THE System SHALL store limitations text describing scope boundaries
5. THE System SHALL store assumptions text documenting assessment premises

### Requirement 4: Assessment Review Workflow

**User Story:** As an engineering manager, I want to review and approve technical assessments, so that only validated assessments are used for operations.

#### Acceptance Criteria

1. THE System SHALL track assessment status through: draft, in_progress, pending_review, approved, rejected, superseded
2. WHEN an engineer submits an assessment for review, THE System SHALL change status to pending_review and record prepared_by and prepared_at
3. WHEN a reviewer reviews an assessment, THE System SHALL record reviewed_by and reviewed_at
4. WHEN an approver approves an assessment, THE System SHALL change status to approved and record approved_by and approved_at
5. IF an assessment is rejected, THEN THE System SHALL change status to rejected and allow revision_notes

### Requirement 5: Assessment Revision Control

**User Story:** As an engineer, I want to create revisions of assessments, so that I can update analysis while maintaining history.

#### Acceptance Criteria

1. THE System SHALL track revision_number starting from 1 for each assessment
2. WHEN a revision is created, THE System SHALL link to previous_revision_id and increment revision_number
3. WHEN a new revision is created, THE System SHALL change the previous assessment status to superseded
4. THE System SHALL require revision_notes when creating a revision
5. THE System SHALL allow viewing the complete revision history of an assessment

### Requirement 6: Lifting Plan Management

**User Story:** As an engineer, I want to create detailed lifting plans within lifting study assessments, so that crane operations are properly planned and safe.

#### Acceptance Criteria

1. WHEN creating a lifting plan, THE System SHALL require assessment_id and load_weight_tons
2. THE System SHALL calculate total_lifted_weight_tons as load_weight_tons plus rigging_weight_tons
3. THE System SHALL store crane specifications: crane_type, crane_capacity_tons, crane_radius_m, crane_boom_length_m, crane_capacity_at_radius_tons
4. THE System SHALL calculate utilization_percentage as (total_lifted_weight / crane_capacity_at_radius) * 100
5. IF utilization_percentage exceeds 80%, THEN THE System SHALL flag the lift as requiring additional review
6. THE System SHALL store rigging configuration: rigging_configuration, sling_type, sling_capacity_tons, sling_quantity, spreader_beam, spreader_capacity_tons
7. THE System SHALL store position data: crane_position, load_pickup_position, load_set_position
8. THE System SHALL store ground requirements: ground_bearing_required_kpa, ground_preparation, outrigger_mats, mat_size
9. THE System SHALL support multiple lifts per assessment via lift_number

### Requirement 7: Axle Load Calculation Management

**User Story:** As an engineer, I want to calculate axle load distributions, so that transport configurations comply with legal limits.

#### Acceptance Criteria

1. WHEN creating an axle load calculation, THE System SHALL require assessment_id and cargo_weight_tons
2. THE System SHALL store trailer specifications: trailer_type, trailer_axle_count, trailer_axle_spacing_m, trailer_tare_weight_tons
3. THE System SHALL store prime mover specifications: prime_mover_type, prime_mover_axle_count, prime_mover_weight_tons
4. THE System SHALL store cargo COG position: cargo_cog_from_front_m
5. THE System SHALL calculate and store axle_loads as array with axle_number, axle_type, load_tons, max_allowed_tons, utilization_pct
6. THE System SHALL calculate total_weight_tons, max_single_axle_load_tons, max_tandem_axle_load_tons
7. THE System SHALL determine within_legal_limits based on axle load calculations
8. IF any axle exceeds legal limits, THEN THE System SHALL set permit_required to true

### Requirement 8: Assessment Document Management

**User Story:** As an engineer, I want to attach documents and drawings to assessments, so that supporting materials are accessible.

#### Acceptance Criteria

1. THE System SHALL store documents as JSON array with document metadata
2. THE System SHALL store drawings as JSON array with drawing metadata
3. WHEN a lifting plan includes a drawing, THE System SHALL store lift_drawing_url
4. THE System SHALL support document versioning within the assessment

### Requirement 9: Assessment List and Search

**User Story:** As an engineer, I want to view and search technical assessments, so that I can find relevant assessments quickly.

#### Acceptance Criteria

1. THE System SHALL display assessments in a list with assessment_number, title, type, status, and dates
2. WHEN filtering assessments, THE System SHALL support filtering by assessment_type, status, customer, project, and date range
3. THE System SHALL display status counts for quick overview (draft, pending_review, approved, etc.)
4. THE System SHALL support sorting by assessment_number, created_at, and status

### Requirement 10: Assessment Detail View

**User Story:** As an engineer, I want to view complete assessment details with all calculations and plans, so that I can review the full technical analysis.

#### Acceptance Criteria

1. THE System SHALL display assessment summary with cargo specifications and COG data
2. THE System SHALL display all calculations with formulas, inputs, and results
3. WHEN viewing a lifting study, THE System SHALL display lifting plans with crane capacity tables and rigging configuration
4. WHEN viewing a transport study, THE System SHALL display axle load calculations with compliance status
5. THE System SHALL display conclusion with status, conditions, and approver information
6. THE System SHALL provide tabs for Summary, Calculations, Lifting Plan/Axle Loads, Drawings, and Documents
