import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { ErrorCode } from '@/lib/types/errors';

describe('ErrorDisplay', () => {
  it('should render error message', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.FILE_TOO_LARGE}
        message="File is too large"
        recoverable={true}
      />
    );

    expect(screen.getByText('File is too large')).toBeInTheDocument();
  });

  it('should show recoverable title for recoverable errors', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.INVALID_FILE_TYPE}
        message="Invalid file type"
        recoverable={true}
      />
    );

    expect(screen.getByText('We can fix this')).toBeInTheDocument();
  });

  it('should show non-recoverable title for non-recoverable errors', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.DATABASE_ERROR}
        message="Database error"
        recoverable={false}
      />
    );

    expect(screen.getByText('Unable to proceed')).toBeInTheDocument();
  });

  it('should show retry button when recoverable and onRetry provided', () => {
    const onRetry = vi.fn();
    render(
      <ErrorDisplay
        code={ErrorCode.API_ERROR}
        message="API failed"
        recoverable={true}
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /Retry/ });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(
      <ErrorDisplay
        code={ErrorCode.API_ERROR}
        message="API failed"
        recoverable={true}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('should show contact support for non-recoverable errors', () => {
    render(
      <ErrorDisplay code={ErrorCode.DATABASE_ERROR} message="Database error" recoverable={false} />
    );

    const contactLink = screen.getByRole('link', { name: /Contact Support/ });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', 'mailto:support@panecho.io');
  });

  it('should show retry count', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.API_ERROR}
        message="API failed"
        recoverable={true}
        onRetry={vi.fn()}
        retryCount={1}
      />
    );

    const button = screen.getByRole('button', { name: /Retry/ });
    expect(button.textContent).toMatch(/Retry.*1.*3/);
  });

  it('should show max retry warning', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.API_ERROR}
        message="API failed"
        recoverable={true}
        retryCount={3}
      />
    );

    expect(screen.getByText(/maximum retry attempts/)).toBeInTheDocument();
  });

  it('should expand/collapse technical details', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.INVALID_FILE_TYPE}
        message="Invalid file"
        recoverable={true}
        showTechnicalDetails={false}
      />
    );

    const button = screen.getByRole('button', { name: /Technical Details/ });
    expect(button).toBeInTheDocument();

    // Initially collapsed
    expect(screen.queryByText(ErrorCode.INVALID_FILE_TYPE)).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(button);
    expect(screen.getByText(ErrorCode.INVALID_FILE_TYPE)).toBeInTheDocument();
  });

  it('should show technical details when requested', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.FILE_TOO_LARGE}
        message="File too large"
        recoverable={true}
        showTechnicalDetails={true}
      />
    );

    expect(screen.getByText(ErrorCode.FILE_TOO_LARGE)).toBeInTheDocument();
  });

  it('should show quality disclaimer for image quality errors', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.INSUFFICIENT_IMAGE_QUALITY}
        message="Low quality"
        recoverable={false}
      />
    );

    expect(screen.getByText(/Medical Disclaimer/)).toBeInTheDocument();
    expect(screen.getByText(/informational purposes only/)).toBeInTheDocument();
  });

  it('should show save results warning for database errors', () => {
    render(
      <ErrorDisplay
        code={ErrorCode.DATABASE_ERROR}
        message="DB failed"
        recoverable={false}
      />
    );

    expect(screen.getByText(/Save Your Results/)).toBeInTheDocument();
    expect(screen.getByText(/screenshot/i)).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <ErrorDisplay
        code={ErrorCode.API_ERROR}
        message="API failed"
        recoverable={true}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Dismiss/ }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('should have proper ARIA roles', () => {
    render(
      <ErrorDisplay code={ErrorCode.INVALID_FILE_TYPE} message="Invalid file" recoverable={true} />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should be accessible with aria-live', () => {
    render(
      <ErrorDisplay code={ErrorCode.API_ERROR} message="API error" recoverable={true} />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});
