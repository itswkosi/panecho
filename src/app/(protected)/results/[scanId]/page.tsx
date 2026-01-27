'use client';

import { useEffect, useState, use } from 'react';
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
import { RadiomicFeaturesCard } from '@/components/results/RadiomicFeaturesCard';
import { SegmentedPancreasVisualization } from '@/components/results/SegmentedPancreasVisualization';
import { RiskFactorsCard } from '@/components/results/RiskFactorsCard';
import { SimilarScansWidget } from '@/components/results/SimilarScansWidget';

interface ResultsPageProps {
  params: Promise<{
    scanId: string;
  }>;
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { scanId } = use(params);
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
          getScan(scanId),
          getAnalysis(scanId),
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
        const retentionRes = await getScanRetention(scanId);
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
  }, [scanId]);

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
    <div className="min-h-screen bg-[#F5F1ED]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm text-slate-600">
          <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
          <span className="mx-2">›</span>
          <span className="text-slate-400">Patient 001</span>
          <span className="mx-2">›</span>
          <span className="text-slate-900 font-medium">Scan {scan?.file_name?.slice(0, 6) || '03'}</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-4xl font-serif font-medium text-slate-900 mb-8">Scan Analysis Results</h1>

        {/* Hero Section - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Patient Info Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xs text-slate-500 uppercase tracking-wide mb-1">Patient 001</h2>
                <p className="text-lg font-medium text-slate-900">
                  Scan {scan?.file_name?.slice(0, 6) || '03'} · CT Abdomen
                </p>
              </div>
              <ClassificationBadge
                classification={analysis.classification}
                riskScore={Math.round(analysis.risk_score)}
              />
            </div>
            
            {/* AI Observation Box */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <p className="text-sm font-semibold text-amber-900 mb-1">🤖 AI Observation:</p>
              <p className="text-sm text-amber-800">{analysis.ai_summary}</p>
            </div>

            {/* Download Report Button */}
            <div className="mt-4">
              <PDFDownloadButton scanId={scanId} />
            </div>
          </div>

          {/* Right Column - Scan Visualization */}
          {scan?.key_slices && scan.key_slices.length > 0 ? (
            <SegmentedPancreasVisualization
              imageUrl={scan.key_slices[0]}
              sliceUrls={scan.key_slices}
              scanId={scanId}
            />
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-96 bg-slate-100 rounded-lg">
                <p className="text-slate-400">No scan visualization available</p>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Radiomic Features */}
          <RadiomicFeaturesCard detailedFindings={analysis.detailed_findings} />

          {/* Right Column - Longitudinal & Risk Factors */}
          <div className="space-y-6">
            {/* Longitudinal Analysis Card */}
            {isLongitudinal && previousAnalyses.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-serif font-medium text-slate-900 mb-4">Longitudinal Analysis</h3>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Risk Probability</h4>
                  <TimelineVisualization scans={timelineScans} />
                </div>
              </div>
            )}

            {/* Risk Factors Card */}
            <RiskFactorsCard 
              detailedFindings={analysis.detailed_findings} 
              riskScore={analysis.risk_score} 
            />
          </div>
        </div>

        {/* Similar Scans Section */}
        {allUserScans.length > 1 && (
          <div className="mb-6">
            <SimilarScansWidget 
              allScans={allUserScans}
              currentScanId={scanId}
              currentClassification={analysis.classification as 'normal' | 'suspicious'}
            />
          </div>
        )}

        {/* Collapsible Detailed Analysis */}
        <div className="mb-6">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
