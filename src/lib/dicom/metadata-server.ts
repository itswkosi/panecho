import 'server-only';

// Server-only module - DICOM processing
import dcmjs from 'dcmjs';
const { DicomMessage } = (dcmjs as any).data;

/**
 * Extract scan date from DICOM file (server-only)
 * Reads StudyDate (0008,0020) and StudyTime (0008,0030) tags
 * Returns JavaScript Date object or null if metadata missing
 */
export function extractScanDateFromDicom(dicomBuffer: ArrayBuffer): Date | null {
  try {
    const dicomDict = DicomMessage.readFile(new Uint8Array(dicomBuffer));

    if (!dicomDict) {
      return null;
    }

    const dataset = dicomDict.dict;

    // Get Study Date (YYYYMMDD format)
    const studyDate = dataset['00080020']?.Value?.[0]; // Study Date
    // Get Study Time (HHMMSS or HHMMSS.frac format)
    const studyTime = dataset['00080030']?.Value?.[0]; // Study Time

    if (!studyDate) {
      return null;
    }

    // Parse DICOM date format: YYYYMMDD
    const year = parseInt(studyDate.substring(0, 4), 10);
    const month = parseInt(studyDate.substring(4, 6), 10);
    const day = parseInt(studyDate.substring(6, 8), 10);

    // Parse DICOM time format: HHMMSS or HHMMSS.frac
    let hour = 0;
    let minute = 0;
    let second = 0;

    if (studyTime) {
      hour = parseInt(studyTime.substring(0, 2), 10);
      minute = parseInt(studyTime.substring(2, 4), 10);
      second = parseInt(studyTime.substring(4, 6), 10);
    }

    // Validate date values
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Create Date object (month is 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day, hour, minute, second);

    // Verify date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error extracting DICOM metadata:', error);
    return null;
  }
}
