'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { ErrorCode } from '@/lib/types/errors';

/**
 * Custom hook for displaying error notifications as toasts
 * Used for transient errors (rate limits, network issues, etc.)
 * Persistent errors should use ErrorDisplay component instead
 */
export function useErrorToast() {
  const showError = useCallback(
    (
      message: string,
      code: ErrorCode,
      options?: {
        duration?: number;
        action?: {
          label: string;
          onClick: () => void;
        };
      }
    ) => {
      const isTransient =
        code === ErrorCode.API_RATE_LIMIT ||
        code === ErrorCode.STORAGE_UPLOAD_ERROR ||
        code === ErrorCode.API_ERROR;

      toast.error(message, {
        duration: options?.duration ?? (isTransient ? 5000 : 10000),
        action: options?.action,
        description: `Error code: ${code}`,
      });
    },
    []
  );

  const showWarning = useCallback(
    (message: string, options?: { duration?: number }) => {
      toast.warning(message, {
        duration: options?.duration ?? 5000,
      });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, options?: { duration?: number }) => {
      toast.success(message, {
        duration: options?.duration ?? 3000,
      });
    },
    []
  );

  const showLoading = useCallback((message: string) => {
    return toast.loading(message);
  }, []);

  return {
    showError,
    showWarning,
    showSuccess,
    showLoading,
    dismiss: toast.dismiss,
  };
}
