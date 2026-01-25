'use client';

import { useEffect, useRef, useState } from 'react';
import { getScan } from '@/lib/supabase/db';

interface ProcessingStatusResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook to poll scan processing status every 2 seconds
 * Stops polling when status is 'completed' or 'failed'
 */
export function useProcessingStatus(scanId: string): ProcessingStatusResult {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!scanId) {
      setIsLoading(false);
      return;
    }

    isMountedRef.current = true;

    const pollStatus = async () => {
      try {
        console.log('[useProcessingStatus] Polling scan:', scanId);
        const scan = await getScan(scanId);

        if (!isMountedRef.current) return;

        if (scan) {
          console.log('[useProcessingStatus] Scan status:', scan.processing_status);
          setStatus(scan.processing_status);

          if (scan.error_message) {
            setError(scan.error_message);
          }

          // Stop polling when processing is done
          if (
            scan.processing_status === 'completed' ||
            scan.processing_status === 'failed'
          ) {
            console.log('[useProcessingStatus] Processing complete, stopping poll');
            setIsLoading(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return;
          }
        } else {
          console.warn('[useProcessingStatus] Scan not found:', scanId);
        }

        setIsLoading(false);
      } catch (err) {
        if (isMountedRef.current) {
          console.error('[useProcessingStatus] Error:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch processing status');
          setIsLoading(false);
        }
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    intervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scanId]);

  return { status, error, isLoading };
}
