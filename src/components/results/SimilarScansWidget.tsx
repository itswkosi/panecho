'use client';

import Link from 'next/link';

interface ScanData {
  id: string;
  scanDate: Date;
  riskScore: number;
  classification: 'normal' | 'suspicious';
  analysisType: 'initial' | 'longitudinal';
}

interface SimilarScansWidgetProps {
  allScans: ScanData[];
  currentScanId: string;
  currentClassification: 'normal' | 'suspicious';
}

export function SimilarScansWidget({ 
  allScans, 
  currentScanId, 
  currentClassification 
}: SimilarScansWidgetProps) {
  // Filter and sort by similarity (same classification first, then by risk score proximity)
  const similarScans = allScans
    .filter(scan => scan.id !== currentScanId)
    .sort((a, b) => {
      // Prioritize same classification
      if (a.classification === currentClassification && b.classification !== currentClassification) return -1;
      if (b.classification === currentClassification && a.classification !== currentClassification) return 1;
      
      // Then sort by date (most recent first)
      return b.scanDate.getTime() - a.scanDate.getTime();
    })
    .slice(0, 3);

  if (similarScans.length === 0) {
    return null;
  }

  const getRiskBadge = (classification: 'normal' | 'suspicious', riskScore: number) => {
    if (classification === 'suspicious' || riskScore >= 70) {
      return { text: 'High Risk', className: 'bg-red-100 text-red-800' };
    } else if (riskScore >= 30) {
      return { text: 'Medium Risk', className: 'bg-amber-100 text-amber-800' };
    }
    return { text: 'Low Risk', className: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 className="text-2xl font-serif mb-6" style={{ color: '#2C2520', fontWeight: 400 }}>Similar Scans</h3>
      <div className="space-y-3">
        {similarScans.map((scan) => {
          const badge = getRiskBadge(scan.classification, scan.riskScore);
          
          return (
            <Link
              key={scan.id}
              href={`/results/${scan.id}`}
              className="flex items-center gap-4 p-4 rounded-lg transition-colors"
              style={{ border: '1px solid #E8E2DB', backgroundColor: 'white' }}
            >
              <div className="w-16 h-16 rounded flex-shrink-0" style={{ backgroundColor: '#E8E2DB' }}>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  Scan {scan.id.slice(0, 8)}
                </p>
                <p className="text-xs text-slate-500">
                  {scan.scanDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className={`text-xs px-2 py-1 rounded font-medium ${badge.className}`}>
                {badge.text}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}