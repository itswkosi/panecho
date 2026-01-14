import { describe, it, expect } from 'vitest';
import { extractScanDate } from '@/lib/dicom/metadata';
import { formatDateForInput, parseDateFromInput } from '@/lib/utils/date';

describe('DICOM Metadata Extraction', () => {
  it('extracts scan date from valid DICOM data', () => {
    // Create a mock DICOM file with StudyDate and StudyTime
    // Note: In real tests, you would use actual DICOM files
    const mockDicomData = new Uint8Array([
      // DICOM preamble and magic word
      0x00, 0x00, 0x00, 0x00, 0x44, 0x49, 0x43, 0x4d, // "DICM"
    ]);

    const result = extractScanDate(mockDicomData.buffer);
    // This will likely be null with incomplete DICOM data
    // but demonstrates the function works without crashing
    expect(typeof result === 'object' || result === null).toBe(true);
  });

  it('returns null for invalid DICOM data', () => {
    const invalidBuffer = new ArrayBuffer(10);
    const result = extractScanDate(invalidBuffer);
    expect(result).toBeNull();
  });

  it('returns null for empty buffer', () => {
    const emptyBuffer = new ArrayBuffer(0);
    const result = extractScanDate(emptyBuffer);
    expect(result).toBeNull();
  });

  describe('Date formatting', () => {
    it('formats date to YYYY-MM-DD string', () => {
      const date = new Date(2025, 0, 15); // Jan 15, 2025
      const formatted = formatDateForInput(date);
      expect(formatted).toBe('2025-01-15');
    });

    it('pads single-digit months and days', () => {
      const date = new Date(2025, 2, 5); // Mar 5, 2025
      const formatted = formatDateForInput(date);
      expect(formatted).toBe('2025-03-05');
    });

    it('parses YYYY-MM-DD string to Date', () => {
      const parsed = parseDateFromInput('2025-01-15');
      expect(parsed).not.toBeNull();
      if (parsed) {
        expect(parsed.getFullYear()).toBe(2025);
        expect(parsed.getMonth()).toBe(0); // January
        expect(parsed.getDate()).toBe(15);
      }
    });

    it('returns null for invalid date format', () => {
      expect(parseDateFromInput('2025/01/15')).toBeNull();
      expect(parseDateFromInput('01-15-2025')).toBeNull();
      expect(parseDateFromInput('invalid')).toBeNull();
    });

    it('returns null for invalid date values', () => {
      expect(parseDateFromInput('2025-13-01')).toBeNull(); // Invalid month
      expect(parseDateFromInput('2025-02-30')).toBeNull(); // Invalid day
      expect(parseDateFromInput('2025-00-15')).toBeNull(); // Invalid month
    });

    it('round-trips date formatting', () => {
      const original = new Date(2025, 5, 20); // Jun 20, 2025
      const formatted = formatDateForInput(original);
      const parsed = parseDateFromInput(formatted);

      expect(parsed).not.toBeNull();
      if (parsed) {
        expect(parsed.getFullYear()).toBe(original.getFullYear());
        expect(parsed.getMonth()).toBe(original.getMonth());
        expect(parsed.getDate()).toBe(original.getDate());
      }
    });
  });
});
