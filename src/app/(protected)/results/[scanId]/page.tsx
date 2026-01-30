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
import { TwoWeekComparisonCard } from '@/components/results/TwoWeekComparisonCard';
import { TumorGrowthChart } from '@/components/results/TumorGrowthChart';

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
  const [userId, setUserId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'longitudinal' | 'single'>('longitudinal');

  // Load view preference from localStorage on mount
  useEffect(() => {
    const loadViewPreference = async () => {
      const user = await getUser();
      if (user) {
        setUserId(user.id);
        const storageKey = `panecho_results_view_${user.id}`;
        const savedView = localStorage.getItem(storageKey);
        if (savedView === 'single' || savedView === 'longitudinal') {
          setViewMode(savedView);
        }
      }
    };
    loadViewPreference();
  }, []);

  // Save view preference to localStorage when changed
  const handleViewModeChange = (mode: 'longitudinal' | 'single') => {
    setViewMode(mode);
    if (userId) {
      const storageKey = `panecho_results_view_${userId}`;
      localStorage.setItem(storageKey, mode);
    }
  };

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
  const hasLongitudinalData = isLongitudinal && previousAnalyses.length > 0;
  const twoWeekComparisonScanId = analysis.detailed_findings?.two_week_comparison_scan_id as string | undefined;

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
    <div className="min-h-screen" style={{ backgroundColor: '#F5F1EA' }}>
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 text-sm" style={{ color: '#6B5E52' }}>
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">Dashboard</Link>
          <span className="mx-2">›</span>
          <span style={{ color: '#8B7E72' }}>Patient 001</span>
          <span className="mx-2">›</span>
          <span className="font-medium" style={{ color: '#3D3530' }}>Scan {scan?.file_name?.slice(0, 6) || '03'}</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-5xl font-serif mb-8" style={{ color: '#2C2520', fontWeight: 400 }}>Scan Analysis Results</h1>

        {/* View Mode Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleViewModeChange('longitudinal')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'longitudinal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
              }`}
            >
              Longitudinal Analysis
            </button>
            <button
              onClick={() => handleViewModeChange('single')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
              }`}
            >
              Single Scan
            </button>
          </div>
          {!hasLongitudinalData && viewMode === 'longitudinal' && (
            <p className="text-sm text-slate-600 italic">
              Upload more scans for longitudinal analysis
            </p>
          )}
        </div>

        {/* Tumor Growth Chart - Always visible when 3+ scans exist */}
        {previousAnalyses.length >= 2 && (
          <div className="bg-white rounded-lg p-8 shadow-sm mb-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 className="text-2xl font-serif mb-2" style={{ color: '#2C2520', fontWeight: 400 }}>Tumor Size Progression</h3>
            <p className="text-sm mb-6" style={{ color: '#6B5E52' }}>
              Tracking changes in lesion measurements over time
            </p>
            <TumorGrowthChart
              analyses={[
                ...previousAnalyses.map(a => ({
                  scan_date: new Date(a.created_at),
                  detailed_findings: a.detailed_findings,
                })),
                {
                  scan_date: new Date(analysis.created_at),
                  detailed_findings: analysis.detailed_findings,
                },
              ]}
            />
          </div>
        )}

        {/* Longitudinal View */}
        {viewMode === 'longitudinal' && hasLongitudinalData && (
          <>
            {/* 2-3 Week Comparison Card */}
            {twoWeekComparisonScanId && (
              <div className="mb-8">
                <TwoWeekComparisonCard
                  twoWeekScanId={twoWeekComparisonScanId}
                  currentScanId={scanId}
                  currentRiskScore={analysis.risk_score}
                  currentClassification={analysis.classification as 'normal' | 'suspicious'}
                  longitudinalChanges={analysis.detailed_findings?.longitudinal_changes}
                  comparisonResults={analysis.detailed_findings?.comparison_results}
                />
              </div>
            )}

            {/* Longitudinal Analysis Section */}
            <div className="bg-white rounded-lg p-8 shadow-sm mb-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 className="text-2xl font-serif mb-6" style={{ color: '#2C2520', fontWeight: 400 }}>Historical Comparison</h3>
              <div>
                <h4 className="text-sm font-medium mb-4" style={{ color: '#6B5E52' }}>Risk Probability Over Time</h4>
                <TimelineVisualization scans={timelineScans} />
              </div>

              <div className="mt-6 pt-6" style={{ borderTop: '1px solid #E8E4DD' }}>
                <h4 className="text-sm font-medium mb-3" style={{ color: '#6B5E52' }}>Change Summary</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#6B5E52' }}>
                  {analysis.risk_score > (previousAnalyses[previousAnalyses.length - 1]?.risk_score || 0)
                    ? 'Risk score has increased compared to previous scan, indicating progression of concerning features.'
                    : 'Risk score has remained stable or decreased, suggesting stable or improving pancreatic health.'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Top Row: Patient Info (Left) + Scan Image (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Patient Info Card */}
          <div className="bg-white rounded-lg p-8 shadow-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-sm font-medium mb-2" style={{ color: '#6B5E52', letterSpacing: '0.05em' }}>Patient 001</h2>
                <p className="text-xl font-serif" style={{ color: '#2C2520' }}>
                  Scan {scan?.file_name?.slice(0, 6) || '03'} · CT Abdomen
                </p>
              </div>
              <ClassificationBadge
                classification={analysis.classification}
                riskScore={Math.round(analysis.risk_score)}
              />
            </div>
            
            {/* AI Observation Box */}
            <div className="rounded-lg p-5 mb-4" style={{ backgroundColor: '#FFF9F0', borderLeft: '4px solid #E8B86D' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#8B6914' }}>AI Observation:</p>
              <p className="text-sm leading-relaxed" style={{ color: '#6B5E52' }}>{analysis.ai_summary}</p>
            </div>

            {/* Download Report Button */}
            <div>
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
            <div className="bg-white rounded-lg p-6 shadow-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-center h-96 rounded-lg" style={{ backgroundColor: '#F5F1EA' }}>
                <p style={{ color: '#8B7E72' }}>No scan visualization available</p>
              </div>
            </div>
          )}
        </div>

        {/* Middle Row: Radiomic Features (Left) + Risk Factors (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Radiomic Features */}
          <RadiomicFeaturesCard detailedFindings={analysis.detailed_findings} />

          {/* Right Column - Risk Factors */}
          <RiskFactorsCard 
            detailedFindings={analysis.detailed_findings} 
            riskScore={analysis.risk_score} 
          />
        </div>

        {/* Next Steps Section */}
        <div className="bg-white rounded-lg p-8 shadow-sm mb-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-2xl font-serif mb-6" style={{ color: '#2C2520', fontWeight: 400 }}>Next Steps</h3>
          
          <div className="space-y-6">
            {/* Clinical Recommendations */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: '#6B5E52' }}>Clinical Recommendations</h4>
              <ul className="space-y-2">
                {analysis.classification === 'suspicious' ? (
                  <>
                    <li className="flex items-start text-sm" style={{ color: '#6B5E52' }}>
                      <span className="mr-2" style={{ color: '#E8B86D' }}>●</span>
                      <span>Consult with a gastroenterologist or oncologist for further evaluation</span>
                    </li>
                    <li className="flex items-start text-sm" style={{ color: '#6B5E52' }}>
                      <span className="mr-2" style={{ color: '#E8B86D' }}>●</span>
                      <span>Consider additional imaging studies (MRI, endoscopic ultrasound) for comprehensive assessment</span>
                    </li>
                    <li className="flex items-start text-sm" style={{ color: '#6B5E52' }}>
                      <span className="mr-2" style={{ color: '#E8B86D' }}>●</span>
                      <span>Laboratory tests including tumor markers (CA 19-9) may be recommended</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start text-sm" style={{ color: '#6B5E52' }}>
                      <span className="mr-2" style={{ color: '#E8B86D' }}>●</span>
                      <span>Continue routine monitoring with follow-up imaging in 6-12 months</span>
                    </li>
                    <li className="flex items-start text-sm" style={{ color: '#6B5E52' }}>
                      <span className="mr-2" style={{ color: '#E8B86D' }}>●</span>
                      <span>Maintain healthy lifestyle habits to support pancreatic health</span>
                    </li>
                    <li className="flex items-start text-sm" style={{ color: '#6B5E52' }}>
                      <span className="mr-2" style={{ color: '#E8B86D' }}>●</span>
                      <span>Report any new symptoms to your healthcare provider promptly</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Follow-up Timeline */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: '#6B5E52' }}>Recommended Follow-up</h4>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#FFF9F0' }}>
                <p className="text-sm" style={{ color: '#6B5E52' }}>
                  {analysis.classification === 'suspicious'
                    ? 'Schedule follow-up consultation within 2-4 weeks for comprehensive evaluation and treatment planning.'
                    : 'Next routine scan recommended in 6-12 months, or sooner if symptoms develop.'}
                </p>
              </div>
            </div>

            {/* Patient Actions */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: '#6B5E52' }}>Your Actions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="text-left p-4 rounded-lg border transition-colors hover:border-opacity-80" style={{ borderColor: '#E8B86D', backgroundColor: 'white' }}>
                  <p className="font-medium mb-1" style={{ color: '#2C2520' }}>Download Report</p>
                  <p className="text-xs" style={{ color: '#8B7E72' }}>Share results with your physician</p>
                </button>
                <button className="text-left p-4 rounded-lg border transition-colors hover:border-opacity-80" style={{ borderColor: '#E8B86D', backgroundColor: 'white' }}>
                  <p className="font-medium mb-1" style={{ color: '#2C2520' }}>Schedule Consultation</p>
                  <p className="text-xs" style={{ color: '#8B7E72' }}>Book appointment with specialist</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-8">
          <Disclaimer />
        </div>

        {/* Upload Next Scan Button */}
        <div className="flex justify-center pb-8">
          <Link href="/upload">
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Upload Next Scan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
