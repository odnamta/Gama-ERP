# Changelog

All notable changes to GAMA ERP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.2] - 2026-01-08 - Performance Optimization Release

### 🚀 Performance Improvements
- **Lighthouse score: 40 → 95-97** (+140% improvement)
- **Equipment costing bundles: 428KB → 174KB** (-59%)
- **Dashboard load: 5s → <1s** (-80%)
- **Report pages: 2-4s spinner → instant SSR**
- **Middleware latency: 50-200ms → ~0ms** per navigation
- **Console logs in production: 1,395 → 0**

### ✨ Features
- Added list virtualization for large datasets (60fps with 10,000+ rows)
- Migrated all 15 report pages to Server Components
- Implemented lazy loading for ExcelJS (933KB loads on-demand)
- Added dashboard caching with 5-minute TTL
- Created ReportSkeleton for zero layout shift (CLS = 0)
- Owner dashboard now loads preview data on-demand
- Login page optimized with static generation

### 🔧 Developer Experience
- Re-enabled TypeScript strict checking (all errors fixed)
- Added bundle analyzer (`ANALYZE=true npm run build`)
- Parallelized layout async calls
- Removed 1,395 console.log statements from production

### 📊 Core Web Vitals
- FCP: 3-4s → 1.4s ✅
- LCP: 5-6s → 2.6-2.9s ⚠️ (very close to 2.5s target)
- TTI: 8-10s → ~2s ✅
- TBT: ~800ms → 60ms ✅
- CLS: 0.3-0.5 → 0 ✅

### 📚 Documentation
- Added Lighthouse audit results (`LIGHTHOUSE-AUDIT.md`)
- Added performance optimization summary (`PERFORMANCE-OPTIMIZATION-SUMMARY.md`)
- Documented performance budgets for CI/CD
- Created backlog for future optimizations (`PERFORMANCE-BACKLOG.md`)

### ⚠️ Breaking Changes
None. All changes are backwards compatible.

### 🔮 Future Optimizations (Backlog)
- LCP optimization: 2.6-2.9s → 2.5s
- Reduce unused JavaScript (170ms savings)
- Reduce unused CSS (160ms savings)
- Database optimization (index analysis, N+1 queries)
- Edge runtime migration for API routes
- Real user monitoring (Vercel Analytics, Sentry)

**Note:** Current 95-97/100 Lighthouse score is production-ready. Future optimizations are diminishing returns.

---

## [0.9.1] - 2025-12 - Assets & Customs Module

### ✨ Features
- Assets Management module (equipment, vehicles, machinery tracking)
- Customs Documentation module (PEB/PIB documents)
- Asset maintenance scheduling and tracking
- Asset assignments to jobs and employees

---

## [0.9.0] - 2025-12 - Engineering Module

### ✨ Features
- Route surveys with GPS waypoints
- Journey Management Plans (JMP)
- Technical assessments
- Drawing management with revisions
- Drawing transmittals and approvals

---

## [0.8.0] - 2025-11 - Job Orders & Invoicing

### ✨ Features
- Job Orders module with full CRUD
- Invoice generation and tracking
- PJO → JO conversion workflow
- Cost confirmation by Operations

---

## [0.7.0] - 2025-10 - PJO Itemized Financials

### ✨ Features
- Revenue/Cost line items tables
- Revenue items CRUD
- Cost items estimation
- Budget summary & health indicators

---

## [0.6.0] - 2025-09 - Quotations Module

### ✨ Features
- Quotation creation and management
- Complexity scoring system
- Engineering review workflow
- Market type classification

---

## [0.5.0] - 2025-08 - Projects & Customers

### ✨ Features
- Customer CRUD operations
- Projects management
- Role-based access control
- Google OAuth integration

---

## [0.4.0] - 2025-07 - Foundation

### ✨ Features
- Initial database schema setup
- Supabase integration
- Authentication system
- Basic navigation and layout
