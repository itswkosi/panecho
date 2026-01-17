import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsageWidget } from '@/components/usage/UsageWidget';
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

describe('UsageWidget Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUsage).mockReturnValue({
      usageData: mockUsageData,
      loading: false,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: vi.fn(),
    });
  });

  describe('Compact Version', () => {
    it('should render compact icon', () => {
      render(<UsageWidget compact={true} />);

      const button = screen.getByRole('button', { name: /view usage/i });
      expect(button).toBeInTheDocument();
    });

    it('should show icon with normal color when within limits', () => {
      const { container } = render(<UsageWidget compact={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-slate-600');
    });

    it('should show icon with warning color when near limit', () => {
      vi.mocked(useUsage).mockReturnValue({
        usageData: mockWarningData,
        loading: false,
        error: null,
        fetchUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      const { container } = render(<UsageWidget compact={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-amber-600');
    });

    it('should show icon with error color when exceeded', () => {
      vi.mocked(useUsage).mockReturnValue({
        usageData: mockExceededData,
        loading: false,
        error: null,
        fetchUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      const { container } = render(<UsageWidget compact={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-red-600');
    });

    it('should show tooltip with scan usage', () => {
      render(<UsageWidget compact={true} />);

      expect(screen.getByText('Scans')).toBeInTheDocument();
      expect(screen.getByText('10 / 100')).toBeInTheDocument();
    });

    it('should show tooltip with storage usage', () => {
      render(<UsageWidget compact={true} />);

      expect(screen.getByText('Storage')).toBeInTheDocument();
      expect(screen.getByText('2.5 / 10 GB')).toBeInTheDocument();
    });
  });

  describe('Full Version', () => {
    it('should render full widget', () => {
      render(<UsageWidget compact={false} />);

      expect(screen.getByText('Scans')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
      expect(screen.getByText('10 / 100')).toBeInTheDocument();
    });

    it('should not show warning when within limits', () => {
      render(<UsageWidget compact={false} />);

      const widget = screen.getByText('Scans').closest('div');
      expect(widget).not.toHaveClass('text-amber-600');
    });

    it('should show warning status when near limit', () => {
      vi.mocked(useUsage).mockReturnValue({
        usageData: mockWarningData,
        loading: false,
        error: null,
        fetchUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      render(<UsageWidget compact={false} />);

      expect(screen.getByText('High usage warning')).toBeInTheDocument();
    });

    it('should show error status when exceeded', () => {
      vi.mocked(useUsage).mockReturnValue({
        usageData: mockExceededData,
        loading: false,
        error: null,
        fetchUsageData: vi.fn(),
        clearError: vi.fn(),
      });

      render(<UsageWidget compact={false} />);

      expect(screen.getByText('Usage limit exceeded')).toBeInTheDocument();
    });

    it('should display scan count', () => {
      render(<UsageWidget compact={false} />);

      expect(screen.getByText('10 / 100')).toBeInTheDocument();
    });

    it('should display storage usage', () => {
      render(<UsageWidget compact={false} />);

      expect(screen.getByText('2.5 / 10 GB')).toBeInTheDocument();
    });
  });

  it('should render nothing when no usage data', () => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: null,
      loading: false,
      error: null,
      fetchUsageData: vi.fn(),
      clearError: vi.fn(),
    });

    const { container } = render(<UsageWidget />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
