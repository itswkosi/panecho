'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageDisplay } from '@/components/upload/UsageDisplay';
import { uploadScan } from '@/app/actions/upload';
import { checkUsageLimit } from '@/app/actions/usage';
import type { UsageLimitResult } from '@/lib/usage/tracker';
import {
  getRetentionStatus,
  extendScanRetention,
  deleteScan,
} from '@/app/actions/retention';
import { RetentionNotification } from '@/components/shared/RetentionNotification';
import type { RetentionStatus } from '@/lib/retention/manager';
import { getFileError, getFileSize } from '@/lib/validation/files';

interface UploadedFile {
  file: File;
  error?: string | null;
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [retentionStatuses, setRetentionStatuses] = useState<RetentionStatus[]>([]);
  const [retentionLoading, setRetentionLoading] = useState(false);

  // Load retention statuses for dismissible notification
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setRetentionLoading(true);
        const res = await getRetentionStatus();
        if (!mounted) return;
        if (!res.success) return;

        const parsed = (res.data || []).map((s: any) => ({
          ...s,
          scanDate: new Date(s.scanDate),
          expiresAt: new Date(s.expiresAt),
        }));

        setRetentionStatuses(parsed);
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setRetentionLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const handleExtend = async (scanId: string) => {
    try {
      const res = await extendScanRetention(scanId);
      if (res.success) {
        // refresh statuses
        const updated = await getRetentionStatus();
        if (updated.success) {
          setRetentionStatuses((updated.data || []).map((s: any) => ({
            ...s,
            scanDate: new Date(s.scanDate),
            expiresAt: new Date(s.expiresAt),
          })));
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const handleDelete = async (scanId: string) => {
    try {
      const res = await deleteScan(scanId);
      if (res.success) {
        setRetentionStatuses((prev) => prev.filter((s) => s.scanId !== scanId));
      }
    } catch (err) {
      // ignore
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      file,
      error: getFileError(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current) {
      dragRef.current.classList.add('border-blue-500', 'bg-blue-50');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current) {
      dragRef.current.classList.remove('border-blue-500', 'bg-blue-50');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current) {
      dragRef.current.classList.remove('border-blue-500', 'bg-blue-50');
    }
    handleFileSelect(e.dataTransfer.files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const validFiles = files.filter((f) => !f.error);

    if (validFiles.length === 0) {
      setUploadError('Please select valid files to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      for (let i = 0; i < validFiles.length; i++) {
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));

        const formData = new FormData();
        formData.append('file', validFiles[i].file);

        const result = await uploadScan(formData);

        if (!result.success) {
          setUploadError(result.error?.message || 'Upload failed');
          setIsUploading(false);
          return;
        }

        // Redirect to processing page for first successfully uploaded file
        if (result.data?.scanId && i === 0) {
          setFiles([]);
          setUploadProgress(0);
          // Navigate to processing page
          router.push(`/processing/${result.data.scanId}`);
          return;
        }
      }

      setUploadSuccess(
        `Successfully uploaded ${validFiles.length} file(s).`
      );
      setFiles([]);
      setUploadProgress(0);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const validFiles = files.filter((f) => !f.error);
  const invalidFiles = files.filter((f) => f.error);

  return (
    <div className="space-y-8">
      {/* Retention notifications for scans nearing deletion */}
      <RetentionNotification
        retentionStatuses={retentionStatuses}
        onExtend={handleExtend}
        onDelete={handleDelete}
      />
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Upload CT Scan</h1>
        <p className="text-slate-500 mt-2">
          Upload your DICOM, PNG, or JPEG images for analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>
            Drag and drop your files or click to browse. Maximum file size: 100MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Zone */}
          <div
            ref={dragRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center transition-colors cursor-pointer hover:border-blue-500 hover:bg-blue-50"
            onClick={handleBrowseClick}
          >
            <div className="space-y-3">
              <div className="text-4xl">📁</div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-slate-900">
                  Drag and drop your files here
                </p>
                <p className="text-sm text-slate-500">
                  or click to browse from your computer
                </p>
              </div>
              <p className="text-xs text-slate-400 pt-2">
                Supported formats: DICOM (.dcm), PNG, JPEG
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".dcm,.png,.jpg,.jpeg"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Error Messages */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {uploadSuccess}
            </div>
          )}

          {/* Valid Files List */}
          {validFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-slate-900">
                Valid Files ({validFiles.length})
              </h3>
              <div className="space-y-2">
                {validFiles.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">✓</div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 truncate">
                          {item.file.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {getFileSize(item.file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invalid Files List */}
          {invalidFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-slate-900">
                Invalid Files ({invalidFiles.length})
              </h3>
              <div className="space-y-2">
                {invalidFiles.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">✕</div>
                      <div className="flex-1">
                        <p className="font-medium text-red-900 truncate">
                          {item.file.name}
                        </p>
                        <p className="text-sm text-red-700">{item.error}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(files.indexOf(item))}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Uploading...</span>
                <span className="font-medium text-slate-900">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={validFiles.length === 0 || isUploading}
            size="lg"
            className="w-full"
          >
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Analyze Scan'}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-slate-600">
          <p>• DICOM files (.dcm) are the standard format for medical CT scans</p>
          <p>• PNG and JPEG formats are also supported for compatibility</p>
          <p>• Maximum file size is 100MB per file</p>
          <p>• Your files are encrypted and securely stored</p>
        </CardContent>
      </Card>
    </div>
  );
}
