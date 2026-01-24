# Date & Currency Formatting Standards

When working with dates or currency in this codebase, always use the centralized formatting utilities from `lib/utils/format.ts`.

## Required Imports

```typescript
import { 
  formatDate,           // "15 Jan 2026" - for tables, cards, UI
  formatDateTime,       // "15 Jan 2026, 14:30" - with time
  formatTime,           // "14:30" - time only
  formatRelative,       // "2 hari yang lalu" - Indonesian relative
  formatDocumentDate,   // "15 Januari 2026" - formal documents/PDFs
  toInputDate,          // "2026-01-15" - HTML form inputs
  toFileDate,           // "20260115" - file naming
  toFileDateTime,       // "20260115_143022" - file naming with time
  formatCurrency,       // "Rp 1.500.000" - full currency
  formatCurrencyShort,  // "Rp 1,5 jt" - compact for dashboards
  formatNumber,         // "1.500.000" - number with separators
  formatPercent,        // "75,5%" - percentage
} from '@/lib/utils/format'
```

## DO NOT Use

- ❌ `toLocaleDateString()` - inconsistent across browsers
- ❌ `new Intl.DateTimeFormat()` directly - use centralized functions
- ❌ `formatIDR` or `formatDate` from `lib/pjo-utils.ts` - deprecated
- ❌ Manual date string formatting with template literals
- ❌ Direct `format()` from date-fns without locale

## Examples

```typescript
// ✅ Correct
<span>{formatDate(job.created_at)}</span>
<span>{formatCurrency(invoice.total_amount)}</span>

// ❌ Wrong
<span>{new Date(job.created_at).toLocaleDateString()}</span>
<span>{`Rp ${invoice.total_amount.toLocaleString()}`}</span>
```

## Null Handling

All formatting functions handle null/undefined gracefully:
- Date functions return `"-"` for invalid/missing dates
- `toInputDate` returns `""` (empty string) for form compatibility
- Currency functions return `"Rp 0"` for null/undefined
- Number functions return `"0"` for null/undefined
