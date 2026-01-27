'use client';

import { useEffect, useRef, useState } from 'react';

interface ProcessingStatusResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook to poll scan processing status every 3 seconds
 * Stops polling when status is 'completed' or 'failed'
 * Uses API endpoint to bypass RLS issues
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
        
        // Use API endpoint instead of direct Supabase client to bypass RLS
        const response = await fetch(`/api/scan-status?scanId=${scanId}`);
        
        if (!isMountedRef.current) return;

        if (!response.ok) {
          console.error('[useProcessingStatus] API error:', response.status);
          setError('Failed to fetch scan status');
          setIsLoading(false);
          return;
        }

        const scan = await response.json();

        if (scan) {
          console.log('[useProcessingStatus] Status:', scan.processing_status);
          setStatus(scan.processing_status);
          
          if (scan.error_message) {
            setError(scan.error_message);
          }

          setIsLoading(false);

          // Stop polling when processing is done
          if (
            scan.processing_status === 'completed' ||
            scan.processing_status === 'failed'
          ) {
            console.log('[useProcessingStatus] Done, stopping poll');
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return;
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error('[useProcessingStatus] Error:', err);
          setError(err instanceof Error ? err.message : 'Failed to check status');
          setIsLoading(false);
        }
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    intervalRef.current = setInterval(pollStatus, 3000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scanId]);

  return { status, error, isLoading };
}
