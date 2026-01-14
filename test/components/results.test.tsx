import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClassificationBadge } from '@/components/results/ClassificationBadge';
import { RiskScoreGauge } from '@/components/results/RiskScoreGauge';
import { Disclaimer } from '@/components/shared/Disclaimer';

describe('ClassificationBadge', () => {
  it('renders normal classification correctly', () => {
    render(<ClassificationBadge classification="normal" riskScore={25} />);
    
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
    expect(screen.getByText('Risk Score: 25%')).toBeInTheDocument();
  });

  it('renders suspicious classification correctly', () => {
    render(<ClassificationBadge classification="suspicious" riskScore={75} />);
    
    expect(screen.getByText('SUSPICIOUS FINDINGS')).toBeInTheDocument();
    expect(screen.getByText('Risk Score: 75%')).toBeInTheDocument();
  });

  it('displays risk score correctly', () => {
    render(<ClassificationBadge classification="normal" riskScore={42} />);
    
    expect(screen.getByText('Risk Score: 42%')).toBeInTheDocument();
  });
});

describe('RiskScoreGauge', () => {
  it('renders percentage correctly', () => {
    render(<RiskScoreGauge score={50} />);
    
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders labels', () => {
    render(<RiskScoreGauge score={50} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders legend', () => {
    render(<RiskScoreGauge score={50} />);
    
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Borderline')).toBeInTheDocument();
    expect(screen.getByText('Suspicious')).toBeInTheDocument();
  });

  it('clamps score to 0-100 range', () => {
    const { rerender, container } = render(<RiskScoreGauge score={150} />);
    expect(container.textContent).toContain('100%');

    rerender(<RiskScoreGauge score={-10} />);
    expect(container.textContent).toContain('0%');
  });
});

describe('Disclaimer', () => {
  it('renders disclaimer text', () => {
    render(<Disclaimer />);
    
    expect(screen.getByText(/Important Medical Disclaimer/i)).toBeInTheDocument();
    expect(screen.getByText(/This AI analysis is intended to assist/i)).toBeInTheDocument();
  });

  it('contains warning icon', () => {
    const { container } = render(<Disclaimer />);
    expect(container.textContent).toContain('⚠️');
  });

  it('displays multiple warning paragraphs', () => {
    render(<Disclaimer />);
    
    const paragraphs = screen.getAllByText(/This|All|Do not/);
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('has amber styling', () => {
    const { container } = render(<Disclaimer />);
    const disclaimerDiv = container.firstChild;
    
    expect(disclaimerDiv).toHaveClass('bg-amber-50');
    expect(disclaimerDiv).toHaveClass('border-amber-400');
  });
});
