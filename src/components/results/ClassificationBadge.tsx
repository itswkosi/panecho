import React from 'react';

interface ClassificationBadgeProps {
  classification: 'normal' | 'suspicious';
  riskScore: number;
}

/**
 * Classification badge component
 * Displays analysis result with visual cues
 */
export function ClassificationBadge({ classification, riskScore }: ClassificationBadgeProps) {
  const isNormal = classification === 'normal';
  const bgColor = isNormal ? 'bg-green-50' : 'bg-amber-50';
  const borderColor = isNormal ? 'border-green-300' : 'border-amber-300';
  const badgeColor = isNormal ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800';
  const textColor = isNormal ? 'text-green-900' : 'text-amber-900';
  const icon = isNormal ? '✓' : '⚠';
  const label = isNormal ? 'NORMAL' : 'SUSPICIOUS FINDINGS';

  return (
    <div className={`rounded-lg border-2 ${borderColor} ${bgColor} p-6`}>
      <div className="flex items-center gap-4">
        <div className={`rounded-full ${badgeColor} h-16 w-16 flex items-center justify-center text-2xl font-bold`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-semibold uppercase tracking-wide ${textColor}`}>Classification</p>
          <p className={`text-3xl font-bold ${textColor}`}>{label}</p>
          <p className={`text-sm mt-1 ${textColor}`}>Risk Score: {riskScore}%</p>
        </div>
      </div>
    </div>
  );
}
