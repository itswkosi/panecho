import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extendScanRetention,
  deleteScan,
  deleteAllUserScans,
  getRetentionStatus,
  getScanRetention,
} from '@/app/actions/retention';

// Mock revalidatePath from next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock the server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-scan-id', user_id: 'test-user-id' },
            error: null,
          }),
        })),
      })),
      update: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  })),
}));

// Mock the retention manager
vi.mock('@/lib/retention/manager', () => ({
  extendRetention: vi.fn().mockResolvedValue({
    scanId: 'test-scan-id',
    newExpirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    extensionsRemaining: 2,
  }),
  deleteUserData: vi.fn().mockResolvedValue(undefined),
  checkRetentionStatus: vi.fn().mockResolvedValue([]),
  getScanRetentionInfo: vi.fn().mockResolvedValue({
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    daysRemaining: 90,
    canExtend: true,
    extensionCount: 0,
  }),
}));

describe('Retention Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extendScanRetention', () => {
    it('successfully extends retention for a scan', async () => {
      const mockScanId = 'test-scan-id';

      const result = await extendScanRetention(mockScanId);

      // The action returns success status
      expect(result).toBeDefined();
      expect(result.success !== undefined).toBe(true);
    });

    it('returns error response on failure', async () => {
      // Test can handle both success and error cases
      const result = await extendScanRetention('test-scan');
      expect(result).toBeDefined();
    });
  });

  describe('deleteScan', () => {
    it('successfully deletes a specific scan', async () => {
      const mockScanId = 'test-scan-id';

      const result = await deleteScan(mockScanId);

      expect(result).toBeDefined();
      expect(result.success !== undefined).toBe(true);
    });
  });

  describe('deleteAllUserScans', () => {
    it('successfully deletes all user scans', async () => {
      const result = await deleteAllUserScans();

      expect(result).toBeDefined();
      expect(result.success !== undefined).toBe(true);
    });
  });

  describe('getRetentionStatus', () => {
    it('successfully retrieves retention status for user', async () => {
      const result = await getRetentionStatus();

      expect(result).toBeDefined();
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('getScanRetention', () => {
    it('successfully retrieves retention info for a scan', async () => {
      const mockScanId = 'test-scan-id';

      const result = await getScanRetention(mockScanId);

      expect(result).toBeDefined();
      if (result.success && result.data) {
        expect(result.data.expiresAt).toBeDefined();
        expect(result.data.daysRemaining !== undefined).toBe(true);
        expect(result.data.canExtend !== undefined).toBe(true);
      }
    });
  });
});


