'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generatePDF } from '@/app/actions/pdf';

interface PDFDownloadButtonProps {
  scanId: string;
  disabled?: boolean;
}

export function PDFDownloadButton({ scanId, disabled = false }: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generatePDF(scanId);

      if (!result.success || !result.blob || !result.filename) {
        setError(result.error || 'Failed to generate PDF');
        setIsLoading(false);
        return;
      }

      // Create blob URL and download
      const blobUrl = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      // Show success message (you can integrate with toast notification)
      console.log('PDF downloaded successfully:', result.filename);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleDownload}
        disabled={disabled || isLoading}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Generating PDF...
          </>
        ) : (
          <>
            📄 Download PDF Report
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
