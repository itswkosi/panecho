import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsage } from '@/lib/hooks/useUsage';
import { useCheckUsage } from '@/lib/hooks/useCheckUsage';
import { useUsageStore } from '@/lib/hooks/useUsageStore';
import { checkUsageLimit } from '@/app/actions/usage';
import type { UsageLimitResult } from '@/lib/usage/tracker';

// Mock the server action
vi.mock('@/app/actions/usage');

const mockUsageData: UsageLimitResult = {
  canUpload: true,
  scansUsed: 50,
  scansRemaining: 50,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isAdmin: false,
};

describe('Usage System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize store, fetch data, and provide to hooks', async () => {
    vi.mocked(checkUsageLimit).mockResolvedValue(mockUsageData);

    const { result: storeResult } = renderHook(() => useUsageStore());
    const { result: hookResult } = renderHook(() => useUsage({ autoFetch: true }));

    // Initially should be empty
    expect(storeResult.current.usageData).toBeNull();

    // Wait for auto-fetch
    await waitFor(() => {
      expect(storeResult.current.usageData).toEqual(mockUsageData);
    });

    // Hook should also have data
    expect(hookResult.current.usageData).toEqual(mockUsageData);
  });

  it('should handle upload workflow with usage check', async () => {
    vi.mocked(checkUsageLimit).mockResolvedValue(mockUsageData);

    const { result } = renderHook(() => useCheckUsage());
    const uploadCallback = vi.fn();
    const onPass = vi.fn();

    await act(async () => {
      await result.current.checkAndExecute(uploadCallback);
    });

    // Within limits, should execute
    expect(uploadCallback).toHaveBeenCalled();
  });

  it('should prevent upload when limit exceeded', async () => {
    const exceededData: UsageLimitResult = {
      canUpload: false,
      scansUsed: 100,
      scansRemaining: 0,
      resetDate: mockUsageData.resetDate,
      isAdmin: false,
    };

    vi.mocked(checkUsageLimit).mockResolvedValue(exceededData);

    const { result } = renderHook(() => useCheckUsage());
    const uploadCallback = vi.fn();
    const onFail = vi.fn();

    // First fetch to get data
    await act(async () => {
      await result.current.checkAndExecute(() => Promise.resolve());
    });

    // Now test with exceeded data
    vi.mocked(checkUsageLimit).mockResolvedValue(exceededData);

    await act(async () => {
      await result.current.checkAndExecute(uploadCallback);
    });

    // Should not execute when limit exceeded
    expect(uploadCallback).not.toHaveBeenCalled();
  });

  it('should track usage updates across multiple components', async () => {
    vi.mocked(checkUsageLimit).mockResolvedValue(mockUsageData);

    const { result: store1 } = renderHook(() => useUsageStore());
    const { result: store2 } = renderHook(() => useUsageStore()); // Same store
    const { result: hook1 } = renderHook(() => useUsage({ autoFetch: false }));

    // Update data in first store
    act(() => {
      store1.current.setUsageData(mockUsageData);
    });

    // Both should see the same data (Zustand store is global)
    expect(store2.current.usageData).toEqual(mockUsageData);
  });

  it('should handle concurrent operations', async () => {
    vi.mocked(checkUsageLimit).mockResolvedValue(mockUsageData);

    const { result: check1 } = renderHook(() => useCheckUsage());
    const { result: check2 } = renderHook(() => useCheckUsage());

    const callback1 = vi.fn();
    const callback2 = vi.fn();

    await act(async () => {
      await Promise.all([
        check1.current.checkAndExecute(callback1),
        check2.current.checkAndExecute(callback2),
      ]);
    });

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('should refresh usage data on demand', async () => {
    const updatedData: UsageLimitResult = {
      canUpload: true,
      scansUsed: 60,
      scansRemaining: 40,
      resetDate: mockUsageData.resetDate,
      isAdmin: false,
    };

    vi.mocked(checkUsageLimit)
      .mockResolvedValueOnce(mockUsageData)
      .mockResolvedValueOnce(updatedData);

    const { result } = renderHook(() => useUsage({ autoFetch: false }));

    // First fetch
    await act(async () => {
      await result.current.fetchUsageData();
    });

    expect(result.current.usageData?.scansUsed).toBe(50);

    // Second fetch with updated data
    await act(async () => {
      await result.current.fetchUsageData();
    });

    expect(result.current.usageData?.scansUsed).toBe(60);
  });

  it('should handle errors gracefully across system', async () => {
    const error = new Error('Network error');
    vi.mocked(checkUsageLimit).mockRejectedValue(error);

    const { result: store } = renderHook(() => useUsageStore());
    const { result: check } = renderHook(() => useCheckUsage());

    await act(async () => {
      await store.current.fetchUsageData();
    });

    expect(store.current.error).toBeDefined();
    expect(store.current.usageData).toBeNull();

    // Check should still allow operation if no data
    expect(check.current.canProceed()).toBe(true);
  });

  it('should transition between allowed and exceeded states', async () => {
    const warningData: UsageLimitResult = {
      canUpload: true,
      scansUsed: 85,
      scansRemaining: 15,
      resetDate: mockUsageData.resetDate,
      isAdmin: false,
    };

    const exceededData: UsageLimitResult = {
      canUpload: false,
      scansUsed: 100,
      scansRemaining: 0,
      resetDate: mockUsageData.resetDate,
      isAdmin: false,
    };

    vi.mocked(checkUsageLimit)
      .mockResolvedValueOnce(warningData)
      .mockResolvedValueOnce(exceededData);

    const { result } = renderHook(() => useUsage({ autoFetch: false }));

    // Start with allowed
    await act(async () => {
      await result.current.fetchUsageData();
    });

    expect(result.current.usageData?.canUpload).toBe(true);

    // Update to exceeded
    await act(async () => {
      await result.current.fetchUsageData();
    });

    expect(result.current.usageData?.canUpload).toBe(false);
  });

  it('should provide correct scan usage', async () => {
    vi.mocked(checkUsageLimit).mockResolvedValue(mockUsageData);

    const { result } = renderHook(() => useUsage({ autoFetch: false }));

    await act(async () => {
      await result.current.fetchUsageData();
    });

    // 50 scans used, 50 remaining
    expect(result.current.usageData?.scansUsed).toBe(50);
    expect(result.current.usageData?.scansRemaining).toBe(50);
  });
});
