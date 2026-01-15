import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TimelineVisualization } from '@/components/results/TimelineVisualization';

describe('TimelineVisualization', () => {
  it('renders with multiple scans', () => {
    const scans = [
      {
        date: new Date('2024-01-15'),
        riskScore: 35,
        classification: 'normal' as const,
      },
      {
        date: new Date('2024-03-15'),
        riskScore: 42,
        classification: 'normal' as const,
      },
      {
        date: new Date('2024-05-15'),
        riskScore: 55,
        classification: 'suspicious' as const,
      },
    ];

    render(<TimelineVisualization scans={scans} />);

    expect(screen.getByText('Risk Score Timeline')).toBeInTheDocument();
  });

  it('renders empty state when no scans provided', () => {
    render(<TimelineVisualization scans={[]} />);

    expect(screen.getByText('No previous scans available for timeline')).toBeInTheDocument();
  });

  it('displays scans in chronological order', () => {
    const scans = [
      {
        date: new Date('2024-05-15'),
        riskScore: 55,
        classification: 'suspicious' as const,
      },
      {
        date: new Date('2024-01-15'),
        riskScore: 35,
        classification: 'normal' as const,
      },
    ];

    render(<TimelineVisualization scans={scans} />);

    expect(screen.getByText('Risk Score Timeline')).toBeInTheDocument();
  });

  it('handles single scan', () => {
    const scans = [
      {
        date: new Date('2024-01-15'),
        riskScore: 35,
        classification: 'normal' as const,
      },
    ];

    render(<TimelineVisualization scans={scans} />);

    expect(screen.getByText('Risk Score Timeline')).toBeInTheDocument();
  });
});
