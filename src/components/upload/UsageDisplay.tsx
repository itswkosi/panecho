'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface UsageDisplayProps {
  scansUsed: number;
  scansRemaining: number;
  resetDate: Date;
  isAdmin?: boolean;
}

export function UsageDisplay({ scansUsed, scansRemaining, resetDate, isAdmin = false }: UsageDisplayProps) {
  const totalScans = 5;
  const usagePercentage = Math.round((scansUsed / totalScans) * 100);

  // Determine color based on usage
  const getProgressColor = () => {
    if (scansUsed <= 2) return 'bg-green-500';
    if (scansUsed <= 4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getProgressBgColor = () => {
    if (scansUsed <= 2) return 'bg-green-100';
    if (scansUsed <= 4) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getTextColor = () => {
    if (scansUsed <= 2) return 'text-green-700';
    if (scansUsed <= 4) return 'text-amber-700';
    return 'text-red-700';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isAdmin) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm font-medium text-blue-700">Admin account - rate limits disabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${getProgressBgColor()} p-4 mb-6`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm ${getTextColor()}`}>Monthly Scan Limit</h3>
          <span className={`text-sm font-bold ${getTextColor()}`}>{scansUsed}/{totalScans}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-white rounded-full overflow-hidden border border-current border-opacity-20">
          <div className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`} style={{ width: `${usagePercentage}%` }} />
        </div>

        {/* Usage Info */}
        <div className="flex items-center justify-between">
          <div>
            {scansRemaining > 0 ? (
              <p className={`text-sm font-medium ${getTextColor()}`}>{scansRemaining} {scansRemaining === 1 ? 'scan' : 'scans'} remaining this month</p>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <p className={`text-sm font-medium ${getTextColor()}`}>Limit reached for this month</p>
              </div>
            )}
          </div>
        </div>

        {/* Reset Date */}
        <div className="flex items-center gap-2 pt-2 border-t border-current border-opacity-10">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className={`text-xs ${getTextColor()} font-medium`}>Resets on {formatDate(resetDate)}</span>
        </div>

        {/* Message when at limit */}
        {scansRemaining === 0 && (
          <div className={`mt-3 p-3 rounded bg-white bg-opacity-50 border border-current border-opacity-20`}>
            <p className={`text-xs ${getTextColor()}`}>You've reached your limit of {totalScans} scans this month. Please contact support if you need more scans.</p>
          </div>
        )}
      </div>
    </div>
  );
}
