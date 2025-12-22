# Implementation Plan: HSE PPE Management

## Overview

This implementation plan breaks down the PPE Management module into incremental coding tasks. Each task builds on previous work, ensuring no orphaned code. The implementation follows the existing Gama ERP patterns using Next.js App Router, Supabase, and shadcn/ui components.

## Tasks

- [x] 1. Database schema and types setup
  - [x] 1.1 Apply database migration for PPE tables
    - Create ppe_types, ppe_inventory, ppe_issuance, ppe_inspections tables
    - Create indexes and views (ppe_replacement_due, employee_ppe_status)
    - Insert default PPE types
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 6.1_
  - [x] 1.2 Create TypeScript types for PPE entities
    - Create types/ppe.ts with all interfaces and type definitions
    - Include PPEType, PPEInventory, PPEIssuance, PPEInspection, view types
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Core utility functions
  - [x] 2.1 Implement PPE utility functions in lib/ppe-utils.ts
    - Implement category helpers, replacement date calculation, stock status
    - Implement compliance status calculation, condition utilities, formatters
    - _Requirements: 1.2, 2.3, 3.3, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 2.2 Write property tests for PPE utilities
    - **Property 2: PPE Category Validation**
    - **Property 4: Low Stock Detection**
    - **Property 7: Replacement Date Calculation**
    - **Property 11: Compliance Status Calculation**
    - **Property 12: Compliance Issue Counting**
    - **Validates: Requirements 1.2, 2.3, 3.3, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 3. Server actions for PPE management
  - [x] 3.1 Implement PPE type server actions in lib/ppe-actions.ts
    - createPPEType, updatePPEType, deletePPEType (soft-delete)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 3.2 Implement inventory server actions
    - updateInventory, adjustStock, recordPurchase
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [x] 3.3 Implement issuance server actions
    - issuePPE (with stock decrement), returnPPE (with stock increment)
    - replacePPE, markPPELost, markPPEDamaged
    - _Requirements: 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [x] 3.4 Implement inspection server actions
    - recordInspection, updateInspectionAction
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 3.5 Write property tests for server actions
    - **Property 5: Stock Decrement on Issuance**
    - **Property 6: Stock Increment on Return**
    - **Property 8: Issuance Status Validation**
    - **Property 9: Inspection Enum Validation**
    - **Validates: Requirements 2.6, 2.7, 3.6, 4.2, 4.4**

- [x] 4. Checkpoint - Core functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. PPE Types management UI
  - [x] 5.1 Create PPE type form component
    - Create components/ppe/ppe-type-form.tsx
    - Form fields for all PPE type properties with validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 5.2 Create PPE types table component
    - Create components/ppe/ppe-type-table.tsx
    - Display PPE types with category badges, edit/delete actions
    - _Requirements: 1.7_
  - [x] 5.3 Create PPE types management page
    - Create app/(main)/hse/ppe/types/page.tsx
    - Wire form and table components
    - _Requirements: 1.1-1.7_

- [x] 6. Inventory management UI
  - [x] 6.1 Create inventory form and table components
    - Create components/ppe/inventory-form.tsx for stock updates
    - Create components/ppe/inventory-table.tsx with low stock alerts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 6.2 Create inventory management page
    - Create app/(main)/hse/ppe/inventory/page.tsx
    - Show stock levels, reorder alerts, purchase recording
    - _Requirements: 2.1-2.5_

- [x] 7. PPE Issuance UI
  - [x] 7.1 Create issuance form component
    - Create components/ppe/issuance-form.tsx
    - Employee selector, PPE type selector, size picker, date fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 7.2 Create issuance table and detail components
    - Create components/ppe/issuance-table.tsx for list view
    - Create components/ppe/issuance-detail.tsx for single issuance
    - Create components/ppe/return-form.tsx for returns
    - _Requirements: 3.5, 3.6, 3.7_
  - [x] 7.3 Create issuance pages
    - Create app/(main)/hse/ppe/issuance/page.tsx for list
    - Create app/(main)/hse/ppe/issuance/[id]/page.tsx for detail
    - _Requirements: 3.1-3.7_

- [x] 8. Inspection records UI
  - [x] 8.1 Create inspection components
    - Create components/ppe/inspection-form.tsx
    - Create components/ppe/inspection-history.tsx
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 8.2 Integrate inspections into issuance detail page
    - Add inspection form and history to issuance detail
    - _Requirements: 4.6_

- [x] 9. Checkpoint - CRUD operations complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Compliance and replacement tracking UI
  - [x] 10.1 Create compliance table component
    - Create components/ppe/compliance-table.tsx
    - Show employee PPE status with missing/overdue/due_soon badges
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 10.2 Create replacement due table component
    - Create components/ppe/replacement-due-table.tsx
    - Show PPE due for replacement with days overdue
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 10.3 Create compliance and replacement pages
    - Create app/(main)/hse/ppe/compliance/page.tsx
    - Create app/(main)/hse/ppe/replacement/page.tsx
    - _Requirements: 5.1-5.5, 6.1-6.6_
  - [x] 10.4 Write property tests for compliance views
    - **Property 3: Soft-Delete Filtering**
    - **Property 10: Replacement Due Filtering**
    - **Validates: Requirements 1.7, 5.1, 5.2, 5.5**

- [x] 11. PPE Dashboard
  - [x] 11.1 Create dashboard components
    - Create components/ppe/ppe-dashboard-cards.tsx for metrics
    - Create components/ppe/ppe-alerts-list.tsx for alerts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 11.2 Create PPE dashboard page
    - Create app/(main)/hse/ppe/page.tsx
    - Display metrics cards and alert lists with navigation
    - _Requirements: 7.1-7.6_

- [x] 12. Navigation integration
  - [x] 12.1 Add PPE menu items to HSE navigation
    - Update navigation to include PPE submenu under HSE
    - Add routes: Dashboard, Types, Inventory, Issuance, Compliance, Replacement
    - _Requirements: 7.6_

- [x] 13. Final checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows existing Gama ERP patterns for consistency
