'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TumorMeasurement {
  finding_id: string;
  finding: string;
  location: string;
  size_mm: number;
  scan_date: Date;
}

interface TumorGrowthChartProps {
  analyses: Array<{
    scan_date: Date;
    detailed_findings?: {
      comparison_results?: {
        size_changes: Array<{
          finding_id?: string;
          finding: string;
          location?: string;
          current_size_mm?: number;
        }>;
      };
    };
  }>;
}

const COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#ea580c', // orange
  '#9333ea', // purple
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#ec4899', // pink
];

/**
 * Tumor growth chart showing size progression over time
 * Only displays when analyses contain structured numeric measurement data
 */
export function TumorGrowthChart({ analyses }: TumorGrowthChartProps) {
  // Extract all measurements across scans
  const measurements: TumorMeasurement[] = [];
  const findingIds = new Set<string>();

  analyses.forEach((analysis) => {
    const sizeChanges = analysis.detailed_findings?.comparison_results?.size_changes || [];
    
    sizeChanges.forEach((change) => {
      if (change.finding_id && change.current_size_mm !== undefined) {
        measurements.push({
          finding_id: change.finding_id,
          finding: change.finding,
          location: change.location || 'unknown',
          size_mm: change.current_size_mm,
          scan_date: analysis.scan_date,
        });
        findingIds.add(change.finding_id);
      }
    });
  });

  // Check if we have any numeric data
  if (measurements.length === 0 || findingIds.size === 0) {
    return null; // Don't render if no structured data
  }

  // Group by scan date for charting
  const scanDates = [...new Set(measurements.map(m => m.scan_date.getTime()))].sort();
  const chartData = scanDates.map(timestamp => {
    const date = new Date(timestamp);
    const dataPoint: any = {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp,
    };

    findingIds.forEach(findingId => {
      const measurement = measurements.find(
        m => m.finding_id === findingId && m.scan_date.getTime() === timestamp
      );
      if (measurement) {
        dataPoint[findingId] = measurement.size_mm;
      }
    });

    return dataPoint;
  });

  // Create legend labels
  const legendLabels: Record<string, string> = {};
  findingIds.forEach(id => {
    const measurement = measurements.find(m => m.finding_id === id);
    if (measurement) {
      legendLabels[id] = `${measurement.finding} (${measurement.location})`;
    }
  });

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Tumor Size Progression</CardTitle>
        <CardDescription>Size measurements over time (millimeters)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              label={{ value: 'Size (mm)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: any, name?: string) => [
                `${value} mm`,
                name ? (legendLabels[name] || name) : '',
              ]}
            />
            <Legend
              formatter={(value: string) => legendLabels[value] || value}
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />
            {Array.from(findingIds).map((findingId, index) => (
              <Line
                key={findingId}
                type="monotone"
                dataKey={findingId}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4, fill: COLORS[index % COLORS.length] }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
