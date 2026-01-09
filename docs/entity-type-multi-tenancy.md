# Entity Type Multi-Tenancy Implementation

**Implementation Date:** 2026-01-09
**Version:** 1.0
**Status:** Production Ready

## Overview

This document describes the soft multi-tenancy pattern implemented in Gama ERP to logically separate data between **Gama Main** (logistics operations) and **Gama Agency** (shipping/agency division).

## Architecture

### Soft Multi-Tenancy Pattern

We use a column-based approach where a single `entity_type` column on each table determines which business entity owns the record:

- `gama_main` - Main logistics business operations
- `gama_agency` - Shipping agency division operations

### Why Soft Multi-Tenancy?

**Advantages:**
- Single database infrastructure (lower costs)
- Consolidated reporting across entities (owner/director view)
- Simple backup/recovery
- Easy to implement (4 hours vs 4 weeks for full separation)
- Can migrate to hard multi-tenancy later if needed

**Trade-offs:**
- Relies on RLS policies for data isolation
- Requires careful testing to ensure proper filtering
- Schema changes affect all tenants

## Database Schema

### Tables with entity_type Column

The following tables have the `entity_type` column added:

#### Core Business Tables
- `customers` - Customer records
- `quotations` - Sales quotations
- `proforma_job_orders` - PJO records
- `job_orders` - Job order records
- `invoices` - Customer invoices
- `bkk_records` - Cash disbursement records
- `payments` - Payment records

#### Agency-Specific Tables (Always 'gama_agency')
- `shipping_lines`
- `bookings`
- `bl_documentation`
- `manifests`
- `vessel_schedules`
- `container_tracking`
- `port_agents`
- `service_providers`
- `shipping_rates`

### Column Specification

```sql
entity_type VARCHAR(20) DEFAULT 'gama_main' NOT NULL
CHECK (entity_type IN ('gama_main', 'gama_agency'))
```

### Indexes

All tables with `entity_type` have an index for query performance:

```sql
CREATE INDEX idx_{table}_entity_type ON {table}(entity_type);
```

## Row-Level Security (RLS) Policies

### Policy Logic

**Owner and Director roles:**
- Can see ALL records (both `gama_main` and `gama_agency`)
- Can create records in either entity
- Full system oversight

**Agency role:**
- Can ONLY see `gama_agency` records
- Can ONLY create `gama_agency` records
- Isolated to agency operations

**All other roles (marketing, finance, operations, etc.):**
- Can ONLY see `gama_main` records
- Can ONLY create `gama_main` records
- Isolated to main business operations

### Policy Implementation

For each table with `entity_type`, four policies are created:

1. **SELECT policy** - Controls which records users can view
2. **INSERT policy** - Controls which entity_type users can create
3. **UPDATE policy** - Controls which records users can modify
4. **DELETE policy** - Usually restricted to owner/director only

Example for `customers` table:

```sql
CREATE POLICY "Users can view customers based on entity_type" ON customers
FOR SELECT USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE  -- See everything

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'  -- Agency data only

    ELSE entity_type = 'gama_main'  -- Main business data only
  END
);
```

## Application Code Implementation

### Auto-Setting entity_type in Actions

All server actions that create records automatically set the correct `entity_type`:

#### Pattern 1: Based on User Role (Standalone Records)

For records created directly by users (customers, quotations):

```typescript
// Example: app/(main)/customers/actions.ts
export async function createCustomer(data: CustomerFormData) {
  const supabase = await createClient()
  const profile = await getUserProfile()
  const entityType = profile?.role === 'agency' ? 'gama_agency' : 'gama_main'

  await supabase.from('customers').insert({
    ...data,
    entity_type: entityType,
  })
}
```

#### Pattern 2: Inherited from Parent Record

For records derived from other records (PJO from quotation, invoice from JO):

```typescript
// Example: Converting quotation to PJO
const { data: quotation } = await supabase
  .from('quotations')
  .select('*, entity_type')
  .eq('id', quotationId)
  .single()

await supabase.from('proforma_job_orders').insert({
  ...pjoData,
  entity_type: quotation.entity_type || 'gama_main',
})
```

#### Pattern 3: Conditional Inheritance

For records that may or may not have a parent (BKK with/without JO):

```typescript
// Example: app/(main)/disbursements/actions.ts
let entityType = 'gama_main'

if (input.job_order_id) {
  // Inherit from Job Order
  const { data: jo } = await supabase
    .from('job_orders')
    .select('entity_type')
    .eq('id', input.job_order_id)
    .single()

  entityType = jo?.entity_type || 'gama_main'
} else {
  // Determine from user role
  const profile = await getUserProfile()
  entityType = profile?.role === 'agency' ? 'gama_agency' : 'gama_main'
}

await supabase.from('bkk_records').insert({
  ...data,
  entity_type: entityType,
})
```

### Files Modified

The following action files were updated to include entity_type logic:

1. `app/(main)/customers/actions.ts` - Customer CRUD
2. `app/(main)/quotations/actions.ts` - Quotation CRUD and convert to PJO
3. `app/(main)/invoices/actions.ts` - Invoice creation from JO
4. `app/(main)/disbursements/actions.ts` - Disbursement/BKK creation

## User Roles

### New Roles Added

Two new roles support the multi-tenancy pattern:

- **`agency`** - Agency division staff (bookings, B/L, container tracking)
- **`customs`** - Customs clearance staff (PIB, PEB, duties, HS codes)

Both roles automatically create records with `entity_type = 'gama_agency'`.

### Role Hierarchy

```
Owner/Director (Full Access)
├── Gama Main Operations
│   ├── marketing_manager
│   ├── finance_manager
│   ├── operations_manager
│   ├── marketing
│   ├── administration
│   ├── finance
│   ├── ops
│   ├── engineer
│   ├── hr
│   └── hse
│
└── Gama Agency Operations
    ├── agency
    └── customs
```

## Testing the Implementation

### Test Scenarios

**Scenario 1: Agency User Creates Customer**

```sql
-- Login as agency user
-- Create customer via UI or API

-- Verify entity_type
SELECT name, entity_type FROM customers WHERE id = '{new_customer_id}';
-- Expected: entity_type = 'gama_agency'
```

**Scenario 2: Marketing User Cannot See Agency Customers**

```sql
-- Login as marketing user
-- Query customers table

SELECT COUNT(*) FROM customers WHERE entity_type = 'gama_agency';
-- Expected: 0 (RLS policy blocks access)
```

**Scenario 3: Owner Sees Both Entities**

```sql
-- Login as owner
-- Query customers table

SELECT entity_type, COUNT(*) FROM customers GROUP BY entity_type;
-- Expected: Both 'gama_main' and 'gama_agency' counts visible
```

**Scenario 4: Quotation → PJO → JO → Invoice Chain**

```sql
-- Create quotation as marketing (entity_type = 'gama_main')
-- Convert to PJO (should inherit 'gama_main')
-- Convert to JO (should inherit 'gama_main')
-- Create invoice (should inherit 'gama_main')

SELECT
  q.entity_type as quot_entity,
  pjo.entity_type as pjo_entity,
  jo.entity_type as jo_entity,
  i.entity_type as inv_entity
FROM quotations q
LEFT JOIN proforma_job_orders pjo ON pjo.quotation_id = q.id
LEFT JOIN job_orders jo ON jo.pjo_id = pjo.id
LEFT JOIN invoices i ON i.jo_id = jo.id
WHERE q.id = '{quotation_id}';

-- Expected: All entity_type columns = 'gama_main'
```

## Migration Instructions

### 1. Run Database Migrations

Execute both migration files in order:

```bash
# Apply migrations via Supabase CLI
supabase db push

# Or manually in Supabase Studio SQL Editor:
# 1. Run: supabase/migrations/20260109_add_entity_type.sql
# 2. Run: supabase/migrations/20260109_add_entity_type_rls.sql
```

### 2. Verify Migrations

```sql
-- Check entity_type column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customers' AND column_name = 'entity_type';

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE policyname LIKE '%entity_type%';

-- Verify indexes
SELECT indexname FROM pg_indexes
WHERE indexname LIKE '%entity_type%';
```

### 3. Test Application Code

```bash
# Run type checking
npm run type-check

# Run tests if available
npm run test

# Start development server
npm run dev
```

### 4. Data Validation

```sql
-- Check existing data (should all be 'gama_main' after migration)
SELECT
  'customers' as table_name, entity_type, COUNT(*)
FROM customers
GROUP BY entity_type

UNION ALL

SELECT
  'quotations' as table_name, entity_type, COUNT(*)
FROM quotations
GROUP BY entity_type

UNION ALL

SELECT
  'invoices' as table_name, entity_type, COUNT(*)
FROM invoices
GROUP BY entity_type;
```

## Dashboard Impact

### Finance Manager Dashboard

The Finance Manager dashboard may need updates to filter by entity_type:

```typescript
// Example: Separate metrics for each entity
const mainMetrics = await supabase
  .from('invoices')
  .select('*')
  .eq('entity_type', 'gama_main')
  .eq('status', 'draft')

const agencyMetrics = await supabase
  .from('invoices')
  .select('*')
  .eq('entity_type', 'gama_agency')
  .eq('status', 'draft')
```

### Owner Dashboard

Owner dashboard should aggregate across both entities:

```typescript
// No entity_type filter needed - RLS allows owner to see all
const allMetrics = await supabase
  .from('invoices')
  .select('*')
  .eq('status', 'draft')
// Returns both gama_main and gama_agency records
```

## Future Considerations

### When to Consider Full Separation

If the following conditions arise, consider migrating to hard multi-tenancy:

1. **Regulatory compliance** requires complete data isolation
2. **Performance degradation** due to RLS overhead (unlikely with proper indexes)
3. **Different SLA requirements** for each entity
4. **Independent scaling needs**
5. **Separate deployment schedules** required

### Migration Path to Hard Multi-Tenancy

If full separation is needed in the future:

1. The `entity_type` column makes data export simple:
```sql
-- Export Gama Agency data
COPY (SELECT * FROM customers WHERE entity_type = 'gama_agency') TO 'agency_customers.csv';
```

2. Create separate database for agency
3. Import agency data
4. Update application to route requests based on subdomain/tenant
5. Remove agency data from main database

**Cost:** ~4 weeks of development + infrastructure setup

## Troubleshooting

### Issue: User Cannot See Records They Created

**Cause:** RLS policy filtering by entity_type
**Solution:** Verify user role matches entity_type of records

```sql
-- Check user profile
SELECT role FROM user_profiles WHERE user_id = auth.uid();

-- Check record entity_type
SELECT entity_type FROM customers WHERE id = '{record_id}';
```

### Issue: Agency Records Showing in Main Business Reports

**Cause:** Report query missing entity_type filter or user has owner/director role
**Solution:** Add explicit filter for reports:

```sql
-- Filter for main business only
WHERE entity_type = 'gama_main'
```

### Issue: entity_type Not Set on New Records

**Cause:** Missing entity_type in insert statement
**Solution:** Check server action includes entity_type determination logic

## Support

For questions or issues with the entity_type implementation:

1. Check this documentation first
2. Review RLS policies in Supabase dashboard
3. Check server action code for entity_type logic
4. Test with different user roles to verify RLS filtering

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-09 | 1.0 | Initial implementation of entity_type multi-tenancy |
