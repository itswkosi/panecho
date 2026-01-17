/**
 * Admin Analytics Dashboard Metrics Service
 * Aggregates metrics from database and events
 * 
 * @note This module uses server-only imports and should only be called from server components
 */

import { createClient as createServerClient } from '@/lib/supabase/server';

export interface AnalyticsMetrics {
  totalScansProcessed: number;
  totalScansUploaded: number;
  completedAnalyses: number;
  failedAnalyses: number;
  averageProcessingTimeSeconds: number;
  classificationDistribution: {
    normal: number;
    suspicious: number;
  };
  riskScoreDistribution: {
    lowRisk: number; // 0-30
    mediumRisk: number; // 30-70
    highRisk: number; // 70-100
  };
  errorRatePercent: number;
  activeUsersToday: number;
  pdfDownloadsToday: number;
  retentionExtensionsToday: number;
  usageLimitReachedToday: number;
  dailyTrendData: DailyTrend[];
}

export interface DailyTrend {
  date: string;
  scansUploaded: number;
  analysisCompleted: number;
  errors: number;
  averageProcessingTime: number;
}

/**
 * Get analytics metrics for admin dashboard
 */
export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const supabase = await createServerClient();

  try {
    // Get scan statistics
    const { data: scans, error: scansError } = await supabase
      .from('scans')
      .select('id, created_at, processing_status');

    if (scansError) throw scansError;

    const scanList = scans || [];
    const totalScansUploaded = scanList.length;

    // Get analysis statistics
    const { data: analyses, error: analysesError } = await supabase
      .from('analyses')
      .select('id, classification, risk_score, processing_time_seconds, created_at');

    if (analysesError) throw analysesError;

    const analysisList = analyses || [];
    const completedAnalyses = analysisList.length;

    // Calculate statistics
    const classificationDistribution = {
      normal: analysisList.filter((a) => a.classification === 'normal').length,
      suspicious: analysisList.filter((a) => a.classification === 'suspicious').length,
    };

    const averageProcessingTimeSeconds =
      analysisList.length > 0
        ? analysisList.reduce((sum, a) => sum + (a.processing_time_seconds || 0), 0) /
          analysisList.length
        : 0;

    // Risk score distribution (estimated based on risk_score field)
    const riskScoreDistribution = {
      lowRisk: analysisList.filter((a) => (a.risk_score || 0) < 30).length,
      mediumRisk: analysisList.filter((a) => {
        const score = a.risk_score || 0;
        return score >= 30 && score < 70;
      }).length,
      highRisk: analysisList.filter((a) => (a.risk_score || 0) >= 70).length,
    };

    // Failed analyses (no analysis for uploaded scan)
    const failedAnalyses = scanList.filter(
      (s) => !analysisList.some((a) => a.id === s.id) && s.processing_status === 'failed'
    ).length;

    const errorRatePercent =
      totalScansUploaded > 0 ? (failedAnalyses / totalScansUploaded) * 100 : 0;

    // Get today's metrics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayScans = scanList.filter((s) => {
      const scanDate = new Date(s.created_at);
      return scanDate >= todayStart && scanDate <= todayEnd;
    });

    const todayAnalyses = analysisList.filter((a) => {
      const analysisDate = new Date(a.created_at);
      return analysisDate >= todayStart && analysisDate <= todayEnd;
    });

    // Estimate unique users today (scans)
    const { data: usersToday, error: usersError } = await supabase
      .from('scans')
      .select('user_id')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    const activeUsersToday = usersToday ? new Set(usersToday.map((s) => s.user_id)).size : 0;

    // Daily trend data (last 7 days)
    const dailyTrendData: DailyTrend[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayScans = scanList.filter((s) => {
        const scanDate = new Date(s.created_at);
        return scanDate >= date && scanDate < nextDate;
      });

      const dayAnalyses = analysisList.filter((a) => {
        const analysisDate = new Date(a.created_at);
        return analysisDate >= date && analysisDate < nextDate;
      });

      const dayErrors = dayScans.filter((s) => s.processing_status === 'failed').length;

      const dayAvgTime =
        dayAnalyses.length > 0
          ? dayAnalyses.reduce((sum, a) => sum + (a.processing_time_seconds || 0), 0) /
            dayAnalyses.length
          : 0;

      dailyTrendData.push({
        date: date.toISOString().split('T')[0],
        scansUploaded: dayScans.length,
        analysisCompleted: dayAnalyses.length,
        errors: dayErrors,
        averageProcessingTime: dayAvgTime,
      });
    }

    return {
      totalScansProcessed: completedAnalyses,
      totalScansUploaded,
      completedAnalyses,
      failedAnalyses,
      averageProcessingTimeSeconds: Math.round(averageProcessingTimeSeconds * 100) / 100,
      classificationDistribution,
      riskScoreDistribution,
      errorRatePercent: Math.round(errorRatePercent * 100) / 100,
      activeUsersToday,
      pdfDownloadsToday: 0, // Would need to track from analytics
      retentionExtensionsToday: 0, // Would need to track from analytics
      usageLimitReachedToday: 0, // Would need to track from analytics
      dailyTrendData,
    };
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    throw error;
  }
}

/**
 * Format metrics for display
 */
export function formatMetric(value: number, type: 'number' | 'percent' | 'time'): string {
  switch (type) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'time':
      return `${value.toFixed(1)}s`;
    case 'number':
    default:
      return value.toString();
  }
}
