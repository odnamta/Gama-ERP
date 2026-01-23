# Implementation Plan: Operations Manager Dashboard Real Data

## Overview

Convert the Operations Manager dashboard from hardcoded mock data to real Supabase queries. The dashboard displays job metrics, asset/equipment status, team utilization, and cost tracking. **CRITICAL: Operations Manager CANNOT see revenue, profit, or invoice data.**

## Tasks

- [x] 1. Create the Operations Manager data service
  - [x] 1.1 Create `lib/operations-manager-dashboard-utils.ts` with TypeScript interfaces
    - Define JobMetrics, AssetMetrics, TeamMetrics, CostMetrics, KPIMetrics interfaces
    - Define RecentJob, RecentBKK interfaces
    - Define OperationsManagerDashboardData main interface
    - Export all interfaces for use in dashboard page
    - _Requirements: 1.1-1.4, 2.1-2.5, 3.1-3.4, 4.1-4.3, 5.1-5.3_
  
  - [x] 1.2 Implement `getJobMetrics()` function
    - Query job_orders for active count (status = 'active')
    - Query job_orders for pending handover count (status = 'completed')
    - Query job_orders for completed MTD (completed_at in current month)
    - Calculate status breakdown grouped by status
    - Use Promise.all for parallel queries
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 1.3 Implement `getAssetMetrics()` function
    - Query assets for total count and assigned count (assigned_to_job_id IS NOT NULL)
    - Calculate utilization rate as (assigned / total) * 100
    - Count assets with expiring documents (7-day window for registration, kir, insurance)
    - Calculate status breakdown grouped by asset status
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 1.4 Implement `getTeamMetrics()` function
    - Query employees for active count (status = 'active')
    - Query asset_assignments joined with job_orders to find assigned employees
    - Handle timestamp comparison for assigned_to field
    - Calculate utilization rate as (assigned / total) * 100
    - Use distinct employee IDs to avoid double-counting
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 1.5 Implement `getCostMetrics()` function (NO REVENUE)
    - Query job_orders for amount (budget) and final_cost ONLY
    - NEVER query final_revenue, net_profit, net_margin, or invoice data
    - Calculate total budget and total spent for active jobs
    - Calculate budget utilization as (spent / budget) * 100
    - Count over-budget jobs where final_cost > amount
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 1.6 Implement `getKPIMetrics()` function
    - Calculate cost efficiency from cost metrics (budget remaining percentage)
    - Calculate equipment uptime from asset metrics (available percentage)
    - Return placeholder values (0) for on-time delivery and safety score
    - Clamp cost efficiency between 0-100%
    - _Requirements: 2.4_
  
  - [x] 1.7 Implement `getRecentJobs()` function
    - Query 5 most recently updated job_orders
    - Join with customers table for customer name
    - Return id, jo_number, customer_name, status, updated_at
    - _Requirements: 5.1_
  
  - [x] 1.8 Implement `getRecentBKK()` function
    - Query 5 most recent bkk_records where is_active = true
    - Return id, bkk_number, description, amount, created_at
    - _Requirements: 5.2_
  
  - [x] 1.9 Implement `getOperationsManagerDashboardData()` main function with caching
    - Use generateCacheKey with 'ops-manager-dashboard' prefix
    - Use getOrFetch with 5-minute TTL
    - Fetch all metrics in parallel using Promise.all
    - Return complete OperationsManagerDashboardData object
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Checkpoint - Verify data service
  - Run TypeScript check to ensure no type errors
  - Verify all functions are exported correctly

- [x] 3. Update the Operations Manager dashboard page
  - [x] 3.1 Import and call `getOperationsManagerDashboardData()` in the server component
    - Import the data service function
    - Fetch metrics after auth/role check
    - _Requirements: 7.1_
  
  - [x] 3.2 Replace mock values in Operations section
    - Update "Active Jobs" card with `jobMetrics.activeJobs`
    - Update "Pending Handover" card with `jobMetrics.pendingHandover`
    - Update "Team Utilization" card with `teamMetrics.utilizationRate`
    - _Requirements: 7.2_
  
  - [x] 3.3 Replace mock values in Assets section
    - Update "Equipment Status" card with `assetMetrics.availableAssets / assetMetrics.totalAssets`
    - Update "Maintenance Due" card with `assetMetrics.maintenanceDue`
    - Update "Asset Utilization" card with `assetMetrics.utilizationRate`
    - _Requirements: 7.2_
  
  - [x] 3.4 Replace mock values in KPI section
    - Update "Cost Efficiency" card with `kpiMetrics.costEfficiency`
    - Update "Equipment Uptime" card with `kpiMetrics.equipmentUptime`
    - Show placeholder text for On-Time Delivery and Safety Score (not yet implemented)
    - _Requirements: 7.2, 7.5_
  
  - [x] 3.5 Add error handling with try-catch
    - Wrap data fetching in try-catch block
    - Log errors for debugging
    - Show fallback UI on error
    - _Requirements: 7.4_

- [x] 4. Checkpoint - Verify dashboard integration
  - Test dashboard loads with real data
  - Verify no revenue data is displayed

- [x] 5. Final verification and build
  - [x] 5.1 Run `npm run build` to verify no TypeScript errors
    - Fix any type inference issues with explicit casts if needed
  
  - [x] 5.2 Test dashboard as operations_manager role
    - Verify all metrics display real data
    - Verify NO revenue, profit, or invoice data is visible
    - Verify dashboard loads within 2 seconds
    - Verify cache works (subsequent loads are faster)

- [x] 6. Final checkpoint
  - Ensure build passes
  - Confirm all acceptance criteria met

## Notes

- **CRITICAL**: Operations Manager role CANNOT see revenue, profit, or invoice totals
- Follow the pattern from `lib/dashboard/finance-manager-data.ts` for consistency
- Use explicit type casts for Supabase queries to avoid "type instantiation too deep" errors
- Currency formatting should use existing `formatCurrencyIDR` utility from `lib/utils/format.ts`
- asset_assignments.assigned_to is timestamp with time zone, not date

## Implementation Summary

**Files Created:**
- `lib/operations-manager-dashboard-utils.ts` - Data service with 8 functions and 8 interfaces

**Files Modified:**
- `app/(main)/dashboard/operations-manager/page.tsx` - Updated to use real data

**Build Status:** ✅ Passed (0 TypeScript errors)
