'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateAssignmentModal, FileWithoutDate } from '@/components/upload/DateAssignmentModal';
import { UsageDisplay } from '@/components/upload/UsageDisplay';
import { uploadBatchScans } from '@/app/actions/batch';
import { formatDateForInput } from '@/lib/utils/date';
import { validateFileType, validateFileSize } from '@/lib/validation/files';
import { ClinicalContext } from '@/lib/types/database';
import { ErrorCode } from '@/lib/types/errors';
import { checkUsageLimit } from '@/app/actions/usage';
import type { UsageLimitResult } from '@/lib/usage/tracker';

interface FileToUpload {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  isDicom: boolean;
  scanDate?: Date;
}

interface ErrorState {
  code: ErrorCode;
  message: string;
  recoverable: boolean;
}

type ErrorType = string | ErrorState;

const MAX_FILE_SIZE_MB = 5; // DICOM files typically 2-5MB
const MAX_FILES = 5;

/**
 * Upload page with batch support
 */
export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<FileToUpload[]>([]);
  const [filesWithoutDates, setFilesWithoutDates] = useState<FileWithoutDate[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<ErrorType | null>(null);
  const [usageLimit, setUsageLimit] = useState<UsageLimitResult | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  // Load usage limit on mount
  useEffect(() => {
    const loadUsageLimit = async () => {
      try {
        const result = await checkUsageLimit();
        setUsageLimit(result);
      } catch (err) {
        console.error('Failed to load usage limit:', err);
        // Default to allowing upload on error
        setUsageLimit({
          canUpload: true,
          scansUsed: 0,
          scansRemaining: 5,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      } finally {
        setIsLoadingUsage(false);
      }
    };

    loadUsageLimit();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const files = Array.from(e.currentTarget.files || []);

    if (files.length === 0) {
      return;
    }

    if (files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const filesToUpload: FileToUpload[] = [];
    const withoutDates: FileWithoutDate[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!validateFileType(file)) {
        setError(`${file.name}: Invalid file type. Only DICOM, PNG, and JPEG files are allowed.`);
        return;
      }

      // Validate file size
      if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
        setError(`${file.name}: Exceeds ${MAX_FILE_SIZE_MB}MB limit`);
        return;
      }

      // Read file as ArrayBuffer
      const buffer = await file.arrayBuffer();
      const isDicom = file.name.toLowerCase().endsWith('.dcm');

      filesToUpload.push({
        name: file.name,
        size: file.size,
        buffer,
        isDicom,
        scanDate: undefined, // Will be set on server for DICOM, or by user for others
      });

      // For now, all files need date assignment (DICOM extraction happens on server)
      withoutDates.push({ name: file.name, index: i });
    }

    setSelectedFiles(filesToUpload);

    // Show date assignment modal if needed
    if (withoutDates.length > 0) {
      setFilesWithoutDates(withoutDates);
      setShowDateModal(true);
    }
  };

  const handleDateAssignment = (dates: Record<number, string>) => {
    // Update selected files with assigned dates
    const updated = selectedFiles.map((file, idx) => {
      if (idx in dates) {
        const [year, month, day] = dates[idx].split('-').map(Number);
        return {
          ...file,
          scanDate: new Date(year, month - 1, day),
        };
      }
      return file;
    });

    setSelectedFiles(updated);
    setShowDateModal(false);
    setFilesWithoutDates([]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilesWithoutDates((prev) =>
      prev.filter((f) => f.index !== index).map((f) => ({
        ...f,
        index: f.index > index ? f.index - 1 : f.index,
      }))
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('No files selected');
      return;
    }

    // Validate all files have scan dates
    const allHaveDates = selectedFiles.every((f) => f.scanDate);
    if (!allHaveDates) {
      setError('All files must have scan dates');
      return;
    }

    // Check usage limit
    if (!usageLimit?.canUpload) {
      const resetDate = usageLimit?.resetDate || new Date();
      setError({
        code: ErrorCode.API_RATE_LIMIT,
        message: `You've reached your limit of 5 scans this month. Your limit resets on ${resetDate.toLocaleDateString()}. Please contact support for exceptions.`,
        recoverable: false,
      });
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Prepare files for batch upload
      const filesData = selectedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        buffer: file.buffer,
        isDicom: file.isDicom,
        scanDate: file.scanDate ? formatDateForInput(file.scanDate) : undefined,
      }));

      // Clinical context (default values - can be enhanced later)
      const clinicalContext: ClinicalContext = {
        age: 0,
        smoking_status: 'never',
      };

      // Call batch upload
      const result = await uploadBatchScans(filesData, clinicalContext);

      if (!result.success) {
        setError(result.error || {
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Upload failed',
          recoverable: true,
        });
        setIsUploading(false);
        return;
      }

      // Validate we received scan IDs
      if (!result.data || !result.data.scanIds || result.data.scanIds.length === 0) {
        console.error('[Upload] ERROR: Upload succeeded but no scan IDs returned', result);
        setError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Upload completed but no scan IDs returned',
          recoverable: true,
        });
        setIsUploading(false);
        return;
      }

      // Get the first scan ID for navigation
      const primaryScanId = result.data.scanIds[0];
      
      // Validate the primary scan ID before navigation
      if (!primaryScanId || typeof primaryScanId !== 'string' || primaryScanId.trim() === '') {
        console.error('[Upload] ERROR: Invalid primary scan ID', { 
          primaryScanId, 
          type: typeof primaryScanId,
          allScanIds: result.data.scanIds 
        });
        setError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Invalid scan ID generated',
          recoverable: true,
        });
        setIsUploading(false);
        return;
      }

      console.log(`[Upload] Successfully uploaded ${result.data.scanIds.length} scan(s)`);
      console.log(`[Upload] Primary scan ID: ${primaryScanId}`);
      console.log(`[Upload] All scan IDs:`, result.data.scanIds);

      // Navigate to processing page for the primary scan
      if (result.data.scanIds.length === 1) {
        console.log(`[Upload] Navigating to processing page: /processing/${primaryScanId}`);
        router.push(`/processing/${primaryScanId}`);
      } else if (result.data.scanIds.length > 1) {
        // Multiple scans - navigate to first one (timeline view can be added later)
        console.log(`[Upload] Multiple scans uploaded, navigating to: /processing/${primaryScanId}`);
        router.push(`/processing/${primaryScanId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Upload CT Scans</h1>
          <p className="text-slate-600">
            Upload DICOM files or images for analysis. Multiple files are supported.
          </p>
        </div>

        {/* Usage Display */}
        {!isLoadingUsage && usageLimit && (
          <UsageDisplay
            scansUsed={usageLimit.scansUsed}
            scansRemaining={usageLimit.scansRemaining}
            resetDate={usageLimit.resetDate}
            isAdmin={usageLimit.isAdmin}
          />
        )}

        {/* Drop zone */}
        <Card className="border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors p-8 mb-6">
          <div
            className="text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('bg-slate-50');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-slate-50');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-slate-50');
              if (fileInputRef.current) {
                fileInputRef.current.files = e.dataTransfer.files;
                handleFileSelect({
                  currentTarget: fileInputRef.current,
                } as React.ChangeEvent<HTMLInputElement>);
              }
            }}
          >
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-900 mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-slate-600">
              Supported: DICOM (.dcm), PNG, JPEG (up to {MAX_FILE_SIZE_MB}MB, max {MAX_FILES} files)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".dcm,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </Card>

        {/* Error message */}
        {error && (
          <Card className="border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-red-800">
              {typeof error === 'string' ? error : error.message}
            </p>
          </Card>
        )}

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <Card className="border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Selected Files ({selectedFiles.length}/{MAX_FILES})
            </h2>

            <div className="space-y-3">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <div className="flex gap-4 text-sm text-slate-600 mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="text-slate-400">•</span>
                      <span>{file.isDicom ? 'DICOM' : 'Image'}</span>
                      {file.scanDate && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-green-600 font-medium">
                            {file.scanDate.toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedFiles([]);
              setError(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            disabled={selectedFiles.length === 0 || isUploading}
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading || !usageLimit?.canUpload}
            className="flex-1"
          >
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </Button>
        </div>
      </div>

      {/* Date assignment modal */}
      <DateAssignmentModal
        isOpen={showDateModal}
        files={filesWithoutDates}
        onAssignDates={handleDateAssignment}
        onCancel={() => {
          setShowDateModal(false);
          setSelectedFiles([]);
          setFilesWithoutDates([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      />
    </div>
  );
}
