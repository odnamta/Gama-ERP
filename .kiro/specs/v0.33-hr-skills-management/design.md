# v0.33: HR Skills Management - Design

## Database Schema

### skill_categories
```sql
CREATE TABLE skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(30) UNIQUE NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Default categories:
- driving: Driving & Vehicle Operation
- lifting: Lifting & Rigging
- safety: Safety & Compliance
- technical: Technical Skills
- admin: Administrative
- leadership: Leadership & Management

### skills
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_code VARCHAR(30) UNIQUE NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  category_id UUID REFERENCES skill_categories(id),
  description TEXT,
  requires_certification BOOLEAN DEFAULT FALSE,
  certification_validity_months INTEGER,
  criticality VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  target_coverage_percent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Default skills:
- sim_b2: Heavy Vehicle License (SIM B2) - critical, 80% target
- forklift: Forklift Operation (SIO) - high, 50% target
- crane_rigging: Crane Rigging - high, 30% target
- first_aid: First Aid Certification - high, 100% target
- defensive_driving: Defensive Driving - high, 80% target

### employee_skills
```sql
CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  skill_id UUID NOT NULL REFERENCES skills(id),
  level VARCHAR(20) DEFAULT 'basic', -- basic, intermediate, advanced, expert
  is_certified BOOLEAN DEFAULT FALSE,
  certification_number VARCHAR(100),
  certification_date DATE,
  expiry_date DATE,
  certificate_url VARCHAR(500),
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, skill_id)
);
```

### Views

#### skill_gap_analysis
Calculates coverage for Operations department:
- ops_staff_count: Total active ops employees
- staff_with_skill: Employees with this skill
- current_coverage_percent: Actual coverage
- gap_percent: Target minus current

#### expiring_certifications
Shows certifications expiring within 60 days:
- days_until_expiry: Countdown
- expiry_status: ok, warning, critical, expired

## UI Design

### Route: /hr/skills

```
┌─────────────────────────────────────────────────────────────────┐
│ Skills Management                                    [Refresh]  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│ │ Total   │ │ Employees│ │ Expiring│ │ Skill   │                │
│ │ Skills  │ │ w/Skills │ │ Certs   │ │ Gaps    │                │
│ │   5     │ │    0     │ │    0    │ │    5    │                │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                │
├─────────────────────────────────────────────────────────────────┤
│ [Gap Analysis] [By Employee] [Expiring Certs] [Skills Library]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ GAP ANALYSIS TAB:                                               │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Skill              │ Required │ Have │ Coverage │ Gap       ││
│ │ Heavy Vehicle      │    15    │  12  │ ████ 80% │ ✅ Met    ││
│ │ First Aid          │    15    │  15  │█████100% │ ✅ Met    ││
│ │ Forklift           │    15    │   6  │ ██░ 40%  │ ⚠️ -10%   ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ RECOMMENDATIONS:                                                │
│ • Schedule crane rigging training - only 13% coverage          │
│ • 3 staff certifications expiring soon                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Structure

```
components/skills/
├── skills-dashboard.tsx      # Main container with tabs
├── skills-header.tsx         # Title and refresh button
├── skills-stats-cards.tsx    # Summary stat cards
├── gap-analysis-tab.tsx      # Coverage table + recommendations
├── employee-skills-tab.tsx   # Employee list + skill assignment
├── expiring-certifications-tab.tsx  # Expiry alerts
└── skills-library-tab.tsx    # All skills by category
```

## Server Actions

```typescript
// app/(main)/hr/skills/actions.ts
getSkillCategories()
getSkills()
getEmployeeSkills(employeeId)
addEmployeeSkill(formData)
updateEmployeeSkill(id, formData)
deleteEmployeeSkill(id)
bulkAssignSkill(data)
getSkillGapAnalysis()
getExpiringCertifications(daysAhead)
getSkillsStats()
getActiveEmployees()
```

## Utility Functions

```typescript
// lib/skills-utils.ts
criticalityConfig        // Display config for criticality levels
proficiencyConfig        // Display config for proficiency levels
expiryStatusConfig       // Display config for expiry status
getGapStatus()           // Calculate gap status (met/warning/critical)
getDaysUntilExpiry()     // Calculate days until expiry
getExpiryStatus()        // Determine expiry status from days
formatDaysUntilExpiry()  // Format days for display
calculateCoveragePercent()
sortByCriticality()
filterSkillsWithGaps()
getCoverageBarWidth()
getCoverageBarColor()
validateCertificationDates()
generateRecommendations()
```

## Types

```typescript
// types/skills.ts
SkillCriticality = 'low' | 'medium' | 'high' | 'critical'
ProficiencyLevel = 'basic' | 'intermediate' | 'advanced' | 'expert'
ExpiryStatus = 'ok' | 'warning' | 'critical' | 'expired'

SkillCategory
Skill
EmployeeSkill
SkillGapAnalysis
ExpiringCertification
SkillsStats
EmployeeSkillProfile
EmployeeSkillFormData
BulkSkillAssignment
```
