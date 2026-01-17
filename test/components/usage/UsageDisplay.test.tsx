import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageDisplay } from '@/components/usage/UsageDisplay';
import { useUsage } from '@/lib/hooks/useUsage';
import type { UsageLimitResult } from '@/lib/usage/tracker';

vi.mock('@/lib/hooks/useUsage');

const mockUsageData: UsageLimitResult = {
  canUpload: true,
  scansUsed: 10,
  scansRemaining: 90,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isAdmin: false,
};

const mockExceededData: UsageLimitResult = {
  canUpload: false,
  scansUsed: 100,
  scansRemaining: 0,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isAdmin: false,
};

const mockWarningData: UsageLimitResult = {
  canUpload: true,
  scansUsed: 85,
  scansRemaining: 15,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isAdmin: false,
};

describe('UsageDisplay Component', () => {
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockUsageData,
      loading: false,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });
  });

  it('should render loading state', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: null,
      loading: true,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });

    render(<UsageDisplay />);

    expect(screen.getByText('Loading usage data...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: null,
      loading: false,
      error: 'Failed to load usage',
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });

    render(<UsageDisplay showWarning={true} />);

    expect(screen.getByText('Failed to load usage')).toBeInTheDocument();
  });

  it('should not display error when showWarning is false', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: null,
      loading: false,
      error: 'Failed to load usage',
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });

    const { container } = render(<UsageDisplay showWarning={false} />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should render usage information when data available', () => {
    render(<UsageDisplay />);

    expect(screen.getByText('Usage Information')).toBeInTheDocument();
    expect(screen.getByText('Your current usage metrics')).toBeInTheDocument();
    expect(screen.getByText('Scans Used')).toBeInTheDocument();
    expect(screen.getByText('Storage Used')).toBeInTheDocument();
  });

  it('should display correct scan count', () => {
    render(<UsageDisplay />);

    expect(screen.getByText('10 / 100')).toBeInTheDocument();
  });

  it('should display correct storage usage', () => {
    render(<UsageDisplay />);

    expect(screen.getByText('2.50 / 10 GB')).toBeInTheDocument();
  });

  it('should display remaining scans', () => {
    render(<UsageDisplay />);

    expect(screen.getByText('90 scans remaining')).toBeInTheDocument();
  });

  it('should display remaining storage', () => {
    render(<UsageDisplay />);

    expect(screen.getByText('7.50 GB remaining')).toBeInTheDocument();
  });

  it('should display plan type', () => {
    render(<UsageDisplay />);

    expect(screen.getByText('pro')).toBeInTheDocument();
  });

  it('should show exceeded alert when limit exceeded', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockExceededData,
      loading: false,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });

    render(<UsageDisplay />);

    expect(
      screen.getByText(
        "You've reached your usage limit. Please upgrade your plan or contact support."
      )
    ).toBeInTheDocument();
  });

  it('should not show exceeded alert when showWarning is false', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockExceededData,
      loading: false,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });

    const { queryByText } = render(<UsageDisplay showWarning={false} />);

    expect(
      queryByText("You've reached your usage limit. Please upgrade your plan or contact support.")
    ).not.toBeInTheDocument();
  });

  it('should show usage information correctly', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockWarningData,
      loading: false,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });

    render(<UsageDisplay />);

    expect(
      screen.getByText("You're using 85% of your scan limit. Consider upgrading your plan soon.")
    ).toBeInTheDocument();
  });

  it('should not show warning when no data', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: null,
      loading: false,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });

    const { container } = render(<UsageDisplay />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should call onLimitExceeded callback', () => {
    const onLimitExceeded = vi.fn();

    vi.mocked(useUsage).mockReturnValue({
      usageData: mockExceededData,
      loading: false,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: mockClearError,
    });

    render(<UsageDisplay onLimitExceeded={onLimitExceeded} />);

    expect(onLimitExceeded).toHaveBeenCalled();
  });

  it('should render correct progress bar percentage', () => {
    const { container } = render(<UsageDisplay />);

    const progressBars = container.querySelectorAll('[style*="width"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
