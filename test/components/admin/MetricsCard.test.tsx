import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsCard } from '@/components/admin/MetricsCard';

describe('Admin MetricsCard Component', () => {
  it('should render metric title', () => {
    render(
      <MetricsCard
        title="Total Scans"
        value={42}
      />
    );
    expect(screen.getByText('Total Scans')).toBeInTheDocument();
  });

  it('should render metric value', () => {
    render(
      <MetricsCard
        title="Test Metric"
        value={123}
      />
    );
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('should render string values', () => {
    render(
      <MetricsCard
        title="Processing Time"
        value="15.5s"
      />
    );
    expect(screen.getByText('15.5s')).toBeInTheDocument();
  });

  it('should render optional subtitle', () => {
    render(
      <MetricsCard
        title="Metric"
        value={100}
        subtitle="All time"
      />
    );
    expect(screen.getByText('All time')).toBeInTheDocument();
  });

  it('should render upward trend indicator', () => {
    render(
      <MetricsCard
        title="Growth"
        value={50}
        trend={{ direction: 'up', percent: 5.2 }}
      />
    );
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/5\.2/)).toBeInTheDocument();
  });

  it('should render downward trend indicator', () => {
    render(
      <MetricsCard
        title="Decline"
        value={30}
        trend={{ direction: 'down', percent: 3.5 }}
      />
    );
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/3\.5/)).toBeInTheDocument();
  });

  it('should render stable trend indicator', () => {
    render(
      <MetricsCard
        title="Stable"
        value={100}
        trend={{ direction: 'stable', percent: 0 }}
      />
    );
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    render(
      <MetricsCard
        title="Uploads"
        value={42}
        icon="📤"
      />
    );
    expect(screen.getByText('📤')).toBeInTheDocument();
  });

  it('should apply correct styles for up trend', () => {
    const { container } = render(
      <MetricsCard
        title="Uptrend"
        value={100}
        trend={{ direction: 'up', percent: 10 }}
      />
    );
    const trendElement = container.querySelector('.text-green-600');
    expect(trendElement).toBeInTheDocument();
  });

  it('should apply correct styles for down trend', () => {
    const { container } = render(
      <MetricsCard
        title="Downtrend"
        value={100}
        trend={{ direction: 'down', percent: 10 }}
      />
    );
    const trendElement = container.querySelector('.text-red-600');
    expect(trendElement).toBeInTheDocument();
  });

  it('should render all optional properties together', () => {
    render(
      <MetricsCard
        title="Complex Metric"
        value="75.5%"
        subtitle="Last 7 days"
        icon="📊"
        trend={{ direction: 'up', percent: 12.3 }}
      />
    );
    expect(screen.getByText('Complex Metric')).toBeInTheDocument();
    expect(screen.getByText('75.5%')).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText(/12\.3/)).toBeInTheDocument();
  });

  it('should work without trend data', () => {
    render(
      <MetricsCard
        title="No Trend"
        value={42}
      />
    );
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByText(/↑|↓|→/)).not.toBeInTheDocument();
  });
});
