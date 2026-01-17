import { describe, it, expect } from 'vitest';
import { handleError, createErrorResponse, shouldRetry, getRetryDelay } from '@/lib/errors/handler';
import { ErrorCode } from '@/lib/types/errors';

describe('Error Handler', () => {
  describe('handleError', () => {
    it('should detect FILE_TOO_LARGE error', () => {
      const error = new Error('File exceeds 100MB limit');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(result.userMessage).toContain('100MB');
    });

    it('should detect INVALID_FILE_TYPE error', () => {
      const error = new Error('Invalid file type');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.INVALID_FILE_TYPE);
      expect(result.recoverable).toBe(true);
    });

    it('should detect DICOM_PARSE_ERROR', () => {
      const error = new Error('DICOM parsing failed');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.DICOM_PARSE_ERROR);
      expect(result.recoverable).toBe(true);
    });

    it('should detect DICOM_CONVERSION_ERROR', () => {
      const error = new Error('conversion failed');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.DICOM_CONVERSION_ERROR);
      expect(result.recoverable).toBe(true);
    });

    it('should detect STORAGE_UPLOAD_ERROR', () => {
      const error = new Error('Storage upload failed');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.STORAGE_UPLOAD_ERROR);
    });

    it('should detect DATABASE_ERROR', () => {
      const error = new Error('Database connection failed');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(result.recoverable).toBe(false);
    });

    it('should detect API_RATE_LIMIT', () => {
      const error = new Error('rate limit exceeded');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.API_RATE_LIMIT);
      expect(result.recoverable).toBe(true);
    });

    it('should detect API_ERROR', () => {
      const error = new Error('OpenAI API error');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.API_ERROR);
    });

    it('should detect UNAUTHORIZED error', () => {
      const error = new Error('Unauthorized access');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should default to UNKNOWN_ERROR for unmatched errors', () => {
      const error = new Error('Some weird error');
      const result = handleError(error, 'test');

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.recoverable).toBe(true);
    });

    it('should handle non-Error exceptions', () => {
      const result = handleError('String error', 'test');

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('An unexpected error occurred');
    });

    it('should provide user-friendly message', () => {
      const error = new Error('File exceeds 100MB limit');
      const result = handleError(error, 'test');

      expect(result.userMessage).toBeDefined();
      expect(result.userMessage.length).toBeGreaterThan(0);
      expect(result.userMessage).not.toContain('DICOM');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with correct structure', () => {
      const error = {
        code: ErrorCode.FILE_TOO_LARGE,
        message: 'technical message',
        userMessage: 'user message',
        recoverable: true,
      };

      const response = createErrorResponse(error, 0);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(response.error?.message).toBe('user message');
      expect(response.error?.recoverable).toBe(true);
      expect(response.error?.retryCount).toBe(0);
    });

    it('should track retry count', () => {
      const error = {
        code: ErrorCode.API_ERROR,
        message: 'API failed',
        userMessage: 'API failed',
        recoverable: true,
      };

      const response = createErrorResponse(error, 2);

      expect(response.error?.retryCount).toBe(2);
    });
  });

  describe('shouldRetry', () => {
    it('should allow retry for recoverable errors', () => {
      const error = {
        code: ErrorCode.API_ERROR,
        message: 'API failed',
        userMessage: 'API failed',
        recoverable: true,
      };

      expect(shouldRetry(error, 0, 3)).toBe(true);
      expect(shouldRetry(error, 1, 3)).toBe(true);
      expect(shouldRetry(error, 2, 3)).toBe(true);
    });

    it('should not allow retry after max retries', () => {
      const error = {
        code: ErrorCode.API_ERROR,
        message: 'API failed',
        userMessage: 'API failed',
        recoverable: true,
      };

      expect(shouldRetry(error, 3, 3)).toBe(false);
      expect(shouldRetry(error, 4, 3)).toBe(false);
    });

    it('should not allow retry for non-recoverable errors', () => {
      const error = {
        code: ErrorCode.DATABASE_ERROR,
        message: 'DB failed',
        userMessage: 'DB failed',
        recoverable: false,
      };

      expect(shouldRetry(error, 0, 3)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential backoff delays', () => {
      expect(getRetryDelay(0)).toBe(1000); // 2^0 * 1000
      expect(getRetryDelay(1)).toBe(2000); // 2^1 * 1000
      expect(getRetryDelay(2)).toBe(4000); // 2^2 * 1000
      expect(getRetryDelay(3)).toBe(8000); // 2^3 * 1000
    });

    it('should handle large retry counts', () => {
      const delay = getRetryDelay(5);
      expect(delay).toBe(32000); // 2^5 * 1000
    });
  });
});
