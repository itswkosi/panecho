/**
 * Toast notification utilities
 * Wrapper around sonner for consistent error/success notifications
 */

import { toast } from 'sonner';
import { ErrorCode } from '@/lib/types/errors';

/**
 * Show error toast for transient errors
 */
export function showErrorToast(message: string, code?: ErrorCode) {
  toast.error(message, {
    duration: 5000,
    position: 'top-center',
    description: code ? `Error code: ${code}` : undefined,
  });
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
  });
}

/**
 * Show loading toast
 */
export function showLoadingToast(message: string) {
  return toast.loading(message, {
    position: 'top-center',
  });
}

/**
 * Update existing toast
 */
export function updateToast(id: string | number, message: string, type: 'success' | 'error' = 'success') {
  toast[type](message, {
    id,
    duration: 3000,
    position: 'top-center',
  });
}

/**
 * Dismiss toast
 */
export function dismissToast(id: string | number) {
  toast.dismiss(id);
}

/**
 * Show retry toast for rate limits or temporary errors
 */
export function showRetryToast(message: string, retryCount: number, maxRetries: number) {
  toast.info(message, {
    duration: 5000,
    position: 'top-center',
    description: `Attempt ${retryCount + 1} of ${maxRetries}`,
  });
}
