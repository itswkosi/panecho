/**
 * Error types and interfaces for the application
 * All error codes should have corresponding user-friendly messages
 */

export enum ErrorCode {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  DICOM_PARSE_ERROR = 'DICOM_PARSE_ERROR',
  DICOM_CONVERSION_ERROR = 'DICOM_CONVERSION_ERROR',
  STORAGE_UPLOAD_ERROR = 'STORAGE_UPLOAD_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  INSUFFICIENT_IMAGE_QUALITY = 'INSUFFICIENT_IMAGE_QUALITY',
  INVALID_API_RESPONSE = 'INVALID_API_RESPONSE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured error response from server
 */
export interface AppError {
  code: ErrorCode;
  message: string; // Technical message for logging
  userMessage: string; // User-friendly message for display
  recoverable: boolean; // Whether user can retry
  partialData?: any; // Any partial results if available
  retryCount?: number; // Current retry attempt
  maxRetries?: number; // Maximum retry attempts
}

/**
 * Server action error response format
 */
export interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    recoverable: boolean;
    retryCount?: number;
  };
}

/**
 * Error context for logging (without PII)
 */
export interface ErrorContext {
  action: string; // Server action name
  code?: string; // Error code if available
  context?: string; // Additional context
  timestamp?: Date;
  userId?: string; // Hashed user ID if applicable
}
