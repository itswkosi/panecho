'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getScan, getAnalysis } from '@/lib/supabase/db';
import { ComparisonView } from './ComparisonView';
import { ChangeIndicator } from './ChangeIndicator';

interface TwoWeekComparisonCardProps {
  twoWeekScanId: string;
  currentScanId: string;
  currentRiskScore: number;
  currentClassification: 'normal' | 'suspicious';
  longitudinalChanges?: {
    change_detected: boolean;
    change_description?: string;
    progression_rate?: string;
    clinical_significance?: string;
  };
  comparisonResults?: {
    size_changes: Array<{ finding: string; direction: string; magnitude: string }>;
    new_findings: string[];
    resolved_findings: string[];
    progression_pattern: string;
  };
}

/**
 * Card component displaying focused comparison with scan from 2-3 weeks ago (optimal window)
 * Highlights key changes and provides side-by-side image comparison
 */
export function TwoWeekComparisonCard({
  twoWeekScanId,
  currentScanId,
  currentRiskScore,
  currentClassification,
  longitudinalChanges,
  comparisonResults,
}: TwoWeekComparisonCardProps) {
  const [comparisonScan, setComparisonScan] = useState<{
    id: string;
    scan_date: Date;
    file_name: string;
    key_slices?: string[];
  } | null>(null);
  const [comparisonAnalysis, setComparisonAnalysis] = useState<{
    risk_score: number;
    classification: string;
  } | null>(null);
  const [currentScan, setCurrentScan] = useState<{
    scan_date: Date;
    key_slices?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComparisonData() {
      try {
        // Fetch the 2-3 week old scan
        const scan = await getScan(twoWeekScanId);
        if (scan) {
          setComparisonScan({
            id: scan.id,
            scan_date: new Date(scan.scan_date || scan.upload_date),
            file_name: scan.file_name,
            key_slices: scan.key_slices,
          });

          // Fetch its analysis
          const analysis = await getAnalysis(twoWeekScanId);
          if (analysis) {
            setComparisonAnalysis({
              risk_score: analysis.risk_score || 0,
              classification: analysis.classification || 'normal',
            });
          }
        }

        // Fetch current scan for image comparison
        const current = await getScan(currentScanId);
        if (current) {
          setCurrentScan({
            scan_date: new Date(current.scan_date || current.upload_date),
            key_slices: current.key_slices,
          });
        }
      } catch (error) {
        console.error('Failed to fetch comparison data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchComparisonData();
  }, [twoWeekScanId, currentScanId]);

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="py-6">
          <p className="text-center text-slate-600">Loading optimal comparison...</p>
        </CardContent>
      </Card>
    );
  }

  if (!comparisonScan || !comparisonAnalysis || !currentScan) {
    return null;
  }

  // Calculate days between scans
  const daysDiff = Math.round(
    (currentScan.scan_date.getTime() - comparisonScan.scan_date.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get trend icon
  const getTrendIcon = () => {
    const riskChange = currentRiskScore - comparisonAnalysis.risk_score;
    if (Math.abs(riskChange) < 5) {
      return <Minus className="h-5 w-5 text-slate-500" />;
    }
    return riskChange > 0 ? (
      <TrendingUp className="h-5 w-5 text-red-600" />
    ) : (
      <TrendingDown className="h-5 w-5 text-green-600" />
    );
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">2-3 Week Comparison</CardTitle>
              <Badge variant="default" className="bg-blue-600">
                Optimal Comparison Window
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Comparing scans from {daysDiff} days apart
            </CardDescription>
          </div>
          {getTrendIcon()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Risk Score Change */}
        {comparisonAnalysis && (
          <ChangeIndicator
            previousRiskScore={comparisonAnalysis.risk_score}
            currentRiskScore={currentRiskScore}
            previousClassification={comparisonAnalysis.classification as 'normal' | 'suspicious'}
            currentClassification={currentClassification}
          />
        )}

        {/* Key Changes Summary */}
        {longitudinalChanges?.change_detected && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Key Changes</h4>
            {longitudinalChanges.change_description && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-slate-800">
                  {longitudinalChanges.change_description}
                </AlertDescription>
              </Alert>
            )}

            {longitudinalChanges.clinical_significance && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Clinical Significance:</p>
                <p className="text-sm text-slate-600">{longitudinalChanges.clinical_significance}</p>
              </div>
            )}
          </div>
        )}

        {/* Size Changes */}
        {comparisonResults && comparisonResults.size_changes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Size Changes</h4>
            <div className="space-y-2">
              {comparisonResults.size_changes.map((change, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-lg bg-white border border-slate-200"
                >
                  <div className="mt-0.5">
                    {change.direction.toLowerCase().includes('increase') ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : change.direction.toLowerCase().includes('decrease') ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{change.finding}</p>
                    <p className="text-xs text-slate-600">
                      {change.direction} • {change.magnitude}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Findings */}
        {comparisonResults && comparisonResults.new_findings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">New Findings</h4>
            <ul className="space-y-2">
              {comparisonResults.new_findings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resolved Findings */}
        {comparisonResults && comparisonResults.resolved_findings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Resolved Findings</h4>
            <ul className="space-y-2">
              {comparisonResults.resolved_findings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Side-by-side Image Comparison */}
        {comparisonScan.key_slices && currentScan.key_slices && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Image Comparison</h4>
            <ComparisonView
              currentSlices={currentScan.key_slices.map((url, idx) => ({ url, sliceNumber: idx }))}
              previousSlices={comparisonScan.key_slices.map((url, idx) => ({ url, sliceNumber: idx }))}
              currentDate={currentScan.scan_date}
              previousDate={comparisonScan.scan_date}
            />
          </div>
        )}

        {/* Stable Case */}
        {!longitudinalChanges?.change_detected &&
          (!comparisonResults ||
            (comparisonResults.size_changes.length === 0 &&
              comparisonResults.new_findings.length === 0 &&
              comparisonResults.resolved_findings.length === 0)) && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                No significant changes detected over the {daysDiff}-day period. Findings remain stable.
              </AlertDescription>
            </Alert>
          )}
      </CardContent>
    </Card>
  );
}
