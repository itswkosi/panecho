import { describe, it, expect } from 'vitest';
import { validateFileType, validateFileSize } from '@/lib/validation/files';

describe('File Validation', () => {
  describe('validateFileType', () => {
    it('accepts valid DICOM files', () => {
      const dicomFile = new File(['dummy'], 'scan.dcm', {
        type: 'application/dicom',
      });
      expect(validateFileType(dicomFile)).toBe(true);
    });

    it('accepts PNG files', () => {
      const pngFile = new File(['dummy'], 'scan.png', {
        type: 'image/png',
      });
      expect(validateFileType(pngFile)).toBe(true);
    });

    it('accepts JPEG files', () => {
      const jpegFile = new File(['dummy'], 'scan.jpeg', {
        type: 'image/jpeg',
      });
      expect(validateFileType(jpegFile)).toBe(true);
    });

    it('accepts JPG files', () => {
      const jpgFile = new File(['dummy'], 'scan.jpg', {
        type: 'image/jpeg',
      });
      expect(validateFileType(jpgFile)).toBe(true);
    });

    it('rejects invalid file types', () => {
      const txtFile = new File(['dummy'], 'file.txt', {
        type: 'text/plain',
      });
      expect(validateFileType(txtFile)).toBe(false);
    });

    it('rejects PDF files', () => {
      const pdfFile = new File(['dummy'], 'file.pdf', {
        type: 'application/pdf',
      });
      expect(validateFileType(pdfFile)).toBe(false);
    });

    it('rejects files with mismatched extension and MIME type', () => {
      const mismatchFile = new File(['dummy'], 'file.txt', {
        type: 'image/png',
      });
      expect(validateFileType(mismatchFile)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('accepts files under 100MB', () => {
      const smallFile = new File(['x'.repeat(50 * 1024 * 1024)], 'scan.dcm');
      expect(validateFileSize(smallFile, 100)).toBe(true);
    });

    it('accepts files exactly at 100MB', () => {
      const exactFile = new File(['x'.repeat(100 * 1024 * 1024)], 'scan.dcm');
      expect(validateFileSize(exactFile, 100)).toBe(true);
    });

    it('rejects files over 100MB', () => {
      const largeFile = new File(['x'.repeat(150 * 1024 * 1024)], 'scan.dcm');
      expect(validateFileSize(largeFile, 100)).toBe(false);
    });

    it('accepts small files', () => {
      const tinyFile = new File(['small'], 'scan.png');
      expect(validateFileSize(tinyFile, 100)).toBe(true);
    });
  });
});
