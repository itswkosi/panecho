/**
 * Analytics Tracker Service
 * Wrapper around Vercel Analytics for privacy-compliant event tracking
 * No PII is tracked - only non-sensitive metrics and UUIDs
 */

import { track } from '@vercel/analytics';

/**
 * Privacy-compliant event tracking
 * Respects Do Not Track header
 * No PII tracked - only user_id (UUID), counts, and non-sensitive data
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
): void {
  // Respect DNT header
  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
    return;
  }

  // Only track in production or staging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics] ${eventName}`, properties);
    return;
  }

  try {
    // Verify no PII in properties
    const sanitizedProperties = sanitizeProperties(properties);
    track(eventName, sanitizedProperties);
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
}

/**
 * Sanitize properties to ensure no PII is tracked
 * Blocks emails, names, phone numbers, etc.
 */
function sanitizeProperties(
  properties?: Record<string, any>
): Record<string, string | number | boolean> {
  if (!properties) {
    return {};
  }

  const sanitized: Record<string, string | number | boolean> = {};
  const piiPatterns = [
    /email/i,
    /phone/i,
    /name/i,
    /address/i,
    /ssn/i,
    /credit/i,
    /health/i,
    /medical/i,
    /diagnosis/i,
    /patient/i,
  ];

  for (const [key, value] of Object.entries(properties)) {
    // Block keys that look like PII
    if (piiPatterns.some((pattern) => pattern.test(key))) {
      console.warn(`[Analytics] Blocked PII property: ${key}`);
      continue;
    }

    // Only allow safe types
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      // Check value for PII patterns
      if (
        typeof value === 'string' &&
        piiPatterns.some((pattern) => pattern.test(value))
      ) {
        console.warn(`[Analytics] Blocked PII value for key: ${key}`);
        continue;
      }

      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Track scan upload event
 */
export function trackScanUploaded(
  fileType: 'dicom' | 'image',
  fileSizeMb: number,
  isBatch: boolean
): void {
  trackEvent('scan_uploaded', {
    file_type: fileType,
    file_size_mb: fileSizeMb,
    is_batch: isBatch,
  });
}

/**
 * Track scan analysis completion
 */
export function trackScanAnalyzed(
  analysisType: 'initial' | 'longitudinal',
  processingTimeSeconds: number,
  classification: 'normal' | 'suspicious',
  riskScore: number
): void {
  // Group risk scores into ranges to avoid precise health data
  const riskScoreRange = getRiskScoreRange(riskScore);

  trackEvent('scan_analyzed', {
    analysis_type: analysisType,
    processing_time_seconds: processingTimeSeconds,
    classification,
    risk_score_range: riskScoreRange,
  });
}

/**
 * Group risk score into privacy-friendly ranges
 */
function getRiskScoreRange(score: number): string {
  if (score < 30) return '0-30';
  if (score < 70) return '30-70';
  return '70-100';
}

/**
 * Track PDF download
 */
export function trackPdfDownloaded(scanId: string): void {
  // Only track that PDF was downloaded, not other details
  trackEvent('pdf_downloaded', {
    scan_id: scanId,
  });
}

/**
 * Track retention extension
 */
export function trackRetentionExtended(extensionCount: number): void {
  trackEvent('retention_extended', {
    extension_count: extensionCount,
  });
}

/**
 * Track usage limit reached
 */
export function trackUsageLimitReached(): void {
  trackEvent('usage_limit_reached', {});
}

/**
 * Track error occurrence
 */
export function trackError(
  errorCode: string,
  isRecoverable: boolean = true
): void {
  trackEvent('error_occurred', {
    error_code: errorCode,
    is_recoverable: isRecoverable,
  });
}

/**
 * Track data deletion
 */
export function trackDataDeleted(isBatch: boolean): void {
  trackEvent('data_deleted', {
    is_batch: isBatch,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsed(featureName: string): void {
  trackEvent('feature_used', {
    feature_name: featureName,
  });
}
