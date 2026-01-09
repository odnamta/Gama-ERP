# Production Deployment Checklist

## Pre-Deployment

- [x] All optimizations complete
- [x] Lighthouse score: 95-97/100
- [x] TypeScript build passes (0 errors)
- [x] Documentation complete
- [ ] Staging deployment successful
- [ ] Smoke tests pass on staging
- [ ] Performance verified on staging
- [ ] Backup database before deployment

## Deployment Steps

1. Merge feature branch to main
2. Deploy to production (Vercel auto-deploy)
3. Run smoke tests on production
4. Verify performance metrics
5. Monitor error rates

## Post-Deployment

- [ ] Verify dashboard loads <1s
- [ ] Verify equipment pages load <2s
- [ ] Verify reports appear instantly
- [ ] Check Vercel Analytics (if enabled)
- [ ] Monitor error logs (24 hours)
- [ ] Gather user feedback

## Smoke Tests

### Critical Paths
- [ ] Login with Google OAuth
- [ ] Dashboard loads for owner role
- [ ] Dashboard preview mode works
- [ ] Job Orders list loads
- [ ] Create new Job Order
- [ ] Equipment utilization page loads
- [ ] Export to Excel works
- [ ] All 15 report pages load

### Performance Checks
- [ ] Dashboard: <1s load time
- [ ] Reports: Instant (no spinner)
- [ ] Equipment pages: <2s load time
- [ ] No console errors in production

## Rollback Plan

If performance regresses:
1. Revert deployment via Vercel dashboard
2. Investigate root cause
3. Fix in development
4. Re-deploy after verification

## Monitoring Setup (Week 1)

- [ ] Enable Vercel Analytics
- [ ] Set up Sentry (optional)
- [ ] Create performance dashboard
- [ ] Set up alerts for regression

## Success Criteria

| Metric | Target | Acceptable |
|--------|--------|------------|
| Lighthouse Performance | >90 | >85 |
| Dashboard Load | <1s | <2s |
| Report Load | Instant | <1s |
| Error Rate | 0% | <0.1% |
| User Complaints | 0 | <3/week |

## Contacts

- **Technical Lead:** Dio Atmando
- **Deployment:** Vercel (auto-deploy on merge)
- **Database:** Supabase (ljbkjtaowrdddvjhsygj)

---

**Status:** Ready for Production
**Last Updated:** January 9, 2026
