'use client';

import { Check, Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedTimeRemaining?: number; // seconds
}

const STEPS = [
  { id: 'upload', label: 'Upload', description: 'File preparation' },
  { id: 'convert', label: 'Convert DICOM', description: 'Processing images' },
  { id: 'analyze', label: 'Analyze', description: 'AI analysis running' },
  { id: 'report', label: 'Generate Report', description: 'Creating results' },
];

export function ProgressIndicator({
  status,
  estimatedTimeRemaining,
}: ProgressIndicatorProps) {
  const getCurrentStepIndex = () => {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'completed':
        return STEPS.length;
      case 'failed':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-8">
        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex && status !== 'failed';
            const isFailed = status === 'failed' && index === currentStepIndex;

            return (
              <div key={step.id} className="flex items-start gap-4">
                {/* Step indicator circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                          : isFailed
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isFailed ? (
                      <span className="text-lg font-bold">!</span>
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`mt-2 h-12 w-1 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Step label and description */}
                <div className="pt-1">
                  <h3
                    className={`font-semibold transition-colors ${
                      isActive || isCompleted ? 'text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-semibold">
              {Math.round((currentStepIndex / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full transition-all duration-300 ${
                status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                width: `${Math.max(0, (currentStepIndex / STEPS.length) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Status message and estimated time */}
        {status !== 'completed' && status !== 'failed' && (
          <div className="rounded-lg bg-blue-50 p-4 text-sm">
            <p className="text-gray-700">
              {status === 'pending' && 'Initializing scan analysis...'}
              {status === 'processing' && 'Processing your scan with advanced AI analysis...'}
            </p>
            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
              <p className="mt-2 text-gray-600">
                Estimated time remaining: <span className="font-semibold">{formatTime(estimatedTimeRemaining)}</span>
              </p>
            )}
          </div>
        )}

        {status === 'completed' && (
          <div className="rounded-lg bg-green-50 p-4 text-sm">
            <p className="font-semibold text-green-900">Analysis Complete!</p>
            <p className="mt-1 text-green-700">Your results are ready to view.</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="rounded-lg bg-red-50 p-4 text-sm">
            <p className="font-semibold text-red-900">Processing Failed</p>
            <p className="mt-1 text-red-700">
              There was an error processing your scan. Please try uploading again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
