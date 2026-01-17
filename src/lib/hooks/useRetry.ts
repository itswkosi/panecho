'use client';

import { useState, useCallback } from 'react';
import { getRetryDelay } from '@/lib/errors/handler';

const MAX_RETRIES = 3;

export interface UseRetryOptions {
  maxRetries?: number;
  onRetry?: (attemptNumber: number) => Promise<any>;
}

export interface UseRetryReturn {
  retryCount: number;
  canRetry: boolean;
  isRetrying: boolean;
  retry: () => Promise<void>;
  reset: () => void;
  getRetryMessage: () => string;
}

/**
 * Custom hook for managing retry logic with exponential backoff
 * Tracks retry count, manages state, and provides user-friendly messages
 */
export function useRetry({
  maxRetries = MAX_RETRIES,
  onRetry,
}: UseRetryOptions = {}): UseRetryReturn {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const canRetry = retryCount < maxRetries;

  const retry = useCallback(async () => {
    if (!canRetry || !onRetry) return;

    setIsRetrying(true);
    try {
      const delay = getRetryDelay(retryCount);
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      // Execute the retry callback
      await onRetry(retryCount + 1);
      
      // Increment retry count on success
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      // Increment retry count even on error
      setRetryCount((prev) => prev + 1);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [canRetry, retryCount, onRetry]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const getRetryMessage = useCallback(() => {
    if (!canRetry) {
      return `You've reached the maximum retry attempts (${maxRetries}). Please contact support.`;
    }
    if (retryCount === 0) {
      return 'Click retry to try again.';
    }
    return `Retry attempt ${retryCount} of ${maxRetries}. You can try ${maxRetries - retryCount} more time${maxRetries - retryCount !== 1 ? 's' : ''}.`;
  }, [canRetry, retryCount, maxRetries]);

  return {
    retryCount,
    canRetry,
    isRetrying,
    retry,
    reset,
    getRetryMessage,
  };
}
