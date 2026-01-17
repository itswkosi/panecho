'use client';

import { AnalyticsMetrics } from '@/lib/admin/dashboard';
import { MetricsCard } from './MetricsCard';

interface AnalyticsDashboardProps {
  metrics: AnalyticsMetrics;
}

/**
 * Admin Analytics Dashboard
 * Displays key system metrics and trends
 */
export function AnalyticsDashboard({ metrics }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time system metrics and performance data</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricsCard
          title="Total Scans Uploaded"
          value={metrics.totalScansUploaded}
          icon="📤"
          subtitle="All time"
        />
        <MetricsCard
          title="Analyses Completed"
          value={metrics.completedAnalyses}
          icon="✓"
          subtitle="Successfully processed"
        />
        <MetricsCard
          title="Avg Processing Time"
          value={`${metrics.averageProcessingTimeSeconds.toFixed(1)}s`}
          icon="⏱️"
          subtitle="Per scan"
        />
        <MetricsCard
          title="Error Rate"
          value={`${metrics.errorRatePercent.toFixed(1)}%`}
          icon="⚠️"
          subtitle={`${metrics.failedAnalyses} failed`}
          trend={{
            direction: metrics.errorRatePercent > 5 ? 'up' : 'stable',
            percent: metrics.errorRatePercent,
          }}
        />
        <MetricsCard
          title="Active Users Today"
          value={metrics.activeUsersToday}
          icon="👥"
          subtitle="Unique users"
        />
        <MetricsCard
          title="Normal Scans"
          value={metrics.classificationDistribution.normal}
          icon="✓"
          subtitle="No findings"
        />
      </div>

      {/* Classification Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Classification Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Normal</div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-green-600">
                {metrics.classificationDistribution.normal}
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {metrics.completedAnalyses > 0
                  ? (
                      ((metrics.classificationDistribution.normal / metrics.completedAnalyses) * 100).toFixed(
                        1
                      ) + '%'
                    )
                  : '0%'}
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width:
                    metrics.completedAnalyses > 0
                      ? `${(metrics.classificationDistribution.normal / metrics.completedAnalyses) * 100}%`
                      : '0%',
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Suspicious</div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-red-600">
                {metrics.classificationDistribution.suspicious}
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {metrics.completedAnalyses > 0
                  ? (
                      ((metrics.classificationDistribution.suspicious / metrics.completedAnalyses) * 100).toFixed(
                        1
                      ) + '%'
                    )
                  : '0%'}
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{
                  width:
                    metrics.completedAnalyses > 0
                      ? `${(metrics.classificationDistribution.suspicious / metrics.completedAnalyses) * 100}%`
                      : '0%',
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">All Analyses</div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-gray-900">{metrics.completedAnalyses}</div>
              <div className="text-xs text-gray-500 mb-1">total</div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-900 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Score Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Risk Score Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Low Risk (0-30)</div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-blue-600">
                {metrics.riskScoreDistribution.lowRisk}
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {metrics.completedAnalyses > 0
                  ? (((metrics.riskScoreDistribution.lowRisk / metrics.completedAnalyses) * 100).toFixed(1) + '%')
                  : '0%'}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Medium Risk (30-70)</div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-yellow-600">
                {metrics.riskScoreDistribution.mediumRisk}
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {metrics.completedAnalyses > 0
                  ? (((metrics.riskScoreDistribution.mediumRisk / metrics.completedAnalyses) * 100).toFixed(1) + '%')
                  : '0%'}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">High Risk (70-100)</div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-red-600">
                {metrics.riskScoreDistribution.highRisk}
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {metrics.completedAnalyses > 0
                  ? (((metrics.riskScoreDistribution.highRisk / metrics.completedAnalyses) * 100).toFixed(1) + '%')
                  : '0%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">7-Day Trends</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Uploads</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Analyses</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Errors</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {metrics.dailyTrendData.map((trend) => (
                <tr key={trend.date} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{trend.date}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{trend.scansUploaded}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{trend.analysisCompleted}</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {trend.errors > 0 ? <span className="text-red-600">{trend.errors}</span> : '0'}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {trend.averageProcessingTime > 0
                      ? `${trend.averageProcessingTime.toFixed(1)}s`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
