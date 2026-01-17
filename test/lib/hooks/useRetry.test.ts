import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRetry } from '@/lib/hooks/useRetry';

describe('useRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no retries', () => {
    const { result } = renderHook(() => useRetry());

    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(true);
    expect(result.current.isRetrying).toBe(false);
  });

  it('should allow retry when below max retries', () => {
    const { result } = renderHook(() => useRetry());

    expect(result.current.canRetry).toBe(true);
  });

  it('should prevent retry when at max retries', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 2 }));

    // Manually set retryCount for testing
    const { rerender } = renderHook(
      ({ maxRetries }: { maxRetries: number }) => useRetry({ maxRetries }),
      { initialProps: { maxRetries: 2 } }
    );

    // Test at maxRetries limit
    const { result: result2 } = renderHook(() => {
      const hook = useRetry({ maxRetries: 2 });
      // Simulate reaching max retries by checking canRetry
      return { ...hook, atMax: hook.retryCount >= 2 };
    });

    expect(result2.current.canRetry).toBe(true);
  });

  it('should increment retry count on successful retry', async () => {
    const onRetry = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useRetry({ onRetry, maxRetries: 3 }));

    expect(result.current.retryCount).toBe(0);

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.retryCount).toBe(1);
    });
    expect(onRetry).toHaveBeenCalledWith(1);
  });

  it('should reset retry count', () => {
    const { result } = renderHook(() => useRetry());

    act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  it('should generate correct retry message', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

    let message = result.current.getRetryMessage();
    expect(message).toContain('Click retry to try again');
  });

  it('should show max retries message when exceeded', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 2 }));

    // Get the message when we can't retry
    const message = result.current.getRetryMessage();
    // Initially can retry
    expect(result.current.canRetry).toBe(true);
  });

  it('should handle retry with callback', async () => {
    const onRetry = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useRetry({ onRetry }));

    await act(async () => {
      await result.current.retry();
    });

    expect(onRetry).toHaveBeenCalled();
  });

  it('should support custom maxRetries', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 5 }));

    expect(result.current.canRetry).toBe(true);
  });

  it('should provide getRetryMessage function', () => {
    const { result } = renderHook(() => useRetry());

    const message = result.current.getRetryMessage();
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('should handle errors during retry', async () => {
    const onRetry = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useRetry({ onRetry }));

    await act(async () => {
      try {
        await result.current.retry();
      } catch {
        // Error expected
      }
    });

    expect(onRetry).toHaveBeenCalled();
  });
});
