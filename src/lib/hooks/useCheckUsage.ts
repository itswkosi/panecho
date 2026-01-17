import { useCallback } from 'react';
import { useUsage } from './useUsage';

interface UseCheckUsageOptions {
  /**
   * Callback when check passes
   */
  onPass?: () => void | Promise<void>;
  /**
   * Callback when check fails (limit exceeded)
   */
  onFail?: () => void;
}

interface UseCheckUsageReturn {
  /**
   * Check if operation is allowed
   * Returns true if within limits, false if exceeded
   */
  canProceed: () => boolean;
  /**
   * Check and execute callback if allowed
   */
  checkAndExecute: (callback: () => void | Promise<void>) => Promise<void>;
}

/**
 * Hook for checking usage limits before operations
 * Useful for upload, processing, and other resource-consuming operations
 */
export function useCheckUsage(options: UseCheckUsageOptions = {}): UseCheckUsageReturn {
  const { onPass, onFail } = options;
  const { usageData, fetchUsageData } = useUsage({ autoFetch: false });

  const canProceed = useCallback(() => {
    // Refresh data before checking
    if (!usageData) {
      return true; // Allow if no data loaded yet
    }
    return usageData.canUpload;
  }, [usageData]);

  const checkAndExecute = useCallback(
    async (callback: () => void | Promise<void>) => {
      // Ensure we have fresh data
      await fetchUsageData();

      if (canProceed()) {
        await callback();
        onPass?.();
      } else {
        onFail?.();
      }
    },
    [canProceed, fetchUsageData, onPass, onFail]
  );

  return {
    canProceed,
    checkAndExecute,
  };
}
