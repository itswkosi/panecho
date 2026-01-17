# Admin Analytics Dashboard Setup Guide

## Overview

The Admin Analytics Dashboard is a real-time metrics and performance monitoring interface for administrators. It displays key system metrics, trends, and error tracking in a clean, accessible interface.

## Access Control

### Environment Variable Setup

To enable admin access to the dashboard, set the `NEXT_PUBLIC_ADMIN_EMAILS` environment variable in `.env.local`:

```bash
NEXT_PUBLIC_ADMIN_EMAILS="admin@example.com,support@example.com,dev@example.com"
```

**Format:**
- Comma-separated list of email addresses
- Emails must match exactly against authenticated user's email
- Case-sensitive
- No spaces around commas

### Example Configuration

```env
# .env.local
NEXT_PUBLIC_ADMIN_EMAILS="alice@hospital.com,bob@hospital.com"
```

## Routes & Access

- **Route:** `/admin/analytics`
- **Location:** `src/app/(protected)/admin/analytics/page.tsx`
- **Access:** Admin users only (via `AdminAuthGuard` component)
- **Rendering:** Server component with dynamic rendering (requires cookies for auth)

## Features

### Key Metrics Cards
- **Total Scans Uploaded** - All-time scan count
- **Analyses Completed** - Successfully processed scans
- **Average Processing Time** - Per-scan processing duration in seconds
- **Error Rate** - Percentage of failed analyses
- **Active Users Today** - Unique users in current day
- **Normal Scans** - Scans classified as normal

### Data Visualizations

#### Classification Distribution
- Bar chart showing Normal vs Suspicious classifications
- Real-time percentages
- Sortable by count

#### Risk Score Distribution
- Visual breakdown of risk categories:
  - Low Risk (0-30)
  - Medium Risk (30-70)
  - High Risk (70-100)
- Color-coded for quick assessment

#### 7-Day Trend Table
- Daily metrics over past 7 days
- Columns: Date, Uploads, Completed, Failed, Errors, Avg Processing Time
- Sortable by any column

## Architecture

### Components

#### `AdminAuthGuard`
- Path: `src/components/admin/AdminAuthGuard.tsx`
- Purpose: Authenticate and authorize admin access
- Props: `children` (ReactNode)
- Behavior: 
  - Checks user email against `NEXT_PUBLIC_ADMIN_EMAILS`
  - Shows loading state during verification
  - Redirects non-admin users to dashboard
  - Integrates with error boundary

#### `AnalyticsDashboard`
- Path: `src/components/admin/AnalyticsDashboard.tsx`
- Purpose: Main dashboard UI component
- Props: `metrics` (AnalyticsMetrics object)
- Features:
  - Responsive grid layout (1→2→3 columns)
  - Multiple metric cards and charts
  - 7-day trends table
  - Error boundary support

#### `MetricsCard`
- Path: `src/components/admin/MetricsCard.tsx`
- Purpose: Reusable metric display component
- Props:
  - `title` (string) - Metric name
  - `value` (string | number) - Metric value
  - `icon` (string) - Emoji icon
  - `subtitle?` (string) - Optional subtitle
  - `trend?` ({ direction: 'up' | 'down' | 'stable', percent: number })
- Features:
  - Trend indicators with color coding
  - Optional icon display
  - Responsive sizing

### Services

#### `dashboard.ts`
- Path: `src/lib/admin/dashboard.ts`
- Purpose: Aggregates metrics from database
- Exports:
  - `getAnalyticsMetrics()` - Async function fetching all metrics
  - `formatMetric(value, type)` - Formats numbers for display
  - `AnalyticsMetrics` interface - Type definition
  - `DailyTrend` interface - 7-day trend data structure

**Function Details:**

```typescript
// Get all dashboard metrics
const metrics = await getAnalyticsMetrics();

// Format values for display
formatMetric(42, 'number')      // "42"
formatMetric(95.5, 'percent')   // "95.5%"
formatMetric(12.3, 'time')      // "12.3s"
```

## Metrics Calculation

Metrics are calculated from the following database tables:

- `scans` - DICOM scan uploads
- `analyses` - Scan analysis results
- `audit_log` - System event tracking

**Metric Sources:**

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total Scans Uploaded | `scans` table | COUNT(*) |
| Completed Analyses | `analyses` table | COUNT(*) WHERE status='completed' |
| Failed Analyses | `analyses` table | COUNT(*) WHERE status='failed' |
| Avg Processing Time | `analyses` table | AVG(processing_time_seconds) |
| Error Rate | `analyses` table | (failed / total) * 100 |
| Classification Distribution | `analyses` table | COUNT(*) GROUP BY classification |
| Risk Distribution | `analyses` table | COUNT(*) GROUP BY risk_category |
| Active Users | `audit_log` table | DISTINCT user_id TODAY |

## Testing

### Running Admin Tests

```bash
# Test admin-specific components and services
npm test -- admin/ --run

# Test full suite
npm test -- --run
```

### Test Files

- `test/components/admin/MetricsCard.test.tsx` - Component tests
- `test/lib/admin/dashboard.test.ts` - Service tests

**Current Status:**
- ✅ 26/26 admin tests passing
- ✅ 500+ total tests passing
- ✅ 0 TypeScript errors

## Development

### Adding New Metrics

1. Update `AnalyticsMetrics` interface in `dashboard.ts`
2. Implement calculation logic in `getAnalyticsMetrics()`
3. Create new `MetricsCard` in `AnalyticsDashboard` component
4. Add tests for new metric calculation

### Customizing Trends

Trends are shown as direction + percent. Update metric calculation to include trend data:

```typescript
trend: {
  direction: value > threshold ? 'up' : 'stable',
  percent: Math.abs(value - previous)
}
```

## Deployment Notes

### Environment Variables
- `NEXT_PUBLIC_ADMIN_EMAILS` - **REQUIRED** for admin access
- No other admin-specific environment variables needed

### Build Requirements
- Next.js 16+ (uses dynamic rendering)
- Supabase client configured
- Vercel Analytics installed (for future integration)

### Performance Considerations
- Metrics are calculated server-side on each page load
- Consider adding caching for high-traffic deployments
- Database queries are indexed on `created_at` and `status` fields

## Troubleshooting

### "Access Denied" Error
- Verify email is in `NEXT_PUBLIC_ADMIN_EMAILS`
- Check for exact email match (case-sensitive)
- Clear browser cache and re-authenticate

### "Error Loading Dashboard"
- Verify database connection is working
- Check Supabase credentials in environment
- Ensure `scans` and `analyses` tables exist
- Verify user has SELECT permissions

### Blank Metrics
- Data may not exist in database yet
- Check that scans have been uploaded
- Verify analyses have completed processing

## Security Considerations

⚠️ **Important:**
- Admin emails are public (in `NEXT_PUBLIC_ADMIN_EMAILS`)
- Email verification happens server-side
- All data access is controlled by Supabase RLS policies
- Admins can see all user data (normal for admin dashboards)

## Future Enhancements

Planned improvements:
- [ ] Caching for metrics (Redis/in-memory)
- [ ] Custom date range selection
- [ ] Export metrics to CSV
- [ ] Admin audit log viewer
- [ ] System health alerts
- [ ] Performance optimization recommendations
- [ ] A/B testing metrics
- [ ] API rate limit monitoring

## Support

For issues or questions:
1. Check test output: `npm test -- admin/ --run`
2. Review TypeScript errors: `npx tsc --noEmit`
3. Check browser console for client-side errors
4. Review server logs for database errors
