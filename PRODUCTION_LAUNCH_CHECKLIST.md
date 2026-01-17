# Production Launch Checklist

## Pre-Launch Setup

### 1. Production Supabase Project
- [ ] Create production Supabase project: `panecho-production`
- [ ] Save project URL: `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Save anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Save service role key: `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Schema Deployment
- [ ] Navigate to SQL Editor in Supabase dashboard
- [ ] Copy contents from `docs/schema.sql`
- [ ] Run schema in production database
- [ ] Verify tables created: `scans`, `batch_uploads`, `usage_records`
- [ ] Verify Row Level Security policies active
- [ ] Test RLS with test query

### 3. Storage Bucket Configuration
- [ ] Create new bucket: `dicom-files`
- [ ] Set bucket to **private**
- [ ] Configure CORS settings:
  ```json
  {
    "allowedOrigins": ["https://panecho.com", "https://*.vercel.app"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
  ```
- [ ] Set up storage policies (if not using RLS)
- [ ] Test upload permissions

### 4. Supabase Auth Configuration
- [ ] Go to Authentication → URL Configuration
- [ ] Set Site URL to production domain: `https://panecho.com`
- [ ] Add Redirect URLs:
  - `https://panecho.com/auth/callback`
  - `https://panecho.com/auth/confirm`
- [ ] Go to Authentication → Email Templates
- [ ] Customize "Confirm signup" template
- [ ] Customize "Reset password" template
- [ ] Customize "Magic Link" template (if used)
- [ ] Send test email to yourself
- [ ] Verify email received and links work

### 5. Production API Keys
- [ ] OpenAI production API key obtained
- [ ] Set usage limits in OpenAI dashboard
- [ ] Configure billing alerts at $50, $100, $200
- [ ] Verify gpt-4o-mini access

### 6. Vercel Production Deployment
- [ ] Push latest code to `main` branch
- [ ] Verify Vercel project connected to repository
- [ ] Deployment should trigger automatically
- [ ] Wait for deployment to complete

### 7. Vercel Environment Variables
Navigate to Vercel Dashboard → Project Settings → Environment Variables

Set **Production** environment:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `<production-url>`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<production-anon-key>`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `<production-service-role>`
- [ ] `OPENAI_API_KEY` = `<production-openai-key>`
- [ ] `NODE_ENV` = `production`
- [ ] Redeploy to apply new environment variables

### 8. Custom Domain Setup (Optional)
- [ ] Purchase domain: `panecho.com`
- [ ] Go to Vercel → Domains
- [ ] Add custom domain
- [ ] Configure DNS records as instructed by Vercel
- [ ] Wait for DNS propagation (can take up to 48h)
- [ ] Verify SSL certificate issued automatically
- [ ] Test HTTPS access
- [ ] Update Supabase Site URL to custom domain

### 9. Vercel Cron Configuration
- [ ] Verify `vercel.json` contains cron job
- [ ] Deploy to production
- [ ] Check Vercel Dashboard → Cron Jobs
- [ ] Verify cron job appears: "Daily Cleanup (3 AM UTC)"
- [ ] Enable cron job if not enabled
- [ ] Wait 24h and verify execution log

### 10. Monitoring Setup

#### Vercel Analytics
- [ ] Go to Vercel Dashboard → Analytics
- [ ] Enable Analytics (free tier includes Web Vitals)
- [ ] Verify tracking script injected automatically

#### Error Tracking
- [ ] Enable Vercel Error Tracking or integrate Sentry
- [ ] Test error reporting with intentional error
- [ ] Verify error appears in dashboard

#### Alerts Configuration
- [ ] Go to Vercel → Settings → Notifications
- [ ] Configure alert email/Slack webhook
- [ ] Set up alerts for:
  - [ ] Deployment failures
  - [ ] Function errors (>5 in 5 min)
  - [ ] Function timeouts
  - [ ] Budget threshold reached

#### Supabase Monitoring
- [ ] Go to Supabase → Reports
- [ ] Note current database size
- [ ] Note current storage size
- [ ] Set calendar reminder to check weekly
- [ ] Configure Supabase email alerts:
  - [ ] Database approaching 500MB (free tier limit)
  - [ ] Storage approaching 1GB (free tier limit)
  - [ ] API request patterns unusual

---

## Production Smoke Tests

**Create test user account** (use real email you control):
- [ ] Email: `test-prod@yourdomain.com`
- [ ] Password: (save in password manager)

### Core Flow Tests
- [ ] **Homepage loads** - https://panecho.com
  - [ ] No console errors (F12 → Console)
  - [ ] Header displays correctly
  - [ ] "Get Started" button visible
  
- [ ] **Signup flow**
  - [ ] Navigate to /signup
  - [ ] Enter test email and password
  - [ ] Submit form
  - [ ] Confirmation email received
  - [ ] Click confirmation link
  - [ ] Redirected to upload page

- [ ] **Login flow**
  - [ ] Log out
  - [ ] Navigate to /login
  - [ ] Enter credentials
  - [ ] Successfully logged in
  - [ ] Redirected to upload page

- [ ] **Password reset**
  - [ ] Log out
  - [ ] Click "Forgot Password"
  - [ ] Enter email
  - [ ] Reset email received
  - [ ] Click reset link
  - [ ] Enter new password
  - [ ] Password updated successfully
  - [ ] Can log in with new password

### Upload & Processing Tests
- [ ] **Single file upload**
  - [ ] Navigate to /upload
  - [ ] Select DICOM file from TCIA
  - [ ] Click "Analyze Scan"
  - [ ] Redirected to /processing/[id]
  - [ ] Progress bar animates
  - [ ] No errors in console

- [ ] **DICOM processing**
  - [ ] Wait for processing (60-90s)
  - [ ] Redirected to /results/[id]
  - [ ] Results page displays
  - [ ] Risk score shown (0-100)
  - [ ] Classification shown (Normal/Suspicious)
  - [ ] Anatomical analysis present
  - [ ] Recommendations displayed

- [ ] **PDF download**
  - [ ] On results page, click "Download PDF"
  - [ ] PDF downloads successfully
  - [ ] Open PDF
  - [ ] All data present in PDF
  - [ ] Images rendered correctly

### Advanced Features Tests
- [ ] **Batch upload**
  - [ ] Navigate to /upload
  - [ ] Select 3 DICOM files
  - [ ] Upload starts
  - [ ] Batch processing page shows progress
  - [ ] All 3 scans process successfully
  - [ ] Can view each result

- [ ] **Longitudinal analysis**
  - [ ] Upload follow-up scan for same patient
  - [ ] Go to results page
  - [ ] Timeline view appears
  - [ ] Comparison view available
  - [ ] Change indicators displayed
  - [ ] Trend analysis shown

- [ ] **Rate limiting**
  - [ ] Try uploading 6 files in quick succession
  - [ ] 6th upload should be rate limited
  - [ ] Error message displayed clearly
  - [ ] "Try again in X seconds" shown

- [ ] **Data deletion**
  - [ ] Navigate to scan history
  - [ ] Click delete on a scan
  - [ ] Confirmation dialog appears
  - [ ] Confirm deletion
  - [ ] Scan removed from list
  - [ ] File removed from storage

### Mobile Responsive Tests
- [ ] **iOS Testing (iPhone Safari)**
  - [ ] Homepage responsive
  - [ ] Upload page usable on mobile
  - [ ] Results page readable
  - [ ] All buttons tappable
  - [ ] No horizontal scroll

- [ ] **Android Testing (Chrome)**
  - [ ] Homepage responsive
  - [ ] Upload page usable on mobile
  - [ ] Results page readable
  - [ ] All buttons tappable
  - [ ] No horizontal scroll

### Edge Cases
- [ ] Try uploading invalid file format → Error shown
- [ ] Try accessing /results/[invalid-id] → 404 or error
- [ ] Slow network simulation → Loading states work
- [ ] Clear cookies mid-session → Redirected to login

---

## Post-Launch Monitoring (First 24 Hours)

### Hour 1-4
- [ ] Check Vercel deployments - no rollbacks
- [ ] Check Vercel Analytics - page views tracking
- [ ] Check Supabase logs - queries executing
- [ ] Check OpenAI usage - API calls succeeding
- [ ] No error alerts received

### Hour 4-12
- [ ] Verify cron job will run on schedule
- [ ] Check error rate in Vercel dashboard (<1%)
- [ ] Check average response time (<2s)
- [ ] Review any user signups
- [ ] Check support email - no critical issues

### Hour 12-24
- [ ] Review full day analytics
- [ ] Calculate total OpenAI cost
- [ ] Check database storage usage
- [ ] Review any error patterns
- [ ] Verify cron job executed successfully

### Day 2-7
- [ ] Daily error rate review
- [ ] Daily cost review
- [ ] Respond to support emails within 24h
- [ ] Monitor user feedback
- [ ] Fix any non-critical bugs
- [ ] Plan hotfix deployment if needed

---

## Success Criteria

### Technical
- ✅ Zero-downtime deployment
- ✅ All smoke tests pass
- ✅ No console errors on any page
- ✅ Error rate <1%
- ✅ Average response time <3s
- ✅ SSL certificate valid
- ✅ Mobile responsive on iOS and Android

### Operational
- ✅ Monitoring dashboards accessible
- ✅ Alerts configured and tested
- ✅ Support email responding
- ✅ Documentation published
- ✅ Cron jobs running on schedule

### User Validation
- ✅ First real user signed up
- ✅ First real scan processed successfully
- ✅ No critical bugs reported
- ✅ Analytics tracking events

---

## Rollback Plan

If critical issues occur:

1. **Immediate:** Revert Vercel deployment to last stable version
2. **Database:** No rollback needed (schema is additive)
3. **Communication:** Post status page update
4. **Investigation:** Review logs and errors
5. **Fix:** Deploy hotfix to `main` branch
6. **Re-deploy:** Automatic deployment on push

---

## Launch Complete! 🎉

Once all checklists are complete, PanEcho is officially in production!

**Next Steps:**
- Continue monitoring for first week
- Iterate based on user feedback
- Optimize costs as usage grows
- Plan feature roadmap

**Support:** For issues, contact support@panecho.com
