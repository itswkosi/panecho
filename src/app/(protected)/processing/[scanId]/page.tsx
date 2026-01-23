'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressIndicator } from '@/components/processing/ProgressIndicator';
import { EducationalContent } from '@/components/processing/EducationalContent';
import { useProcessingStatus } from '@/lib/hooks/useProcessingStatus';

interface ProcessingPageProps {
  params: Promise<{
    scanId: string;
  }>;
}

export default function ProcessingPage({ params }: ProcessingPageProps) {
  const [scanId, setScanId] = useState<string>('');
  const router = useRouter();
  const { status, error, isLoading } = useProcessingStatus(scanId);
  const [startTime] = useState(() => Date.now());
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>(
    undefined
  );
  const [showRetry, setShowRetry] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [apiTriggered, setApiTriggered] = useState(false);

  // Resolve params first
  useEffect(() => {
    params.then(p => setScanId(p.scanId));
  }, [params]);

  // Trigger analysis immediately when page loads if status is pending
  useEffect(() => {
    if (status === 'pending' && !apiTriggered && scanId) {
      console.log('[ProcessingPage] Status is pending, triggering analysis...', scanId);
      setApiTriggered(true);
      fetch('/api/process-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      })
        .then(res => {
          console.log('[ProcessingPage] API response:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('[ProcessingPage] API result:', data);
        })
        .catch(err => {
          console.error('[ProcessingPage] API error:', err);
        });
    }
  }, [status, scanId, apiTriggered]);

  // Redirect to results when processing completes
  useEffect(() => {
    if (status === 'completed') {
      // Small delay for UX polish
      const timer = setTimeout(() => {
        router.push(`/results/${scanId}`);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [status, scanId, router]);

  // Detect if processing is stuck (no progress after 30 seconds)
  useEffect(() => {
    if (status === 'pending') {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 30000); // Show retry after 30 seconds
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Calculate and update estimated time remaining
  useEffect(() => {
    if (status === 'processing') {
      const updateTimer = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        // Estimate based on typical processing time (e.g., 300 seconds typical)
        // Adjust these estimates based on actual usage patterns
        const estimatedTotal = 300; // seconds (5 minutes)
        const remaining = Math.max(0, estimatedTotal - elapsedSeconds);
        setEstimatedTimeRemaining(remaining);
      }, 1000);

      return () => clearInterval(updateTimer);
    }
  }, [status, startTime]);

  const handleRetry = async () => {
    setRetrying(true);
    setShowRetry(false);
    try {
      const response = await fetch('/api/process-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      });
      if (!response.ok) {
        throw new Error('Failed to start processing');
      }
    } catch (err) {
      console.error('Retry failed:', err);
      setShowRetry(true);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1EA]">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-[#2C2C2C]">Processing Your Scan</h1>
          <p className="mt-2 text-[#5C5C5C]">
            Our AI is analyzing your pancreatic imaging. This typically takes 3-5 minutes.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left column: Progress */}
          <div className="flex items-center justify-center">
            <ProgressIndicator status={status} estimatedTimeRemaining={estimatedTimeRemaining} />
          </div>

          {/* Right column: Educational content */}
          <div className="flex items-center justify-center">
            <EducationalContent />
          </div>
        </div>

        {/* Error state */}
        {status === 'failed' && error && (
          <div className="mt-8 rounded-lg bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Processing Error</h2>
            <p className="mt-2 text-red-700">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 inline-block rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Loading indicator for initial fetch */}
        {isLoading && status === 'pending' && (
          <div className="mt-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#D4B5A0]/30 border-t-[#D4B5A0]" />
            <p className="mt-2 text-[#5C5C5C]">Checking scan status...</p>
          </div>
        )}

        {/* Retry button if processing hasn't started */}
        {showRetry && status === 'pending' && (
          <div className="mt-8 rounded-lg bg-yellow-50 border border-yellow-200 p-6 text-center">
            <h2 className="text-lg font-semibold text-yellow-900">Processing Delayed</h2>
            <p className="mt-2 text-yellow-700">Analysis hasn't started yet. This may be due to high server load.</p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="mt-4 inline-block rounded-lg bg-[#D4B5A0] px-6 py-2 font-semibold text-[#2C2C2C] hover:bg-[#C4A590] disabled:opacity-50"
            >
              {retrying ? 'Starting Analysis...' : 'Start Analysis Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
