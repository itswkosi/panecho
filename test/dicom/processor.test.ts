import { describe, it, expect } from 'vitest';
import { extractKeySlices, DICOMMetadata } from '@/lib/dicom/processor';

describe('DICOM Processing', () => {
  describe('extractKeySlices', () => {
    it('extracts correct number of key slices', () => {
      const metadata: DICOMMetadata = {
        numSlices: 100,
      };

      const sliceIndices = extractKeySlices(metadata, 8);

      expect(sliceIndices).toHaveLength(8);
      // Should be from middle 30-40% (slices 30-70 for 100 total)
      expect(sliceIndices[0]).toBeGreaterThanOrEqual(30);
      expect(sliceIndices[sliceIndices.length - 1]).toBeLessThanOrEqual(70);
    });

    it('returns slices in ascending order', () => {
      const metadata: DICOMMetadata = {
        numSlices: 100,
      };

      const sliceIndices = extractKeySlices(metadata, 8);

      for (let i = 1; i < sliceIndices.length; i++) {
        expect(sliceIndices[i]).toBeGreaterThanOrEqual(sliceIndices[i - 1]);
      }
    });

    it('handles DICOM with fewer slices than requested', () => {
      const metadata: DICOMMetadata = {
        numSlices: 5,
      };

      const sliceIndices = extractKeySlices(metadata, 8);

      // Should return all available slices
      expect(sliceIndices.length).toBeLessThanOrEqual(5);
    });

    it('handles DICOM with exactly requested slices', () => {
      const metadata: DICOMMetadata = {
        numSlices: 8,
      };

      const sliceIndices = extractKeySlices(metadata, 8);

      expect(sliceIndices.length).toBeLessThanOrEqual(8);
    });

    it('returns empty array for zero slices', () => {
      const metadata: DICOMMetadata = {
        numSlices: 0,
      };

      const sliceIndices = extractKeySlices(metadata, 8);

      expect(sliceIndices).toHaveLength(0);
    });

    it('extracts slices from different ranges', () => {
      // Large dataset
      const metadataLarge: DICOMMetadata = {
        numSlices: 200,
      };
      const slicesLarge = extractKeySlices(metadataLarge, 8);
      expect(slicesLarge[0]).toBeGreaterThanOrEqual(60);
      expect(slicesLarge[slicesLarge.length - 1]).toBeLessThanOrEqual(80);

      // Small dataset
      const metadataSmall: DICOMMetadata = {
        numSlices: 50,
      };
      const slicesSmall = extractKeySlices(metadataSmall, 8);
      expect(slicesSmall.length).toBeGreaterThan(0);
    });

    it('removes duplicate slice indices', () => {
      const metadata: DICOMMetadata = {
        numSlices: 10,
      };

      const sliceIndices = extractKeySlices(metadata, 8);

      // Check for duplicates
      const uniqueSlices = new Set(sliceIndices);
      expect(uniqueSlices.size).toBe(sliceIndices.length);
    });

    it('handles single slice DICOM', () => {
      const metadata: DICOMMetadata = {
        numSlices: 1,
      };

      const sliceIndices = extractKeySlices(metadata, 8);

      expect(sliceIndices).toEqual([0]);
    });

    it('extracts evenly spaced slices', () => {
      const metadata: DICOMMetadata = {
        numSlices: 100,
      };

      const sliceIndices = extractKeySlices(metadata, 8);

      // Check spacing is roughly equal
      const gaps: number[] = [];
      for (let i = 1; i < sliceIndices.length; i++) {
        gaps.push(sliceIndices[i] - sliceIndices[i - 1]);
      }

      // Gaps should be similar (within 5 units for this test)
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      for (const gap of gaps) {
        expect(Math.abs(gap - avgGap)).toBeLessThanOrEqual(5);
      }
    });
  });
});
