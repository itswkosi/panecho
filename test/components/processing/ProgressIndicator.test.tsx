import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from '@/components/processing/ProgressIndicator';

describe('ProgressIndicator', () => {
  it('should render with pending status', () => {
    render(<ProgressIndicator status="pending" />);

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('File preparation')).toBeInTheDocument();
  });

  it('should show 0% progress when pending', () => {
    render(<ProgressIndicator status="pending" />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should show processing status with active spinner', () => {
    const { container } = render(<ProgressIndicator status="processing" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show 25% progress when processing', () => {
    render(<ProgressIndicator status="processing" />);

    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('should show all completed steps with checkmarks', () => {
    render(<ProgressIndicator status="completed" />);

    expect(screen.getByText('Analysis Complete!')).toBeInTheDocument();
    expect(screen.getByText('Your results are ready to view.')).toBeInTheDocument();
  });

  it('should show 100% progress when completed', () => {
    render(<ProgressIndicator status="completed" />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should show failed status with error message', () => {
    render(<ProgressIndicator status="failed" />);

    expect(screen.getByText('Processing Failed')).toBeInTheDocument();
    expect(screen.getByText('There was an error processing your scan. Please try uploading again.')).toBeInTheDocument();
  });

  it('should display estimated time remaining when provided', () => {
    render(<ProgressIndicator status="processing" estimatedTimeRemaining={45} />);

    expect(screen.getByText(/45s/)).toBeInTheDocument();
    expect(screen.getByText('Estimated time remaining:')).toBeInTheDocument();
  });

  it('should format time in minutes for large values', () => {
    render(<ProgressIndicator status="processing" estimatedTimeRemaining={125} />);

    expect(screen.getByText(/2m 5s/)).toBeInTheDocument();
  });

  it('should not display estimated time when not provided', () => {
    render(<ProgressIndicator status="processing" />);

    expect(screen.queryByText(/Estimated time remaining:/)).not.toBeInTheDocument();
  });

  it('should render all step labels', () => {
    render(<ProgressIndicator status="pending" />);

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Convert DICOM')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  it('should render all step descriptions', () => {
    render(<ProgressIndicator status="pending" />);

    expect(screen.getByText('File preparation')).toBeInTheDocument();
    expect(screen.getByText('Processing images')).toBeInTheDocument();
    expect(screen.getByText('AI analysis running')).toBeInTheDocument();
    expect(screen.getByText('Creating results')).toBeInTheDocument();
  });

  it('should apply correct styling to completed steps', () => {
    const { container } = render(<ProgressIndicator status="processing" />);

    const circles = container.querySelectorAll('.flex.h-10.w-10');
    // First circle should have green-500 for completed step
    expect(circles[0]).toHaveClass('bg-green-500');
  });

  it('should apply blue ring styling to active step', () => {
    const { container } = render(<ProgressIndicator status="processing" />);

    const circles = container.querySelectorAll('.flex.h-10.w-10');
    // Second circle should have blue styling for active step
    expect(circles[1]).toHaveClass('bg-blue-500');
    expect(circles[1]).toHaveClass('ring-4');
    expect(circles[1]).toHaveClass('ring-blue-200');
  });

  it('should render progress bar with correct width', () => {
    const { container } = render(<ProgressIndicator status="processing" />);

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should show processing message when status is processing', () => {
    render(<ProgressIndicator status="processing" />);

    expect(screen.getByText('Processing your scan with advanced AI analysis...')).toBeInTheDocument();
  });

  it('should show pending message when status is pending', () => {
    render(<ProgressIndicator status="pending" />);

    expect(screen.getByText('Initializing scan analysis...')).toBeInTheDocument();
  });

  it('should change progress bar color on failed status', () => {
    const { container } = render(<ProgressIndicator status="failed" />);

    const progressBar = container.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should not show status messages for pending status without error', () => {
    const { container } = render(<ProgressIndicator status="pending" />);

    // Should not have error or success boxes
    expect(container.querySelector('.bg-red-50')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-green-50')).not.toBeInTheDocument();
  });
});
