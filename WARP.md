# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core Commands

### Environment & dependencies
- Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Install dependencies:
  - `npm install`

### Running the app
- Development server (Turbo mode, default):
  - `npm run dev`
- Legacy dev server (without `next dev --turbo`):
  - `npm run dev:legacy`

### Build & production
- Create a production build:
  - `npm run build`
- Start the production server (after `npm run build`):
  - `npm run start`

### Linting
- Run the Next.js/ESLint lint suite:
  - `npm run lint`

### Tests (Vitest)
- Run the full test suite once:
  - `npm run test`
- Run tests in watch mode:
  - `npm run test:watch`
- Run a single test file:
  - `npm run test -- __tests__/accounting-transformer.property.test.ts`
- Run tests matching a specific test name (pattern):
  - `npm run test -- -t "matches something"`

### n8n workflows
- The `n8n-workflows/` directory is for optional external automation (document generation, accounting sync, GPS tracking, storage sync). It is configured and deployed separately from this Next.js app; see `n8n-workflows/README.md` for CLI import commands and required n8n environment variables.

## High-Level Architecture

### Overview
- Frontend is a Next.js 14 App Router application written in TypeScript, with Tailwind CSS and Shadcn/ui for styling and components.
- Backend/data layer is Supabase (Postgres + Auth + Storage) accessed via typed clients in `lib/supabase/` using the generated types in `types/database.ts`.
- Most domain and integration logic lives in `lib/` as small, focused modules (typically `*-utils.ts` and `*-actions.ts`), which are imported into route handlers and server components under `app/`.
- The UI component layer is under `components/` (Shadcn primitives in `components/ui`, domain-specific forms/tables/layouts in subfolders). Page-level routing and layout live in `app/`.

### Routing & UI layer (`app/` + `components/`)
- The App Router is organized around the main logistics flows in `app/(main)/`:
  - `dashboard` – role-based dashboards for owners, ops, finance, sales, managers, and admins.
  - `pjo` – Proforma Job Orders (quotations/estimates for jobs).
  - `jo` – Job Orders (actual execution of work).
  - `invoices` – customer invoicing flows.
  - `customers`, `projects`, `settings` – master data and configuration areas.
- `app/layout.tsx` defines the root HTML shell, global fonts (local Geist fonts), global CSS (`globals.css`), and optional Google Maps JS API loading when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is present.
- `components/` contains:
  - `components/ui/` – Shadcn/ui primitives.
  - Higher-level domain components (e.g., dashboard widgets, tables, forms, layout chrome) that compose these primitives and call into `lib/` utilities or server actions.

### Supabase access & data model (`lib/supabase/`, `types/database.ts`)
- Supabase clients are centralized:
  - `lib/supabase/server.ts` – wraps `createServerClient` from `@supabase/ssr`, wiring it to Next.js `cookies()` for auth on the server.
  - `lib/supabase/client.ts` – wraps `createBrowserClient` for client-side usage.
- All clients are parameterized with the generated `Database` type from `types/database.ts`, which maps the public schema (tables, inserts/updates, relationships).
- The database schema is fairly rich and covers multiple domains:
  - Core logistics: `customers`, `proforma_job_orders`, `job_orders`, `invoices`, `invoice_line_items`, `payments`, overhead-related tables, document attachments.
  - HR & payroll: `employees`, `departments`, `positions`, attendance/leave/payroll tables.
  - Notifications & activity: `notifications`, `notification_preferences`, `activity_log`.
  - Integrations & sync: `integration_connections`, `sync_mappings`, `sync_log`, `external_id_mappings`, plus configuration/support tables.
- Application code should import and use these typed clients instead of constructing raw Supabase clients directly, to keep auth and typing consistent.

### Document generation module (`lib/document-generator-actions.ts`)
- Central orchestration for generating PDFs for:
  - Invoices (`generateInvoice`)
  - Quotations (`generateQuotation`)
  - Delivery notes (`generateDeliveryNote`)
  - Generic documents (`generateDocument`), parameterized by template and entity type.
- Responsibilities of this module:
  - Fetch and validate document templates (via `getTemplateByCode` and `document_templates` table) and entity data (`invoices`, `quotations`, `job_orders`, line items, related customers/projects).
  - Build variable contexts (`InvoiceTemplateVariables`, `QuotationTemplateVariables`, `DeliveryNoteTemplateVariables`, etc.) from Supabase data.
  - Process HTML templates with variables (via `processTemplate` and `injectLetterhead`), inject optional CSS and company letterhead, and convert HTML to PDF via `convertToPDF` from `pdf-converter-utils`.
  - Upload generated PDFs to Supabase storage using `uploadDocument`, then write `generated_documents` records via `createGeneratedDocumentRecord`.
  - Optionally update source entities with `pdf_url` (e.g., invoices/quotations) and expose history queries (`getGenerationHistory`, `getGeneratedDocument`) over `generated_documents` with joined template/user metadata.
- This module is the main entry point when the app wants to generate documents directly, instead of going through the n8n workflows.

### External sync & integrations (`app/actions/sync-actions.ts` + `lib/sync-*`)
- `app/actions/sync-actions.ts` defines server actions for driving synchronization between Supabase tables and external systems (e.g., Accurate accounting, GPS providers, Google Drive), corresponding to the flows described in `n8n-workflows/README.md` (v0.69):
  - `triggerManualSync` – kicks off a sync for one integration connection (and optionally a specific mapping), creating a `sync_log` row and processing records according to `sync_mappings`.
  - `retryFailedSync` – reprocesses only failed records from a previous log, using error details stored in `sync_log.error_details`.
  - `getSyncStatus` / `cancelSync` – query and control the state of recent syncs per connection.
- These actions delegate most logic to helpers in `lib/`:
  - `lib/sync-engine` – defines the sync context, lifecycle, and type signatures (`SyncResult`, `SyncRecord`, `ExternalApiAdapter`, retry configs).
  - `lib/sync-log-utils` – shapes data written into `sync_log` (creation, completion, failure).
  - `lib/sync-mapping-utils` – applies mapping rules and filter conditions from `sync_mappings` to local records.
  - `lib/external-id-utils` – manages `external_id_mappings` lookups and updates.
- Conceptually, integrations follow this pattern:
  - `integration_connections` describe a connection (e.g., to Accurate, GPS, Google Drive) including OAuth/token state.
  - `sync_mappings` describe how a local table maps to an external resource and which records to sync.
  - Sync runs read local Supabase data, transform it to external payloads, simulate or call external APIs, and persist external IDs and error details back into Supabase for observability and retry.

### Dashboards & role-based experience (`app/(main)/dashboard`, `lib/*dashboard*`)
- `app/(main)/dashboard/page.tsx` is the central entry point for the main dashboard experience:
  - Uses `getUserProfile` from `lib/permissions-server` to determine the current user role and identity.
  - For `owner` users, eagerly fetches all dashboard data variants (ops, enhanced ops, finance, sales, sales-engineering, manager, admin, plus default KPIs and activity) via `Promise.all`, then renders `DashboardSelector` with all datasets.
  - For other roles (`ops`, `finance`, `sales`, `manager`, `admin`, `viewer`), fetches only the relevant subset of data and passes it to `DashboardSelector`.
  - Special-cases specific users (e.g., a marketing user who also manages engineering) to show a combined “sales-engineering” dashboard.
- Supporting utilities and actions live in `lib/` and local `app/(main)/dashboard/*` files:
  - `lib/ops-dashboard-utils`, `lib/ops-dashboard-enhanced-utils` – compute operational KPIs and queue data from Supabase.
  - `lib/onboarding-actions` – exposes user onboarding progress, consumed by dashboards.
  - `app/(main)/dashboard/actions.ts` and `sales-engineering-actions.ts` – route-local server actions for aggregating dashboard data.
- The common `DashboardSelector` component (under `components/dashboard/`) takes these different datasets and renders the appropriate dashboard layout based on props and role, keeping page logic thin.

### Testing strategy (`__tests__/`, `gama-erp/`, Vitest)
- Tests are written with Vitest and React Testing Library:
  - `vitest.config.ts` uses `@vitejs/plugin-react` and `jsdom` environment; it defines an alias `@` that points to the project root so tests can import application modules as `@/lib/...` or `@/app/...`.
  - `vitest.setup.ts` wires in `@testing-library/jest-dom/vitest` for DOM matchers.
- Test files live primarily under `__tests__/` and also under `gama-erp/` (older or domain-grouped tests). Naming conventions:
  - `*.test.ts` – regular unit tests.
  - `*.property.test.ts` – property-based tests using `fast-check` for pure logic (e.g., transformers, mappers, utilities).
- Many `lib/*-utils.ts` and `lib/*-actions.ts` modules have corresponding tests that exercise Supabase query shaping, transformations, and domain rules without hitting the live database (or by mocking the client).

### External automation vs in-app server actions
- For document generation and integrations there are *two* paths:
  - **n8n workflows** (under `n8n-workflows/`) provide HTTP webhook-based automations that can be called from Gama ERP or other systems and handle HTML → PDF, storage uploads, accounting sync, GPS sync, and storage backup.
  - **Built-in server actions** (e.g., `lib/document-generator-actions.ts`, `app/actions/sync-actions.ts`) expose the same or similar flows directly inside the Next.js app using Supabase and internal utilities, without going through n8n.
- When working in this repo, prefer using the in-app server actions for new UI features, and treat the n8n workflows as external automations or reference implementations unless a feature explicitly needs n8n.
