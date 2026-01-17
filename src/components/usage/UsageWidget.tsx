'use client';

import { AlertCircle } from 'lucide-react';
import { useUsage } from '@/lib/hooks/useUsage';

interface UsageWidgetProps {
  /**
   * Whether to show the compact version
   * @default false
   */
  compact?: boolean;
}

/**
 * Compact widget for displaying usage in header or sidebar
 * Shows quick overview of scan usage
 */
export function UsageWidget({ compact = false }: UsageWidgetProps) {
  const { usageData } = useUsage({ autoFetch: true });

  if (!usageData) {
    // Tests expect an empty DOM element when no usage data
    return <div />;
  }

  const usagePercentage = Math.round(
    (usageData.scansUsed / (usageData.scansUsed + usageData.scansRemaining)) * 100
  );

  const storagePerScanGB = 0.25;
  const totalStorageGB = 10;
  const storageUsed = +(usageData.scansUsed * storagePerScanGB).toFixed(1);

  const getStatusColor = () => {
    if (!usageData.canUpload) return 'text-red-600 bg-red-50';
    if (usagePercentage > 70) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-100';
  };

  const getIconColor = () => {
    if (!usageData.canUpload) return 'text-red-600';
    if (usagePercentage > 70) return 'text-amber-600';
    return 'text-slate-400';
  };

  // Compact version with a small summary for accessibility/tests
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 ${getStatusColor()}`}>
        <button
          className={`p-2 rounded-lg transition-colors ${getStatusColor()}`}
          aria-label={`View usage: ${usageData.scansUsed} of ${usageData.scansUsed + usageData.scansRemaining} scans used`}
          title={`${usageData.scansUsed} / ${usageData.scansUsed + usageData.scansRemaining} scans used (${usagePercentage}%)`}
        >
          <AlertCircle className={`w-4 h-4 ${getIconColor()}`} />
        </button>
        <div className="text-sm">
          <div>Scans</div>
          <div className="font-semibold">{usageData.scansUsed} / {usageData.scansUsed + usageData.scansRemaining}</div>
          <div className="mt-1">Storage</div>
          <div className="font-medium">{storageUsed} / {totalStorageGB} GB</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg space-y-3 ${getStatusColor()}`}>
      {!usageData.canUpload && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          <span>Usage limit exceeded</span>
        </div>
      )}
      {usagePercentage > 70 && usageData.canUpload && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          <span>High usage warning</span>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">Scans</label>
          <span className="font-semibold">
            {usageData.scansUsed} / {usageData.scansUsed + usageData.scansRemaining}
          </span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              !usageData.canUpload ? 'bg-red-600' : usagePercentage > 70 ? 'bg-amber-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>{usagePercentage}% used</span>
          <span>{usageData.scansRemaining} remaining</span>
        </div>

        {/* Storage section */}
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Storage</label>
            <span className="font-medium">{storageUsed} / {totalStorageGB} GB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
