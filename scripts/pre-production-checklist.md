# Gama ERP - Pre-Production Deployment Checklist

## 1. Data Cleanup ✅
- [ ] Run `cleanup-test-data.sql` script
- [ ] Verify only real customer data remains
- [ ] Check that sequences are reset for clean numbering

## 2. Environment Variables
- [ ] Update `.env.local` to `.env.production`
- [ ] Verify Supabase URL and keys are production values
- [ ] Remove any debug flags or test configurations

## 3. User Accounts
- [ ] Ensure real user accounts exist:
  - [ ] dioatmando@gama-group.co (owner)
  - [ ] hutamiarini@gama-group.co (manager: marketing + engineering)
  - [ ] ferisupriono@gama-group.co (manager: administration + finance)
  - [ ] rezapramana@gama-group.co (manager: operations + assets)
- [ ] Remove any test user accounts
- [ ] Verify user roles and department scopes are correctly assigned
- [ ] Confirm manager department scopes:
  - [ ] Hutami: marketing + engineering departments
  - [ ] Feri: administration + finance departments
  - [ ] Reza: operations + assets departments

## 4. Database Security
- [ ] Confirm RLS policies are enabled on all tables
- [ ] Test that users can only access their company data
- [ ] Verify API keys are not exposed in client code

## 5. Application Settings
- [ ] Set proper company information
- [ ] Configure email templates for notifications
- [ ] Set up proper backup schedules
- [ ] Configure monitoring and alerts

## 6. Final Testing
- [ ] Test complete workflow: Quotation → PJO → JO → Invoice
- [ ] Verify all user roles work correctly
- [ ] Test authentication and authorization
- [ ] Check mobile responsiveness
- [ ] Verify all forms validate properly

## 7. Deployment
- [ ] Build production version (`npm run build`)
- [ ] Deploy to production environment
- [ ] Run smoke tests on production
- [ ] Monitor for any errors in first 24 hours

## Notes
- Keep a backup of current database before cleanup
- Test the cleanup script on a copy first
- Document any custom configurations for future reference