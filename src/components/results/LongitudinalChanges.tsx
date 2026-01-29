'use client';

import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface LongitudinalChangesProps {
  changes: {
    change_detected: boolean;
    change_description: string;
    progression_rate: string;
    clinical_significance: string;
  };
  comparisonResults: {
    size_changes: Array<{ finding: string; direction: string; magnitude: string }>;
    new_findings: string[];
    resolved_findings: string[];
    progression_pattern: string;
  };
  trajectoryResults: {
    direction: string;
    rate: string;
    clinical_significance: string;
    follow_up_recommendation: string;
  };
  comparedScansCount?: number;
}

/**
 * Component to display longitudinal analysis results
 * Shows changes over time, new findings, trajectory, and recommendations
 */
export function LongitudinalChanges({
  changes,
  comparisonResults,
  trajectoryResults,
  comparedScansCount = 0,
}: LongitudinalChangesProps) {
  // Helper to get trend icon based on direction
  const getTrendIcon = (direction: string) => {
    const lowerDir = direction.toLowerCase();
    if (lowerDir.includes('increas') || lowerDir.includes('wors') || lowerDir.includes('progress')) {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    }
    if (lowerDir.includes('decreas') || lowerDir.includes('improv') || lowerDir.includes('regress')) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    return <Minus className="h-4 w-4 text-slate-500" />;
  };

  // If no changes detected, show stable message
  if (!changes.change_detected && comparisonResults.size_changes.length === 0 && comparisonResults.new_findings.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📊 Longitudinal Comparison</CardTitle>
            {comparedScansCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                Compared with {comparedScansCount} previous scan{comparedScansCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <CardDescription>Changes compared to previous scans</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Stable Findings</AlertTitle>
            <AlertDescription className="text-green-800">
              No significant changes detected compared to previous scans. The pancreas appears stable.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">📊 Changes Over Time</CardTitle>
          {comparedScansCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              Compared with {comparedScansCount} previous scan{comparedScansCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <CardDescription>Longitudinal analysis of pancreatic changes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Size Changes */}
        {comparisonResults.size_changes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              Size Changes
            </h4>
            <div className="space-y-2">
              {comparisonResults.size_changes.map((change, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="mt-0.5">{getTrendIcon(change.direction)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{change.finding}</p>
                    <p className="text-sm text-slate-600">
                      <span className="capitalize">{change.direction}</span> - {change.magnitude}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Findings */}
        {comparisonResults.new_findings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              New Findings
              <Badge variant="destructive" className="text-xs">
                {comparisonResults.new_findings.length}
              </Badge>
            </h4>
            <ul className="space-y-2">
              {comparisonResults.new_findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-red-600 font-bold">•</span>
                  <span className="text-sm text-slate-900">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resolved Findings */}
        {comparisonResults.resolved_findings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              Resolved Findings
              <Badge variant="default" className="text-xs bg-green-600">
                {comparisonResults.resolved_findings.length}
              </Badge>
            </h4>
            <ul className="space-y-2">
              {comparisonResults.resolved_findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-sm text-slate-900">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progression Pattern */}
        {comparisonResults.progression_pattern && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2">Progression Pattern</h4>
            <p className="text-sm text-slate-700">{comparisonResults.progression_pattern}</p>
          </div>
        )}

        {/* Risk Trajectory */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">Risk Trajectory</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Direction</p>
              <div className="flex items-center gap-2">
                {getTrendIcon(trajectoryResults.direction)}
                <p className="font-medium text-slate-900 capitalize">{trajectoryResults.direction}</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Rate</p>
              <p className="font-medium text-slate-900 capitalize">{trajectoryResults.rate}</p>
            </div>
          </div>
          {trajectoryResults.clinical_significance && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 uppercase tracking-wide mb-2">Clinical Significance</p>
              <p className="text-sm text-blue-900">{trajectoryResults.clinical_significance}</p>
            </div>
          )}
        </div>

        {/* Follow-up Recommendation */}
        {trajectoryResults.follow_up_recommendation && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Follow-up Recommendation</AlertTitle>
            <AlertDescription className="text-amber-800">
              {trajectoryResults.follow_up_recommendation}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
