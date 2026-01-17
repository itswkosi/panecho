import { useCallback, useEffect } from 'react';
import { useUsageStore } from './useUsageStore';
import type { UsageLimitResult } from '@/lib/usage/tracker';

interface UseUsageOptions {
  /**
   * If true, automatically fetch usage data on mount
   * @default true
   */
  autoFetch?: boolean;
  /**
   * Callback fired when usage limit is exceeded
   */
  onLimitExceeded?: (data: UsageLimitResult) => void;
}

interface UseUsageReturn {
  usageData: UsageLimitResult | null;
  loading: boolean;
  error: string | null;
  fetchUsageData: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook to manage and access usage data
 * Provides access to scan counts and limits
 */
export function useUsage(options: UseUsageOptions = {}): UseUsageReturn {
  const { autoFetch = true, onLimitExceeded } = options;
  const { usageData, loading, error, fetchUsageData, clearError } = useUsageStore();

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !usageData && !loading) {
      fetchUsageData();
    }
  }, [autoFetch, usageData, loading, fetchUsageData]);

  // Trigger callback when limit exceeded
  useEffect(() => {
    if (usageData && !usageData.canUpload && onLimitExceeded) {
      onLimitExceeded(usageData);
    }
  }, [usageData?.canUpload, usageData, onLimitExceeded]);

  return {
    usageData,
    loading,
    error,
    fetchUsageData: useCallback(() => fetchUsageData(), [fetchUsageData]),
    clearError,
  };
}
