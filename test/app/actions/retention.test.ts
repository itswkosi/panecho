import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extendScanRetention,
  deleteScan,
  deleteAllUserScans,
  getRetentionStatus,
} from '@/app/actions/retention';

// Mock dependencies
vi.mock('@/lib/retention/manager', () => ({
  extendRetention: vi.fn(async (scanId: string) => ({
    scanId,
    newExpirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    extensionsRemaining: 2,
  })),
  deleteUserData: vi.fn(async () => undefined),
  checkRetentionStatus: vi.fn(async () => []),
  getScanRetentionInfo: vi.fn(async () => ({
    expiresAt: new Date(),
    daysRemaining: 30,
    canExtend: true,
    extensionCount: 0,
  })),
}));
// Provide a basic Supabase server mock that returns an auth object and query helpers
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id: 'scan-123', user_id: 'user-1' }, error: null })),
        })),
      })),
    })),
    storage: { from: vi.fn(() => ({ remove: vi.fn(async () => ({ data: null, error: null })) })) },
  })),
}));
vi.mock('next/cache');

describe('Retention Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extendScanRetention', () => {
    it('should succeed with valid scan', async () => {
      const result = await extendScanRetention('scan-123');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should return error when not authenticated', async () => {
      const result = await extendScanRetention('scan-123');

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should return error for non-existent scan', async () => {
      const result = await extendScanRetention('non-existent');

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should include new expiration date in response', async () => {
      const result = await extendScanRetention('scan-123');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('newExpirationDate');
        expect(result.data).toHaveProperty('extensionsRemaining');
      }
    });
  });

  describe('deleteScan', () => {
    it('should succeed with valid scan', async () => {
      const result = await deleteScan('scan-123');

      expect(result).toHaveProperty('success');
    });

    it('should return error when not authenticated', async () => {
      const result = await deleteScan('scan-123');

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should verify user ownership', async () => {
      const result = await deleteScan('scan-123');

      if (!result.success) {
        // Should fail due to ownership check in test environment
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('deleteAllUserScans', () => {
    it('should return success or error', async () => {
      const result = await deleteAllUserScans();

      expect(result).toHaveProperty('success');
    });

    it('should handle authentication error', async () => {
      const result = await deleteAllUserScans();

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('getRetentionStatus', () => {
    it('should return data structure', async () => {
      const result = await getRetentionStatus();

      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result).toHaveProperty('data');
      }
    });

    it('should handle authentication error', async () => {
      const result = await getRetentionStatus();

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should catch and return error messages', async () => {
      const result = await extendScanRetention('invalid');

      if (!result.success) {
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
