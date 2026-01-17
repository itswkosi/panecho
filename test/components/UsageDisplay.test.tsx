import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsageDisplay } from '@/components/upload/UsageDisplay';

describe('UsageDisplay Component', () => {
  const baseDate = new Date('2025-12-31');

  it('renders without errors', () => {
    render(
      <UsageDisplay
        scansUsed={2}
        scansRemaining={3}
        resetDate={baseDate}
      />
    );

    expect(screen.getByText('Monthly Scan Limit')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('displays scans remaining correctly', () => {
    render(
      <UsageDisplay
        scansUsed={1}
        scansRemaining={4}
        resetDate={baseDate}
      />
    );

    expect(screen.getByText('4 scans remaining this month')).toBeInTheDocument();
  });

  it('displays singular "scan" when 1 remaining', () => {
    render(
      <UsageDisplay
        scansUsed={4}
        scansRemaining={1}
        resetDate={baseDate}
      />
    );

    expect(screen.getByText('1 scan remaining this month')).toBeInTheDocument();
  });

  it('shows limit reached message when at 0 remaining', () => {
    render(
      <UsageDisplay
        scansUsed={5}
        scansRemaining={0}
        resetDate={baseDate}
      />
    );

    expect(screen.getByText(/Limit reached for this month/)).toBeInTheDocument();
    expect(screen.getByText(/Please contact support/)).toBeInTheDocument();
  });

  it('displays reset date correctly', () => {
    const resetDate = new Date('2026-01-15T00:00:00');
    render(
      <UsageDisplay
        scansUsed={2}
        scansRemaining={3}
        resetDate={resetDate}
      />
    );

    expect(screen.getByText(/Resets on/)).toBeInTheDocument();
    // Just check that a date is displayed, exact format may vary by timezone
    const resetElements = screen.getByText(/Resets on/);
    expect(resetElements.textContent).toContain('2026');
  });

  it('displays admin message when isAdmin is true', () => {
    render(
      <UsageDisplay
        scansUsed={0}
        scansRemaining={5}
        resetDate={baseDate}
        isAdmin={true}
      />
    );

    expect(screen.getByText(/Admin account - rate limits disabled/)).toBeInTheDocument();
    expect(screen.queryByText('Monthly Scan Limit')).not.toBeInTheDocument();
  });

  it('uses correct colors for green status (1-2 scans)', () => {
    const { container } = render(
      <UsageDisplay
        scansUsed={1}
        scansRemaining={4}
        resetDate={baseDate}
      />
    );

    // Check for green styling
    const progressBg = container.querySelector('.bg-green-100');
    expect(progressBg).toBeInTheDocument();
  });

  it('uses correct colors for amber status (3-4 scans)', () => {
    const { container } = render(
      <UsageDisplay
        scansUsed={3}
        scansRemaining={2}
        resetDate={baseDate}
      />
    );

    // Check for amber styling
    const progressBg = container.querySelector('.bg-amber-100');
    expect(progressBg).toBeInTheDocument();
  });

  it('uses correct colors for red status (5 scans)', () => {
    const { container } = render(
      <UsageDisplay
        scansUsed={5}
        scansRemaining={0}
        resetDate={baseDate}
      />
    );

    // Check for red styling
    const progressBg = container.querySelector('.bg-red-100');
    expect(progressBg).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(
      <UsageDisplay
        scansUsed={2}
        scansRemaining={3}
        resetDate={baseDate}
      />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle('width: 40%');
  });

  it('renders progress bar at 0% when no scans used', () => {
    const { container } = render(
      <UsageDisplay
        scansUsed={0}
        scansRemaining={5}
        resetDate={baseDate}
      />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle('width: 0%');
  });

  it('renders progress bar at 100% when all scans used', () => {
    const { container } = render(
      <UsageDisplay
        scansUsed={5}
        scansRemaining={0}
        resetDate={baseDate}
      />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle('width: 100%');
  });

  it('shows detailed message when limit reached', () => {
    render(
      <UsageDisplay
        scansUsed={5}
        scansRemaining={0}
        resetDate={baseDate}
      />
    );

    expect(screen.getByText(/You've reached your limit of 5 scans this month/)).toBeInTheDocument();
  });

  it('does not show limit reached message when not at limit', () => {
    render(
      <UsageDisplay
        scansUsed={3}
        scansRemaining={2}
        resetDate={baseDate}
      />
    );

    expect(screen.queryByText(/You've reached your limit/)).not.toBeInTheDocument();
  });
});
