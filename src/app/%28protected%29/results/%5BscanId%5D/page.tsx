'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { getAnalysis, getScan, getAnalysesByUserId } from '@/lib/supabase/db';
import { getUser } from '@/app/actions/auth';
import { getScanRetention, extendScanRetention } from '@/app/actions/retention';
import { Analysis, Scan } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { ClassificationBadge } from '@/components/results/ClassificationBadge';
import { RiskScoreGauge } from '@/components/results/RiskScoreGauge';
import { TieredDisclosure } from '@/components/results/TieredDisclosure';
import { TimelineVisualization } from '@/components/results/TimelineVisualization';
import { ChangeIndicator } from '@/components/results/ChangeIndicator';
import { ComparisonView } from '@/components/results/ComparisonView';
import { ScanHistoryTable } from '@/components/results/ScanHistoryTable';
import { PDFDownloadButton } from '@/components/results/PDFDownloadButton';

interface ResultsPageProps {
  params: {
    scanId: string;
  };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<Analysis[]>([]);
  const [allUserScans, setAllUserScans] = useState<Array<{
    id: string;
    scanDate: Date;
    riskScore: number;
    classification: 'normal' | 'suspicious';
    analysisType: 'initial' | 'longitudinal';
    uploadDate: Date;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retention, setRetention] = useState<{
    expiresAt: Date;
    daysRemaining: number;
    canExtend: boolean;
    extensionCount: number;
  } | null>(null);
  const [extendingRetention, setExtendingRetention] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current scan and analysis
        const [scanData, analysisData] = await Promise.all([
          getScan(params.scanId),
          getAnalysis(params.scanId),
        ]);

        if (!scanData) {
          setError('Scan not found');
          setLoading(false);
          return;
        }

        setScan(scanData);

        if (!analysisData) {
          setError('Analysis not yet available. Please check back shortly.');
          setLoading(false);
          return;
        }

        setAnalysis(analysisData);

        // Fetch retention info
        const retentionRes = await getScanRetention(params.scanId);
        if (retentionRes.success && retentionRes.data) {
          setRetention({
            expiresAt: new Date(retentionRes.data.expiresAt),
            daysRemaining: retentionRes.data.daysRemaining,
            canExtend: retentionRes.data.canExtend,
            extensionCount: retentionRes.data.extensionCount,
          });
        }

        // If longitudinal analysis, fetch previous analyses
        if (analysisData.analysis_type === 'longitudinal' && analysisData.compared_scan_ids) {
          const previousScans: Analysis[] = [];
          for (const scanId of analysisData.compared_scan_ids) {
            try {
              const prevAnalysis = await getAnalysis(scanId);
              if (prevAnalysis) previousScans.push(prevAnalysis);
            } catch (err) {
              console.error(`Failed to fetch analysis for scan ${scanId}:`, err);
            }
          }
          setPreviousAnalyses(previousScans.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ));
        }

        // Fetch all user's scans for history table
        const user = await getUser();
        if (user) {
          try {
            const userAnalyses = await getAnalysesByUserId(user.id);
            const scansData: Array<{
              id: string;
              scanDate: Date;
              riskScore: number;
              classification: 'normal' | 'suspicious';
              analysisType: 'initial' | 'longitudinal';
              uploadDate: Date;
            }> = [];
            
            for (const analysis of userAnalyses) {
              if (analysis.scan) {
                scansData.push({
                  id: analysis.scan_id || '',
                  scanDate: new Date(analysis.scan.scan_date),
                  riskScore: analysis.risk_score || 0,
                  classification: analysis.classification as 'normal' | 'suspicious',
                  analysisType: analysis.analysis_type as 'initial' | 'longitudinal',
                  uploadDate: new Date(analysis.created_at),
                });
              }
            }
            setAllUserScans(scansData);
          } catch (err) {
            console.error('Failed to fetch user scans:', err);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
        setLoading(false);
      }
    };

    fetchData();
  }, [params.scanId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>
          <p className="text-slate-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="rounded-lg bg-red-50 border border-red-300 p-6">
            <h1 className="text-xl font-bold text-red-900 mb-2">Unable to Load Results</h1>
            <p className="text-red-800 mb-4">{error || 'The analysis results are not yet available.'}</p>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
              <Link href="/upload">
                <Button>Upload New Scan</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(analysis.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isLongitudinal = analysis.analysis_type === 'longitudinal';

  // Build timeline data for longitudinal analysis
  const timelineScans = previousAnalyses.length > 0
    ? [
        ...previousAnalyses.map((a) => ({
          date: new Date(a.created_at),
          riskScore: a.risk_score,
          classification: a.classification as 'normal' | 'suspicious',
        })),
        {
          date: new Date(analysis.created_at),
          riskScore: analysis.risk_score,
          classification: analysis.classification as 'normal' | 'suspicious',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Analysis Results</h1>
          <p className="text-slate-600">
            Scan analyzed on {formattedDate} | Scan ID: <code className="text-xs bg-slate-100 px-2 py-1 rounded">{params.scanId}</code>
          </p>
        </div>

        {/* Disclaimer - Always Visible */}
        <Disclaimer />

        {/* Classification & Risk Score - Above the Fold */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Classification Badge */}
          <ClassificationBadge
            classification={analysis.classification}
            riskScore={Math.round(analysis.risk_score)}
          />

          {/* Risk Score Gauge */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <RiskScoreGauge score={Math.round(analysis.risk_score)} />
          </div>
        </div>

        {/* AI Summary */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Clinical Summary</h2>
          <p className="text-slate-700 leading-relaxed">{analysis.ai_summary}</p>

          {analysis.detailed_findings?.recommendations && analysis.detailed_findings.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">Recommended Actions:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                {analysis.detailed_findings.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2">
                    <span>→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Longitudinal Analysis Sections */}
        {isLongitudinal && previousAnalyses.length > 0 && (
          <>
            {/* Timeline Visualization */}
            <div className="mb-8">
              <TimelineVisualization scans={timelineScans} />
            </div>

            {/* Change Indicator */}
            <div className="mb-8">
              <ChangeIndicator
                previousRiskScore={Math.round(previousAnalyses[previousAnalyses.length - 1].risk_score || 0)}
                currentRiskScore={Math.round(analysis.risk_score)}
                previousClassification={previousAnalyses[previousAnalyses.length - 1].classification as 'normal' | 'suspicious'}
                currentClassification={analysis.classification as 'normal' | 'suspicious'}
              />
            </div>

            {/* Longitudinal Changes Details */}
            {analysis.detailed_findings?.longitudinal_changes && (
              <div className="rounded-lg border border-slate-200 bg-white p-6 mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Longitudinal Changes</h2>
                <div className="space-y-4">
                  {analysis.detailed_findings.longitudinal_changes.change_detected ? (
                    <>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm font-semibold text-amber-900">Change Detected</p>
                        <p className="text-sm text-amber-800 mt-1">
                          {analysis.detailed_findings.longitudinal_changes.change_description}
                        </p>
                      </div>
                      {analysis.detailed_findings.longitudinal_changes.progression_rate && (
                        <div>
                          <p className="text-sm font-medium text-slate-900">Progression Rate</p>
                          <p className="text-sm text-slate-700 capitalize">
                            {analysis.detailed_findings.longitudinal_changes.progression_rate}
                          </p>
                        </div>
                      )}
                      {analysis.detailed_findings.longitudinal_changes.clinical_significance && (
                        <div>
                          <p className="text-sm font-medium text-slate-900">Clinical Significance</p>
                          <p className="text-sm text-slate-700">
                            {analysis.detailed_findings.longitudinal_changes.clinical_significance}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-700">No significant changes detected compared to previous scans.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tiered Disclosure */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 mb-8">
          <TieredDisclosure
            detailedFindings={analysis.detailed_findings}
            isLongitudinal={isLongitudinal}
            comparisonResults={analysis.detailed_findings?.comparison_results}
            trajectoryResults={analysis.detailed_findings?.trajectory_results}
            synthesisReport={isLongitudinal ? {
              executive_summary: analysis.detailed_findings?.trajectory_results?.clinical_significance || '',
              current_assessment: analysis.ai_summary,
              trajectory_assessment: analysis.detailed_findings?.trajectory_results?.follow_up_recommendation || '',
              recommendations: analysis.detailed_findings?.recommendations || [],
            } : undefined}
          />
        </div>

        {/* Scan History Table */}
        {allUserScans.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Scan History</h2>
            <ScanHistoryTable
              scans={allUserScans}
              currentScanId={params.scanId}
            />
          </div>
        )}

        {/* Data Retention Information */}
        {retention && (
          <div
            className={`rounded-lg border p-6 mb-8 ${
              retention.daysRemaining <= 30
                ? 'border-amber-200 bg-amber-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              {retention.daysRemaining <= 30 && (
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 mb-2">Data Retention</h3>
                <p className={`text-sm mb-3 ${
                  retention.daysRemaining <= 30
                    ? 'text-amber-800'
                    : 'text-slate-700'
                }`}>
                  Your scan data will be automatically deleted on{' '}
                  <strong>{retention.expiresAt.toLocaleDateString()}</strong>{' '}
                  ({retention.daysRemaining} days remaining).
                </p>
                {retention.daysRemaining <= 30 && retention.canExtend && (
                  <p className="text-xs text-amber-700 mb-3">
                    Extended {retention.extensionCount}/3 times. You can extend retention by 90 days.
                  </p>
                )}
                {!retention.canExtend && (
                  <p className="text-xs text-amber-700 mb-3">
                    You have used all 3 available extensions. No further extensions available.
                  </p>
                )}
              </div>
              {retention.canExtend && (
                <Button
                  onClick={async () => {
                    try {
                      setExtendingRetention(true);
                      const res = await extendScanRetention(params.scanId);
                      if (res.success && res.data) {
                        setRetention({
                          expiresAt: new Date(res.data.newExpirationDate),
                          daysRemaining: 90,
                          canExtend: res.data.extensionsRemaining > 0,
                          extensionCount: retention.extensionCount + 1,
                        });
                      }
                    } catch (err) {
                      console.error('Error extending retention:', err);
                    } finally {
                      setExtendingRetention(false);
                    }
                  }}
                  disabled={extendingRetention}
                  className="flex-shrink-0"
                  variant="outline"
                >
                  {extendingRetention ? 'Extending...' : 'Extend Retention'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Analysis Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-600 uppercase tracking-wide">Model</p>
            <p className="font-semibold text-slate-900">{analysis.gpt_model_used}</p>
          </div>
          {analysis.tokens_used && (
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-600 uppercase tracking-wide">Tokens Used</p>
              <p className="font-semibold text-slate-900">{analysis.tokens_used.toLocaleString()}</p>
            </div>
          )}
          {analysis.processing_time_seconds && (
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-600 uppercase tracking-wide">Processing Time</p>
              <p className="font-semibold text-slate-900">{analysis.processing_time_seconds}s</p>
            </div>
          )}
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-600 uppercase tracking-wide">Slices Analyzed</p>
            <p className="font-semibold text-slate-900">{analysis.slices_analyzed?.length || 0}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <PDFDownloadButton scanId={params.scanId} />
          <Link href="/upload" className="flex-1">
            <Button className="w-full">
              📤 Upload Follow-Up Scan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
