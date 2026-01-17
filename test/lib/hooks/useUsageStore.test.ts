import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsageStore } from '@/lib/hooks/useUsageStore';
import * as usageActions from '@/app/actions/usage';
import type { UsageLimitResult } from '@/lib/usage/tracker';

vi.mock('@/app/actions/usage');

const mockUsageData: UsageLimitResult = {
  canUpload: true,
  scansUsed: 10,
  scansRemaining: 90,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isAdmin: false,
};

describe('useUsageStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useUsageStore());

    expect(result.current.usageData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch usage data successfully', async () => {
    vi.mocked(usageActions.checkUsageLimit).mockResolvedValue(mockUsageData);

    const { result } = renderHook(() => useUsageStore());

    await act(async () => {
      await result.current.fetchUsageData();
    });

    expect(result.current.usageData).toEqual(mockUsageData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Failed to fetch usage';
    vi.mocked(usageActions.checkUsageLimit).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUsageStore());

    await act(async () => {
      await result.current.fetchUsageData();
    });

    expect(result.current.usageData).toBeNull();
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.loading).toBe(false);
  });

  it('should set loading state during fetch', async () => {
    vi.mocked(usageActions.checkUsageLimit).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockUsageData), 100);
        })
    );

    const { result } = renderHook(() => useUsageStore());

    act(() => {
      result.current.fetchUsageData();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.loading).toBe(false);
  });

  it('should set usage data directly', () => {
    const { result } = renderHook(() => useUsageStore());

    act(() => {
      result.current.setUsageData(mockUsageData);
    });

    expect(result.current.usageData).toEqual(mockUsageData);
    expect(result.current.error).toBeNull();
  });

  it('should clear error', async () => {
    vi.mocked(usageActions.checkUsageLimit).mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useUsageStore());

    await act(async () => {
      await result.current.fetchUsageData();
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle null usage data', async () => {
    vi.mocked(usageActions.checkUsageLimit).mockResolvedValue(null);

    const { result } = renderHook(() => useUsageStore());

    await act(async () => {
      await result.current.fetchUsageData();
    });

    expect(result.current.usageData).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
