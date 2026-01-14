import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeInitialScan } from '@/lib/ai/analyzer';
import { openai } from '@/lib/ai/client';

vi.mock('@/lib/ai/client');
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

describe('AI Analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Analysis Responses', () => {
    it('returns valid analysis structure for normal scan', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: 25,
        summary: 'No suspicious findings detected in the pancreatic region. The pancreas appears homogeneous with normal size and enhancement pattern.',
        detailed_findings: {
          radiomic_features: ['Normal tissue density', 'Homogeneous parenchyma'],
          areas_of_concern: [],
          measurements: ['Pancreatic head: 28mm', 'Pancreatic body: 22mm'],
        },
        clinical_reasoning:
          'Given patient age (55) and lack of specific symptoms, normal imaging findings support benign assessment.',
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
        usage: { total_tokens: 1500 },
      } as any);

      // Mock fetch for image download
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      const result = await analyzeInitialScan(
        ['https://example.com/slice1.png'],
        { age: 55 }
      );

      expect(result.classification).toBe('normal');
      expect(result.risk_score).toBe(25);
      expect(result.summary).toContain('No suspicious findings');
      expect(result.tokens_used).toBe(1500);
      expect(result.processing_time_seconds).toBeGreaterThanOrEqual(0);
    });

    it('returns valid analysis structure for suspicious scan', async () => {
      const mockResponse = {
        classification: 'suspicious',
        risk_score: 78,
        summary:
          'Concerning findings identified in the pancreatic head region. A hypodense mass measuring approximately 25mm with associated ductal dilatation is present.',
        detailed_findings: {
          radiomic_features: [
            'Hypodense lesion in pancreatic head',
            'Ductal dilatation (>3mm)',
            'Loss of fat plane',
          ],
          areas_of_concern: ['Pancreatic head', 'Main pancreatic duct'],
          measurements: ['Lesion size: 25mm', 'Duct diameter: 4mm'],
        },
        clinical_reasoning:
          'Age 62 with jaundice and elevated liver enzymes. Imaging findings concerning for malignancy.',
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
        usage: { total_tokens: 1800 },
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      const result = await analyzeInitialScan(
        ['https://example.com/slice1.png', 'https://example.com/slice2.png'],
        { age: 62, symptoms: ['jaundice'] }
      );

      expect(result.classification).toBe('suspicious');
      expect(result.risk_score).toBe(78);
      expect(result.summary).toContain('Concerning findings');
      expect((result.detailed_findings as any).areas_of_concern).toContain('Pancreatic head');
    });

    it('handles multiple slices correctly', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: 18,
        summary: 'All slices reviewed show normal pancreatic anatomy.',
        detailed_findings: {
          radiomic_features: ['Normal throughout series'],
          areas_of_concern: [],
        },
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        usage: { total_tokens: 2000 },
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      const sliceUrls = Array(8)
        .fill(null)
        .map((_, i) => `https://example.com/slice${i + 1}.png`);

      const result = await analyzeInitialScan(sliceUrls, { age: 50 });

      expect(result.classification).toBe('normal');
      expect(vi.mocked(global.fetch).mock.calls).toHaveLength(8);
    });
  });

  describe('Validation & Error Handling', () => {
    it('throws error for empty slice URLs', async () => {
      await expect(analyzeInitialScan([], { age: 55 })).rejects.toThrow(
        /At least one slice URL/i
      );
    });

    it('validates risk score is 0-100', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: 150, // Invalid - exceeds 100
        summary: 'Test summary',
        detailed_findings: {},
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/risk score.*between 0 and 100/i);
    });

    it('validates risk score cannot be negative', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: -10, // Invalid
        summary: 'Test summary',
        detailed_findings: {},
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/risk score/i);
    });

    it('validates classification is "normal" or "suspicious"', async () => {
      const mockResponse = {
        classification: 'inconclusive', // Invalid
        risk_score: 45,
        summary: 'Test summary',
        detailed_findings: {},
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/Invalid classification/i);
    });

    it('auto-corrects classification based on risk score', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: 45, // Should be "suspicious" (≥30)
        summary: 'Test summary',
        detailed_findings: {
          radiomic_features: ['Some abnormality'],
          areas_of_concern: ['Pancreatic head'],
        },
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        usage: { total_tokens: 1500 },
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      const result = await analyzeInitialScan(
        ['https://example.com/slice1.png'],
        { age: 55 }
      );

      // Should auto-correct to "suspicious"
      expect(result.classification).toBe('suspicious');
      expect(result.risk_score).toBe(45);
    });

    it('validates summary has minimum length', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: 25,
        summary: 'Short', // Too short
        detailed_findings: {},
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/Summary must be/i);
    });

    it('validates detailed_findings is an object', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: 25,
        summary: 'Valid summary with sufficient content',
        detailed_findings: null, // Invalid
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/Detailed findings must be/i);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      vi.mocked(openai.chat.completions.create).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/rate limit/i);
    });

    it('handles invalid JSON responses', async () => {
      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Not valid JSON at all',
            },
          },
        ],
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/Failed to parse.*JSON/i);
    });

    it('handles empty API response', async () => {
      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [
          {
            message: {
              content: '', // Empty
            },
          },
        ],
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/Empty response/i);
    });

    it('handles missing API key error', async () => {
      vi.mocked(openai.chat.completions.create).mockRejectedValue(
        new Error('API key not found')
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        analyzeInitialScan(['https://example.com/slice1.png'], { age: 55 })
      ).rejects.toThrow(/API key/i);
    });

    it('handles image fetch failures', async () => {
      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: '{}' } }],
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(
        analyzeInitialScan(['https://example.com/missing.png'], { age: 55 })
      ).rejects.toThrow(/Failed to fetch image/i);
    });
  });

  describe('Risk Score Classification', () => {
    it('classifies 0-29 as normal', async () => {
      const testCases = [0, 1, 15, 29];

      for (const score of testCases) {
        const mockResponse = {
          classification: 'normal',
          risk_score: score,
          summary: 'Test summary for classification validation',
          detailed_findings: {},
        };

        vi.mocked(openai.chat.completions.create).mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
          usage: { total_tokens: 1000 },
        } as any);

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        const result = await analyzeInitialScan(
          ['https://example.com/slice1.png'],
          { age: 55 }
        );

        expect(result.classification).toBe('normal');
      }
    });

    it('classifies 30-100 as suspicious', async () => {
      const testCases = [30, 50, 75, 100];

      for (const score of testCases) {
        const mockResponse = {
          classification: score < 30 ? 'normal' : 'suspicious',
          risk_score: score,
          summary: 'Test summary for classification validation',
          detailed_findings: {
            radiomic_features: score >= 30 ? ['Abnormal finding'] : [],
            areas_of_concern: [],
          },
        };

        vi.mocked(openai.chat.completions.create).mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
          usage: { total_tokens: 1000 },
        } as any);

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        const result = await analyzeInitialScan(
          ['https://example.com/slice1.png'],
          { age: 55 }
        );

        expect(result.classification).toBe('suspicious');
      }
    });
  });

  describe('Token Usage Tracking', () => {
    it('logs token usage from API response', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: 25,
        summary: 'Test summary with sufficient length here',
        detailed_findings: {},
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        usage: { total_tokens: 2345 },
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      const result = await analyzeInitialScan(
        ['https://example.com/slice1.png'],
        { age: 55 }
      );

      expect(result.tokens_used).toBe(2345);
    });

    it('returns processing time in seconds', async () => {
      const mockResponse = {
        classification: 'normal',
        risk_score: 25,
        summary: 'Test summary with sufficient length content',
        detailed_findings: {},
      };

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        usage: { total_tokens: 1000 },
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      const result = await analyzeInitialScan(
        ['https://example.com/slice1.png'],
        { age: 55 }
      );

      expect(result.processing_time_seconds).toBeGreaterThanOrEqual(0);
      expect(typeof result.processing_time_seconds).toBe('number');
    });
  });
});
