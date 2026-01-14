'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAnalysis, getScan } from '@/lib/supabase/db';
import { Analysis, Scan } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { ClassificationBadge } from '@/components/results/ClassificationBadge';
import { RiskScoreGauge } from '@/components/results/RiskScoreGauge';
import { TieredDisclosure } from '@/components/results/TieredDisclosure';

interface ResultsPageProps {
  params: {
    scanId: string;
  };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both scan and analysis
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

        {/* Tiered Disclosure */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 mb-8">
          <TieredDisclosure
            detailedFindings={analysis.detailed_findings}
          />
        </div>

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
          <Button 
            variant="outline" 
            className="flex-1"
            disabled
            title="PDF download coming soon"
          >
            📄 Download PDF Report
          </Button>
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
