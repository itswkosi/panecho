'use client';

import { ReactNode } from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percent: number;
  };
  icon?: ReactNode;
}

/**
 * Metric Display Card
 * Shows a single metric with optional trend indicator
 */
export function MetricsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: MetricsCardProps) {
  const trendColor = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600',
  }[trend?.direction || 'stable'];

  const trendIcon = {
    up: '↑',
    down: '↓',
    stable: '→',
  }[trend?.direction || 'stable'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-sm mt-2 ${trendColor}`}>
              {trendIcon} {trend.percent.toFixed(1)}%
            </p>
          )}
        </div>
        {icon && <div className="text-3xl text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
