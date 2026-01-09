# Performance Optimization Backlog

**Current Status:** 95-97/100 Lighthouse (Production Ready)
**Last Updated:** January 9, 2026

---

## Prioritization Framework

Only pursue these if:
1. Real users report slowness
2. Monitoring shows regression
3. Business requirements demand it

**Do NOT optimize for the sake of optimization.**

---

## Quick Wins (If Needed)

### 1. Add robots.txt
- **Effort:** 5 minutes
- **Impact:** SEO improvement
- **Priority:** Low (SEO already 91/100)

```txt
# robots.txt
User-agent: *
Allow: /
Sitemap: https://gama-erp.com/sitemap.xml
```

### 2. Add main landmark
- **Effort:** 10 minutes
- **Impact:** Accessibility (98 → 100)
- **Priority:** Low

```tsx
// app/(main)/layout.tsx
<main className="flex-1 overflow-auto bg-muted/30 p-6">
  {children}
</main>
```

---

## Medium Effort (Diminishing Returns)

### 3. Reduce Unused JavaScript (170ms savings)
- **Effort:** 1-2 days
- **Impact:** Small (users won't notice 0.17s)
- **Priority:** Low
- **How:**
  - Run bundle analyzer: `ANALYZE=true npm run build`
  - Identify unused exports
  - Dynamic import for rarely-used features
  - Tree-shake dependencies

### 4. Reduce Unused CSS (160ms savings)
- **Effort:** 1-2 days
- **Impact:** Small (users won't notice 0.16s)
- **Priority:** Low
- **How:**
  - Tailwind purge configuration
  - Remove unused Radix UI components
  - Split CSS by route
  - Inline critical CSS

### 5. LCP Optimization (2.6-2.9s → 2.5s)
- **Effort:** 1 day
- **Impact:** Low (only 0.1-0.4s improvement)
- **Priority:** Low (already very close to target)
- **How:**
  - Preload critical fonts
  - Inline critical CSS
  - Optimize hero images with priority
  - Use next/font for automatic optimization

```tsx
// Example: Font preloading
import { Geist_Sans } from 'next/font/google'

const geistSans = Geist_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})
```

---

## High Effort (Future Quarters)

### 6. Database Optimization
- **Effort:** 1-2 weeks
- **Impact:** High (if queries become bottleneck)
- **Priority:** Monitor first
- **How:**
  - Analyze slow queries (>500ms)
  - Add missing indexes
  - Fix N+1 query patterns
  - Create materialized views for reports
  - Consider read replicas

### 7. Edge Runtime Migration
- **Effort:** 2-3 days
- **Impact:** Medium (<10ms API responses)
- **Priority:** Low
- **Routes to migrate:**
  - `/api/health`
  - `/api/config`
  - `/api/feature-flags`

```tsx
// Example: Edge runtime
export const runtime = 'edge'

export async function GET() {
  return Response.json({ status: 'ok' })
}
```

### 8. CDN/Caching Layer
- **Effort:** 1 week
- **Impact:** High (if server load increases)
- **Priority:** Monitor first
- **How:**
  - Vercel Edge caching for static content
  - Redis for hot data (dashboard, frequent queries)
  - Stale-while-revalidate pattern
  - Cache-Control headers

### 9. Real User Monitoring
- **Effort:** 1 day
- **Impact:** High (visibility into production)
- **Priority:** High (do this month)
- **Tools:**
  - Vercel Analytics (free tier)
  - Sentry (error tracking)
  - LogRocket (session replay)

### 10. Search Optimization
- **Effort:** 1 week
- **Impact:** Medium (if search is heavily used)
- **Priority:** Monitor first
- **How:**
  - Debounced search (300ms delay)
  - Server-side search
  - Consider Algolia or ElasticSearch
  - Implement search result caching

---

## Monitoring Triggers

Implement these optimizations only if metrics show:

| Optimization | Trigger Metric |
|--------------|----------------|
| Unused JS/CSS | Lighthouse score drops below 85 |
| LCP optimization | LCP consistently >3.5s in production |
| Database optimization | Query time >500ms (p95) |
| Edge runtime | API latency >200ms (p95) |
| CDN/caching | Server CPU >70% sustained |
| Search optimization | Search latency >1s (p95) |

---

## Performance Budget Enforcement

Add to CI/CD pipeline:

```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://staging.gama-erp.com/dashboard
            https://staging.gama-erp.com/job-orders
            https://staging.gama-erp.com/equipment/utilization
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

```json
// lighthouse-budget.json
{
  "performance": 85,
  "accessibility": 90,
  "first-contentful-paint": 1800,
  "largest-contentful-paint": 3500,
  "cumulative-layout-shift": 0.1,
  "total-blocking-time": 200
}
```

---

## Conclusion

Current state (95-97/100) is production-ready.

Monitor real users, iterate based on data, and only pursue backlog items if metrics justify the effort.

**Avoid premature optimization. Ship value, measure impact, then optimize.**
