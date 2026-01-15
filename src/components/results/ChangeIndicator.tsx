'use client';

import React from 'react';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

interface ChangeIndicatorProps {
  previousRiskScore: number;
  currentRiskScore: number;
  previousClassification?: 'normal' | 'suspicious';
  currentClassification?: 'normal' | 'suspicious';
}

/**
 * Displays change in risk score with direction indicator and color coding
 * Green: Risk decreased
 * Red: Risk increased
 * Gray: Risk stable (<5% change)
 */
export function ChangeIndicator({
  previousRiskScore,
  currentRiskScore,
  previousClassification,
  currentClassification,
}: ChangeIndicatorProps) {
  const riskChange = currentRiskScore - previousRiskScore;
  const riskChangePercent = Math.abs(riskChange);
  const changeThreshold = 5; // Changes < 5% considered stable

  // Determine direction and color
  let direction: 'increase' | 'decrease' | 'stable';
  let color: string;
  let bgColor: string;
  let icon: React.ReactNode;

  if (riskChangePercent < changeThreshold) {
    direction = 'stable';
    color = 'text-gray-600';
    bgColor = 'bg-gray-50 border-gray-200';
    icon = <ArrowRight className="w-5 h-5" />;
  } else if (riskChange > 0) {
    direction = 'increase';
    color = 'text-red-600';
    bgColor = 'bg-red-50 border-red-200';
    icon = <ArrowUp className="w-5 h-5" />;
  } else {
    direction = 'decrease';
    color = 'text-green-600';
    bgColor = 'bg-green-50 border-green-200';
    icon = <ArrowDown className="w-5 h-5" />;
  }

  return (
    <div
      className={`rounded-lg border p-4 ${bgColor} flex items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-700">Risk Change</p>
          <p className={`text-lg font-semibold ${color}`}>
            {previousRiskScore}% → {currentRiskScore}%
          </p>
          {riskChangePercent > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {direction === 'stable'
                ? 'No significant change'
                : `${direction === 'increase' ? '+' : '−'}${riskChangePercent.toFixed(1)}%`}
            </p>
          )}
        </div>
      </div>

      {previousClassification && currentClassification && (
        <div className="text-right text-xs text-gray-600">
          <p className="capitalize">{previousClassification} → {currentClassification}</p>
        </div>
      )}
    </div>
  );
}
