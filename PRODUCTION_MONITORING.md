# Production Monitoring & Alerts Setup

Complete guide for setting up monitoring, alerts, and observability for PanEcho in production.

---

## Overview

Production monitoring ensures:
- Early detection of issues
- Performance optimization insights
- Cost tracking and optimization
- User experience monitoring
- Proactive incident response

---

## Part 1: Vercel Monitoring

### 1.1 Enable Vercel Analytics

**Setup:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Analytics** tab
4. Click "Enable Analytics"

**Free Tier Includes:**
- Real-time page views
- Web Vitals (LCP, FID, CLS)
- Top pages report
- Traffic sources
- Device breakdown

**What to Monitor:**
- **Page load time** - Should be < 3s
- **Largest Contentful Paint (LCP)** - Should be < 2.5s
- **First Input Delay (FID)** - Should be < 100ms
- **Cumulative Layout Shift (CLS)** - Should be < 0.1

**Weekly Review:**
- Identify slow pages
- Optimize high-traffic routes
- Monitor trends over time

### 1.2 Enable Speed Insights

**Setup:**
1. In Vercel Dashboard → **Speed Insights**
2. Click "Enable"
3. No code changes needed (auto-injected)

**Metrics Tracked:**
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)

**Action Items:**
- Pages with LCP > 4s → Investigate and optimize
- High TTFB → Check server-side rendering performance
- Poor CLS → Fix layout shifts

### 1.3 Error Tracking

**Setup:**
1. Go to **Settings → Error Tracking**
2. Enable "Vercel Error Tracking"
3. Errors automatically captured

**Or use Sentry:**
```bash
npm install @sentry/nextjs
```

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
    }
    return event;
  },
});
```

**What to Monitor:**
- Error rate (should be < 1%)
- Specific error messages
- Affected users
- Error trends

### 1.4 Configure Deployment Notifications

**Setup:**
1. Go to **Settings → Notifications**
2. Add notification channels:
   - Email
   - Slack webhook
   - Discord webhook

**Recommended Alerts:**
- ✅ Deployment started
- ✅ Deployment completed
- ✅ Deployment failed
- ✅ Deployment rolled back

**Slack Webhook Setup:**
```bash
# In Slack:
# 1. Go to api.slack.com/apps
# 2. Create new app
# 3. Enable Incoming Webhooks
# 4. Add webhook to channel
# 5. Copy webhook URL

# In Vercel:
# Settings → Notifications → Add Webhook
# URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Part 2: Function Monitoring

### 2.1 Configure Function Alerts

**Setup:**
1. Go to **Settings → Notifications**
2. Configure alert rules:

**Error Rate Alert:**
- Trigger: More than 5 errors in 5 minutes
- Notification: Email + Slack
- Action: Investigate immediately

**Timeout Alert:**
- Trigger: Function timeout (>10s serverless limit)
- Notification: Email
- Action: Optimize or increase timeout

**High Invocation Alert:**
- Trigger: >1000 invocations in 5 minutes
- Notification: Slack
- Action: Check for abuse or bot traffic

### 2.2 Function Logs

**Access Logs:**
1. Go to **Functions** tab
2. Click on function name
3. View recent invocations
4. Filter by:
   - Status code
   - Duration
   - Time range

**Log Retention:**
- Free tier: 1 day
- Pro tier: 7 days
- Enterprise: 30+ days

**Best Practices:**
- Add structured logging
- Include request IDs
- Log errors with context
- Use appropriate log levels

### 2.3 Function Metrics Dashboard

**Key Metrics to Track:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Invocations/min | < 100 | > 500 |
| Avg Duration | < 2s | > 5s |
| Error Rate | < 0.5% | > 5% |
| Timeout Rate | 0% | > 1% |
| Cold Start Rate | < 10% | > 30% |

**Weekly Review:**
- Identify frequently called functions
- Optimize slow functions
- Reduce cold starts (use warming)

---

## Part 3: Supabase Monitoring

### 3.1 Database Monitoring

**Setup:**
1. Go to Supabase Dashboard → **Reports**
2. Review metrics:
   - Database size
   - Query performance
   - Active connections
   - Slow queries

**Key Metrics:**

| Metric | Free Tier Limit | Monitor At |
|--------|----------------|------------|
| Database Size | 500 MB | 400 MB (80%) |
| Storage Size | 1 GB | 800 MB (80%) |
| Bandwidth | 2 GB/month | 1.6 GB (80%) |
| API Requests | 50K/day | 40K (80%) |

**Alert Setup:**
```sql
-- Create notification function
CREATE OR REPLACE FUNCTION notify_database_size()
RETURNS void AS $$
DECLARE
  db_size_mb numeric;
BEGIN
  SELECT pg_database_size(current_database()) / 1024 / 1024 INTO db_size_mb;
  
  IF db_size_mb > 400 THEN
    -- Send notification (implement via webhook)
    RAISE WARNING 'Database size approaching limit: % MB', db_size_mb;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily check (use pg_cron if available)
```

### 3.2 Storage Monitoring

**Check Storage Usage:**
1. Go to **Storage** → Dashboard
2. View metrics:
   - Total storage used
   - Files count
   - Bucket sizes

**Cleanup Script:**
```sql
-- Find old files (>30 days)
SELECT 
  name,
  created_at,
  metadata->>'size' as size_bytes
FROM storage.objects
WHERE bucket_id = 'dicom-files'
  AND created_at < NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Delete old files (done by cron job)
```

### 3.3 API Monitoring

**Setup:**
1. Go to **Settings → API**
2. View API usage stats
3. Monitor:
   - Requests per day
   - Response times
   - Error rates

**Rate Limiting:**
```typescript
// Already implemented in app
// Monitor for users hitting limits
SELECT 
  user_id,
  COUNT(*) as requests_today
FROM scans
WHERE created_at > CURRENT_DATE
GROUP BY user_id
ORDER BY requests_today DESC
LIMIT 10;
```

### 3.4 Query Performance

**Identify Slow Queries:**
1. Go to **Database → Query Performance**
2. Review slow queries (>1s)
3. Optimize with indexes

**Add Indexes:**
```sql
-- Already in schema.sql, but verify:
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

---

## Part 4: OpenAI Monitoring

### 4.1 Usage Tracking

**Access Dashboard:**
1. Go to [platform.openai.com/usage](https://platform.openai.com/usage)
2. View:
   - Daily usage
   - Cost breakdown
   - Model usage
   - Token consumption

**Key Metrics:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Daily Cost | < $5 | > $10 |
| Avg Cost/Request | $0.01-0.05 | > $0.10 |
| API Error Rate | < 1% | > 5% |
| Avg Response Time | < 10s | > 30s |

### 4.2 Cost Alerts

**Setup Budget Alerts:**
1. Go to **Settings → Limits**
2. Set monthly budget: $50
3. Configure email alerts at:
   - $10 (20%)
   - $25 (50%)
   - $40 (80%)

### 4.3 Application Monitoring

**Track in Database:**
```sql
-- View usage trends
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_scans,
  SUM((metadata->>'gpt_cost')::float) as total_cost,
  AVG((metadata->>'gpt_cost')::float) as avg_cost
FROM scans
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Find expensive scans
SELECT 
  id,
  user_id,
  (metadata->>'gpt_cost')::float as cost,
  (metadata->>'gpt_tokens')::int as tokens,
  created_at
FROM scans
WHERE (metadata->>'gpt_cost')::float > 0.10
ORDER BY cost DESC
LIMIT 20;
```

### 4.4 Rate Limit Monitoring

**OpenAI Rate Limits (Tier 1):**
- Requests per minute: 500
- Tokens per minute: 30,000
- Requests per day: 10,000

**Track Application Limits:**
```typescript
// Already implemented in rate-limit.ts
// Monitor logs for rate limit hits
```

---

## Part 5: Automated Alerts

### 5.1 Email Alerts Template

**Critical Error Alert:**
```
Subject: 🚨 [PanEcho] Critical Error Rate Alert

High error rate detected in production:

- Time: 2026-01-17 14:35 UTC
- Error Rate: 8.5% (threshold: 5%)
- Affected Users: 15
- Top Error: "OpenAI API timeout"

Action Required:
1. Check Vercel Functions logs
2. Verify OpenAI status
3. Consider temporary maintenance mode

Dashboard: https://vercel.com/dashboard/functions
```

**Usage Alert:**
```
Subject: ⚠️ [PanEcho] High OpenAI Usage Alert

OpenAI usage approaching budget limit:

- Current Month: $42.50
- Budget: $50.00
- Remaining: $7.50 (15%)
- Days Left: 14

Consider:
- Review usage patterns
- Optimize prompts
- Increase budget if needed

Dashboard: https://platform.openai.com/usage
```

### 5.2 Slack Alerts Template

**Deployment Success:**
```json
{
  "text": "✅ PanEcho deployed to production",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Deployment Successful* 🚀\n\n*Environment:* Production\n*Branch:* main\n*Commit:* abc1234\n*Duration:* 2m 45s"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Deployment"
          },
          "url": "https://vercel.com/dashboard"
        }
      ]
    }
  ]
}
```

### 5.3 Monitoring Checklist

**Daily (Automated):**
- [ ] Check error rate dashboard
- [ ] Review OpenAI usage
- [ ] Check Supabase storage
- [ ] Verify cron job executed

**Weekly (Manual):**
- [ ] Review analytics trends
- [ ] Optimize slow queries
- [ ] Review user feedback
- [ ] Update documentation

**Monthly (Manual):**
- [ ] Cost analysis and optimization
- [ ] Performance benchmark
- [ ] Security audit
- [ ] Backup verification

---

## Part 6: Dashboard Setup

### 6.1 Custom Monitoring Dashboard

**Create Dashboard Page** (optional):

```typescript
// app/(protected)/admin/monitoring/page.tsx
export default async function MonitoringDashboard() {
  // Fetch metrics
  const metrics = await fetchMetrics();
  
  return (
    <div>
      <h1>Production Monitoring</h1>
      
      {/* Error Rate */}
      <MetricCard
        title="Error Rate"
        value={metrics.errorRate}
        threshold={5}
        unit="%"
      />
      
      {/* OpenAI Cost */}
      <MetricCard
        title="OpenAI Cost (Today)"
        value={metrics.openaiCost}
        threshold={10}
        unit="$"
      />
      
      {/* Database Size */}
      <MetricCard
        title="Database Size"
        value={metrics.dbSize}
        threshold={400}
        unit="MB"
      />
      
      {/* Active Users */}
      <MetricCard
        title="Active Users (24h)"
        value={metrics.activeUsers}
      />
    </div>
  );
}
```

### 6.2 Metrics API Endpoint

```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  // Get error rate
  const { data: scans } = await supabase
    .from('scans')
    .select('status, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  const errorRate = scans
    ? (scans.filter(s => s.status === 'failed').length / scans.length) * 100
    : 0;
  
  // Get OpenAI cost
  const { data: usage } = await supabase
    .from('usage_records')
    .select('cost')
    .gte('created_at', new Date().toISOString().split('T')[0]);
  
  const openaiCost = usage
    ? usage.reduce((sum, u) => sum + u.cost, 0)
    : 0;
  
  return NextResponse.json({
    errorRate: Math.round(errorRate * 100) / 100,
    openaiCost: Math.round(openaiCost * 100) / 100,
    timestamp: new Date().toISOString(),
  });
}
```

---

## Part 7: Incident Response

### 7.1 Incident Severity Levels

**P0 - Critical (Immediate)**
- Site completely down
- Data loss occurring
- Security breach
- Action: All hands on deck, fix immediately

**P1 - High (< 1 hour)**
- Core feature broken (upload, processing)
- High error rate (>10%)
- Payment system down
- Action: Drop everything, fix within 1 hour

**P2 - Medium (< 24 hours)**
- Non-critical feature broken
- Performance degradation
- Moderate error rate (5-10%)
- Action: Fix within business day

**P3 - Low (< 1 week)**
- UI bugs
- Minor performance issues
- Enhancement requests
- Action: Schedule in sprint

### 7.2 Incident Response Playbook

**Step 1: Detect**
- Alert received
- User report
- Monitoring shows issue

**Step 2: Assess**
- Determine severity
- Identify affected users
- Estimate impact

**Step 3: Communicate**
- Update status page
- Notify stakeholders
- Provide ETA if possible

**Step 4: Mitigate**
- Roll back if needed
- Apply hotfix
- Enable maintenance mode

**Step 5: Resolve**
- Deploy fix
- Verify resolution
- Monitor for recurrence

**Step 6: Post-Mortem**
- Document incident
- Identify root cause
- Implement preventive measures

### 7.3 Emergency Contacts

```markdown
## Emergency Response Team

**On-Call Engineer:**
- Name: [Your Name]
- Email: you@example.com
- Phone: +1-XXX-XXX-XXXX

**Escalation:**
- Tech Lead: [Name]
- CTO: [Name]

**Service Providers:**
- Vercel Support: vercel.com/support
- Supabase Support: supabase.com/dashboard/support
- OpenAI Support: help.openai.com
```

---

## Part 8: Monitoring Tools Summary

### Essential Tools

| Tool | Purpose | Cost | Setup Time |
|------|---------|------|------------|
| Vercel Analytics | Page performance | Free | 5 min |
| Vercel Error Tracking | Error monitoring | Free | 5 min |
| Supabase Logs | Database monitoring | Free | 0 min (included) |
| OpenAI Dashboard | API usage | Free | 0 min (included) |

### Optional Tools

| Tool | Purpose | Cost | Worth It? |
|------|---------|------|-----------|
| Sentry | Advanced error tracking | $26/mo | If >1000 users |
| Datadog | Full observability | $15/host | Enterprise only |
| PagerDuty | Incident management | $19/user | If 24/7 support |
| StatusPage | Public status | $29/mo | If >1000 users |

---

## Monitoring Checklist

### Initial Setup
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Deployment notifications set up
- [ ] Function alerts configured
- [ ] Supabase monitoring active
- [ ] OpenAI budget alerts set
- [ ] Email alerts configured
- [ ] Slack webhooks added (optional)

### Daily Checks
- [ ] Error rate < 1%
- [ ] No critical alerts
- [ ] Cron job executed
- [ ] OpenAI usage normal

### Weekly Reviews
- [ ] Analytics trends
- [ ] Performance metrics
- [ ] Cost analysis
- [ ] User feedback

### Monthly Tasks
- [ ] Comprehensive cost review
- [ ] Performance optimization
- [ ] Security audit
- [ ] Backup verification

---

**Production monitoring ensures PanEcho stays healthy, fast, and cost-effective! 📊**
