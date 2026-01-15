'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Eye } from 'lucide-react';

interface ScanRecord {
  id: string;
  scanDate: Date;
  riskScore: number;
  classification: 'normal' | 'suspicious';
  analysisType: 'initial' | 'longitudinal';
  uploadDate: Date;
}

interface ScanHistoryTableProps {
  scans: ScanRecord[];
  currentScanId?: string;
}

type SortColumn = 'date' | 'riskScore' | 'classification' | 'analysisType';
type SortDirection = 'asc' | 'desc';

/**
 * Tabular display of all user's scans with sortable columns
 * Allows navigating to specific scan results
 */
export function ScanHistoryTable({ scans, currentScanId }: ScanHistoryTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  if (!scans || scans.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No scans available</p>
      </div>
    );
  }

  // Sort scans
  const sortedScans = [...scans].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'date':
        aValue = a.scanDate.getTime();
        bValue = b.scanDate.getTime();
        break;
      case 'riskScore':
        aValue = a.riskScore;
        bValue = b.riskScore;
        break;
      case 'classification':
        aValue = a.classification;
        bValue = b.classification;
        break;
      case 'analysisType':
        aValue = a.analysisType;
        bValue = b.analysisType;
        break;
      default:
        aValue = a.scanDate.getTime();
        bValue = b.scanDate.getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Toggle sort direction
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Get risk level color
  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return 'text-green-600 bg-green-50';
    if (riskScore < 70) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // Get risk badge background
  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore < 30) return 'bg-green-100';
    if (riskScore < 70) return 'bg-amber-100';
    return 'bg-red-100';
  };

  // Sort header button
  const SortHeader = ({
    column,
    children,
  }: {
    column: SortColumn;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-2 hover:text-gray-900 transition-colors group"
    >
      {children}
      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
    </button>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortHeader column="date">Scan Date</SortHeader>
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortHeader column="riskScore">Risk Score</SortHeader>
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortHeader column="classification">Classification</SortHeader>
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortHeader column="analysisType">Analysis Type</SortHeader>
            </th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedScans.map((scan, index) => (
            <tr
              key={scan.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                scan.id === currentScanId ? 'bg-blue-50' : ''
              }`}
            >
              <td className="px-6 py-4 text-sm text-gray-900">
                {new Date(scan.scanDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRiskBadgeColor(scan.riskScore)} ${getRiskColor(scan.riskScore)}`}
                >
                  {Math.round(scan.riskScore)}%
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                {scan.classification}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className="inline-flex px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                  {scan.analysisType}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <Link
                  href={`/results/${scan.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="View scan details"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-medium">View</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
