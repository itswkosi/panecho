# Production Deployment Guide

Complete step-by-step instructions for deploying PanEcho to production.

---

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier works)
- Supabase account (free tier works)
- OpenAI API account with credits
- Domain name (optional but recommended)

---

## Part 1: Production Supabase Setup

### Step 1: Create Production Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Configure:
   - **Name:** `panecho-production`
   - **Database Password:** (Generate strong password, save in password manager)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (can upgrade later)
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### Step 2: Save Production Credentials

Once project is ready, go to **Settings → API**

Save these values (you'll need them later):

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"

# Supabase Anon Key (public, safe for browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase Service Role Key (SECRET - never expose in browser!)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Deploy Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open `docs/schema.sql` from your project
4. Copy the entire contents
5. Paste into SQL Editor
6. Click "Run" (bottom right)
7. Verify success message appears

**Verify Tables Created:**
1. Go to **Table Editor**
2. You should see:
   - `scans` - Main scan records
   - `batch_uploads` - Batch upload tracking
   - `usage_records` - Usage/cost tracking
   - `profiles` - User profiles (auto-created by Supabase)

### Step 4: Configure Storage Bucket

1. Go to **Storage** in sidebar
2. Click "Create a new bucket"
3. Configure:
   - **Name:** `dicom-files`
   - **Public:** OFF (keep private)
   - **File size limit:** 50 MB
4. Click "Create bucket"

**Set up CORS:**
1. Click on `dicom-files` bucket
2. Click "Configuration" tab
3. Add CORS policy:

```json
[
  {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

**Note:** After domain setup, replace `"*"` with your actual domain.

### Step 5: Configure Authentication

1. Go to **Authentication → URL Configuration**
2. Set:
   - **Site URL:** `https://your-vercel-url.vercel.app` (update after deployment)
   - **Redirect URLs:** Add:
     ```
     https://your-vercel-url.vercel.app/auth/callback
     https://your-vercel-url.vercel.app/auth/confirm
     ```

3. Go to **Authentication → Email Templates**
4. Customize templates (optional but recommended):

**Confirm Signup Template:**
```html
<h2>Welcome to PanEcho!</h2>
<p>Click below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you didn't sign up for PanEcho, you can safely ignore this email.</p>
```

**Reset Password Template:**
```html
<h2>Reset Your Password</h2>
<p>Click below to reset your PanEcho password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 1 hour.</p>
```

---

## Part 2: OpenAI API Setup

### Step 1: Get Production API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to **API Keys**
3. Click "Create new secret key"
4. Name: `panecho-production`
5. Copy key immediately (can't view again!)
6. Save securely

```bash
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxx"
```

### Step 2: Configure Usage Limits

1. Go to **Settings → Limits**
2. Set monthly budget cap:
   - Recommended: $50/month for testing
   - Adjust based on expected usage
3. Configure email alerts at:
   - $10 (20% of budget)
   - $25 (50% of budget)
   - $40 (80% of budget)

### Step 3: Verify Model Access

1. Go to **Playground**
2. Select model: `gpt-4o-mini`
3. Send test message
4. Verify response received
5. You're good to go!

---

## Part 3: Vercel Deployment

### Step 1: Connect Repository (if not already)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. DON'T click Deploy yet!

### Step 2: Configure Environment Variables

Click "Environment Variables" before deploying.

Add the following for **Production** environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
```

**Important:** Select "Production" environment for each variable!

### Step 3: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build and deployment
3. Vercel will show deployment URL: `https://panecho.vercel.app`
4. Click "Visit" to test

### Step 4: Verify Deployment

Check that:
- ✅ Site loads without errors
- ✅ Can access /login and /signup pages
- ✅ Homepage displays correctly
- ✅ No console errors (F12 → Console)

---

## Part 4: Custom Domain Setup (Optional)

### Step 1: Purchase Domain

Purchase `panecho.com` (or your preferred domain) from:
- Namecheap
- Google Domains
- GoDaddy
- Cloudflare

### Step 2: Add Domain to Vercel

1. In Vercel dashboard, go to **Settings → Domains**
2. Click "Add"
3. Enter your domain: `panecho.com`
4. Click "Add"
5. Also add `www.panecho.com`

### Step 3: Configure DNS

Vercel will show you DNS records to add. In your domain registrar:

**For panecho.com:**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP)

**For www.panecho.com:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

### Step 4: Wait for DNS Propagation

- Can take up to 48 hours (usually much faster)
- Check status at [whatsmydns.net](https://www.whatsmydns.net)
- Vercel will automatically issue SSL certificate

### Step 5: Update Supabase URLs

Once domain is live:

1. Go back to Supabase → **Authentication → URL Configuration**
2. Update:
   - **Site URL:** `https://panecho.com`
   - **Redirect URLs:**
     ```
     https://panecho.com/auth/callback
     https://panecho.com/auth/confirm
     ```
3. Save changes

---

## Part 5: Monitoring & Alerts Setup

### Vercel Analytics

1. Go to Vercel Dashboard → **Analytics**
2. Click "Enable Analytics"
3. Free tier includes:
   - Page views
   - Web Vitals (performance metrics)
   - Top pages
   - Traffic sources

### Error Tracking

**Option A: Vercel Built-in (Recommended)**
1. Go to **Settings → Error Tracking**
2. Toggle "Enable Error Tracking"
3. Errors will appear in Vercel dashboard

**Option B: Sentry Integration**
1. Create Sentry account
2. Install: `npm install @sentry/nextjs`
3. Configure Sentry in `next.config.ts`
4. Redeploy

### Configure Alerts

1. Go to **Settings → Notifications**
2. Add email or Slack webhook
3. Enable alerts for:
   - ✅ Deployment failed
   - ✅ Function errors (threshold: 5 errors in 5 minutes)
   - ✅ Function timeouts
   - ✅ Build warnings

### Supabase Monitoring

1. Go to Supabase → **Settings → Notifications**
2. Add email
3. Enable alerts for:
   - ✅ Database size approaching limit
   - ✅ API rate limit approaching
   - ✅ Unusual activity

---

## Part 6: Cron Job Verification

### Verify Configuration

Your `vercel.json` should contain:

```json
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "0 3 * * *"
  }]
}
```

This runs daily at 3 AM UTC to delete old data.

### Enable Cron

1. Go to Vercel Dashboard → **Cron Jobs**
2. You should see "Daily Cleanup (3 AM UTC)"
3. Verify it's enabled (toggle should be ON)

### Test Cron Job

**Manual test:**
```bash
curl https://panecho.com/api/cron/cleanup \
  -H "Authorization: Bearer $(cat .vercel/.env.production | grep CRON_SECRET | cut -d= -f2)"
```

**Or wait 24 hours and check logs:**
1. Go to **Functions** → `/api/cron/cleanup`
2. Check execution log
3. Verify no errors

---

## Part 7: Production Smoke Tests

See [PRODUCTION_LAUNCH_CHECKLIST.md](./PRODUCTION_LAUNCH_CHECKLIST.md) for comprehensive test checklist.

**Quick validation:**

1. **Create test account:** Go to /signup
2. **Upload TCIA scan:** Go to /upload
3. **Wait for processing:** Should complete in 60-90s
4. **View results:** Risk score and analysis displayed
5. **Download PDF:** PDF generates correctly
6. **Test on mobile:** iPhone and Android

If all pass → You're live! 🎉

---

## Part 8: Post-Launch Monitoring

### First 24 Hours

**Check every 4 hours:**
- Vercel Analytics → page views trending up?
- Error rate < 1%?
- OpenAI costs reasonable?
- Supabase queries executing?
- Any support emails?

### First Week

**Check daily:**
- User signups
- Scan processing success rate
- Total OpenAI cost
- Database storage usage
- Any user-reported bugs

### Ongoing

**Check weekly:**
- Review analytics trends
- Optimize slow pages
- Review and fix non-critical bugs
- Plan feature improvements
- Respond to user feedback

---

## Troubleshooting

### "Database connection failed"
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify Supabase project is not paused
- Check RLS policies allow access

### "OpenAI API error"
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has credits
- Check usage limits not exceeded

### "Upload fails"
- Check Supabase Storage bucket exists
- Verify CORS configured correctly
- Check file size under 50MB

### "Email not sending"
- Check Supabase Site URL is correct
- Verify email template configured
- Check spam folder

### "Deployment fails"
- Check build logs in Vercel
- Run `npm run build` locally
- Fix any TypeScript or ESLint errors
- Push fix and redeploy

---

## Rollback Procedure

If critical issues occur:

1. Go to Vercel → **Deployments**
2. Find last stable deployment
3. Click "..." → "Promote to Production"
4. Instant rollback (< 30 seconds)

Database doesn't need rollback (schema is additive).

---

## Success! 🚀

PanEcho is now live in production!

**Share your app:**
- https://panecho.com (or your-app.vercel.app)

**Monitor:**
- Vercel: vercel.com/dashboard
- Supabase: supabase.com/dashboard
- OpenAI: platform.openai.com/usage

**Support:**
- User questions → support@panecho.com
- Critical bugs → Deploy hotfix immediately
- Feature requests → Add to roadmap

Congratulations on shipping! 🎉
