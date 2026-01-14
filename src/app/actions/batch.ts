'use server';

import { createClient } from '@supabase/supabase-js';
import { createScan } from '@/lib/supabase/db';
import { extractScanDateFromDicom } from '@/lib/dicom/metadata-server';
import { parseDateFromInput } from '@/lib/utils/date';
import { getUser } from './auth';
import { ClinicalContext } from '@/lib/types/database';

export interface FileToBatch {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  isDicom: boolean;
  scanDate?: Date; // Auto-extracted for DICOM, or user-assigned
}

export interface BatchUploadResult {
  success: boolean;
  scanIds: string[]; // In chronological order
  error?: string;
  filesWithoutDates?: Array<{ name: string; index: number }>;
}

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
      return {
        success: false,
        scanIds: [],
        error: 'Unauthorized',
      };
    }

    // Initialize Supabase client for storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        scanIds: [],
        error: 'Missing Supabase configuration',
      };
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

      // Try to extract scan date from DICOM metadata
      if (file.isDicom) {
        scanDate = extractScanDateFromDicom(file.buffer);
      }

      // Use user-assigned date if provided
      if (!scanDate && file.scanDate) {
        scanDate = parseDateFromInput(file.scanDate);
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
    }

    // If any files missing dates, return them for user assignment
    if (filesWithoutDates.length > 0) {
      return {
        success: false,
        scanIds: [],
        filesWithoutDates,
        error: 'Some files are missing scan dates',
      };
    }

    // Sort files chronologically by scan date
    filesWithMetadata.sort((a, b) => a.scanDate.getTime() - b.scanDate.getTime());

    // Upload files and create scan records
    const scanIds: string[] = [];

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
          console.error(`Error uploading ${file.name}:`, uploadError);
          continue;
        }

        // Create scan record in database
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
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        continue;
      }
    }

    if (scanIds.length === 0) {
      return {
        success: false,
        scanIds: [],
        error: 'Failed to upload all files',
      };
    }

    return {
      success: true,
      scanIds,
    };
  } catch (error) {
    console.error('Batch upload error:', error);
    return {
      success: false,
      scanIds: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
