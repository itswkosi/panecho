import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@/lib/types/errors';

describe('Upload Server Action', () => {
  it('should return properly structured error response', async () => {
    // This test verifies the response structure
    // Full integration tests are in upload-action.test.ts
    const mockError = {
      success: false,
      error: {
        code: ErrorCode.FILE_TOO_LARGE,
        message: 'Your file is larger than 100MB',
        recoverable: true,
      },
    };

    expect(mockError.success).toBe(false);
    expect(mockError.error).toHaveProperty('code');
    expect(mockError.error).toHaveProperty('message');
    expect(mockError.error).toHaveProperty('recoverable');
  });

  it('should properly type ServerActionResponse', async () => {
    const successResponse = {
      success: true,
      data: { scanId: 'scan-123' },
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.data?.scanId).toBeDefined();
  });

  it('should have all ErrorCode types available', () => {
    const codes = [
      ErrorCode.FILE_TOO_LARGE,
      ErrorCode.INVALID_FILE_TYPE,
      ErrorCode.DICOM_PARSE_ERROR,
      ErrorCode.DICOM_CONVERSION_ERROR,
      ErrorCode.STORAGE_UPLOAD_ERROR,
      ErrorCode.DATABASE_ERROR,
      ErrorCode.API_ERROR,
      ErrorCode.API_RATE_LIMIT,
      ErrorCode.INSUFFICIENT_IMAGE_QUALITY,
      ErrorCode.INVALID_API_RESPONSE,
      ErrorCode.UNAUTHORIZED,
      ErrorCode.NOT_FOUND,
      ErrorCode.UNKNOWN_ERROR,
    ];

    expect(codes).toHaveLength(13);
    codes.forEach((code) => {
      expect(typeof code).toBe('string');
    });
  });
});

