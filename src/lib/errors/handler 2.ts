/**
 * Error handling service
 * Converts technical errors to user-friendly messages
 * Logs errors server-side (without PII)
 */

import { ErrorCode, AppError, ErrorContext } from '@/lib/types/errors';

/**
 * Map of error codes to user-friendly messages
 * Based on PRD Section 3.12 error handling specifications
 */
const ERROR_MESSAGES: Record<ErrorCode, { userMessage: string; recoverable: boolean }> = {
  [ErrorCode.FILE_TOO_LARGE]: {
    userMessage:
      'Your file is larger than 100MB. Please contact support or compress the file using standard medical imaging compression.',
    recoverable: true,
  },
  [ErrorCode.INVALID_FILE_TYPE]: {
    userMessage:
      "We couldn't read this file format. Please ensure it's a DICOM file (.dcm) or a standard medical image (PNG, JPEG) from your imaging center.",
    recoverable: true,
  },
  [ErrorCode.DICOM_PARSE_ERROR]: {
    userMessage:
      'We couldn\'t read this DICOM file. Please ensure it\'s a valid CT scan file from your imaging center. You may need to export it again.',
    recoverable: true,
  },
  [ErrorCode.DICOM_CONVERSION_ERROR]: {
    userMessage:
      "We're having trouble processing this scan image. The file may be corrupted or in an unsupported format. Please try a different export or contact your imaging center.",
    recoverable: true,
  },
  [ErrorCode.STORAGE_UPLOAD_ERROR]: {
    userMessage:
      'We had trouble uploading your file. Please check your internet connection and try again.',
    recoverable: true,
  },
  [ErrorCode.DATABASE_ERROR]: {
    userMessage:
      "We analyzed your scan but had trouble saving the results. Please screenshot this page and contact support so we don't lose your analysis.",
    recoverable: false,
  },
  [ErrorCode.API_ERROR]: {
    userMessage:
      'Our analysis service is temporarily unavailable. Please try again in a few moments. We will automatically retry your scan.',
    recoverable: true,
  },
  [ErrorCode.API_RATE_LIMIT]: {
    userMessage:
      "Our service is experiencing high demand. We'll automatically retry your scan analysis in a moment.",
    recoverable: true,
  },
  [ErrorCode.INSUFFICIENT_IMAGE_QUALITY]: {
    userMessage:
      "The image quality may be too low for accurate AI analysis. For critical medical decisions, please consult a physician directly. We're providing preliminary results below for reference.",
    recoverable: false,
  },
  [ErrorCode.INVALID_API_RESPONSE]: {
    userMessage:
      'We received an unexpected response from our analysis service. Please try again. If this continues, please contact support.',
    recoverable: true,
  },
  [ErrorCode.UNAUTHORIZED]: {
    userMessage: 'You need to be logged in to upload scans. Please sign in and try again.',
    recoverable: true,
  },
  [ErrorCode.NOT_FOUND]: {
    userMessage:
      "We couldn't find the scan you're looking for. It may have been deleted or you may not have access to it.",
    recoverable: false,
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    userMessage:
      'An unexpected error occurred. Please try again. If this continues, please contact support at support@panecho.io.',
    recoverable: true,
  },
};

/**
 * Log error server-side without PII
 * Should be called on server only (in Server Actions)
 */
function logError(error: Error, context: ErrorContext): void {
  // Only log on server
  if (typeof window !== 'undefined') return;

  const logEntry = {
    timestamp: context.timestamp || new Date().toISOString(),
    action: context.action,
    code: context.code,
    message: error.message,
    stack: error.stack,
    userId: context.userId,
  };

  // Log to console (can be collected by error tracking service)
  console.error('[ERROR]', JSON.stringify(logEntry));
}

/**
 * Handles errors and converts them to user-friendly format
 * @param error The error to handle
 * @param context Error context for logging
 * @returns Structured AppError with user-friendly message
 */
export function handleError(error: Error | unknown, context: string): AppError {
  let code = ErrorCode.UNKNOWN_ERROR;
  let message = 'An unexpected error occurred';
  const errorContext: ErrorContext = {
    action: context,
    timestamp: new Date(),
  };

  if (error instanceof Error) {
    message = error.message;

    // Detect error type from message or error properties
    if (message.includes('File exceeds') || message.includes('too large')) {
      code = ErrorCode.FILE_TOO_LARGE;
    } else if (
      message.includes('Invalid file type') ||
      message.includes('not supported') ||
      message.includes('format')
    ) {
      code = ErrorCode.INVALID_FILE_TYPE;
    } else if (
      message.includes('DICOM') ||
      message.includes('parsing') ||
      message.includes('dcm')
    ) {
      code = ErrorCode.DICOM_PARSE_ERROR;
    } else if (message.includes('conversion') || message.includes('slice')) {
      code = ErrorCode.DICOM_CONVERSION_ERROR;
    } else if (message.includes('Storage') || message.includes('upload')) {
      code = ErrorCode.STORAGE_UPLOAD_ERROR;
    } else if (message.includes('database') || message.includes('Database')) {
      code = ErrorCode.DATABASE_ERROR;
    } else if (message.includes('rate limit') || message.includes('429')) {
      code = ErrorCode.API_RATE_LIMIT;
    } else if (
      message.includes('API') ||
      message.includes('OpenAI') ||
      message.includes('401') ||
      message.includes('403')
    ) {
      code = ErrorCode.API_ERROR;
    } else if (message.includes('quality')) {
      code = ErrorCode.INSUFFICIENT_IMAGE_QUALITY;
    } else if (message.includes('response') || message.includes('parse')) {
      code = ErrorCode.INVALID_API_RESPONSE;
    } else if (message.includes('unauthorized') || message.includes('auth')) {
      code = ErrorCode.UNAUTHORIZED;
    } else if (message.includes('not found') || message.includes('404')) {
      code = ErrorCode.NOT_FOUND;
    }
  }

  errorContext.code = code;
  logError(error instanceof Error ? error : new Error(String(error)), errorContext);

  const errorInfo = ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];

  return {
    code,
    message,
    userMessage: errorInfo.userMessage,
    recoverable: errorInfo.recoverable,
  };
}

/**
 * Convert AppError to server action response
 */
export function createErrorResponse(error: AppError, retryCount = 0) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.userMessage,
      recoverable: error.recoverable,
      retryCount,
    },
  };
}

/**
 * Check if error is recoverable and retry is possible
 */
export function shouldRetry(error: AppError, currentRetryCount: number, maxRetries = 3): boolean {
  return error.recoverable && currentRetryCount < maxRetries;
}

/**
 * Get retry delay in milliseconds (exponential backoff)
 * Delays: 1s, 2s, 4s for retries 0, 1, 2
 */
export function getRetryDelay(retryCount: number): number {
  return Math.pow(2, retryCount) * 1000;
}
