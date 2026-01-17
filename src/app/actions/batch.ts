'use server';

import { createClient } from '@supabase/supabase-js';
import { createScan } from '@/lib/supabase/db';
import { extractScanDateFromDicom } from '@/lib/dicom/metadata-server';
import { parseDateFromInput } from '@/lib/utils/date';
import { getUser } from './auth';
import { ClinicalContext } from '@/lib/types/database';
import { handleError, createErrorResponse } from '@/lib/errors/handler';
import { ErrorCode, ServerActionResponse } from '@/lib/types/errors';
import { checkUsageLimit, trackScanUsage } from '@/lib/usage/tracker';

export interface FileToBatch {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  isDicom: boolean;
  scanDate?: Date; // Auto-extracted for DICOM, or user-assigned
}

export interface BatchUploadResult extends ServerActionResponse<{
  scanIds: string[];
  filesWithoutDates?: Array<{ name: string; index: number }>;
}> {}

/**
 * Upload batch of DICOM/image files
 * Extracts scan dates from DICOM metadata or uses user-assigned dates
 * Returns scanIds sorted chronologically
 */
export async function uploadBatchScans(
  filesData: Array<{
    name: string;
    size: number;
    buffer: ArrayBuffer;
    isDicom: boolean;
    scanDate?: string; // YYYY-MM-DD format for user-assigned dates
  }>,
  clinicalContext: ClinicalContext,
): Promise<BatchUploadResult> {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return createErrorResponse({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not authenticated',
        userMessage: 'You must be logged in to upload scans.',
        recoverable: true,
      }, 0);
    }

    // Check usage limit
    const usageLimit = await checkUsageLimit(user.id);
    if (!usageLimit.canUpload) {
      return createErrorResponse({
        code: ErrorCode.API_RATE_LIMIT,
        message: `User ${user.id} has exceeded upload limit`,
        userMessage: `You've reached your limit of 5 scans this month. Your limit resets on ${usageLimit.resetDate.toLocaleDateString()}.`,
        recoverable: false,
      }, 0);
    }

    // Verify user has enough scans remaining for this batch
    if (filesData.length > usageLimit.scansRemaining) {
      return createErrorResponse({
        code: ErrorCode.API_RATE_LIMIT,
        message: `Batch size (${filesData.length}) exceeds remaining limit (${usageLimit.scansRemaining})`,
        userMessage: `This batch contains ${filesData.length} scans but you only have ${usageLimit.scansRemaining} remaining. Your limit resets on ${usageLimit.resetDate.toLocaleDateString()}.`,
        recoverable: false,
      }, 0);
    }

    // Validate files
    if (!filesData || filesData.length === 0) {
      return createErrorResponse({
        code: ErrorCode.INVALID_FILE_TYPE,
        message: 'No files provided',
        userMessage: 'Please select at least one file to upload.',
        recoverable: true,
      }, 0);
    }

    // Initialize Supabase client for storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return createErrorResponse({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Missing Supabase configuration',
        userMessage: 'Our server is not properly configured. Please contact support.',
        recoverable: false,
      }, 0);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process each file: extract/assign dates
    const filesWithMetadata: Array<{
      name: string;
      buffer: ArrayBuffer;
      isDicom: boolean;
      scanDate: Date;
      index: number;
    }> = [];

    const filesWithoutDates: Array<{ name: string; index: number }> = [];

    for (let i = 0; i < filesData.length; i++) {
      const file = filesData[i];
      let scanDate: Date | null = null;

      try {
        // Try to extract scan date from DICOM metadata
        if (file.isDicom) {
          try {
            scanDate = extractScanDateFromDicom(file.buffer);
          } catch (extractError) {
            console.warn(`Could not extract date from ${file.name}:`, extractError);
          }
        }

        // Use user-assigned date if provided
        if (!scanDate && file.scanDate) {
          try {
            scanDate = parseDateFromInput(file.scanDate);
          } catch (parseError) {
            console.warn(`Could not parse date for ${file.name}:`, parseError);
          }
        }

        if (scanDate) {
          filesWithMetadata.push({
            name: file.name,
            buffer: file.buffer,
            isDicom: file.isDicom,
            scanDate,
            index: i,
          });
        } else {
          filesWithoutDates.push({ name: file.name, index: i });
        }
      } catch (fileProcessError) {
        console.error(`Error processing file ${file.name}:`, fileProcessError);
        filesWithoutDates.push({ name: file.name, index: i });
      }
    }

    // If any files missing dates, return them for user assignment
    if (filesWithoutDates.length > 0) {
      return {
        success: false,
        data: {
          scanIds: [],
          filesWithoutDates,
        },
        error: {
          code: ErrorCode.INVALID_API_RESPONSE,
          message: 'Some files are missing scan dates',
          recoverable: true,
        },
      };
    }

    // Sort files chronologically by scan date
    filesWithMetadata.sort((a, b) => a.scanDate.getTime() - b.scanDate.getTime());

    // Upload files and create scan records
    const scanIds: string[] = [];
    const failedFiles: string[] = [];

    for (const file of filesWithMetadata) {
      try {
        // Upload file to storage
        const fileExtension = file.isDicom ? '.dcm' : '.png';
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}${fileExtension}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('scans')
          .upload(filePath, new Uint8Array(file.buffer), {
            contentType: file.isDicom ? 'application/dicom' : 'image/png',
          });

        if (uploadError) {
          const appError = handleError(uploadError, 'uploadBatchScans_storage');
          console.error(`Error uploading ${file.name}:`, appError.message);
          failedFiles.push(file.name);
          continue;
        }

        // Create scan record in database
        try {
          const scan = await createScan({
            user_id: user.id,
            file_url: filePath,
            file_name: file.name,
            file_size: file.buffer.byteLength,
            file_type: file.isDicom ? 'dicom' : 'image',
            scan_date: file.scanDate,
            clinical_context: clinicalContext,
          });

          if (scan && scan.id) {
            scanIds.push(scan.id);
          } else {
            failedFiles.push(file.name);
          }
        } catch (dbError) {
          const appError = handleError(dbError, 'uploadBatchScans_database');
          console.error(`Error creating scan record for ${file.name}:`, appError.message);
          failedFiles.push(file.name);
        }
      } catch (fileError) {
        const appError = handleError(fileError, 'uploadBatchScans_file');
        console.error(`Error processing ${file.name}:`, appError.message);
        failedFiles.push(file.name);
      }
    }

    // Return results
    if (scanIds.length === 0) {
      return createErrorResponse({
        code: ErrorCode.STORAGE_UPLOAD_ERROR,
        message: 'Failed to upload any files',
        userMessage: 'We had trouble uploading your files. Please check your connection and try again.',
        recoverable: true,
      }, 0);
    }

    // Partial success - some files uploaded, some failed
    if (failedFiles.length > 0) {
      console.warn(`Batch upload partial success: ${scanIds.length} files uploaded, ${failedFiles.length} failed`);
    }

    // Track usage for each successfully uploaded scan
    if (scanIds.length > 0) {
      try {
        await trackScanUsage(user.id);
      } catch (trackError) {
        console.error('Error tracking scan usage:', trackError);
        // Don't fail the upload if usage tracking fails
      }
    }

    return {
      success: scanIds.length > 0,
      data: {
        scanIds,
      },
    };
  } catch (error) {
    const appError = handleError(error, 'uploadBatchScans_general');
    return createErrorResponse({
      code: ErrorCode.STORAGE_UPLOAD_ERROR,
      message: appError.message,
      userMessage: appError.userMessage,
      recoverable: true,
    }, 0);
  }
}
