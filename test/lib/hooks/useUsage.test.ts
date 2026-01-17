import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsage } from '@/lib/hooks/useUsage';
import { useUsageStore } from '@/lib/hooks/useUsageStore';
import type { UsageLimitResult } from '@/lib/usage/tracker';

vi.mock('@/lib/hooks/useUsageStore');

const mockUsageData: UsageLimitResult = {
  canUpload: true,
  scansUsed: 10,
  scansRemaining: 90,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isAdmin: false,
};

const mockExceededData: UsageLimitResult = {
  canUpload: false,
  scansUsed: 100,
  scansRemaining: 0,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isAdmin: false,
};

const mockWarningData: UsageLimitResult = {
  canUpload: true,
  scansUsed: 85,
  scansRemaining: 15,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isAdmin: false,
};

describe('useUsage', () => {
  const mockFetchUsageData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUsageStore).mockReturnValue({
      usageData: mockUsageData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      setUsageData: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('should return usage data', () => {
    const { result } = renderHook(() => useUsage({ autoFetch: false }));

    expect(result.current.usageData).toEqual(mockUsageData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle exceeded data correctly', () => {
    vi.mocked(useUsageStore).mockReturnValue({
      usageData: mockExceededData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      setUsageData: vi.fn(),
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => useUsage({ autoFetch: false }));

    expect(result.current.usageData?.canUpload).toBe(false);
  });

  it('should handle warning data correctly', () => {
    vi.mocked(useUsageStore).mockReturnValue({
      usageData: mockWarningData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      setUsageData: vi.fn(),
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => useUsage({ autoFetch: false }));

    expect(result.current.usageData?.canUpload).toBe(true);
    expect(result.current.usageData?.scansUsed).toBe(85);
  });

  it('should auto-fetch when enabled and no data', async () => {
    vi.mocked(useUsageStore).mockReturnValue({
      usageData: null,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      setUsageData: vi.fn(),
      clearError: vi.fn(),
    });

    renderHook(() => useUsage({ autoFetch: true }));

    await waitFor(() => {
      expect(mockFetchUsageData).toHaveBeenCalled();
    });
  });

  it('should not auto-fetch when disabled', () => {
    vi.mocked(useUsageStore).mockReturnValue({
      usageData: null,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      setUsageData: vi.fn(),
      clearError: vi.fn(),
    });

    renderHook(() => useUsage({ autoFetch: false }));

    expect(mockFetchUsageData).not.toHaveBeenCalled();
  });

  it('should call onLimitExceeded callback when limit exceeded', async () => {
    const onLimitExceeded = vi.fn();

    vi.mocked(useUsageStore).mockReturnValue({
      usageData: mockExceededData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      setUsageData: vi.fn(),
      clearError: vi.fn(),
    });

    renderHook(() => useUsage({ autoFetch: false, onLimitExceeded }));

    await waitFor(() => {
      expect(onLimitExceeded).toHaveBeenCalledWith(mockExceededData);
    });
  });

  it('should not call onLimitExceeded when within limits', () => {
    const onLimitExceeded = vi.fn();

    vi.mocked(useUsageStore).mockReturnValue({
      usageData: mockUsageData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      setUsageData: vi.fn(),
      clearError: vi.fn(),
    });

    renderHook(() => useUsage({ autoFetch: false, onLimitExceeded }));

    expect(onLimitExceeded).not.toHaveBeenCalled();
  });

  it('should return null for usage data when no data', () => {
    vi.mocked(useUsageStore).mockReturnValue({
      usageData: null,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      setUsageData: vi.fn(),
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => useUsage({ autoFetch: false }));

    expect(result.current.usageData).toBeNull();
  });
});
