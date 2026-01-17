# Admin Analytics Dashboard - Quick Reference

## 🚀 Quick Start

### 1. Enable Admin Access
Add to `.env.local`:
```bash
NEXT_PUBLIC_ADMIN_EMAILS="your-email@example.com"
```

### 2. Access Dashboard
Navigate to: `http://localhost:3000/admin/analytics`

### 3. View Metrics
- Total scans uploaded
- Analysis completion rate
- Processing time trends
- Error rates & distribution
- Classification breakdown
- Risk score distribution

---

## 📁 File Structure

```
src/
├── components/admin/
│   ├── AdminAuthGuard.tsx          # Authentication gate
│   ├── AnalyticsDashboard.tsx      # Main UI component
│   └── MetricsCard.tsx              # Reusable metric card
├── lib/admin/
│   └── dashboard.ts                 # Metrics service
└── app/(protected)/admin/
    └── analytics/
        └── page.tsx                 # Dashboard page route

test/
├── components/admin/
│   └── MetricsCard.test.tsx         # Component tests
└── lib/admin/
    └── dashboard.test.ts            # Service tests
```

---

## 🔧 Component APIs

### AdminAuthGuard
```tsx
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';

<AdminAuthGuard>
  <div>Admin-only content</div>
</AdminAuthGuard>
```

### AnalyticsDashboard
```tsx
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

const metrics = await getAnalyticsMetrics();
<AnalyticsDashboard metrics={metrics} />
```

### MetricsCard
```tsx
import { MetricsCard } from '@/components/admin/MetricsCard';

<MetricsCard
  title="Total Scans"
  value={1234}
  icon="📤"
  subtitle="All time"
  trend={{ direction: 'up', percent: 5.2 }}
/>
```

### getAnalyticsMetrics
```tsx
import { getAnalyticsMetrics } from '@/lib/admin/dashboard';

const metrics = await getAnalyticsMetrics();
// Returns: {
//   totalScansUploaded: number
//   completedAnalyses: number
//   failedAnalyses: number
//   averageProcessingTimeSeconds: number
//   errorRatePercent: number
//   classificationDistribution: { normal, suspicious }
//   riskScoreDistribution: { lowRisk, mediumRisk, highRisk }
//   activeUsersToday: number
//   pdfDownloadsToday: number
//   retentionExtensionsToday: number
//   usageLimitReachedToday: number
//   dailyTrendData: DailyTrend[]
// }
```

### formatMetric
```tsx
import { formatMetric } from '@/lib/admin/dashboard';

formatMetric(42, 'number')    // "42"
formatMetric(95.5, 'percent') // "95.5%"
formatMetric(12.3, 'time')    // "12.3s"
```

---

## 🧪 Testing

### Run Admin Tests
```bash
npm test -- admin/ --run
```

Expected output:
```
✓ test/components/admin/MetricsCard.test.tsx (12 tests)
✓ test/lib/admin/dashboard.test.ts (14 tests)

Test Files: 2 passed (2)
Tests: 26 passed (26)
```

### Run Full Suite
```bash
npm test -- --run
```

### Test Admin Components
```bash
# Test specific component
npm test -- test/components/admin/MetricsCard.test.tsx --run

# Test dashboard service
npm test -- test/lib/admin/dashboard.test.ts --run
```

---

## 🔐 Security

### Authentication
- Email-based: `NEXT_PUBLIC_ADMIN_EMAILS`
- Server-side verification
- Secure session handling

### Data Access
- Supabase RLS policies
- Row-level security
- Admin isolation

### Privacy
- Vercel Analytics integration ready
- Event tracking available
- User data aggregation only

---

## 📊 Metrics & Calculations

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total Scans | scans table | COUNT(*) |
| Completed | analyses table | COUNT(*) WHERE status='completed' |
| Failed | analyses table | COUNT(*) WHERE status='failed' |
| Avg Time | analyses table | AVG(processing_time_seconds) |
| Error Rate | analyses table | (failed / total) × 100 |
| Classifications | analyses table | COUNT(*) GROUP BY type |
| Risk Distribution | analyses table | COUNT(*) GROUP BY risk_level |
| Active Users | audit_log | DISTINCT user_id TODAY |

---

## 🐛 Troubleshooting

### "Access Denied" Error
✓ Check email in `NEXT_PUBLIC_ADMIN_EMAILS`
✓ Ensure exact email match (case-sensitive)
✓ Clear cookies and re-authenticate

### Blank Dashboard
✓ Verify database connection
✓ Check scans exist in database
✓ Verify analyses table populated
✓ Check Supabase permissions

### Build Issues
✓ `npm run build` - Full build (slow)
✓ `npm run dev` - Development mode (fast)
✓ Pre-existing: Ignore URL-encoded route warnings

---

## 📚 Related Documentation

- **Full Setup Guide:** [ADMIN_DASHBOARD_SETUP.md](ADMIN_DASHBOARD_SETUP.md)
- **Implementation Details:** [ADMIN_DASHBOARD_IMPLEMENTATION.md](ADMIN_DASHBOARD_IMPLEMENTATION.md)
- **Analytics System:** [ANALYTICS_IMPLEMENTATION_COMPLETE.md](ANALYTICS_IMPLEMENTATION_COMPLETE.md)

---

## ✅ Status

| Item | Status |
|------|--------|
| Components | ✅ Complete (3 files) |
| Services | ✅ Complete (1 file) |
| Tests | ✅ Passing (26/26) |
| TypeScript | ✅ No errors |
| Documentation | ✅ Complete |
| Accessibility | ✅ WCAG 2.1 AA |
| Ready for Prod | ✅ Yes |

---

## 🔗 Related Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Run ESLint

# Testing
npm test                 # Watch mode
npm test -- --run        # Run once
npm test -- admin/ --run # Admin tests only

# Type Checking
npx tsc --noEmit        # Check for errors

# Access Dashboard
# http://localhost:3000/admin/analytics
```

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
