# Implementation Plan: Changelog Feature (v0.82)

## Overview

This implementation plan covers the Changelog Feature for GAMA ERP, providing a changelog page for users to view system updates and an admin interface for managing entries. The implementation follows existing GAMA ERP patterns with Server Components, Supabase, and shadcn/ui.

## Tasks

- [x] 1. Database setup and migrations
  - [x] 1.1 Create changelog_entries table migration
    - Create migration file with table schema, indexes, and constraints
    - Include category CHECK constraint for valid values
    - Add updated_at trigger
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 1.2 Create RLS policies migration
    - Add SELECT policy for all authenticated users
    - Add INSERT policy for owner, director, sysadmin
    - Add UPDATE policy for owner, director, sysadmin
    - Add DELETE policy for owner, director, sysadmin
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 1.3 Create initial data migration
    - Insert v0.33 GAMA ERP Launch entry (is_major: true)
    - Insert v0.34 Disbursement Module entry
    - Insert v0.35 Agency & Customs Roles entry
    - Insert v0.36 User Onboarding Fix entry (bugfix)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. TypeScript types and utilities
  - [x] 2.1 Create changelog types
    - Create types/changelog.ts with ChangelogEntry, ChangelogCategory, ChangelogEntryInput, GroupedChangelogEntries
    - _Requirements: 1.1, 3.2_
  
  - [x] 2.2 Create changelog utilities
    - Create lib/changelog-utils.ts with groupEntriesByMonth, getCategoryBadgeColor, formatPublishedDate, hasNewEntries
    - Define CHANGELOG_LAST_VIEWED_KEY constant
    - _Requirements: 3.2, 4.1, 4.2, 4.3, 4.4, 6.2_
  
  - [x] 2.3 Write property tests for changelog utilities
    - **Property 5: Entry Grouping** - verify groupEntriesByMonth groups correctly
    - **Property 8: Notification Dot Logic** - verify hasNewEntries logic
    - **Validates: Requirements 3.2, 6.2**

- [x] 3. Checkpoint - Verify database and utilities
  - Ensure migrations can be applied successfully
  - Ensure all tests pass, ask the user if questions arise

- [ ] 4. Changelog page components
  - [x] 4.1 Create category badge component
    - Create components/changelog/category-badge.tsx
    - Implement color mapping: feature=blue, bugfix=red, improvement=green, security=yellow
    - Use shadcn/ui Badge component
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.2 Create changelog timeline component
    - Create components/changelog/changelog-timeline.tsx
    - Display entries grouped by month/year with section headers
    - Show version, title, description (markdown), category badge, published date
    - Highlight major updates with visual styling
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [x] 4.3 Create last viewed updater component
    - Create components/changelog/last-viewed-updater.tsx (client component)
    - Update localStorage with current timestamp on mount
    - _Requirements: 6.1, 6.3_
  
  - [x] 4.4 Create changelog page
    - Create app/(main)/changelog/page.tsx as Server Component
    - Fetch entries ordered by published_at DESC
    - Use groupEntriesByMonth for grouping
    - Include LastViewedUpdater client component
    - _Requirements: 3.1, 9.2_
  
  - [x] 4.5 Write property tests for changelog display
    - **Property 4: Entry Ordering** - verify entries are ordered by published_at DESC
    - **Property 6: Display Completeness** - verify all required fields are displayed
    - **Validates: Requirements 3.1, 3.3, 3.5**

- [ ] 5. Sidebar navigation integration
  - [x] 5.1 Add "What's New" menu item to navigation
    - Update lib/navigation.ts to add menu item with SparklesIcon
    - Include all roles in the roles array
    - Set href to /changelog
    - Place in appropriate section (near Help)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 5.2 Create changelog notification hook
    - Create hooks/use-changelog-notification.ts
    - Read last viewed from localStorage
    - Fetch latest entry published_at via API
    - Return hasNewUpdates boolean and markAsViewed function
    - _Requirements: 6.1, 6.2_
  
  - [x] 5.3 Create API route for latest changelog entry
    - Create app/api/changelog/latest/route.ts
    - Return latest entry's published_at timestamp
    - _Requirements: 6.2_
  
  - [x] 5.4 Update sidebar to show notification dot
    - Modify sidebar component to use useChangelogNotification hook
    - Display notification dot when hasNewUpdates is true
    - _Requirements: 6.2, 6.4_
  
  - [x] 5.5 Write property tests for navigation
    - **Property 7: Navigation Visibility** - verify menu visible for all roles
    - **Validates: Requirements 5.2**

- [x] 6. Checkpoint - Verify changelog page and navigation
  - Test changelog page displays correctly
  - Test notification dot appears for new entries
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. Admin changelog editor
  - [x] 7.1 Create changelog server actions
    - Create app/(main)/admin/changelog/actions.ts
    - Implement createChangelogEntry, updateChangelogEntry, deleteChangelogEntry
    - Use revalidatePath for cache invalidation
    - _Requirements: 7.3_
  
  - [x] 7.2 Create changelog entry form component
    - Create components/changelog/changelog-entry-form.tsx
    - Include fields: Version, Title, Description (textarea), Category (dropdown), Is Major (checkbox)
    - Use shadcn/ui form components
    - _Requirements: 7.2_
  
  - [x] 7.3 Create changelog entry list component
    - Create components/changelog/changelog-entry-list.tsx
    - Display existing entries with edit and delete buttons
    - Include confirmation dialog for delete
    - _Requirements: 7.4_
  
  - [x] 7.4 Create admin changelog page
    - Create app/(main)/admin/changelog/page.tsx
    - Check admin access (owner, director, sysadmin)
    - Redirect non-admins to their dashboard
    - Include entry form and entry list
    - _Requirements: 7.1, 7.5_
  
  - [x] 7.5 Write property tests for admin access
    - **Property 9: Admin Access Control** - verify non-admins are redirected
    - **Property 10: Entry Creation Integrity** - verify entries are created correctly
    - **Validates: Requirements 7.1, 7.3, 7.5**

- [ ] 8. RLS and validation tests
  - [x] 8.1 Write property tests for RLS policies
    - **Property 1: Category Validation** - verify only valid categories accepted
    - **Property 2: RLS Read Access** - verify all authenticated users can read
    - **Property 3: RLS Write Access** - verify only admins can write
    - **Validates: Requirements 1.3, 2.1, 2.2, 2.3, 2.4**

- [x] 9. Final checkpoint - Complete feature verification
  - Run npm run build to verify no TypeScript errors
  - Test complete flow: admin creates entry, user views changelog
  - Test notification dot appears and clears correctly
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All components use existing shadcn/ui patterns from GAMA ERP
- Server Actions follow existing patterns with revalidatePath
