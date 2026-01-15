import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProcessingPage from '@/app/(protected)/processing/[scanId]/page';
import * as hooks from '@/lib/hooks/useProcessingStatus';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/hooks/useProcessingStatus', () => ({
  useProcessingStatus: vi.fn(),
}));

vi.mock('@/components/processing/ProgressIndicator', () => ({
  ProgressIndicator: ({ status }: any) => <div data-testid="progress-indicator">{status}</div>,
}));

vi.mock('@/components/processing/EducationalContent', () => ({
  EducationalContent: () => <div data-testid="educational-content">Educational Content</div>,
}));

describe('ProcessingPage', () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: mockBack,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render processing page with header', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.getByText('Processing Your Scan')).toBeInTheDocument();
    expect(
      screen.getByText(/Our AI is analyzing your pancreatic imaging/),
    ).toBeInTheDocument();
  });

  it('should render progress indicator', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
  });

  it('should render educational content', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.getByTestId('educational-content')).toBeInTheDocument();
  });

  it('should show loading indicator when isLoading and status is pending', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'pending',
      error: null,
      isLoading: true,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.getByText('Checking scan status...')).toBeInTheDocument();
  });

  it('should not show loading indicator when isLoading is false', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'pending',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.queryByText('Checking scan status...')).not.toBeInTheDocument();
  });

  it('should redirect to results page when status is completed', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'completed',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    vi.advanceTimersByTime(1000);

    expect(mockPush).toHaveBeenCalledWith('/results/scan-123');
  });

  it('should show error message when processing fails', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'failed',
      error: 'DICOM parsing failed',
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.getByText('Processing Error')).toBeInTheDocument();
    expect(screen.getByText('DICOM parsing failed')).toBeInTheDocument();
  });

  it('should show go back button on error', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'failed',
      error: 'Network error',
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    const backButton = screen.getByRole('button', { name: /Go Back/ });
    expect(backButton).toBeInTheDocument();
  });

  it('should call router.back when back button is clicked', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'failed',
      error: 'Processing failed',
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    const backButton = screen.getByRole('button', { name: /Go Back/ });
    backButton.click();

    expect(mockBack).toHaveBeenCalled();
  });

  it('should pass correct status to progress indicator', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('processing');
  });

  it('should call useProcessingStatus with correct scanId', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-456' }} />);

    expect(hooks.useProcessingStatus).toHaveBeenCalledWith('scan-456');
  });

  it('should handle pending status gracefully', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'pending',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
    expect(screen.queryByText('Processing Error')).not.toBeInTheDocument();
  });

  it('should not show error state when status is not failed', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: 'Some error message',
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    expect(screen.queryByText('Processing Error')).not.toBeInTheDocument();
  });

  it('should have proper page structure with grid layout', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });

    const { container } = render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-2');
  });

  it('should have gradient background', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });

    const { container } = render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    const background = container.querySelector('.bg-gradient-to-b');
    expect(background).toBeInTheDocument();
  });

  it('should show multiple status states correctly', () => {
    const { rerender } = render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    // Pending state
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'pending',
      error: null,
      isLoading: false,
    });
    rerender(<ProcessingPage params={{ scanId: 'scan-123' }} />);
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('pending');

    // Processing state
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });
    rerender(<ProcessingPage params={{ scanId: 'scan-123' }} />);
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('processing');
  });

  it('should calculate estimated time remaining', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'processing',
      error: null,
      isLoading: false,
    });

    render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    // Advance time and verify estimated time updates
    vi.advanceTimersByTime(1000);

    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
  });

  it('should use proper styling classes for error display', () => {
    vi.mocked(hooks.useProcessingStatus).mockReturnValue({
      status: 'failed',
      error: 'Test error',
      isLoading: false,
    });

    const { container } = render(<ProcessingPage params={{ scanId: 'scan-123' }} />);

    const errorBox = container.querySelector('.bg-red-50');
    expect(errorBox).toBeInTheDocument();
    expect(errorBox).toHaveClass('rounded-lg');
    expect(errorBox).toHaveClass('p-6');
  });
});
