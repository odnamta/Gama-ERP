# v0.33: HR - Skills Management

## Overview
Track employee skills, certifications, and identify capability gaps for PT Gama Indonesia's workforce.

## Business Context
Heavy-haul logistics requires specialized skills and certifications (SIM B2, forklift operation, crane rigging, etc.). This module helps HR:
- Track which employees have which skills
- Monitor certification expiry dates
- Identify skill gaps in the Operations department
- Plan training programs based on coverage targets

## Requirements

### 1. Skill Categories
- Organize skills into logical categories
- Default categories: Driving, Lifting, Safety, Technical, Administrative, Leadership
- Each category has a display order for consistent UI

### 2. Skills Library
- Define skills with metadata:
  - Skill code and name
  - Category assignment
  - Whether certification is required
  - Certification validity period (months)
  - Criticality level (low, medium, high, critical)
  - Target coverage percentage for Operations staff

### 3. Employee Skills
- Assign skills to employees with:
  - Proficiency level (basic, intermediate, advanced, expert)
  - Certification status and number
  - Certification and expiry dates
  - Certificate document URL
  - Verification tracking

### 4. Gap Analysis
- Calculate coverage percentage per skill for Operations department
- Compare against target coverage
- Highlight skills below target
- Generate recommendations for training

### 5. Expiring Certifications
- Alert on certifications expiring within 60 days
- Show urgency status (warning, critical, expired)
- Enable proactive renewal planning

### 6. Bulk Assignment
- Assign same skill to multiple employees at once
- Useful for training completion records

## User Stories

1. As HR Manager, I want to see which skills are below target coverage so I can plan training
2. As HR Admin, I want to track certification expiry dates so employees stay compliant
3. As HR Admin, I want to assign skills to employees with proficiency levels
4. As HR Manager, I want to bulk-assign skills after group training sessions
5. As Operations Manager, I want to see my team's skill coverage for job assignments

## Acceptance Criteria

- [x] skill_categories table created with defaults
- [x] skills table created with defaults (SIM B2, Forklift, Crane Rigging, First Aid, Defensive Driving)
- [x] employee_skills table created with unique constraint
- [x] Proficiency levels (basic to expert)
- [x] Certification tracking with expiry
- [x] Gap analysis view working
- [x] Coverage percentage calculated
- [x] Expiring certifications alert (60 days)
- [x] Employee skill profile view
- [x] Bulk skill assignment
- [x] RLS policies enabled on all tables
