import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { UsageProvider, useUsageContext } from '@/components/providers/UsageProvider';
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

describe('UsageProvider', () => {
  const mockFetchUsageData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchUsageData.mockResolvedValue(undefined);
  });

  describe('UsageProvider Component', () => {
    it('should render children', () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: mockUsageData,
        loading: false,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <UsageProvider>
          <div>Test Child</div>
        </UsageProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should fetch usage data on mount', async () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: null,
        loading: false,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <UsageProvider>
          <div>Test</div>
        </UsageProvider>
      );

      expect(mockFetchUsageData).toHaveBeenCalled();
    });

    it('should not fetch if data already exists', () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: mockUsageData,
        loading: false,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <UsageProvider>
          <div>Test</div>
        </UsageProvider>
      );

      expect(mockFetchUsageData).not.toHaveBeenCalled();
    });

    it('should not fetch if currently loading', () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: null,
        loading: true,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <UsageProvider>
          <div>Test</div>
        </UsageProvider>
      );

      expect(mockFetchUsageData).not.toHaveBeenCalled();
    });
  });

  describe('useUsageContext Hook', () => {
    it('should provide usage context', () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: mockUsageData,
        loading: false,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useUsageContext(), {
        wrapper: UsageProvider,
      });

      expect(result.current.usageData).toEqual(mockUsageData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useUsageContext());
      }).toThrow('useUsageContext must be used within UsageProvider');

      spy.mockRestore();
    });

    it('should provide fetchUsageData function', () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: mockUsageData,
        loading: false,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useUsageContext(), {
        wrapper: UsageProvider,
      });

      expect(result.current.fetchUsageData).toBeDefined();
    });

    it('should provide clearError function', () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: mockUsageData,
        loading: false,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useUsageContext(), {
        wrapper: UsageProvider,
      });

      expect(result.current.clearError).toBeDefined();
    });

    it('should update context when store changes', async () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: null,
        loading: true,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      const { result, rerender } = renderHook(() => useUsageContext(), {
        wrapper: UsageProvider,
      });

      expect(result.current.loading).toBe(true);

      // Simulate store update
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: mockUsageData,
        loading: false,
        error: null,
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      act(() => {
        rerender();
      });

      expect(result.current.usageData).toEqual(mockUsageData);
      expect(result.current.loading).toBe(false);
    });

    it('should expose error state', () => {
      vi.mocked(useUsageStore).mockReturnValue({
        usageData: null,
        loading: false,
        error: 'Test error',
        fetchUsageData: mockFetchUsageData,
        setUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useUsageContext(), {
        wrapper: UsageProvider,
      });

      expect(result.current.error).toBe('Test error');
    });
  });
});
