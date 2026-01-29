'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getScan, getAnalysis } from '@/lib/supabase/db';
import { CheckCircle2, Circle } from 'lucide-react';

interface ComparedScansTimelineProps {
  comparedScanIds: string[];
  currentScanId: string;
  currentScanDate?: string;
}

interface ScanTimelineItem {
  id: string;
  date: string;
  classification: string;
  riskScore: number;
  isCurrent: boolean;
}

/**
 * Component to display a timeline of compared scans
 * Shows which previous scans were used for longitudinal comparison
 */
export function ComparedScansTimeline({
  comparedScanIds,
  currentScanId,
  currentScanDate,
}: ComparedScansTimelineProps) {
  const [scans, setScans] = useState<ScanTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScans() {
      try {
        const fetchedScans: ScanTimelineItem[] = [];

        // Fetch all compared scans
        for (const scanId of comparedScanIds) {
          try {
            const scan = await getScan(scanId);
            if (scan) {
              // Get the most recent analysis for this scan
              const analysis = await getAnalysis(scanId);
              
              fetchedScans.push({
                id: scanId,
                date: (scan.scan_date || scan.created_at).toISOString(),
                classification: analysis?.classification || 'unknown',
                riskScore: analysis?.risk_score || 0,
                isCurrent: false,
              });
            }
          } catch (error) {
            console.error(`Failed to fetch scan ${scanId}:`, error);
          }
        }

        // Sort by date (oldest first)
        fetchedScans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Add current scan at the end
        if (currentScanDate) {
          fetchedScans.push({
            id: currentScanId,
            date: currentScanDate,
            classification: 'current',
            riskScore: 0,
            isCurrent: true,
          });
        }

        setScans(fetchedScans);
      } catch (error) {
        console.error('Failed to fetch comparison timeline:', error);
      } finally {
        setLoading(false);
      }
    }

    if (comparedScanIds.length > 0) {
      fetchScans();
    } else {
      setLoading(false);
    }
  }, [comparedScanIds, currentScanId, currentScanDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getClassificationColor = (classification: string) => {
    if (classification === 'normal') return 'text-green-700';
    if (classification === 'suspicious') return 'text-red-700';
    return 'text-slate-700';
  };

  const getClassificationBg = (classification: string) => {
    if (classification === 'normal') return 'bg-green-100';
    if (classification === 'suspicious') return 'bg-red-100';
    return 'bg-slate-100';
  };

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Comparison Timeline</CardTitle>
          <CardDescription>Loading scan history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scans.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Comparison Timeline</CardTitle>
        <CardDescription>
          This scan was compared with {comparedScanIds.length} previous scan{comparedScanIds.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Vertical line */}
          <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-slate-200" />

          {scans.map((scan, index) => (
            <div key={scan.id} className="relative flex items-start gap-4">
              {/* Circle indicator */}
              <div className={`relative z-10 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                scan.isCurrent 
                  ? 'bg-blue-600 text-white' 
                  : getClassificationBg(scan.classification)
              }`}>
                {scan.isCurrent ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Scan info */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-slate-900">
                    {scan.isCurrent ? 'Current Scan' : `Scan ${index + 1}`}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(scan.date)}</p>
                </div>
                {!scan.isCurrent && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm capitalize ${getClassificationColor(scan.classification)}`}>
                      {scan.classification}
                    </span>
                    {scan.riskScore > 0 && (
                      <span className="text-xs text-slate-500">
                        • Risk: {scan.riskScore}%
                      </span>
                    )}
                  </div>
                )}
                {scan.isCurrent && (
                  <p className="text-sm text-blue-700">Currently viewing</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-600">
            Longitudinal analysis compared findings across <span className="font-semibold">{scans.length} scan{scans.length !== 1 ? 's' : ''}</span> spanning{' '}
            {scans.length > 1 && (
              <>
                {Math.round(
                  (new Date(scans[scans.length - 1].date).getTime() - new Date(scans[0].date).getTime()) / 
                  (1000 * 60 * 60 * 24)
                )} days
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
