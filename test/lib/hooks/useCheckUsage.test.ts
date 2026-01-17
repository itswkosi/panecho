import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckUsage } from '@/lib/hooks/useCheckUsage';
import { useUsage } from '@/lib/hooks/useUsage';
import type { UsageLimitResult } from '@/lib/usage/tracker';

vi.mock('@/lib/hooks/useUsage');

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

describe('useCheckUsage', () => {
  const mockFetchUsageData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchUsageData.mockResolvedValue(undefined);
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockUsageData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      clearError: vi.fn(),
    });
  });

  it('should allow operation when within limits', () => {
    const { result } = renderHook(() => useCheckUsage());

    expect(result.current.canProceed()).toBe(true);
  });

  it('should prevent operation when limit exceeded', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockExceededData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => useCheckUsage());

    expect(result.current.canProceed()).toBe(false);
  });

  it('should return true when no data loaded yet', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: null,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => useCheckUsage());

    expect(result.current.canProceed()).toBe(true);
  });

  it('should execute callback when check passes', async () => {
    const { result } = renderHook(() => useCheckUsage());
    const callback = vi.fn();

    await act(async () => {
      await result.current.checkAndExecute(callback);
    });

    expect(callback).toHaveBeenCalled();
    expect(mockFetchUsageData).toHaveBeenCalled();
  });

  it('should not execute callback when check fails', async () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockExceededData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => useCheckUsage());
    const callback = vi.fn();

    await act(async () => {
      await result.current.checkAndExecute(callback);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should call onPass callback when check passes', async () => {
    const onPass = vi.fn();
    const { result } = renderHook(() => useCheckUsage({ onPass }));
    const callback = vi.fn();

    await act(async () => {
      await result.current.checkAndExecute(callback);
    });

    expect(onPass).toHaveBeenCalled();
  });

  it('should call onFail callback when check fails', async () => {
    const onFail = vi.fn();
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockExceededData,
      loading: false,
      error: null,
      fetchUsageData: mockFetchUsageData,
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => useCheckUsage({ onFail }));
    const callback = vi.fn();

    await act(async () => {
      await result.current.checkAndExecute(callback);
    });

    expect(onFail).toHaveBeenCalled();
  });

  it('should handle async callback', async () => {
    const { result } = renderHook(() => useCheckUsage());
    const callback = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.checkAndExecute(callback);
    });

    expect(callback).toHaveBeenCalled();
  });

  it('should refresh data before checking', async () => {
    const { result } = renderHook(() => useCheckUsage());
    const callback = vi.fn();

    mockFetchUsageData.mockClear();

    await act(async () => {
      await result.current.checkAndExecute(callback);
    });

    expect(mockFetchUsageData).toHaveBeenCalled();
  });
});
