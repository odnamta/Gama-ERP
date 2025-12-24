# n8n Workflows for Gama ERP

This directory contains n8n workflow JSON files for automated document generation and external system integrations in Gama ERP.

## Overview

### Document Generation Workflows
- **Invoices** - Customer billing documents
- **Quotations** - Sales proposals and price quotes
- **Delivery Notes** - Cargo handover documentation

### External Integration Workflows (v0.69)
- **Accounting Sync** - Synchronize invoices, payments, and customers with Accurate Online
- **GPS Tracking** - Pull location data from GPS tracking systems
- **Storage Sync** - Backup documents to Google Drive

## Prerequisites

Before importing the workflows, ensure you have:

1. **n8n Instance** - Self-hosted or n8n Cloud
2. **Supabase Project** - With the document generation tables created
3. **HTML2PDF API** - External service for HTML to PDF conversion

## Environment Variables

Configure the following environment variables in your n8n instance:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://ljbkjtaowrdddvjhsygj.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (for storage) | `eyJhbGciOiJIUzI1NiIs...` |
| `HTML2PDF_API_URL` | HTML to PDF conversion API endpoint | `https://api.html2pdf.app/v1/generate` |
| `HTML2PDF_API_KEY` | API key for HTML2PDF service | `your-api-key` |
| `ACCURATE_API_URL` | Accurate Online API base URL | `https://api.accurate.id` |
| `GPS_API_URL` | GPS tracking provider API URL | `https://api.gps-provider.com` |

### Setting Environment Variables in n8n

1. Go to **Settings** → **Variables**
2. Add each variable with its value
3. Variables are referenced in workflows using `$env.VARIABLE_NAME`

## Credentials Setup

### 1. Supabase API Credential

Create a credential of type **Supabase API**:

- **Name**: `Supabase API`
- **Host**: Your Supabase URL (e.g., `https://ljbkjtaowrdddvjhsygj.supabase.co`)
- **Service Role Key**: Your Supabase service role key

### 2. Supabase Storage Credential

Create a credential of type **HTTP Header Auth**:

- **Name**: `Supabase Storage API Key`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer YOUR_SUPABASE_SERVICE_KEY`

### 3. HTML2PDF API Credential

Create a credential of type **HTTP Header Auth**:

- **Name**: `HTML2PDF API Key`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer YOUR_HTML2PDF_API_KEY`

### 4. Accurate Online API Credential (for Accounting Sync)

Create a credential of type **HTTP Header Auth**:

- **Name**: `Accurate API Key`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer YOUR_ACCURATE_API_KEY`

### 5. GPS Tracking API Credential (for GPS Tracking)

Create a credential of type **HTTP Header Auth**:

- **Name**: `GPS API Key`
- **Header Name**: `X-API-Key`
- **Header Value**: `YOUR_GPS_API_KEY`

### 6. Google Drive OAuth2 Credential (for Storage Sync)

Create a credential of type **Google Drive OAuth2 API**:

- **Name**: `Google Drive OAuth2`
- Follow Google's OAuth2 setup process to obtain client ID and secret
- Grant access to Google Drive API

## Importing Workflows

### Method 1: Import via n8n UI

1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Select the workflow JSON file
4. Click **Import**
5. Update credential references to match your configured credentials

### Method 2: Import via n8n CLI

```bash
# Import invoice workflow
n8n import:workflow --input=invoice-generation-workflow.json

# Import quotation workflow
n8n import:workflow --input=quotation-generation-workflow.json

# Import delivery note workflow
n8n import:workflow --input=delivery-note-generation-workflow.json

# Import external integration workflows
n8n import:workflow --input=accounting-sync-workflow.json
n8n import:workflow --input=gps-tracking-workflow.json
n8n import:workflow --input=storage-sync-workflow.json
```

## Workflow Files

### 1. Invoice Generation (`invoice-generation-workflow.json`)

Generates PDF invoices from invoice records.

**Webhook Endpoint**: `POST /webhook/generate-invoice`

**Request Body**:
```json
{
  "invoice_id": "uuid-of-invoice",
  "user_id": "uuid-of-user"
}
```

**Response**:
```json
{
  "success": true,
  "document": {
    "id": "generated-document-id",
    "file_url": "https://supabase.../invoice/2025/01/INV-2025-0001_1234567890.pdf",
    "file_name": "INV-2025-0001_1234567890.pdf",
    "document_number": "INV-2025-0001",
    "generated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Flow**:
1. Webhook receives request with invoice_id and user_id
2. Validates input parameters
3. Fetches invoice data with customer and job order relations
4. Fetches invoice line items
5. Fetches INV_STANDARD template
6. Builds variable context (invoice_number, customer_name, items, totals, etc.)
7. Processes template with variable substitution
8. Converts HTML to PDF via HTML2PDF API
9. Uploads PDF to Supabase storage
10. Creates generated_documents record
11. Updates invoice with pdf_url
12. Returns success response

### 2. Quotation Generation (`quotation-generation-workflow.json`)

Generates PDF quotations from quotation records.

**Webhook Endpoint**: `POST /webhook/generate-quotation`

**Request Body**:
```json
{
  "quotation_id": "uuid-of-quotation",
  "user_id": "uuid-of-user"
}
```

**Response**:
```json
{
  "success": true,
  "document": {
    "id": "generated-document-id",
    "file_url": "https://supabase.../quotation/2025/01/QUO-2025-0001_1234567890.pdf",
    "file_name": "QUO-2025-0001_1234567890.pdf",
    "document_number": "QUO-2025-0001",
    "generated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Flow**:
1. Webhook receives request with quotation_id and user_id
2. Validates input parameters
3. Fetches quotation data with customer and project relations
4. Fetches quotation revenue items
5. Fetches QUOTE_STANDARD template
6. Builds variable context (quotation_number, customer_name, items, scope, terms, etc.)
7. Processes template with variable substitution
8. Converts HTML to PDF via HTML2PDF API
9. Uploads PDF to Supabase storage
10. Creates generated_documents record
11. Updates quotation with pdf_url
12. Returns success response

### 3. Delivery Note Generation (`delivery-note-generation-workflow.json`)

Generates PDF delivery notes from job order records.

**Webhook Endpoint**: `POST /webhook/generate-delivery-note`

**Request Body**:
```json
{
  "jo_id": "uuid-of-job-order",
  "user_id": "uuid-of-user"
}
```

**Response**:
```json
{
  "success": true,
  "document": {
    "id": "generated-document-id",
    "file_url": "https://supabase.../delivery_note/2025/01/DN-JO-0001_1234567890.pdf",
    "file_name": "DN-JO-0001_1234567890.pdf",
    "document_number": "DN-JO-0001/CARGO/I/2025",
    "generated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Flow**:
1. Webhook receives request with jo_id and user_id
2. Validates input parameters
3. Fetches job order data with PJO and customer relations
4. Fetches DN_STANDARD template
5. Builds variable context (dn_number, jo_number, origin, destination, items, etc.)
6. Processes template with variable substitution
7. Converts HTML to PDF via HTML2PDF API
8. Uploads PDF to Supabase storage
9. Creates generated_documents record
10. Returns success response

## Database Requirements

Ensure the following tables exist in your Supabase database:

### document_templates
Stores HTML templates for document generation.

### generated_documents
Tracks all generated documents with metadata.

### Storage Bucket
Create a storage bucket named `generated-documents` with public access for generated PDFs.

```sql
-- Create storage bucket (run in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-documents', 'generated-documents', true);

-- Create storage policy for authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-documents');

-- Create storage policy for public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-documents');
```

## HTML2PDF API Options

The workflows support the following PDF options from templates:

| Option | Description | Values |
|--------|-------------|--------|
| `page_size` | Paper size | `A4`, `Letter`, `Legal` |
| `orientation` | Page orientation | `portrait`, `landscape` |
| `margins` | Page margins in mm | `{ top, right, bottom, left }` |
| `header_html` | Header HTML for each page | HTML string |
| `footer_html` | Footer HTML for each page | HTML string |

## Recommended HTML2PDF Services

- [HTML2PDF.app](https://html2pdf.app) - Simple API, good for basic documents
- [PDFShift](https://pdfshift.io) - High-quality rendering
- [DocRaptor](https://docraptor.com) - Enterprise-grade
- [Gotenberg](https://gotenberg.dev) - Self-hosted option

## Troubleshooting

### Common Issues

1. **Credential not found**
   - Ensure credentials are created with exact names referenced in workflows
   - Update credential IDs in workflow JSON if needed

2. **Storage upload fails**
   - Verify storage bucket exists and has correct policies
   - Check service role key has storage permissions

3. **PDF conversion fails**
   - Verify HTML2PDF API URL and key are correct
   - Check API rate limits and quotas

4. **Template not found**
   - Ensure default templates (INV_STANDARD, QUOTE_STANDARD, DN_STANDARD) exist
   - Verify templates are marked as `is_active = true`

### Debugging

Enable workflow execution logging in n8n:
1. Go to **Settings** → **Workflow Settings**
2. Enable **Save Execution Progress**
3. Check execution history for detailed error messages

## Integration with Gama ERP

The workflows are designed to be called from the Gama ERP application:

```typescript
// Example: Trigger invoice generation from Next.js
async function generateInvoicePDF(invoiceId: string, userId: string) {
  const response = await fetch('https://your-n8n-instance/webhook/generate-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId, user_id: userId })
  });
  
  return response.json();
}
```

Alternatively, use the built-in server actions in `lib/document-generator-actions.ts` which provide the same functionality without n8n.

---

## External Integration Workflows (v0.69)

### 4. Accounting Sync (`accounting-sync-workflow.json`)

Synchronizes invoices, payments, and customers with Accurate Online accounting software.

**Webhook Endpoint**: `POST /webhook/sync-accounting`

**Request Body**:
```json
{
  "event_type": "invoice|payment|customer",
  "entity_id": "uuid-of-entity",
  "connection_id": "uuid-of-integration-connection",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "sync_log_id": "uuid-of-sync-log",
  "entity_type": "invoice",
  "entity_id": "uuid-of-entity",
  "operation": "create|update",
  "synced_at": "2025-01-15T10:30:00.000Z"
}
```

**Flow**:
1. Webhook receives request with event_type, entity_id, and connection_id
2. Validates input parameters
3. Routes to appropriate handler based on event_type (invoice/payment/customer)
4. Fetches entity data from Supabase
5. Transforms data to Accurate Online format
6. Checks external_id_mappings to determine create vs update
7. Sends data to Accurate Online API
8. Creates/updates external_id_mapping record
9. Logs sync operation to sync_log table
10. Returns success/error response

**Supported Event Types**:
- `invoice` - Syncs invoice with line items
- `payment` - Syncs payment records
- `customer` - Syncs customer master data

### 5. GPS Tracking (`gps-tracking-workflow.json`)

Pulls location data from GPS tracking systems on a scheduled interval.

**Trigger**: Schedule (every 5 minutes by default)

**Flow**:
1. Schedule trigger fires at configured interval
2. Fetches all active tracking integration connections
3. For each connection:
   - Fetches device-to-asset mappings from sync_mappings
   - Calls GPS provider API to get latest locations
   - Validates GPS data (coordinates, speed, heading)
   - Transforms data to Gama format
   - Updates asset current location in assets table
   - Inserts location history records
   - Logs sync operation with success/partial/failed status
   - Updates connection last_sync_at timestamp

**GPS Data Fields**:
- `device_id` - GPS device identifier
- `latitude`, `longitude` - Coordinates
- `altitude` - Elevation (optional)
- `speed` - Speed in km/h (optional)
- `heading` - Direction in degrees 0-360 (optional)
- `accuracy` - GPS accuracy in meters (optional)
- `timestamp` - Data timestamp

**Error Handling**:
- Invalid coordinates are logged and skipped
- Connection failures update last_error on connection
- Partial failures (some devices fail) result in 'partial' status

### 6. Storage Sync (`storage-sync-workflow.json`)

Backs up documents to Google Drive with automatic folder structure.

**Webhook Endpoint**: `POST /webhook/sync-storage`

**Request Body**:
```json
{
  "document_id": "uuid-of-attachment",
  "connection_id": "uuid-of-storage-connection",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "document_id": "uuid-of-attachment",
  "drive_file_id": "google-drive-file-id",
  "drive_web_link": "https://drive.google.com/file/d/.../view",
  "folder_path": "Gama ERP Documents/Invoices/2025/01-January/Customer Name/Invoices",
  "operation": "create|update",
  "synced_at": "2025-01-15T10:30:00.000Z"
}
```

**Flow**:
1. Webhook receives request with document_id and connection_id
2. Validates input parameters
3. Fetches document metadata from attachments table
4. Fetches connection configuration
5. Generates folder path based on configuration:
   - Root folder name
   - Entity type folder (Customers, Projects, etc.)
   - Year folder (2025)
   - Month folder (01-January)
   - Entity name folder
   - Document type folder
6. Checks external_id_mappings for existing sync
7. If new: Creates folder structure, downloads file, uploads to Drive
8. If existing: Updates file metadata in Drive
9. Creates/updates external_id_mapping with Drive file ID
10. Updates attachment with sync_status and external_file_link
11. Logs sync operation
12. Returns success/error response

**Folder Structure Configuration** (in connection config):
```json
{
  "folder_id": "google-drive-root-folder-id",
  "root_folder_name": "Gama ERP Documents",
  "use_year_folders": true,
  "use_month_folders": true,
  "use_entity_folders": true,
  "folder_naming_pattern": "entity_name"
}
```

---

## Database Requirements for External Integrations

### integration_connections
Stores connection configurations for external systems.

### sync_mappings
Defines field mappings between local and external entities.

### sync_log
Tracks all synchronization operations with status and statistics.

### external_id_mappings
Maps local record IDs to external system IDs.

### location_history (for GPS tracking)
Stores historical GPS location data for assets.

---

## Integration with Gama ERP

### Triggering External Sync from Next.js

```typescript
// Example: Trigger accounting sync when invoice is created
async function syncInvoiceToAccounting(invoiceId: string, connectionId: string) {
  const response = await fetch('https://your-n8n-instance/webhook/sync-accounting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'invoice',
      entity_id: invoiceId,
      connection_id: connectionId,
      timestamp: new Date().toISOString()
    })
  });
  
  return response.json();
}

// Example: Trigger document backup to Google Drive
async function backupDocumentToDrive(documentId: string, connectionId: string) {
  const response = await fetch('https://your-n8n-instance/webhook/sync-storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      connection_id: connectionId,
      timestamp: new Date().toISOString()
    })
  });
  
  return response.json();
}
```

Alternatively, use the built-in server actions in `app/actions/sync-actions.ts` which provide the same functionality.

## License

These workflows are part of the Gama ERP project.
