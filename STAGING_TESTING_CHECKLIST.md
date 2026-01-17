# Staging Deployment & Testing Checklist

**Project:** PanEcho - Pancreatic Cancer Screening Platform  
**Phase:** Chunk 17 - Staging Deployment & TCIA Testing  
**Status:** Ready for Execution

---

## Pre-Deployment Checklist

### Environment Setup

- [ ] Staging branch created in Git
  - Command: `git branch staging`
  - Verify: `git branch -a` shows staging branch
  
- [ ] Vercel project created: `panecho-staging`
  - Project name: panecho-staging
  - Connected to: staging branch
  - Auto-deploy enabled
  - Deployment URL: https://staging.panecho.dev
  
- [ ] Supabase staging project created: `panecho-staging`
  - Project created in Supabase dashboard
  - Database initialized
  - RLS policies enabled
  - Backups configured
  
- [ ] Environment variables configured in Vercel:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] OPENAI_API_KEY
  - [ ] NEXT_PUBLIC_ADMIN_EMAILS
  - [ ] NEXT_PUBLIC_APP_URL
  - [ ] NODE_ENV=production

### Database & Infrastructure

- [ ] Supabase database schema created
  - [ ] Tables: scans, analyses, audit_log
  - [ ] Migrations applied
  - [ ] Indexes created
  - [ ] RLS policies enabled
  
- [ ] Test data imported (optional)
  - [ ] Sample scans available
  - [ ] Test user accounts created
  
- [ ] Backups configured
  - [ ] Daily backups enabled
  - [ ] Backup retention: 7 days

### Testing Infrastructure

- [ ] Playwright installed locally
  - Command: `npm install --save-dev @playwright/test`
  
- [ ] E2E test files created
  - [ ] test/e2e/staging-scenarios.spec.ts
  
- [ ] Test fixtures downloaded
  - [ ] 10 TCIA scans in test/fixtures/tcia-scans/
  - [ ] Total size: ~2GB
  
- [ ] Test tracking spreadsheets created
  - [ ] TCIA_TEST_RESULTS.csv
  - [ ] PERFORMANCE_DATA.csv
  - [ ] COST_TRACKING.csv

### Monitoring & Logging

- [ ] Vercel Analytics enabled
  - [ ] Web Vitals enabled
  - [ ] Error reporting enabled
  
- [ ] Supabase logging enabled
  - [ ] Postgres logs active
  - [ ] Edge function logs active
  
- [ ] OpenAI usage monitoring
  - [ ] Cost limits set: $100/month
  - [ ] Soft alert: $50
  
- [ ] Error tracking configured
  - [ ] Sentry connected (optional)
  - [ ] Email alerts enabled

---

## Deployment Steps

### Step 1: Deploy to Vercel

- [ ] Commit all changes to staging branch
  ```bash
  git add .
  git commit -m "Deploy to staging: Admin dashboard and analytics"
  git push origin staging
  ```

- [ ] Verify Vercel build completes
  - [ ] Check Vercel dashboard
  - [ ] Build logs show success
  - [ ] No errors or warnings
  
- [ ] Test deployment URL
  ```bash
  curl https://staging.panecho.dev/
  # Should return 200 with HTML
  ```

### Step 2: Verify Environment Configuration

- [ ] Test Supabase connection
  ```bash
  curl https://staging.panecho.dev/api/health
  # Should return: { status: "ok", database: "connected" }
  ```

- [ ] Verify environment variables
  - [ ] No missing variables
  - [ ] No exposed secrets
  - [ ] Correct endpoints configured

- [ ] Test OpenAI API
  - [ ] API key valid
  - [ ] Rate limits not exceeded
  - [ ] Cost tracking active

### Step 3: Smoke Testing

- [ ] Access landing page: https://staging.panecho.dev
  - [ ] Page loads
  - [ ] No console errors
  - [ ] UI renders correctly
  
- [ ] Create test user account
  - [ ] Signup works
  - [ ] Email verification (if enabled)
  - [ ] Login successful
  
- [ ] Test basic upload
  - [ ] Upload page accessible
  - [ ] File upload works
  - [ ] Small test scan processes

---

## TCIA Testing Execution

### Preparation Phase (Day 1)

- [ ] Download 10 TCIA Pancreas-CT scans
  - [ ] Download from: https://www.cancerimagingarchive.net/collection/pancreas-ct/
  - [ ] Use NBIA Data Retriever
  - [ ] Save to: test/fixtures/tcia-scans/
  - [ ] Verify all 10 scans present
  
- [ ] Create test tracking spreadsheets
  - [ ] TCIA_TEST_RESULTS.csv with headers
  - [ ] Columns: Scan ID, Case Type, Known Findings, Expected Range, Actual Risk Score, Classification, Processing Time, Pass/Fail, Notes
  - [ ] Save in project root
  
- [ ] Set up performance monitoring
  - [ ] Vercel logs streaming
  - [ ] Browser DevTools ready
  - [ ] Spreadsheet for timing data
  
- [ ] Configure cost tracking
  - [ ] Check OpenAI balance
  - [ ] Set up usage monitoring
  - [ ] Create cost tracking spreadsheet

### Scenario Execution Phase (Days 2-3)

#### Scenario 1: New User, Single Scan

- [ ] Create fresh test account: test-scenario1-[timestamp]@example.com
- [ ] Navigate to: https://staging.panecho.dev/signup
- [ ] Complete signup flow
- [ ] Verify email (if required)
- [ ] Upload TCIA_001
- [ ] Set scan date from DICOM metadata
- [ ] Click "Analyze"
- [ ] Wait for processing (monitor timing)
- [ ] Verify results display
  - [ ] Risk score visible
  - [ ] Classification shown
  - [ ] Risk score in reasonable range
- [ ] Download PDF
  - [ ] File downloads
  - [ ] PDF opens correctly
  - [ ] All data included
- [ ] Verify scan in history
- [ ] Record results in TCIA_TEST_RESULTS.csv
- [ ] **Status:** ✅ Pass/❌ Fail

#### Scenario 2: Batch Upload & Longitudinal

- [ ] Create fresh test account: test-scenario2-[timestamp]@example.com
- [ ] Upload TCIA_002 (date: 2024-01-01)
  - [ ] Record upload time
  - [ ] Record processing time
  - [ ] Verify results
- [ ] Upload TCIA_003 (date: 2024-06-15)
  - [ ] Record timing
  - [ ] Verify results
- [ ] Upload TCIA_004 (date: 2025-01-10)
  - [ ] Record timing
  - [ ] Verify results
- [ ] Go to Scan History
  - [ ] Verify chronological order
  - [ ] All 3 scans visible
- [ ] Click on most recent → View Comparison
  - [ ] Timeline displays correctly
  - [ ] All 3 scans shown
  - [ ] Trend analysis appears
  - [ ] PDF includes comparison
- [ ] **Status:** ✅ Pass/❌ Fail

#### Scenario 3: Error Handling

**Test 3A: Invalid File**
- [ ] Go to upload page
- [ ] Try to upload non-DICOM file (.jpg, .txt)
- [ ] Verify error message appears
- [ ] Error clearly states DICOM required
- [ ] Form recovers (can try again)
- [ ] **Status:** ✅ Pass/❌ Fail

**Test 3B: File Too Large**
- [ ] Try to upload file >500MB
- [ ] Verify size error displayed
- [ ] **Status:** ✅ Pass/❌ Fail

**Test 3C: Processing Timeout**
- [ ] Upload scan and monitor progress
- [ ] If timeout occurs, verify:
  - [ ] Error message shown
  - [ ] Retry button available
  - [ ] Can successfully retry
- [ ] **Status:** ✅ Pass/❌ N/A (if no timeout)

**Test 3D: Rate Limiting**
- [ ] Attempt to upload 6 scans rapidly
- [ ] After 5-6 scans, expect rate limit
- [ ] Verify rate limit message:
  - [ ] Clear message shown
  - [ ] Reset time indicated
  - [ ] Extension option available
- [ ] **Status:** ✅ Pass/❌ N/A (if limit not triggered)

#### Scenario 4: Batch Processing

- [ ] Create fresh test account
- [ ] Upload remaining TCIA scans (5-10)
- [ ] For each scan:
  - [ ] Record upload time
  - [ ] Record analysis time
  - [ ] Verify results
  - [ ] Update TCIA_TEST_RESULTS.csv
  - [ ] Record tokens used (from logs)

### Monitoring Phase (Days 3-4)

- [ ] Track all processing times
  - [ ] Update PERFORMANCE_DATA.csv
  - [ ] Calculate statistics
  - [ ] Identify outliers
  
- [ ] Monitor costs
  - [ ] Check OpenAI dashboard daily
  - [ ] Update COST_TRACKING.csv
  - [ ] Verify under budget
  
- [ ] Check logs for errors
  - [ ] Vercel logs: any errors?
  - [ ] Supabase logs: any database errors?
  - [ ] Browser console: any JavaScript errors?
  
- [ ] Monitor infrastructure
  - [ ] Vercel CPU/Memory usage: normal?
  - [ ] Supabase connections: stable?
  - [ ] API response times: consistent?

### Admin Dashboard Testing

- [ ] Set admin email in NEXT_PUBLIC_ADMIN_EMAILS
- [ ] Create admin test user
- [ ] Log in as admin
- [ ] Navigate to /admin/analytics
  - [ ] Page loads
  - [ ] Access granted (not redirected)
  - [ ] Metrics display correctly
  - [ ] Total scans count matches
  - [ ] Classifications distribution correct
  - [ ] Risk distribution shows expected ranges
  - [ ] 7-day trend table populated
- [ ] Log out and log in as non-admin
- [ ] Try to access /admin/analytics
  - [ ] Access denied
  - [ ] Redirected to dashboard
- [ ] **Status:** ✅ Pass/❌ Fail

---

## Results Analysis & Reporting

### Data Compilation (Day 4)

- [ ] Compile TCIA_TEST_RESULTS.csv
  - [ ] All 10 scans recorded
  - [ ] Risk scores filled in
  - [ ] Classifications recorded
  - [ ] Pass/Fail marked
  
- [ ] Compile PERFORMANCE_DATA.csv
  - [ ] Timing data for all scans
  - [ ] Calculate averages
  - [ ] Identify outliers
  - [ ] Compare to targets
  
- [ ] Compile COST_TRACKING.csv
  - [ ] Token usage recorded
  - [ ] Costs calculated
  - [ ] Total spending recorded
  - [ ] Forecast generated

### Analysis

- [ ] Calculate performance statistics
  - [ ] Average processing time
  - [ ] Median processing time
  - [ ] Min/Max range
  - [ ] Standard deviation
  - [ ] Compare to <90s target
  
- [ ] Analyze accuracy
  - [ ] Calculate accuracy % (how many within expected range?)
  - [ ] Analyze outliers (why were they outside range?)
  - [ ] Check classification accuracy (normal vs suspicious)
  
- [ ] Analyze costs
  - [ ] Calculate cost per scan
  - [ ] Compare to <$0.50 target
  - [ ] Project monthly costs
  - [ ] Forecast production costs

### Report Creation (Day 5)

- [ ] Complete STAGING_TEST_REPORT_TEMPLATE.md
  - [ ] Update Executive Summary
  - [ ] Fill in all test results
  - [ ] Add TCIA scan results table
  - [ ] Include performance analysis
  - [ ] Include cost analysis
  - [ ] Add screenshots/evidence
  - [ ] Write recommendations
  
- [ ] Get stakeholder sign-off
  - [ ] Engineering Lead review
  - [ ] Product Manager approval
  - [ ] Operations Lead sign-off
  
- [ ] Save final report
  - [ ] Save as: STAGING_TEST_REPORT_FINAL_[DATE].md
  - [ ] Archive supporting data files

---

## Acceptance Criteria Verification

Before declaring staging complete:

### Functional Requirements
- [ ] Scenario 1: New user single scan = ✅ PASS
- [ ] Scenario 2: Batch upload & longitudinal = ✅ PASS
- [ ] Scenario 3: Error handling = ✅ PASS
- [ ] Scenario 4: Rate limiting = ✅ PASS
- [ ] Scenario 5: Retention & deletion = ✅ PASS
- [ ] Admin dashboard access = ✅ PASS

### Data Quality
- [ ] 10/10 TCIA scans processed = ✅ YES
- [ ] Risk scores in expected ranges = ✅ 9/10 (90%)
- [ ] Classifications match findings = ✅ YES
- [ ] No data corruption = ✅ YES

### Performance
- [ ] Average processing time < 90s = ✅ YES
- [ ] Max processing time < 120s = ✅ YES
- [ ] No timeouts or failures = ✅ YES
- [ ] Consistent performance = ✅ YES

### Cost
- [ ] Total cost < $20 = ✅ YES
- [ ] Average cost < $0.50/scan = ✅ YES
- [ ] No unexpected charges = ✅ YES
- [ ] Forecast reasonable = ✅ YES

### Infrastructure
- [ ] Vercel deployment stable = ✅ YES
- [ ] Supabase responsive = ✅ YES
- [ ] No critical errors = ✅ YES
- [ ] Admin dashboard working = ✅ YES

### Security
- [ ] Authentication required = ✅ YES
- [ ] Admin-only access enforced = ✅ YES
- [ ] Data isolation verified = ✅ YES
- [ ] No security issues = ✅ YES

### Accessibility
- [ ] WCAG 2.1 AA compliant = ✅ YES
- [ ] Mobile responsive = ✅ YES
- [ ] Keyboard navigable = ✅ YES
- [ ] Screen reader compatible = ✅ YES

---

## Go/No-Go Decision

After all testing complete:

```
DECISION: [ ] GO FOR PRODUCTION  [ ] NO-GO / NEEDS FIXES

If NO-GO, document:
- [ ] Issue descriptions
- [ ] Severity levels
- [ ] Proposed fixes
- [ ] Retest date

If GO, proceed with:
1. [ ] Stakeholder approval
2. [ ] Production environment setup
3. [ ] Data migration planning
4. [ ] Production deployment
5. [ ] Production monitoring
```

---

## Post-Testing Cleanup

- [ ] Archive test data
  - [ ] Save TCIA scans if needed
  - [ ] Archive all test spreadsheets
  - [ ] Save performance/cost data
  
- [ ] Clean up test accounts
  - [ ] Delete test users (optional)
  - [ ] Reset staging database (optional)
  
- [ ] Update documentation
  - [ ] Create user guide
  - [ ] Create admin guide
  - [ ] Create troubleshooting guide
  
- [ ] Prepare production
  - [ ] Create production branch: `git checkout -b production-v1.0`
  - [ ] Copy staging code: `git merge staging`
  - [ ] Tag version: `git tag v1.0.0`

---

## Useful Commands

### Git Operations
```bash
# Switch to staging branch
git checkout staging

# Push changes
git push origin staging

# Create production branch
git checkout -b production-v1.0

# Tag version
git tag v1.0.0
git push origin v1.0.0
```

### Testing Commands
```bash
# Run E2E tests
npx playwright test test/e2e/staging-scenarios.spec.ts

# Run specific scenario
npx playwright test test/e2e/staging-scenarios.spec.ts -g "Scenario 1"

# Generate HTML report
npx playwright test test/e2e/staging-scenarios.spec.ts --reporter=html
# Open: playwright-report/index.html

# Run headless (CI/CD mode)
npx playwright test test/e2e/staging-scenarios.spec.ts --reporter=list --quiet
```

### Monitoring Commands
```bash
# Stream Vercel logs
vercel logs https://staging.panecho.dev --follow

# Check deployment status
vercel ls

# View past deployments
vercel deploy --list

# Rollback if needed
vercel rollback
```

### Local Testing
```bash
# Copy staging env vars
cp .env.staging.local .env.local

# Start dev server
npm run dev

# Open in browser
open http://localhost:3000

# Run tests against local
npx playwright test test/e2e/staging-scenarios.spec.ts
```

---

## Support & Troubleshooting

### Common Issues

**Issue: "Failed to connect to database"**
- Check NEXT_PUBLIC_SUPABASE_URL is correct
- Check Supabase project is running
- Check SUPABASE_SERVICE_ROLE_KEY is valid
- Verify RLS policies allow access

**Issue: "OpenAI API error"**
- Check OPENAI_API_KEY is valid
- Check API key has funds
- Check rate limits not exceeded
- Check API status: https://status.openai.com

**Issue: "Slow processing (>90s)"**
- Check OpenAI API status
- Try with smaller scan
- Check network connectivity
- Monitor Vercel CPU/Memory

**Issue: "Upload fails silently"**
- Check browser console for errors
- Check Vercel logs
- Verify file format is DICOM
- Try different file

**Issue: "Admin dashboard shows no data"**
- Check admin email matches NEXT_PUBLIC_ADMIN_EMAILS
- Verify user account exists in Supabase Auth
- Check that scans exist in database
- Verify RLS policies allow access

### Getting Help

1. Check Vercel logs: `vercel logs https://staging.panecho.dev`
2. Check Supabase logs: Supabase Dashboard → Logs
3. Check browser console: F12 → Console tab
4. Check OpenAI status: https://status.openai.com
5. Review error messages carefully
6. Search GitHub issues
7. Ask in project Slack/Discord

---

## Timeline

**Recommended Schedule:**

- **Day 1:** Setup & Smoke Testing (2 hours)
- **Day 2:** Scenario 1-2 Testing (3 hours)
- **Day 3:** Scenario 3-5 & TCIA Scans (4 hours)
- **Day 4:** Performance/Cost Analysis (2 hours)
- **Day 5:** Report Writing & Sign-off (2 hours)

**Total: 13 hours over 5 days**

---

## Resources

- **STAGING_DEPLOYMENT_GUIDE.md** - Step-by-step deployment
- **TCIA_TEST_PLAN.md** - Detailed test scenarios
- **PERFORMANCE_COST_MONITORING.md** - Metrics tracking
- **STAGING_TEST_REPORT_TEMPLATE.md** - Final report template
- **test/e2e/staging-scenarios.spec.ts** - Automated E2E tests

---

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for Execution  
**Next Phase:** Production Deployment

