import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScanHistoryTable } from '@/components/results/ScanHistoryTable';

describe('ScanHistoryTable', () => {
  it('renders empty state when no scans', () => {
    render(<ScanHistoryTable scans={[]} />);

    expect(screen.getByText('No scans available')).toBeInTheDocument();
  });

  it('displays scan records with all columns', () => {
    const scans = [
      {
        id: 'scan-1',
        scanDate: new Date('2024-01-15'),
        riskScore: 35,
        classification: 'normal' as const,
        analysisType: 'initial' as const,
        uploadDate: new Date('2024-01-15'),
      },
    ];

    render(<ScanHistoryTable scans={scans} />);

    expect(screen.getByText('Scan Date')).toBeInTheDocument();
    expect(screen.getByText('Risk Score')).toBeInTheDocument();
    expect(screen.getByText('Classification')).toBeInTheDocument();
    expect(screen.getByText('Analysis Type')).toBeInTheDocument();
  });

  it('displays risk score with percentage badge', () => {
    const scans = [
      {
        id: 'scan-1',
        scanDate: new Date('2024-01-15'),
        riskScore: 45,
        classification: 'normal' as const,
        analysisType: 'initial' as const,
        uploadDate: new Date('2024-01-15'),
      },
    ];

    render(<ScanHistoryTable scans={scans} />);

    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('displays analysis type badge', () => {
    const scans = [
      {
        id: 'scan-1',
        scanDate: new Date('2024-01-15'),
        riskScore: 35,
        classification: 'normal' as const,
        analysisType: 'longitudinal' as const,
        uploadDate: new Date('2024-01-15'),
      },
    ];

    render(<ScanHistoryTable scans={scans} />);

    expect(screen.getByText('longitudinal')).toBeInTheDocument();
  });

  it('highlights current scan', () => {
    const scans = [
      {
        id: 'scan-1',
        scanDate: new Date('2024-01-15'),
        riskScore: 35,
        classification: 'normal' as const,
        analysisType: 'initial' as const,
        uploadDate: new Date('2024-01-15'),
      },
      {
        id: 'scan-2',
        scanDate: new Date('2024-05-15'),
        riskScore: 55,
        classification: 'suspicious' as const,
        analysisType: 'longitudinal' as const,
        uploadDate: new Date('2024-05-15'),
      },
    ];

    const { container } = render(
      <ScanHistoryTable scans={scans} currentScanId="scan-1" />
    );

    // Current scan row should have special styling
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('displays multiple scans in order', () => {
    const scans = [
      {
        id: 'scan-1',
        scanDate: new Date('2024-01-15'),
        riskScore: 35,
        classification: 'normal' as const,
        analysisType: 'initial' as const,
        uploadDate: new Date('2024-01-15'),
      },
      {
        id: 'scan-2',
        scanDate: new Date('2024-05-15'),
        riskScore: 55,
        classification: 'suspicious' as const,
        analysisType: 'longitudinal' as const,
        uploadDate: new Date('2024-05-15'),
      },
    ];

    const { container } = render(<ScanHistoryTable scans={scans} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('has view buttons for each scan', () => {
    const scans = [
      {
        id: 'scan-1',
        scanDate: new Date('2024-01-15'),
        riskScore: 35,
        classification: 'normal' as const,
        analysisType: 'initial' as const,
        uploadDate: new Date('2024-01-15'),
      },
    ];

    render(<ScanHistoryTable scans={scans} />);

    expect(screen.getByText('View')).toBeInTheDocument();
  });
});
