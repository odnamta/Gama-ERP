# Database Schema Reference

> Complete schema reference for GAMA ERP (299 tables). Use this instead of querying Supabase for schema discovery.

---

## Core Business Tables

### job_orders
Primary table for job order management.
```
id, jo_number, pjo_id, customer_id, project_id, description, amount (budget), status,
final_cost, equipment_cost, total_overhead, completed_at, submitted_to_finance_at,
workflow_status, checked_by, checked_at, approved_by, approved_at, rejected_by, rejected_at,
rejection_reason, has_berita_acara, has_surat_jalan, requires_berita_acara,
invoice_terms (Json), created_at, updated_at
```
- **Status values**: `active`, `completed`, `submitted_to_finance`, `invoiced`, `closed`
- **Workflow status**: `draft`, `pending_check`, `pending_approval`, `approved`, `rejected`
- **FORBIDDEN columns** (revenue data - hide from ops roles): `final_revenue`, `net_profit`, `net_margin`, `total_invoiced`, `invoiceable_amount`
- **FK**: customer_id → customers, project_id → projects, pjo_id → proforma_job_orders

### proforma_job_orders
Pre-job planning and cost estimation.
```
id, pjo_number, customer_id, project_id, quotation_id, description, estimated_amount,
status, workflow_status, pol, pod, pol_lat, pol_lng, pod_lat, pod_lng,
cargo_weight_kg, cargo_length_m, cargo_width_m, cargo_height_m, cargo_value,
commodity, quantity, quantity_unit, market_type, terrain_type, carrier_type,
is_hazardous, is_new_route, requires_special_permit, requires_engineering,
engineering_status, engineering_assigned_to, engineering_notes,
complexity_score, complexity_factors (Json), duration_days, etd, eta,
total_cost_estimated, total_cost_actual, total_revenue, total_expenses, profit,
converted_to_jo, job_order_id, jo_date, is_active,
checked_by, checked_at, approved_by, approved_at, rejected_by, rejected_at, rejection_reason,
created_by, created_at, updated_at
```
- **Status values**: `draft`, `pending_approval`, `approved`, `rejected`, `converted`
- **Engineering status**: `not_required`, `pending`, `in_progress`, `completed`, `waived`
- **Market type**: `domestic`, `international`
- **FK**: customer_id → customers, project_id → projects, quotation_id → quotations

### quotations
Sales quotations and proposals.
```
id, quotation_number, customer_id, project_id, title, origin, destination,
origin_lat, origin_lng, destination_lat, destination_lng,
cargo_weight_kg, cargo_length_m, cargo_width_m, cargo_height_m, cargo_value,
commodity, market_type, terrain_type, is_hazardous, is_new_route, requires_special_permit,
requires_engineering, engineering_status, engineering_assigned_to, engineering_notes,
complexity_score, complexity_factors (Json), duration_days, estimated_shipments,
total_cost, total_revenue, gross_profit, profit_margin, total_pursuit_cost,
status, rfq_number, rfq_date, rfq_deadline, rfq_received_date,
submitted_at, submitted_to, outcome_date, outcome_reason,
is_active, created_by, created_at, updated_at
```
- **Status values**: `draft`, `engineering_review`, `ready`, `submitted`, `won`, `lost`, `cancelled`
- **FK**: customer_id → customers, project_id → projects

### invoices
Customer invoices linked to job orders.
```
id, invoice_number, jo_id, customer_id, invoice_date, due_date,
subtotal, tax_amount, total_amount, amount_paid, status,
invoice_term, term_description, term_percentage,
sent_at, paid_at, cancelled_at, notes, created_at, updated_at
```
- **Status values**: `draft`, `sent`, `paid`, `overdue`, `cancelled`
- **FK**: jo_id → job_orders, customer_id → customers

### bkk_records (Bukti Kas Keluar - Cash Disbursements)
Cash outflow/payment records.
```
id, bkk_number, job_order_id, vendor_id, vendor_invoice_id, amount, currency,
description, payment_method, bank_account, reference_number,
workflow_status, is_active,
checked_by, checked_at, approved_by, approved_at, paid_by, paid_at,
rejected_by, rejected_at, rejection_reason,
created_by, created_at, updated_at
```
- **Workflow status**: `draft`, `pending_check`, `pending_approval`, `approved`, `paid`, `rejected`
- **Payment methods**: `cash`, `transfer`, `check`
- **FK**: job_order_id → job_orders, vendor_id → vendors

---

## Customer & Vendor Tables

### customers
```
id, name, email, phone, address, is_active, created_at, updated_at
```
- **Soft delete**: Use `is_active = true` filter

### vendors
```
id, vendor_code, vendor_name, vendor_type, legal_name, address, city, province, postal_code,
phone, email, website, contact_person, contact_phone, contact_email, contact_position,
tax_id, business_license, bank_name, bank_branch, bank_account, bank_account_name,
is_active, is_preferred, is_verified, verified_by, verified_at,
average_rating, on_time_rate, total_jobs, total_value, notes, registration_method,
created_by, created_at, updated_at
```
- **Vendor types**: `trucking`, `shipping`, `customs_broker`, `warehouse`, `port_services`, `other`
- **FK**: created_by → user_profiles, verified_by → user_profiles

### projects
```
id, customer_id, name, description, status, is_active, created_at, updated_at
```
- **Status values**: `active`, `completed`, `on_hold`, `cancelled`
- **FK**: customer_id → customers

---

## HR & Employee Tables

### employees
```
id, employee_code, full_name, nickname, user_id, department_id, position_id,
email, phone, address, city, date_of_birth, place_of_birth, gender, religion, marital_status,
id_number, tax_id, bank_name, bank_account, bank_account_name,
join_date, end_date, resignation_date, resignation_reason, employment_type, status,
base_salary, salary_currency, schedule_id, reporting_to,
emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
photo_url, documents (Json), notes, created_by, created_at, updated_at
```
- **Status values**: `active`, `inactive`, `resigned`, `terminated`
- **Employment types**: `permanent`, `contract`, `probation`, `intern`
- **FK**: department_id → departments, position_id → positions, user_id → user_profiles

### departments
```
id, department_code, department_name, parent_department_id, manager_id, is_active, created_at
```
- **FK**: parent_department_id → departments (self-ref), manager_id → employees

### positions
```
id, position_code, position_name, department_id, level, salary_min, salary_max, is_active, created_at
```
- **FK**: department_id → departments

### leave_requests
```
id, request_number, employee_id, leave_type_id, start_date, end_date, total_days,
is_half_day, half_day_type, reason, handover_to, handover_notes, emergency_contact,
attachment_url, status, approved_by, approved_at, rejection_reason, created_at, updated_at
```
- **Status values**: `pending`, `approved`, `rejected`, `cancelled`
- **FK**: employee_id → employees, leave_type_id → leave_types, handover_to → employees

### attendance_records
```
id, employee_id, attendance_date, clock_in, clock_out, clock_in_location, clock_out_location,
work_hours, overtime_hours, late_minutes, early_leave_minutes, status,
is_corrected, corrected_by, correction_reason, notes, created_at, updated_at
```
- **Status values**: `present`, `absent`, `late`, `half_day`, `leave`, `holiday`
- **FK**: employee_id → employees

---

## Asset & Equipment Tables

### assets
```
id, asset_code, asset_name, category_id, description, brand, model, year_manufactured,
registration_number, chassis_number, engine_number, vin_number, color,
capacity_tons, capacity_cbm, length_m, width_m, height_m, weight_kg, axle_configuration,
purchase_date, purchase_price, purchase_vendor, purchase_invoice,
depreciation_method, depreciation_start_date, useful_life_years, salvage_value,
accumulated_depreciation, book_value, current_units, total_expected_units,
registration_expiry_date, kir_expiry_date, insurance_expiry_date,
insurance_provider, insurance_policy_number, insurance_value,
status, current_location_id, assigned_to_employee_id, assigned_to_job_id,
photos (Json), documents (Json), notes, created_by, created_at, updated_at
```
- **Status values**: `available`, `in_use`, `maintenance`, `repair`, `retired`, `sold`
- **Depreciation methods**: `straight_line`, `declining_balance`, `units_of_production`
- **FK**: category_id → asset_categories, current_location_id → asset_locations

### asset_assignments
```
id, asset_id, job_order_id, project_id, employee_id, location_id, assignment_type,
assigned_from, assigned_to, start_km, end_km, km_used, start_hours, end_hours, hours_used,
assigned_by, notes, created_at
```
- **Assignment types**: `job`, `project`, `employee`, `location`
- **FK**: asset_id → assets, job_order_id → job_orders, employee_id → employees

### maintenance_records
```
id, record_number, asset_id, maintenance_type_id, schedule_id, maintenance_date,
description, status, technician_name, technician_employee_id,
workshop_name, workshop_address, odometer_km, hour_meter,
parts_cost, labor_cost, external_cost, total_cost, bkk_id,
started_at, completed_at, performed_at, findings, recommendations,
photos (Json), documents (Json), notes, created_by, created_at, updated_at
```
- **Status values**: `scheduled`, `in_progress`, `completed`, `cancelled`
- **FK**: asset_id → assets, maintenance_type_id → maintenance_types, bkk_id → bkk_records

### asset_categories
```
id, category_code, category_name, description, parent_category_id, display_order,
default_useful_life_years, default_depreciation_method, default_total_units, is_active, created_at
```

---

## User & Auth Tables

### user_profiles
```
id, user_id, email, full_name, avatar_url, role, is_active,
can_create_pjo, can_fill_costs, can_estimate_costs, can_see_actual_costs,
can_check_pjo, can_approve_pjo, can_check_jo, can_approve_jo,
can_check_bkk, can_approve_bkk, can_manage_invoices, can_manage_users,
can_see_revenue, can_see_profit, department_scope (array),
custom_homepage, custom_dashboard, preferences (Json),
last_login_at, created_at, updated_at
```
- **Roles**: `owner`, `director`, `sysadmin`, `marketing_manager`, `finance_manager`, `operations_manager`, `administration`, `finance`, `marketing`, `ops`, `engineer`, `hr`, `hse`, `agency`, `customs`
- **Note**: `user_id` links to Supabase Auth

---

## Customs Tables

### pib_documents (Import Declaration)
```
id, internal_ref, pib_number, aju_number, importer_name, importer_npwp, importer_address,
supplier_name, supplier_country, customer_id, job_order_id,
bill_of_lading, awb_number, vessel_name, voyage_number, transport_mode,
port_of_loading, port_of_discharge, customs_office_id, eta_date, ata_date,
currency, exchange_rate, fob_value, freight_value, insurance_value, cif_value, cif_value_idr,
bea_masuk, ppn, pph_import, total_duties, import_type_id,
gross_weight_kg, total_packages, package_type, documents (Json),
status, submitted_at, sppb_number, sppb_date, released_at, duties_paid_at,
notes, created_by, created_at, updated_at
```
- **Status values**: `draft`, `submitted`, `checking`, `approved`, `released`, `cancelled`
- **FK**: customer_id → customers, job_order_id → job_orders

### peb_documents (Export Declaration)
Similar structure for export documentation.

### customs_fees
```
id, document_type, pib_id, peb_id, job_order_id, fee_type_id, amount, currency,
description, payment_status, payment_method, payment_date, payment_reference,
ntpn, ntb, billing_code, receipt_url, vendor_id, vendor_invoice_number,
notes, created_by, created_at, updated_at
```
- **Document types**: `pib`, `peb`
- **Payment status**: `unpaid`, `paid`, `cancelled`

---

## Cost & Revenue Items Tables

### pjo_cost_items
Cost line items for PJO estimation.
```
id, pjo_id, category, description, estimated_amount, actual_amount,
variance, variance_pct, status, vendor_id, vendor_equipment_id,
estimated_by, confirmed_by, confirmed_at, justification, notes, created_at, updated_at
```
- **Categories**: `trucking`, `port_charges`, `documentation`, `handling`, `customs`, `insurance`, `storage`, `labor`, `fuel`, `tolls`, `other`
- **Status values**: `estimated`, `confirmed`, `actual`
- **FK**: pjo_id → proforma_job_orders, vendor_id → vendors

### pjo_revenue_items
Revenue line items for PJO.
```
id, pjo_id, description, quantity, unit, unit_price, subtotal,
source_type, source_id, notes, created_at, updated_at
```
- **FK**: pjo_id → proforma_job_orders

### quotation_cost_items
Cost estimates for quotations.
```
id, quotation_id, category, description, estimated_amount, display_order,
vendor_id, vendor_name, notes, created_at, updated_at
```
- **FK**: quotation_id → quotations, vendor_id → vendors

### quotation_revenue_items
Revenue line items for quotations.
```
id, quotation_id, category, description, quantity, unit, unit_price, subtotal,
display_order, notes, created_at, updated_at
```
- **FK**: quotation_id → quotations

---

## Supporting Tables

### activity_log
```
id, document_type, document_id, document_number, action_type, user_id, user_name, details (Json), created_at
```

### notifications
```
id, user_id, title, message, type, is_read, link, metadata (Json), created_at
```

### leave_types
```
id, type_code, type_name, default_days_per_year, is_paid, requires_approval,
requires_attachment, allow_carry_over, max_carry_over_days, min_days_advance, is_active, created_at
```

### maintenance_types
```
id, type_code, type_name, description, category, default_interval_days,
default_interval_km, default_interval_hours, is_active, created_at
```

### overhead_categories
```
id, category_code, category_name, description, allocation_method, is_active, created_at
```

---

## Common Patterns

### Soft Delete
All major tables use `is_active` boolean:
```sql
SELECT * FROM customers WHERE is_active = true;
```

### Entity Isolation
Some tables have `entity_type` for multi-tenant separation:
```sql
-- RLS handles this automatically
SELECT * FROM table WHERE entity_type = 'gama_main';
```
- **Values**: `gama_main`, `gama_agency`

### Timestamps
- All tables have `created_at`
- Most have `updated_at`
- Workflow tables have `checked_at`, `approved_at`, `rejected_at`, `paid_at`

### UUIDs
All primary keys are UUID type (auto-generated).

### JSON Columns
Used for flexible data: `documents`, `photos`, `preferences`, `details`, `metadata`, `complexity_factors`

---

## Key Relationships

```
quotations → proforma_job_orders → job_orders → invoices
                                 ↓
                            bkk_records
                                 ↓
                              vendors

customers → projects → job_orders
                    → proforma_job_orders
                    → quotations

employees → departments → positions
         → attendance_records
         → leave_requests

assets → asset_assignments → job_orders
      → maintenance_records
      → asset_categories
```

---

## Status Workflows

### Quotation Flow
`draft` → `engineering_review` → `ready` → `submitted` → `won`/`lost`/`cancelled`

### PJO Flow
`draft` → `pending_approval` → `approved` → `converted` (to JO)
                            → `rejected`

### Job Order Flow
`active` → `completed` → `submitted_to_finance` → `invoiced` → `closed`

### Invoice Flow
`draft` → `sent` → `paid`
               → `overdue`
               → `cancelled`

### BKK Flow
`draft` → `pending_check` → `pending_approval` → `approved` → `paid`
                                              → `rejected`

---

*Last Updated: January 2026*
*Total Tables: 299*
