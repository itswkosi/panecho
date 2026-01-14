import { DicomMessage } from 'dcmjs';

export interface DICOMMetadata {
  patientAge?: string;
  seriesDescription?: string;
  sliceThickness?: number;
  numSlices: number;
  scanDate?: string;
  patientID?: string;
  modality?: string;
  manufacturer?: string;
}

/**
 * Parse DICOM file and extract metadata
 */
export async function parseDICOM(buffer: ArrayBuffer): Promise<DICOMMetadata> {
  try {
    // Parse DICOM file
    const dicomDict = DicomMessage.readFile(new Uint8Array(buffer));

    if (!dicomDict) {
      throw new Error('Unable to parse DICOM file');
    }

    // Extract metadata from DICOM tags
    const dataset = dicomDict.dict;

    // Get slice information
    let numSlices = 1;
    const instanceNumber = dataset['00200013']?.Value?.[0]; // Instance Number
    const framesData = dataset['00280008']?.Value; // Number of Frames
    
    if (framesData && framesData.length > 0) {
      numSlices = parseInt(framesData[0], 10) || 1;
    }

    // Extract clinical data
    const metadata: DICOMMetadata = {
      numSlices,
      patientAge: dataset['00101010']?.Value?.[0], // Patient Age
      seriesDescription: dataset['0008103E']?.Value?.[0], // Series Description
      sliceThickness: parseFloat(dataset['00180050']?.Value?.[0]) || undefined, // Slice Thickness
      scanDate: dataset['00080020']?.Value?.[0], // Study Date
      patientID: dataset['00100020']?.Value?.[0], // Patient ID
      modality: dataset['00080060']?.Value?.[0], // Modality
      manufacturer: dataset['00080070']?.Value?.[0], // Manufacturer
    };

    return metadata;
  } catch (error) {
    throw new Error(
      `Failed to parse DICOM: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract key slice indices from middle 30-40% of scan (pancreas region)
 */
export function extractKeySlices(
  metadata: DICOMMetadata,
  sliceCount: number = 8
): number[] {
  const numSlices = metadata.numSlices || 0;

  // Need at least some slices
  if (numSlices < 1) {
    return [];
  }

  // If we have fewer slices than requested, return all
  if (numSlices <= sliceCount) {
    return Array.from({ length: numSlices }, (_, i) => i);
  }

  // Calculate middle 30-40% of slices (pancreas region)
  const startPercent = 0.3;
  const endPercent = 0.4;

  const startSlice = Math.floor(numSlices * startPercent);
  const endSlice = Math.ceil(numSlices * endPercent);
  const regionSize = endSlice - startSlice;

  // If region is too small, expand to include more context
  if (regionSize < sliceCount / 2) {
    const expandedStart = Math.max(0, startSlice - Math.floor(sliceCount / 4));
    const expandedEnd = Math.min(
      numSlices,
      endSlice + Math.floor(sliceCount / 4)
    );
    const expandedSize = expandedEnd - expandedStart;

    return Array.from({ length: Math.min(sliceCount, expandedSize) }, (_, i) => {
      const step = expandedSize / Math.min(sliceCount, expandedSize);
      return expandedStart + Math.floor(i * step);
    });
  }

  // Extract evenly spaced slices from the region
  const sliceIndices: number[] = [];
  for (let i = 0; i < sliceCount; i++) {
    const progress = i / (sliceCount - 1);
    const sliceIndex = Math.floor(startSlice + progress * regionSize);
    sliceIndices.push(Math.min(sliceIndex, numSlices - 1));
  }

  // Remove duplicates and sort
  return [...new Set(sliceIndices)].sort((a, b) => a - b);
}

/**
 * Get pixel data from DICOM
 */
export function getPixelData(dicomDict: any): Uint8Array | null {
  try {
    const dataset = dicomDict.dict;

    // Get pixel data
    const pixelDataElement = dataset['7FE00010']; // Pixel Data tag
    if (!pixelDataElement) {
      return null;
    }

    // Handle different pixel data encodings
    if (pixelDataElement.value instanceof Uint8Array) {
      return pixelDataElement.value;
    }

    if (pixelDataElement.Value instanceof Uint8Array) {
      return pixelDataElement.Value;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get image dimensions from DICOM
 */
export function getImageDimensions(dicomDict: any): { width: number; height: number } {
  try {
    const dataset = dicomDict.dict;

    const width = parseInt(dataset['00280011']?.Value?.[0], 10) || 512; // Columns
    const height = parseInt(dataset['00280010']?.Value?.[0], 10) || 512; // Rows

    return { width, height };
  } catch {
    return { width: 512, height: 512 };
  }
}
