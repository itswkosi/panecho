'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TimelineProps {
  scans: Array<{
    date: Date;
    riskScore: number;
    classification: 'normal' | 'suspicious';
  }>;
}

/**
 * Timeline visualization of risk scores over time
 * Shows scan history with classification-based coloring
 */
export function TimelineVisualization({ scans }: TimelineProps) {
  if (!scans || scans.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No previous scans available for timeline
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = scans
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((scan) => ({
      date: new Date(scan.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      }),
      riskScore: Math.round(scan.riskScore),
      classification: scan.classification,
      // For color coding in dot
      fill: scan.classification === 'suspicious' ? '#dc2626' : '#16a34a',
    }));

  // Custom dot to color by classification
  const CustomDot = (props: any) => {
    const { cx, cy, fill } = props;
    if (!cx || !cy) return null;

    return (
      <circle cx={cx} cy={cy} r={6} fill={fill} stroke="white" strokeWidth={2} />
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{data.date}</p>
          <p className="text-sm text-gray-700">Risk Score: {data.riskScore}%</p>
          <p className="text-sm text-gray-700 capitalize">
            Classification: {data.classification}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Timeline</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            label={{ value: 'Risk Score (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="riskScore"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 8 }}
            name="Risk Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
