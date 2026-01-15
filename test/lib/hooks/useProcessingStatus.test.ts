import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProcessingStatus } from '@/lib/hooks/useProcessingStatus';
import * as db from '@/lib/supabase/db';

vi.mock('@/lib/supabase/db');

const mockScan = {
  id: 'scan-123',
  user_id: 'user-123',
  file_url: 'https://example.com/scan.dcm',
  file_name: 'scan.dcm',
  file_type: 'application/dicom',
  file_size: 5000000,
  created_at: new Date().toISOString(),
  processing_status: 'processing' as const,
  error_message: null,
  dicom_metadata: { patient_name: 'John Doe', modality: 'CT' },
};

describe('useProcessingStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with pending status', () => {
    vi.mocked(db.getScan).mockResolvedValue(mockScan);
    const { result } = renderHook(() => useProcessingStatus('scan-123'));

    expect(result.current.status).toBe('pending');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should return empty scanId gracefully', () => {
    const { result } = renderHook(() => useProcessingStatus(''));

    expect(result.current.status).toBe('pending');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(db.getScan).not.toHaveBeenCalled();
  });

  it('should cleanup interval on unmount', () => {
    vi.mocked(db.getScan).mockResolvedValue({ ...mockScan, processing_status: 'processing' });
    const { unmount } = renderHook(() => useProcessingStatus('scan-123'));

    unmount();

    // Should not throw when advancing timers
    expect(() => {
      vi.advanceTimersByTime(4000);
    }).not.toThrow();
  });

  it('should be a callable hook', () => {
    vi.mocked(db.getScan).mockResolvedValue(mockScan);
    const { result } = renderHook(() => useProcessingStatus('scan-123'));

    expect(result.current).toBeDefined();
    expect(typeof result.current.status).toBe('string');
    expect(typeof result.current.isLoading).toBe('boolean');
  });
});
