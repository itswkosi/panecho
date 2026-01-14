'use server';

import { DicomMessage } from 'dcmjs';
import { parseDICOM, extractKeySlices, getPixelData, getImageDimensions, DICOMMetadata } from '@/lib/dicom/processor';
import { convertSliceToPNG, optimizeImage } from '@/lib/dicom/converter';
import { uploadFile, deleteFile } from '@/lib/supabase/storage';
import { getUser } from './auth';

export interface ProcessingResult {
  success: boolean;
  scanId?: string;
  metadata?: DICOMMetadata;
  sliceUrls?: string[];
  error?: string;
}

/**
 * Process DICOM file and extract/convert slices
 */
export async function processDICOM(
  fileUrl: string,
  scanId: string
): Promise<ProcessingResult> {
  let uploadedSlices: string[] = [];

  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to process files',
      };
    }

    // Fetch file from Supabase Storage
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to download file from storage',
      };
    }

    const arrayBuffer = await response.arrayBuffer();

    // Check if this is a DICOM file (by magic number)
    const isDICOM = checkDICOMSignature(new Uint8Array(arrayBuffer));

    if (!isDICOM) {
      // Handle non-DICOM files (PNG, JPEG)
      return await processNonDICOMImage(
        Buffer.from(arrayBuffer),
        user.id,
        scanId
      );
    }

    // Parse DICOM file
    let dicomDict: any;
    try {
      dicomDict = DicomMessage.readFile(new Uint8Array(arrayBuffer));
    } catch (error) {
      return {
        success: false,
        error: 'Unable to process DICOM file: Invalid or corrupted format',
      };
    }

    // Extract metadata
    const metadata = await parseDICOM(arrayBuffer);

    // Extract key slices
    const sliceIndices = extractKeySlices(metadata, 8);

    if (sliceIndices.length === 0) {
      return {
        success: false,
        error: 'No valid slices found in DICOM file',
      };
    }

    // Get image dimensions
    const { width, height } = getImageDimensions(dicomDict);

    // Get pixel data
    const pixelData = getPixelData(dicomDict);
    if (!pixelData) {
      return {
        success: false,
        error: 'No pixel data found in DICOM file',
      };
    }

    // Process each slice
    const sliceUrls: string[] = [];
    const bytesPerPixel = pixelData.length / (width * height);

    for (const sliceIndex of sliceIndices) {
      try {
        // Extract slice pixel data
        const sliceStart = sliceIndex * width * height * bytesPerPixel;
        const sliceEnd = sliceStart + width * height * bytesPerPixel;
        const slicePixelData = new Uint8Array(
          pixelData.slice(sliceStart, sliceEnd)
        );

        // Convert to PNG
        const pngBuffer = await convertSliceToPNG(
          slicePixelData,
          width,
          height
        );

        // Upload to Supabase Storage
        const sliceBlob = new Blob([Buffer.from(pngBuffer)], {
          type: 'image/png',
        });
        const sliceFile = new File(
          [sliceBlob],
          `slice_${sliceIndex}.png`,
          { type: 'image/png' }
        );

        const fileName = `slices/slice_${sliceIndex}.png`;
        const sliceUrl = await uploadSliceToStorage(
          user.id,
          scanId,
          sliceFile,
          fileName
        );

        sliceUrls.push(sliceUrl);
      } catch (error) {
        console.error(`Failed to process slice ${sliceIndex}:`, error);
        // Continue processing other slices
      }
    }

    if (sliceUrls.length === 0) {
      return {
        success: false,
        error: 'Failed to process any slices from DICOM file',
      };
    }

    return {
      success: true,
      scanId,
      metadata,
      sliceUrls,
    };
  } catch (error) {
    // Clean up any uploaded slices on error
    for (const sliceUrl of uploadedSlices) {
      try {
        const filePath = new URL(sliceUrl).pathname.split('/').slice(-3).join('/');
        await deleteFile(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process DICOM file',
    };
  }
}

/**
 * Process non-DICOM image files (PNG, JPEG)
 */
async function processNonDICOMImage(
  imageBuffer: Buffer,
  userId: string,
  scanId: string
): Promise<ProcessingResult> {
  try {
    // Optimize image
    const optimizedBuffer = await optimizeImage(imageBuffer);

    // Upload as single slice
    const fileBlob = new Blob([Buffer.from(optimizedBuffer)], {
      type: 'image/png',
    });
    const file = new File([fileBlob], 'image.png', {
      type: 'image/png',
    });

    const sliceUrl = await uploadSliceToStorage(
      userId,
      scanId,
      file,
      'slices/slice_0.png'
    );

    // Return minimal metadata for non-DICOM
    const metadata: DICOMMetadata = {
      numSlices: 1,
      seriesDescription: 'Imported Image',
      modality: 'US', // Unknown modality
    };

    return {
      success: true,
      scanId,
      metadata,
      sliceUrls: [sliceUrl],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image',
    };
  }
}

/**
 * Upload slice file to Supabase Storage
 */
async function uploadSliceToStorage(
  userId: string,
  scanId: string,
  file: File,
  filePath: string
): Promise<string> {
  const supabase = await import('@/lib/supabase/server').then(m => m.createClient());

  const fullPath = `${userId}/${scanId}/${filePath}`;

  const { data, error } = await supabase.storage
    .from('scans')
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload slice: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('scans')
    .getPublicUrl(fullPath);

  if (!publicUrlData.publicUrl) {
    throw new Error('Failed to generate slice URL');
  }

  return publicUrlData.publicUrl;
}

/**
 * Check if file has DICOM signature (magic bytes: 128 bytes offset + "DICM")
 */
function checkDICOMSignature(data: Uint8Array): boolean {
  if (data.length < 132) {
    return false;
  }

  // DICOM files have "DICM" at bytes 128-131
  const signature = String.fromCharCode(
    data[128],
    data[129],
    data[130],
    data[131]
  );

  return signature === 'DICM';
}
