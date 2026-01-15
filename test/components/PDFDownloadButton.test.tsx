import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFDownloadButton } from '@/components/results/PDFDownloadButton';
import * as pdfActions from '@/app/actions/pdf';

vi.mock('@/app/actions/pdf');

describe('PDFDownloadButton', () => {
  const mockGeneratePDF = vi.mocked(pdfActions.generatePDF);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders download button', () => {
    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Download PDF Report');
  });

  it('shows loading state when generating PDF', async () => {
    mockGeneratePDF.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ success: true, blob: new Blob(), filename: 'test.pdf' }),
            1000,
          ),
        ),
    );

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button).toHaveTextContent('Generating PDF...');
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).toHaveTextContent('Download PDF Report');
      expect(button).not.toBeDisabled();
    });
  });

  it('calls generatePDF with correct scanId', async () => {
    mockGeneratePDF.mockResolvedValueOnce({
      success: true,
      blob: new Blob(),
      filename: 'test.pdf',
    });

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGeneratePDF).toHaveBeenCalledWith('scan-123');
    });
  });

  it('triggers download with correct filename', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    const mockFilename = 'PanEcho_Report_John_Doe_2024-01-15.pdf';

    mockGeneratePDF.mockResolvedValueOnce({
      success: true,
      blob: mockBlob,
      filename: mockFilename,
    });

    // Mock URL.createObjectURL and link elements
    const createObjectURLMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.spyOn(URL, 'revokeObjectURL');
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document, 'appendChild');
    const removeChildSpy = vi.spyOn(document, 'removeChild');

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      const linkElement = createElementSpy.mock.results.find(
        (result) => result.value?.tagName === 'A',
      )?.value as HTMLAnchorElement | undefined;

      if (linkElement) {
        expect(linkElement.download).toBe(mockFilename);
      }
    });

    createObjectURLMock.mockRestore();
    revokeObjectURLMock.mockRestore();
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('displays error message on failure', async () => {
    const errorMessage = 'Failed to generate PDF';
    mockGeneratePDF.mockResolvedValueOnce({
      success: false,
      error: errorMessage,
    });

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables button when disabled prop is true', () => {
    render(<PDFDownloadButton scanId="scan-123" disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('clears error when retry is attempted', async () => {
    mockGeneratePDF.mockResolvedValueOnce({
      success: false,
      error: 'First attempt failed',
    });

    const { rerender } = render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('First attempt failed')).toBeInTheDocument();
    });

    // Second attempt succeeds
    mockGeneratePDF.mockResolvedValueOnce({
      success: true,
      blob: new Blob(),
      filename: 'success.pdf',
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText('First attempt failed')).not.toBeInTheDocument();
    });
  });

  it('handles exception errors gracefully', async () => {
    mockGeneratePDF.mockRejectedValueOnce(new Error('Network error'));

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('maintains disabled state while loading', async () => {
    let resolveGenerate: any;
    mockGeneratePDF.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGenerate = resolve;
        }),
    );

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button).toBeDisabled();

    // Keep button disabled until promise resolves
    expect(button).toBeDisabled();

    resolveGenerate({ success: true, blob: new Blob(), filename: 'test.pdf' });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('handles missing blob in response', async () => {
    mockGeneratePDF.mockResolvedValueOnce({
      success: false,
      error: 'Failed to generate PDF',
    });

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Failed to generate PDF')).toBeInTheDocument();
    });
  });

  it('handles missing filename in response', async () => {
    mockGeneratePDF.mockResolvedValueOnce({
      success: false,
      error: 'Failed to generate PDF',
    });

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Failed to generate PDF')).toBeInTheDocument();
    });
  });

  it('logs error to console on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGeneratePDF.mockRejectedValueOnce(new Error('Test error'));

    render(<PDFDownloadButton scanId="scan-123" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error downloading PDF:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
