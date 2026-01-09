# Bug Catching Method Review
**Date:** 2026-01-09
**System:** Gama ERP v0.9.11

## 📊 CURRENT STATE

### ✅ What You Have (GOOD)

**1. Custom Error Classes** (`lib/error-handling/errors.ts`)
- ✅ Structured error types: ValidationError, NotFoundError, AuthorizationError, ConflictError
- ✅ HTTP status code mapping (400, 404, 403, 409)
- ✅ Context data for debugging
- ✅ Type guards for error identification
- ✅ Factory methods for common errors

**2. Error Tracking Infrastructure**
- ✅ Database table: `error_tracking`
- ✅ Error dashboard UI: `/admin/errors`
- ✅ Error status workflow: new → investigating → resolved/ignored
- ✅ Error grouping by hash (deduplication)
- ✅ Occurrence counting

**3. Server Action Error Handling Pattern**
- ✅ Consistent return: `{ success: boolean, error?: string, data?: T }`
- ✅ Console.error logging in most actions
- ✅ Validation before database operations

**Example (Good):**
```typescript
export async function createInvoice(data: InvoiceFormData) {
  try {
    // validation logic
    const { data: invoice, error } = await supabase.from('invoices').insert(...)

    if (error) {
      console.error('Error creating invoice:', error)
      return { error: error.message }
    }

    return { data: invoice }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'Failed to create invoice' }
  }
}
```

---

## ⚠️ GAPS IDENTIFIED

### 1. ❌ Errors Not Being Logged to Database

**Problem:**
- You have an `error_tracking` table
- You have server actions to query it (`error-tracking-actions.ts`)
- You have a dashboard to view errors (`/admin/errors`)
- **BUT:** No code is actually INSERTING errors into the table!

**Current Flow:**
```
Error occurs → console.error() → Lost in server logs ❌
```

**Should Be:**
```
Error occurs → console.error() → INSERT into error_tracking → Dashboard shows it ✅
```

**Impact:**
- Errors are invisible in production
- No alerting when things break
- Can't track error frequency
- Team won't see issues until users complain

---

### 2. ❌ No Global Error Boundary

**Problem:**
- React component errors crash the entire page
- No fallback UI for users
- No error reporting

**Missing Files:**
- `app/error.tsx` (page-level error boundary)
- `app/global-error.tsx` (root error boundary)

**What Happens Now:**
```
Component throws error → White screen → User confused ❌
```

**Should Be:**
```
Component throws error → Fallback UI → Error logged → User sees "Something went wrong" ✅
```

---

### 3. ❌ No Client-Side Error Reporting

**Problem:**
- Browser errors (JavaScript errors, network failures) are not captured
- No visibility into client-side issues

**Example Missing:**
```typescript
// Client-side error boundary that sends errors to server
useEffect(() => {
  window.addEventListener('error', (event) => {
    reportErrorToServer({
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href
    })
  })
}, [])
```

---

### 4. ⚠️ Inconsistent Error Handling

**Problem:**
- Some actions use try/catch, some don't
- Some log errors, some silently fail
- No standardized error response format in all files

**Example of Inconsistency:**
```typescript
// File A: Good
try {
  const result = await doSomething()
  if (error) return { error: error.message }
} catch (err) {
  console.error('Error:', err)
  return { error: 'Failed' }
}

// File B: Missing error handling
const result = await doSomething() // Could throw, no try/catch!
return result
```

---

### 5. ❌ No Error Monitoring/Alerting

**Problem:**
- Errors happen silently
- No notifications to developers
- No real-time monitoring

**What You Need:**
- Email/Slack alerts for critical errors
- Daily error digest
- Error rate monitoring

---

## 🔧 RECOMMENDED FIXES

### Priority 1: AUTO-LOG ERRORS TO DATABASE (HIGH)

**Create:** `lib/error-handling/error-logger.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { getErrorCode } from './errors'

interface ErrorLogData {
  errorMessage: string
  errorStack?: string
  errorType?: string
  module: string
  userId?: string
  context?: Record<string, unknown>
}

export async function logError(data: ErrorLogData) {
  const supabase = await createClient()

  // Generate error hash for deduplication
  const errorHash = generateHash(data.errorMessage + data.errorStack)

  // Check if error already exists
  const { data: existing } = await supabase
    .from('error_tracking')
    .select('id, occurrence_count')
    .eq('error_hash', errorHash)
    .single()

  if (existing) {
    // Update occurrence count
    await supabase
      .from('error_tracking')
      .update({
        occurrence_count: (existing.occurrence_count || 0) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    // Insert new error
    await supabase
      .from('error_tracking')
      .insert({
        error_hash: errorHash,
        error_code: getErrorCode(data.errorMessage),
        error_message: data.errorMessage,
        error_stack: data.errorStack,
        error_type: data.errorType,
        module: data.module,
        status: 'new',
        occurrence_count: 1,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        context: data.context,
      })
  }
}

function generateHash(input: string): string {
  // Simple hash for deduplication
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}
```

**Then Update All Server Actions:**
```typescript
import { logError } from '@/lib/error-handling/error-logger'

export async function createInvoice(data: InvoiceFormData) {
  try {
    // ... existing logic
  } catch (error) {
    console.error('Error creating invoice:', error)

    // NEW: Log to database
    await logError({
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: 'invoice_creation_failed',
      module: 'invoices',
      context: { invoiceData: data }
    })

    return { error: 'Failed to create invoice' }
  }
}
```

---

### Priority 2: ADD ERROR BOUNDARIES (HIGH)

**Create:** `app/error.tsx`
```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to server
    fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: window.location.href,
      }),
    })
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-4">
        We've been notified and are looking into it.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

**Create:** `app/global-error.tsx`
```typescript
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Application Error</h1>
            <p className="mb-4">Something went wrong. Please try refreshing the page.</p>
            <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded">
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
```

**Create:** `app/api/errors/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/error-handling/error-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    await logError({
      errorMessage: body.message,
      errorStack: body.stack,
      errorType: 'client_error',
      module: 'browser',
      context: {
        url: body.url,
        digest: body.digest,
        userAgent: request.headers.get('user-agent'),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to log client error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

---

### Priority 3: ADD CLIENT ERROR TRACKING (MEDIUM)

**Create:** `components/providers/error-tracking-provider.tsx`
```typescript
'use client'

import { useEffect } from 'react'

export function ErrorTrackingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Global error handler
    const errorHandler = (event: ErrorEvent) => {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          url: window.location.href,
        }),
      })
    }

    // Unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          url: window.location.href,
        }),
      })
    }

    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', rejectionHandler)

    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  return <>{children}</>
}
```

**Add to:** `app/layout.tsx`
```typescript
import { ErrorTrackingProvider } from '@/components/providers/error-tracking-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorTrackingProvider>
          {children}
        </ErrorTrackingProvider>
      </body>
    </html>
  )
}
```

---

### Priority 4: ADD ERROR ALERTING (MEDIUM)

**Create:** `lib/error-handling/error-alerting.ts`
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

// Check for critical errors every 5 minutes
export async function checkForCriticalErrors() {
  const supabase = await createClient()

  // Get new critical errors in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: criticalErrors } = await supabase
    .from('error_tracking')
    .select('*')
    .eq('status', 'new')
    .gte('first_seen_at', fiveMinutesAgo)
    .in('error_type', ['database_error', 'auth_error', 'payment_error'])

  if (criticalErrors && criticalErrors.length > 0) {
    // Send alert (email, Slack, etc.)
    await sendAlert({
      title: `${criticalErrors.length} Critical Errors Detected`,
      errors: criticalErrors,
    })
  }
}

async function sendAlert(data: { title: string; errors: unknown[] }) {
  // Option 1: Email via Supabase Edge Function
  // Option 2: Slack webhook
  // Option 3: Discord webhook

  // Example: Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: data.title,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*${data.title}*` },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: data.errors.map((e: any) => `• ${e.error_message}`).join('\n'),
            },
          },
        ],
      }),
    })
  }
}
```

**Add to:** `supabase/functions/scheduled-error-check/index.ts` (cron job)
```typescript
import { checkForCriticalErrors } from '@/lib/error-handling/error-alerting'

// Run every 5 minutes via Supabase cron
Deno.serve(async () => {
  await checkForCriticalErrors()
  return new Response('OK')
})
```

---

## 📈 IMPLEMENTATION PRIORITY

### Phase 1 (This Week - 2 hours)
1. ✅ Create `error-logger.ts` helper
2. ✅ Add error boundaries (`error.tsx`, `global-error.tsx`)
3. ✅ Create `/api/errors` route
4. ✅ Update 2-3 critical server actions to use error logger

**Impact:** Catch 80% of errors immediately

### Phase 2 (Next Week - 2 hours)
1. ✅ Add `ErrorTrackingProvider` for client errors
2. ✅ Update all remaining server actions
3. ✅ Add error alerting (Slack/email)

**Impact:** 95% error coverage + alerting

### Phase 3 (Future - 1 hour)
1. ✅ Error analytics dashboard
2. ✅ Error rate trending
3. ✅ Automated error categorization

**Impact:** Proactive issue detection

---

## 🎯 SUCCESS METRICS

**Before (Current State):**
- ❌ Errors logged: 0 (only console.error)
- ❌ Error visibility: Developer must check server logs
- ❌ Error response time: Hours/days (when users complain)
- ❌ Error tracking: None

**After (Phase 1):**
- ✅ Errors logged: 80%+ to database
- ✅ Error visibility: Dashboard at `/admin/errors`
- ✅ Error response time: Minutes (via dashboard)
- ✅ Error tracking: Automatic deduplication + counting

**After (Phase 2):**
- ✅ Errors logged: 95%+ (server + client)
- ✅ Error visibility: Real-time Slack alerts
- ✅ Error response time: Immediate (alert pings team)
- ✅ Error tracking: Full context + user info

---

## 💡 QUICK WINS

**1. Start Logging Critical Paths (30 min)**
Add error logging to these high-value actions:
- `createInvoice` (invoices/actions.ts)
- `createCustomer` (customers/actions.ts)
- `createDisbursement` (disbursements/actions.ts)
- `getHRDashboardMetrics` (hr-dashboard-data.ts)
- `getFinanceManagerMetrics` (finance-manager-data.ts)

**2. Add Error Boundary to Dashboard (15 min)**
Create `app/(main)/dashboard/error.tsx` so dashboard errors don't crash the app

**3. Weekly Error Review (5 min/week)**
Check `/admin/errors` every Monday morning
Mark errors as resolved/investigating

---

## 🚨 CRITICAL RECOMMENDATION

**DO THIS BEFORE YOUR MEETING:**

Add error logging to the two dashboards you just built:

**File:** `lib/dashboard/finance-manager-data.ts`
```typescript
export async function getFinanceManagerMetrics() {
  try {
    // ... existing code
  } catch (error) {
    console.error('Finance dashboard error:', error)

    // Log to database
    await logError({
      errorMessage: error instanceof Error ? error.message : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: 'dashboard_error',
      module: 'finance_manager_dashboard',
    })

    // Return empty metrics so page doesn't crash
    return {
      pendingPJOs: 0,
      draftInvoices: 0,
      // ... all zeros
    }
  }
}
```

**Same for:** `lib/dashboard/hr-dashboard-data.ts`

**Why:** If either dashboard breaks during your demo, the error will be logged and the page will show zeros instead of crashing!

---

## 📚 SUMMARY

**You Have (Good Foundation):**
- ✅ Error classes
- ✅ Error tracking table
- ✅ Error dashboard UI

**You're Missing (Critical Gaps):**
- ❌ Automatic error logging to database
- ❌ Error boundaries
- ❌ Client error tracking
- ❌ Error alerting

**Recommendation:**
- Implement Phase 1 this week (2 hours)
- Phase 2 next week (2 hours)
- Total effort: 4 hours for production-grade error tracking

**ROI:**
- Catch bugs before users report them
- Reduce debugging time from hours to minutes
- Track error trends over time
- Proactive issue resolution

---

## 🔗 NEXT STEPS

1. Review this document with your team
2. Decide: Implement now or after meeting?
3. If implementing: Start with Priority 1 (error-logger.ts)
4. If deferring: Add to backlog as "Error Monitoring Enhancement"

Good luck with your meeting! 🚀
