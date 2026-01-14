import React from 'react';

interface RiskScoreGaugeProps {
  score: number; // 0-100
}

/**
 * Risk score gauge component
 * Horizontal bar with colored segments and position indicator
 */
export function RiskScoreGauge({ score }: RiskScoreGaugeProps) {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));
  const position = clampedScore; // Percentage position

  return (
    <div className="space-y-4">
      {/* Large percentage display */}
      <div className="text-center">
        <p className="text-5xl font-bold text-slate-900">{clampedScore}%</p>
        <p className="text-sm text-slate-600 mt-1">Risk Score</p>
      </div>

      {/* Gauge container */}
      <div className="space-y-2">
        {/* Colored bar segments */}
        <div className="relative h-8 rounded-full overflow-hidden bg-slate-200 flex shadow-sm">
          {/* Green segment (0-30%) */}
          <div className="flex-1 bg-green-500" style={{ width: '30%' }}></div>

          {/* Amber segment (30-70%) */}
          <div className="flex-1 bg-amber-500" style={{ width: '40%' }}></div>

          {/* Red segment (70-100%) */}
          <div className="flex-1 bg-red-500" style={{ width: '30%' }}></div>

          {/* Position indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-900 transition-all duration-300"
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            aria-hidden="true"
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-slate-600 font-medium px-1">
          <span>0%</span>
          <span>30%</span>
          <span>70%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <span className="text-slate-700">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
          <span className="text-slate-700">Borderline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500"></div>
          <span className="text-slate-700">Suspicious</span>
        </div>
      </div>
    </div>
  );
}
