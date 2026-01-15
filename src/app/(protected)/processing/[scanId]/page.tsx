'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressIndicator } from '@/components/processing/ProgressIndicator';
import { EducationalContent } from '@/components/processing/EducationalContent';
import { useProcessingStatus } from '@/lib/hooks/useProcessingStatus';

interface ProcessingPageProps {
  params: {
    scanId: string;
  };
}

export default function ProcessingPage({ params }: ProcessingPageProps) {
  const { scanId } = params;
  const router = useRouter();
  const { status, error, isLoading } = useProcessingStatus(scanId);
  const [startTime] = useState(() => Date.now());
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>(
    undefined
  );

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

  // Calculate and update estimated time remaining
  useEffect(() => {
    if (status === 'processing') {
      const updateTimer = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        // Estimate based on typical processing time (e.g., 60 seconds typical)
        // Adjust these estimates based on actual usage patterns
        const estimatedTotal = 60; // seconds
        const remaining = Math.max(0, estimatedTotal - elapsedSeconds);
        setEstimatedTimeRemaining(remaining);
      }, 1000);

      return () => clearInterval(updateTimer);
    }
  }, [status, startTime]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Processing Your Scan</h1>
          <p className="mt-2 text-gray-600">
            Our AI is analyzing your pancreatic imaging. This typically takes 30-60 seconds.
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
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="mt-2 text-gray-600">Checking scan status...</p>
          </div>
        )}
      </div>
    </div>
  );
}
