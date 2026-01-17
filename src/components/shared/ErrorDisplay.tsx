'use client';

import { useState } from 'react';
import { AlertCircle, ChevronDown, RefreshCw, Mail } from 'lucide-react';
import { ErrorCode } from '@/lib/types/errors';

interface ErrorDisplayProps {
  code: ErrorCode;
  message: string;
  recoverable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryCount?: number;
  showTechnicalDetails?: boolean;
}

export function ErrorDisplay({
  code,
  message,
  recoverable = false,
  onRetry,
  onDismiss,
  retryCount = 0,
  showTechnicalDetails = false,
}: ErrorDisplayProps) {
  const [expanded, setExpanded] = useState(showTechnicalDetails);
  const maxRetries = 3;
  const canRetry = recoverable && retryCount < maxRetries;

  // Determine error severity color
  const getSeverityColor = () => {
    if (!recoverable) return 'border-red-200 bg-red-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  // Determine icon color
  const getIconColor = () => {
    if (!recoverable) return 'text-red-600';
    return 'text-yellow-600';
  };

  // Determine button color
  const getButtonColor = () => {
    if (!recoverable) return 'bg-red-600 hover:bg-red-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <div
      className={`rounded-lg border-2 p-6 ${getSeverityColor()}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-4">
        <AlertCircle className={`mt-1 h-6 w-6 flex-shrink-0 ${getIconColor()}`} />

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {recoverable ? 'We can fix this' : 'Unable to proceed'}
          </h3>

          {/* Main error message */}
          <p className="mt-2 text-gray-700 leading-relaxed">{message}</p>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                className={`flex items-center gap-2 rounded-lg px-6 py-2 font-semibold text-white transition-colors ${getButtonColor()}`}
                aria-label={`Retry ${retryCount + 1} of ${maxRetries}`}
              >
                <RefreshCw className="h-4 w-4" />
                Retry{retryCount > 0 && ` (${retryCount}/${maxRetries})`}
              </button>
            )}

            {!recoverable && (
              <a
                href="mailto:support@panecho.io"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Contact Support
              </a>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="rounded-lg bg-gray-200 px-6 py-2 font-semibold text-gray-800 hover:bg-gray-300 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>

          {/* Retry limit warning */}
          {canRetry && retryCount > 0 && (
            <p className="mt-3 text-sm text-gray-600">
              Retry attempt {retryCount} of {maxRetries}. You can try {maxRetries - retryCount} more time{maxRetries - retryCount !== 1 ? 's' : ''}.
            </p>
          )}

          {!canRetry && recoverable && (
            <p className="mt-3 text-sm text-gray-600">
              You've reached the maximum retry attempts. Please contact support if you continue to experience issues.
            </p>
          )}

          {/* Technical details section */}
          <div className="mt-6 border-t border-gray-300 pt-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              aria-expanded={expanded}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
              Technical Details
            </button>

            {expanded && (
              <div className="mt-3 rounded bg-white p-4 font-mono text-xs text-gray-600 break-all">
                <p>
                  Error Code: <span className="font-semibold">{code}</span>
                </p>
                <p className="mt-1 text-gray-500">
                  Share this code with support to help resolve the issue faster.
                </p>
              </div>
            )}
          </div>

          {/* Disclaimer for quality issues */}
          {code === ErrorCode.INSUFFICIENT_IMAGE_QUALITY && (
            <div className="mt-6 rounded-lg bg-orange-50 border border-orange-200 p-4">
              <p className="text-sm font-semibold text-orange-900">⚠️ Medical Disclaimer</p>
              <p className="mt-2 text-sm text-orange-800">
                This analysis is provided for informational purposes only and should not be used for
                medical diagnosis. Please consult with a qualified healthcare professional for medical
                advice.
              </p>
            </div>
          )}

          {/* Database error warning */}
          {code === ErrorCode.DATABASE_ERROR && (
            <div className="mt-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-semibold text-red-900">Important: Save Your Results</p>
              <p className="mt-2 text-sm text-red-800">
                Please screenshot this page or contact support at support@panecho.io so we don't lose
                your analysis results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
