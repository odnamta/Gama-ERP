# Continuity Ledger

## Goal
Create spec v0.66: n8n Automation - Workflow Foundation for Gama ERP. Establish foundational n8n integration including webhook endpoints, database triggers, event queue, and core workflow patterns.

## Constraints/Assumptions
- Next.js 15 + TypeScript + Supabase stack
- n8n provides visual workflow builder for automation
- Must integrate with existing ERP tables (job_orders, invoices, incidents)
- RLS policies required on all new tables

## Key Decisions
- Using event queue pattern for async processing
- Database triggers to capture events automatically
- Exponential backoff for retry logic
- All property tests required (comprehensive testing)

## State
- Done: All v0.66 tasks complete - database schema, types, utils, actions, property tests
- Now: Push to GitHub
- Next: Complete

## Open Questions
- None

## Working Set
- .kiro/specs/v0.66-n8n-automation-foundation/
- types/automation.ts
- lib/automation-utils.ts, webhook-actions.ts, event-queue-actions.ts
- lib/webhook-executor.ts, automation-log-actions.ts
- lib/template-management-actions.ts, automation-stats-actions.ts
- __tests__/*automation*.property.test.ts

## Goal
Implement v0.65: AI Insights - Automated Alerts & Reports ✅ COMPLETE
- Automated alerting system based on KPIs, thresholds, and AI insights
- Scheduled report generation with PDF/Excel delivery
- Alert dashboard with acknowledge/resolve workflow

## Constraints/Assumptions
- Next.js 15 + TypeScript + Supabase stack
- Depends on existing KPI definitions from v0.61 executive dashboard
- Uses existing notification infrastructure from v0.40
- PDF generation using existing lib/pdf infrastructure
- Supabase project ID: ljbkjtaowrdddvjhsygj

## Key Decisions
- All property tests required (comprehensive testing from start)
- 14 correctness properties defined, 8 implemented as tests
- 4 database tables: alert_rules, alert_instances, scheduled_reports, report_history
- Integration with existing notification service
- Using `(supabase as any)` for new tables until types regenerated

## State
- Done: All tasks 1-13 complete
- Now: Push to GitHub
- Next: v0.66 or user's next request

## Open Questions
- (none)

## Working Set
- lib/alert-utils.ts ✅
- lib/alert-actions.ts ✅
- lib/alert-notification-utils.ts ✅
- lib/scheduled-report-utils.ts ✅
- lib/scheduled-report-actions.ts ✅
- types/alerts.ts ✅
- types/scheduled-reports.ts ✅
- __tests__/alert-utils.property.test.ts ✅ (8 tests passing)
- components/alerts/* ✅
- app/(main)/dashboard/alerts/* ✅
- app/(main)/dashboard/reports/scheduled/* ✅
