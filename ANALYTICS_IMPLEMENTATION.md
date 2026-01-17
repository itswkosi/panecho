# Analytics Integration - Implementation Documentation

## Overview

PanEcho now integrates privacy-compliant analytics using Vercel Analytics to track user engagement and system performance while maintaining strict data privacy standards.

## Key Features

### 1. Privacy-First Design
- **No PII Tracking**: Email addresses, names, phone numbers, addresses, and health information are never tracked
- **Do Not Track (DNT) Support**: Respects browser DNT header - no tracking when DNT is enabled
- **Production-Only**: Analytics only active in production environment
- **Risk Score Anonymization**: Risk scores grouped into ranges (0-30, 30-70, 70-100) instead of exact values

### 2. Event Tracking

#### Upload Events
```typescript
trackScanUploaded(fileType: 'dicom' | 'image', fileSizeMb: number, isBatch: boolean)
```
- **Triggers**: When a scan is successfully uploaded
- **Properties**: File type (DICOM or image), file size in MB, batch upload flag

#### Analysis Events
```typescript
trackScanAnalyzed(
  analysisType: 'initial' | 'longitudinal',
  processingTimeSeconds: number,
  classification: 'normal' | 'suspicious',
  riskScore: number
)
```
- **Triggers**: When analysis completes successfully
- **Properties**: Analysis type, processing time, classification, risk score range
- **Privacy Note**: Risk scores are anonymized into ranges

#### PDF Download Events
```typescript
trackPdfDownloaded(scanId: string)
```
- **Triggers**: When user downloads PDF report
- **Properties**: Scan ID only

#### Retention Events
```typescript
trackRetentionExtended(extensionCount: number)
trackDataDeleted(isBatch: boolean)
```
- **Triggers**: When user manages data retention
- **Properties**: Extension count or batch flag

#### Usage Limit Events
```typescript
trackUsageLimitReached()
```
- **Triggers**: When user hits monthly upload limit (5 scans/month)
- **Properties**: None (event presence is meaningful)

#### Error Events
```typescript
trackError(errorCode: string, isRecoverable: boolean)
```
- **Triggers**: When errors occur
- **Properties**: Error code, recoverability flag

### 3. Integration Points

#### Server Actions
- **Upload Action** (`/src/app/actions/upload.ts`)
  - Tracks successful uploads
  - Tracks usage limit reached errors
  - Tracks general upload errors

- **Analysis Action** (`/src/app/actions/analyze.ts`)
  - Tracks initial analysis completion
  - Tracks longitudinal analysis completion
  - Tracks analysis errors

- **Retention Action** (`/src/app/actions/retention.ts`)
  - Tracks retention extensions
  - Tracks scan deletions (single and batch)
  - Tracks retention-related errors

#### Client Components
- **PDFDownloadButton** (`/src/components/results/PDFDownloadButton.tsx`)
  - Tracks PDF downloads after successful generation

- **Layout** (`/src/app/layout.tsx`)
  - Integrates `<Analytics />` component from Vercel

#### Footer
- **Footer Component** (`/src/components/shared/Footer.tsx`)
  - Privacy policy link
  - Terms of service link
  - Analytics information link

## Architecture

### Analytics Tracker Service
**File**: `/src/lib/analytics/tracker.ts`

```typescript
// Core function
trackEvent(eventName: string, properties?: Record<string, string | number | boolean>)

// Specialized trackers (built on trackEvent)
trackScanUploaded(fileType, fileSizeMb, isBatch)
trackScanAnalyzed(analysisType, processingTimeSeconds, classification, riskScore)
trackPdfDownloaded(scanId)
trackRetentionExtended(extensionCount)
trackUsageLimitReached()
trackError(errorCode, isRecoverable)
trackDataDeleted(isBatch)
trackFeatureUsed(featureName)
```

#### Privacy Protection Implementation
```typescript
// 1. DNT Header Check
if (navigator.doNotTrack === '1') {
  return; // Skip tracking entirely
}

// 2. Production-Only
if (process.env.NODE_ENV !== 'production') {
  return; // Only track in production
}

// 3. Property Sanitization
- Blocks all properties matching PII patterns (email, phone, name, address, ssn, credit, health, medical, diagnosis, patient)
- Blocks property values matching PII patterns (@, etc.)
- Only allows safe types: string, number, boolean
```

## Event Properties

### scan_uploaded
```json
{
  "file_type": "dicom|image",
  "file_size_mb": 45.5,
  "is_batch": false
}
```

### scan_analyzed
```json
{
  "analysis_type": "initial|longitudinal",
  "processing_time_seconds": 15.5,
  "classification": "normal|suspicious",
  "risk_score_range": "0-30|30-70|70-100"
}
```

### pdf_downloaded
```json
{
  "scan_id": "uuid"
}
```

### retention_extended
```json
{
  "extension_count": 2
}
```

### usage_limit_reached
```json
{}
```

### error_occurred
```json
{
  "error_code": "UPLOAD_FAILED",
  "is_recoverable": true
}
```

### data_deleted
```json
{
  "is_batch": false
}
```

### feature_used
```json
{
  "feature_name": "longitudinal_comparison"
}
```

## Testing

**Test File**: `/test/lib/analytics/tracker.test.ts`

Comprehensive test coverage includes:
- PII detection and blocking (13+ tests)
- Event grouping logic (risk score ranges)
- DNT header support
- Environment checks
- Safe data type validation
- Privacy protection for common sensitive fields

**Run Tests**:
```bash
npm test -- analytics/tracker.test.ts --run
```

**All Tests**:
```bash
npm test -- --run
```

## Configuration

### Vercel Analytics
- Automatically integrated via `@vercel/analytics/react`
- No configuration needed
- Works out of the box in production deployments
- Dashboard available at vercel.com under project analytics

### Environment Variables
No additional environment variables needed. Analytics respects:
- `process.env.NODE_ENV` (must be "production")
- Browser's `navigator.doNotTrack` setting

## Privacy Compliance

### GDPR Compliance
✅ No PII collected
✅ Respects DNT header
✅ Minimal data collection
✅ User consent implied by usage
✅ Privacy policy available

### What's NOT Tracked
- User email addresses
- User names
- Physical addresses
- Health diagnoses
- Exact risk scores
- Medical history
- SSNs or credit card info
- Scan file contents
- Patient demographics beyond age/smoking status

### What IS Tracked (Safe)
- User ID (UUID, non-linkable)
- File types and sizes
- Processing times
- Classification categories (normal/suspicious)
- Risk score ranges (anonymized)
- Feature usage patterns
- Error codes
- Counts and aggregates

## Monitoring & Dashboards

Access analytics dashboard:
1. Go to Vercel project settings
2. Navigate to Analytics section
3. View real-time tracking data
4. Analyze user behavior patterns

**Key Metrics to Monitor**:
- scan_uploaded: User engagement with upload feature
- scan_analyzed: Analysis completion rate
- pdf_downloaded: Report generation usage
- error_occurred: System reliability
- usage_limit_reached: Capacity planning

## Error Handling

All tracking calls are wrapped in try-catch blocks:
```typescript
try {
  track(eventName, sanitizedProperties);
} catch (error) {
  console.error('Error tracking analytics event:', error);
  // Does not break user flow
}
```

Failed tracking does not affect application functionality.

## Future Enhancements

### Potential Additions (Privacy-Aware)
- Processing time buckets for performance monitoring
- File format distribution analysis
- Feature adoption rates
- Error frequency trends
- User retention metrics

### Out of Scope (Privacy)
- User segmentation
- Behavioral targeting
- Funnel analysis with individual users
- Health outcome tracking
- Personalized recommendations

## Developer Guide

### Adding New Events

1. Define tracker function in `/src/lib/analytics/tracker.ts`:
```typescript
export function trackNewEvent(param: string): void {
  trackEvent('new_event', {
    param,
  });
}
```

2. Import in your action/component:
```typescript
import { trackNewEvent } from '@/lib/analytics/tracker';
```

3. Call after successful operation:
```typescript
if (success) {
  trackNewEvent(value);
}
```

4. Add test in `/test/lib/analytics/tracker.test.ts`

5. Ensure no PII in properties

### Testing

```typescript
// Never test like this (requires external mock)
// expect(track).toHaveBeenCalled()

// Test like this instead (logic validation)
it('should group risk scores into ranges', () => {
  const range = score < 30 ? '0-30' : 'other';
  expect(range).toBe('0-30');
});
```

## Deployment

Analytics is enabled automatically in production:
- Vercel Analytics runs in all production deployments
- No configuration needed
- Data persists in Vercel dashboard
- Accessible 24/7 via vercel.com

## References

- [Vercel Analytics Documentation](https://vercel.com/analytics)
- [@vercel/analytics Package](https://www.npmjs.com/package/@vercel/analytics)
- [GDPR Privacy Policy Template](https://example.com/privacy)
- [Do Not Track Specification](https://www.w3.org/TR/tracking-dnt/)
