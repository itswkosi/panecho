# Staging Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying PanEcho to a staging environment for comprehensive testing before production deployment.

## Prerequisites

- Vercel account with admin access
- Supabase account with admin access
- Git access to repository
- Node.js 18+ installed locally
- OpenAI API key

## Staging Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Staging Environment                       │
├─────────────────────────────────────────────────────────────┤
│  Vercel Project (Staging)                                    │
│  ├─ Frontend: panecho-staging                               │
│  ├─ Connected to: staging branch                             │
│  ├─ Auto-deploy on commits                                   │
│  └─ Environment: staging.panecho.dev                         │
├─────────────────────────────────────────────────────────────┤
│  Supabase Project: panecho-staging                           │
│  ├─ PostgreSQL database (separate from production)          │
│  ├─ Authentication (test users)                              │
│  ├─ Storage (test DICOM files)                               │
│  └─ Monitoring & Logs                                        │
├─────────────────────────────────────────────────────────────┤
│  OpenAI API (Shared)                                         │
│  ├─ Cost tracking enabled                                    │
│  ├─ Usage monitoring                                         │
│  └─ Rate limiting configured                                 │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Create Staging Branch

Already completed:

```bash
git branch staging
git checkout staging
git push origin staging
```

Verify:
```bash
git branch -a
# Should show: * staging and origin/staging
```

## Step 2: Create Vercel Staging Project

### 2.1 Create New Project in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your Git repository
4. Configure project:
   - **Project Name:** `panecho-staging`
   - **Framework:** Next.js
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 2.2 Configure Environment Variables in Vercel

Settings → Environment Variables

Add the following (replace with your actual values):

```plaintext
# Next.js
NEXT_PUBLIC_APP_URL=https://staging.panecho.dev

# Supabase Staging
NEXT_PUBLIC_SUPABASE_URL=https://your-project-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (from Supabase)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (from Supabase)

# OpenAI
OPENAI_API_KEY=sk-... (your API key)

# Admin
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=... (optional)

# Analytics/Tracking
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://staging.panecho.dev/api/analytics

# Environment
NODE_ENV=production
```

### 2.3 Connect Staging Branch

Settings → Git Integrations
- Select the staging branch as the production branch for this project
- Enable auto-deploy on commits to staging

## Step 3: Create Supabase Staging Project

### 3.1 Create New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Configure:
   - **Name:** `panecho-staging`
   - **Database Password:** Use strong password (save securely)
   - **Region:** Same as production (or nearest to your location)
   - **Pricing Plan:** Pro (to ensure adequate limits)

### 3.2 Wait for Project Initialization

This takes 3-5 minutes. Check project status on dashboard.

### 3.3 Copy Connection Details

From Supabase Project Settings → API:

```plaintext
Project URL: https://your-project-staging.supabase.co
Anon Public Key: eyJ...
Service Role Secret: eyJ...
Database Password: (saved above)
```

### 3.4 Set Up Database Schema

Run migrations to create tables:

```bash
# Clone schema from production (if available)
# Or run migration scripts

# Using Supabase CLI:
supabase link --project-ref your-project-staging
supabase db push

# Or manually:
# 1. Go to SQL Editor in Supabase dashboard
# 2. Copy schema from docs/schema.sql
# 3. Run the SQL commands
```

### 3.5 Configure RLS Policies

Ensure Row-Level Security policies are enabled:

```sql
-- Example for scans table
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans"
  ON scans FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create scans"
  ON scans FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

## Step 4: Configure Local Environment for Staging

### 4.1 Create `.env.staging.local`

In your local project root:

```bash
# Supabase Staging
NEXT_PUBLIC_SUPABASE_URL=https://your-project-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Admin Emails
NEXT_PUBLIC_ADMIN_EMAILS=test@example.com

# App URL for local testing
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2 Test Locally Against Staging Database

```bash
source .env.staging.local
npm run dev
```

Test:
1. Sign up with test account
2. Upload a small scan
3. Verify data appears in Supabase

## Step 5: Deploy to Vercel Staging

### 5.1 Commit Changes to Staging Branch

```bash
git add .
git commit -m "Deploy to staging: Analytics dashboard and testing infrastructure"
git push origin staging
```

### 5.2 Verify Deployment

1. Go to Vercel dashboard
2. Select `panecho-staging` project
3. Wait for build to complete (5-10 minutes)
4. Check deployment URL: `https://staging.panecho.dev` (or your custom domain)

### 5.3 Test Deployment

```bash
# Test landing page
curl https://staging.panecho.dev/

# Should return 200 with HTML
```

## Step 6: Create Test User Account

1. Go to `https://staging.panecho.dev/signup`
2. Sign up with test email: `test-staging@example.com`
3. Verify in Supabase Auth dashboard
4. If 2FA enabled, configure authenticator

## Step 7: Set Up Monitoring & Logging

### 7.1 Vercel Analytics

Vercel dashboard → Deployments → Staging Project → Analytics

Monitor:
- Page load times
- Web Vitals
- Error rates

### 7.2 Supabase Logs

Supabase dashboard → Logs

Filter by:
- Authentication events
- Database queries
- API errors
- Edge function execution

### 7.3 OpenAI Usage

[OpenAI Dashboard](https://platform.openai.com/usage) → Usage

Track:
- Token usage
- API costs
- Request count
- Error rates

## Step 8: Deploy Monitoring Dashboard

For tracking metrics during testing:

```bash
# Install monitoring tools
npm install --save-dev @vercel/analytics

# View real-time logs
vercel logs staging --follow

# Stream tail logs
vercel tail https://staging.panecho.dev
```

## Environment Variables Checklist

Before testing, verify all variables are set:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (Supabase project URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase public key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Supabase secret key)
- [ ] `OPENAI_API_KEY` (OpenAI API key)
- [ ] `NEXT_PUBLIC_ADMIN_EMAILS` (test admin email)
- [ ] `NEXT_PUBLIC_APP_URL` (staging domain)
- [ ] `NODE_ENV=production` (Vercel setting)

## Troubleshooting Deployment

### Build Fails on Vercel

Check Vercel build logs for errors:

```bash
# View build logs
vercel logs staging --follow

# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies

# Fix locally:
npm run build

# If successful locally but fails on Vercel:
# - Check Node.js version (set to 18+ in Vercel)
# - Check build output directory
# - Rebuild and deploy
```

### Database Connection Error

```bash
# Test connection from staging deployment
curl "https://staging.panecho.dev/api/health"

# Should return: { status: "ok", database: "connected" }

# If fails:
# - Verify Supabase URL is correct
# - Check credentials in Vercel environment
# - Verify RLS policies aren't blocking access
# - Check database is running in Supabase
```

### Slow Processing

```bash
# Check OpenAI API usage
# Monitor token consumption on OpenAI dashboard

# If slow:
# - Check GPT-4 model availability
# - Review API rate limits
# - Check network latency to OpenAI servers
```

## Rollback Procedure

If staging deployment breaks:

```bash
# Option 1: Deploy previous commit
git revert HEAD
git push origin staging
# (Vercel auto-deploys)

# Option 2: Deploy specific commit
git push origin <commit-hash>:staging
# (Vercel auto-deploys)

# Option 3: Use Vercel rollback UI
# Vercel dashboard → Deployments → Previous deployment → ... → Promote to Production
```

## Cost Management

### Monitor Spending

1. **OpenAI API:** $0.50-$2.00 per analysis (depends on scan size)
2. **Vercel:** ~$20-50/month for production-level traffic
3. **Supabase:** ~$25/month for Pro plan
4. **Total estimated:** <$200 for full staging testing (100 scans)

### Cost Controls

```bash
# Set OpenAI rate limits (recommended for staging)
# OpenAI Dashboard → Billing → Usage Limits

# Set monthly spending limit: $100 (to prevent runaway costs)
# Set daily spending limit: $5 (to catch issues early)
```

## Next Steps

1. ✅ Create staging branch
2. ✅ Create Vercel project
3. ✅ Create Supabase project
4. ✅ Configure environment variables
5. ⬜ Run TCIA test dataset
6. ⬜ Execute test scenarios
7. ⬜ Performance benchmarking
8. ⬜ Cost analysis
9. ⬜ Create staging report
10. ⬜ Production deployment (after approval)

## Support

For issues:
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- OpenAI API: https://platform.openai.com/docs/api-reference
- PanEcho Issues: Check GitHub repository

---

**Last Updated:** January 2026  
**Status:** Ready for TCIA Testing  
**Next Phase:** [TCIA_TEST_PLAN.md](TCIA_TEST_PLAN.md)
