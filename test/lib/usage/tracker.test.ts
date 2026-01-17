import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkUsageLimit,
  trackScanUsage,
  getResetDate,
  hasExceededLimit,
  formatResetDate,
} from '@/lib/usage/tracker';
import * as supabaseModule from '@/lib/supabase/server';

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Usage Tracker', () => {
  const mockUserId = 'test-user-123';
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabaseModule.createClient as any).mockResolvedValue(mockSupabase);
  });

  describe('checkUsageLimit', () => {
    it('should return canUpload: true when under limit', async () => {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: false },
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_admin: false },
                }),
              }),
            }),
          };
        }
        if (table === 'usage_tracking') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: '1',
                        scan_count: 2,
                        period_start: now.toISOString(),
                        period_end: periodEnd.toISOString(),
                      },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({}),
            }),
          }),
        };
      });

      const result = await checkUsageLimit(mockUserId);

      expect(result.canUpload).toBe(true);
      expect(result.scansUsed).toBe(2);
      expect(result.scansRemaining).toBe(3);
    });

    it('should return canUpload: false when at limit', async () => {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_admin: false },
                }),
              }),
            }),
          };
        }
        if (table === 'usage_tracking') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: '1',
                        scan_count: 5,
                        period_start: now.toISOString(),
                        period_end: periodEnd.toISOString(),
                      },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({}),
            }),
          }),
        };
      });

      const result = await checkUsageLimit(mockUserId);

      expect(result.canUpload).toBe(false);
      expect(result.scansUsed).toBe(5);
      expect(result.scansRemaining).toBe(0);
    });

    it('should allow admins to bypass rate limits', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_admin: true },
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({}),
            }),
          }),
        };
      });

      const result = await checkUsageLimit(mockUserId);

      expect(result.canUpload).toBe(true);
      expect(result.isAdmin).toBe(true);
      expect(result.scansRemaining).toBe(5);
    });

    it('should handle no active period', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_admin: false },
                }),
              }),
            }),
          };
        }
        if (table === 'usage_tracking') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({}),
            }),
          }),
        };
      });

      const result = await checkUsageLimit(mockUserId);

      expect(result.canUpload).toBe(true);
      expect(result.scansUsed).toBe(0);
      expect(result.scansRemaining).toBe(5);
    });
  });

  describe('trackScanUsage', () => {
    it('should increment existing period', async () => {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      const mockUpdate = vi.fn().mockResolvedValue({});
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'usage_tracking') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: '1',
                        scan_count: 2,
                        period_start: now.toISOString(),
                        period_end: periodEnd.toISOString(),
                      },
                    }),
                  }),
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      await trackScanUsage(mockUserId);

      expect(mockUpdate).toHaveBeenCalledWith({
        scan_count: 3,
        updated_at: expect.any(String),
      });
    });

    it('should create new period if none exists', async () => {
      const mockInsert = vi.fn().mockResolvedValue({});
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'usage_tracking') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
            insert: mockInsert,
          };
        }
        return {};
      });

      await trackScanUsage(mockUserId);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          scan_count: 1,
        })
      );
    });
  });

  describe('getResetDate', () => {
    it('should return period_end when active period exists', async () => {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  period_end: periodEnd.toISOString(),
                },
              }),
            }),
          }),
        }),
      });

      const result = await getResetDate(mockUserId);

      expect(result).toEqual(periodEnd);
    });

    it('should return 30 days from now when no active period', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const beforeCall = new Date();
      const result = await getResetDate(mockUserId);
      const afterCall = new Date();

      const expectedMin = new Date(beforeCall);
      expectedMin.setDate(expectedMin.getDate() + 30);
      const expectedMax = new Date(afterCall);
      expectedMax.setDate(expectedMax.getDate() + 30);

      expect(result.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
  });

  describe('hasExceededLimit', () => {
    it('should return false when under limit', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_admin: false },
                }),
              }),
            }),
          };
        }
        if (table === 'usage_tracking') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { scan_count: 2 },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await hasExceededLimit(mockUserId);

      expect(result).toBe(false);
    });

    it('should return true when at limit', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_admin: false },
                }),
              }),
            }),
          };
        }
        if (table === 'usage_tracking') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { scan_count: 5 },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await hasExceededLimit(mockUserId);

      expect(result).toBe(true);
    });
  });

  describe('formatResetDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-12-31T00:00:00Z');
      const result = formatResetDate(date);

      expect(result).toContain('December');
      expect(result).toContain('2025');
    });
  });
});
