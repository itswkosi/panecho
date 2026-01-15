import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeLongitudinal, getPreviousScansForComparison } from '@/lib/ai/longitudinal';

// Mock OpenAI client
vi.mock('@/lib/ai/client', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

import { openai } from '@/lib/ai/client';

describe('Longitudinal Analysis', () => {
  let mockCreate: any;

  beforeEach(() => {
    mockCreate = vi.fn();
    (openai.chat.completions as any).create = mockCreate;
  });

  describe('analyzeLongitudinal', () => {
    it('should execute 4-step chain successfully with comparison, trajectory, and synthesis', async () => {
      // Mock all three API responses
      const comparisonResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                size_changes: [
                  {
                    finding: 'Main pancreatic duct',
                    direction: 'increased',
                    magnitude: '2mm increase',
                  },
                ],
                new_findings: ['Small cyst adjacent to main duct'],
                resolved_findings: [],
                progression_pattern: 'gradual increase in main duct caliber',
              }),
            },
          },
        ],
        usage: { total_tokens: 450 },
      };

      const trajectoryResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                direction: 'increasing',
                rate: 'moderate',
                clinical_significance: 'Progressive main duct dilation suggesting chronic pancreatitis progression',
                follow_up_recommendation: 'Follow-up imaging in 3 months to assess further progression',
              }),
            },
          },
        ],
        usage: { total_tokens: 350 },
      };

      const synthesisResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                executive_summary:
                  'Progressive findings consistent with chronic pancreatitis with gradual main duct dilation',
                current_assessment:
                  'Main pancreatic duct measuring 4mm with new adjacent cyst, unchanged parenchymal atrophy',
                trajectory_assessment:
                  'Progressive main duct dilation over past 6 months suggests advancing chronic pancreatitis',
                recommendations:
                  'Continue medical management, repeat imaging in 3 months, consider endoscopy if symptoms worsen',
              }),
            },
          },
        ],
        usage: { total_tokens: 520 },
      };

      mockCreate
        .mockResolvedValueOnce(comparisonResponse)
        .mockResolvedValueOnce(trajectoryResponse)
        .mockResolvedValueOnce(synthesisResponse);

      const newAnalysis = {
        classification: 'chronic-pancreatitis',
        risk_score: 45,
        summary: 'Main pancreatic duct dilation with parenchymal atrophy',
        detailed_findings: {},
      };

      const previousAnalyses = [
        {
          id: 'scan-1',
          scan_date: '2024-01-15T10:00:00Z',
          classification: 'chronic-pancreatitis',
          risk_score: 38,
          summary: 'Mild main duct dilation',
          detailed_findings: {
            main_pancreatic_duct: { caliber_mm: 3.5 },
            parenchymal_atrophy: false,
          },
        },
        {
          id: 'scan-2',
          scan_date: '2024-03-15T10:00:00Z',
          classification: 'chronic-pancreatitis',
          risk_score: 42,
          summary: 'Moderate main duct dilation',
          detailed_findings: {
            main_pancreatic_duct: { caliber_mm: 3.8 },
            parenchymal_atrophy: false,
          },
        },
      ];

      const result = await analyzeLongitudinal(newAnalysis, previousAnalyses);

      expect(result.success).toBe(true);
      expect(result.analysis_type).toBe('longitudinal');
      expect(result.compared_scan_ids).toEqual(['scan-1', 'scan-2']);
      expect(result.tokens_used).toBe(1320);
      expect(result.comparison_results.size_changes).toHaveLength(1);
      expect(result.trajectory_results.direction).toBe('increasing');
      expect(result.synthesis_report.executive_summary).toContain('Progressive');
      expect(result.longitudinal_changes.change_detected).toBe(true);
    });

    it('should handle JSON parsing errors in comparison step gracefully', async () => {
      const comparisonResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON response',
            },
          },
        ],
        usage: { total_tokens: 450 },
      };

      const trajectoryResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                direction: 'stable',
                rate: 'static',
                clinical_significance: 'No significant change',
                follow_up_recommendation: 'Routine follow-up',
              }),
            },
          },
        ],
        usage: { total_tokens: 350 },
      };

      const synthesisResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                executive_summary: 'Stable findings',
                current_assessment: 'No acute changes',
                trajectory_assessment: 'Stable course',
                recommendations: 'Continue current management',
              }),
            },
          },
        ],
        usage: { total_tokens: 520 },
      };

      mockCreate
        .mockResolvedValueOnce(comparisonResponse)
        .mockResolvedValueOnce(trajectoryResponse)
        .mockResolvedValueOnce(synthesisResponse);

      const newAnalysis = {
        classification: 'chronic-pancreatitis',
        risk_score: 40,
        summary: 'Stable findings',
        detailed_findings: {},
      };

      const previousAnalyses = [
        {
          id: 'scan-1',
          scan_date: '2024-01-15T10:00:00Z',
          classification: 'chronic-pancreatitis',
          risk_score: 40,
          summary: 'Stable findings',
          detailed_findings: {},
        },
      ];

      const result = await analyzeLongitudinal(newAnalysis, previousAnalyses);

      // Should still succeed with trajectory and synthesis
      expect(result.success).toBe(true);
      expect(result.failed_steps).toContain('comparison');
      expect(result.comparison_results.size_changes).toEqual([]);
      expect(result.trajectory_results.direction).toBe('stable');
    });

    it('should handle API errors in any step gracefully', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('API rate limit exceeded'))
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  direction: 'stable',
                  rate: 'static',
                  clinical_significance: 'Unable to assess due to comparison failure',
                  follow_up_recommendation: 'Retry analysis',
                }),
              },
            },
          ],
          usage: { total_tokens: 350 },
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  executive_summary: 'Analysis incomplete',
                  current_assessment: 'Comparison step failed',
                  trajectory_assessment: 'Unable to determine trajectory',
                  recommendations: 'Retry full analysis',
                }),
              },
            },
          ],
          usage: { total_tokens: 520 },
        });

      const newAnalysis = {
        classification: 'chronic-pancreatitis',
        risk_score: 40,
        summary: 'Test',
        detailed_findings: {},
      };

      const previousAnalyses = [
        {
          id: 'scan-1',
          scan_date: '2024-01-15T10:00:00Z',
          classification: 'normal',
          risk_score: 20,
          summary: 'Normal pancreas',
          detailed_findings: {},
        },
      ];

      const result = await analyzeLongitudinal(newAnalysis, previousAnalyses);

      // Should still succeed (trajectory and synthesis completed)
      expect(result.success).toBe(true);
      expect(result.failed_steps).toContain('comparison');
      expect(typeof result.processing_time_seconds).toBe('number');
      expect(result.processing_time_seconds).toBeGreaterThanOrEqual(0);
    });

    it('should calculate processing time correctly', async () => {
      mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  size_changes: [],
                  new_findings: [],
                  resolved_findings: [],
                  progression_pattern: 'stable',
                }),
              },
            },
          ],
          usage: { total_tokens: 100 },
        });

      const newAnalysis = {
        classification: 'normal',
        risk_score: 10,
        summary: 'Normal pancreas',
        detailed_findings: {},
      };

      const previousAnalyses = [
        {
          id: 'scan-1',
          scan_date: '2024-01-15T10:00:00Z',
          classification: 'normal',
          risk_score: 10,
          summary: 'Normal pancreas',
          detailed_findings: {},
        },
      ];

      const result = await analyzeLongitudinal(newAnalysis, previousAnalyses);

      expect(result.processing_time_seconds).toBeGreaterThanOrEqual(0);
      expect(typeof result.processing_time_seconds).toBe('number');
    });

    it('should accumulate tokens from all three steps', async () => {
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  size_changes: [],
                  new_findings: [],
                  resolved_findings: [],
                  progression_pattern: 'stable',
                }),
              },
            },
          ],
          usage: { total_tokens: 100 },
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  direction: 'stable',
                  rate: 'static',
                  clinical_significance: 'No change',
                  follow_up_recommendation: 'Routine follow-up',
                }),
              },
            },
          ],
          usage: { total_tokens: 150 },
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  executive_summary: 'Stable',
                  current_assessment: 'Normal',
                  trajectory_assessment: 'Stable',
                  recommendations: 'Routine follow-up',
                }),
              },
            },
          ],
          usage: { total_tokens: 200 },
        });

      const newAnalysis = {
        classification: 'normal',
        risk_score: 10,
        summary: 'Normal',
        detailed_findings: {},
      };

      const previousAnalyses = [
        {
          id: 'scan-1',
          scan_date: '2024-01-15T10:00:00Z',
          classification: 'normal',
          risk_score: 10,
          summary: 'Normal',
          detailed_findings: {},
        },
      ];

      const result = await analyzeLongitudinal(newAnalysis, previousAnalyses);

      expect(result.tokens_used).toBe(450); // 100 + 150 + 200
    });

    it('should detect longitudinal changes and populate change_detected flag', async () => {
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  size_changes: [
                    {
                      finding: 'Tumor',
                      direction: 'increased',
                      magnitude: '3cm to 5cm',
                    },
                  ],
                  new_findings: [],
                  resolved_findings: [],
                  progression_pattern: 'rapid growth',
                }),
              },
            },
          ],
          usage: { total_tokens: 100 },
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  direction: 'increasing',
                  rate: 'rapid',
                  clinical_significance: 'Rapidly growing lesion suggesting aggressive biology',
                  follow_up_recommendation: 'Urgent endoscopy and biopsy',
                }),
              },
            },
          ],
          usage: { total_tokens: 150 },
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  executive_summary: 'Rapidly progressive pancreatic lesion',
                  current_assessment: '5cm mass',
                  trajectory_assessment: 'Rapid progression',
                  recommendations: 'Urgent intervention',
                }),
              },
            },
          ],
          usage: { total_tokens: 200 },
        });

      const newAnalysis = {
        classification: 'malignancy-likely',
        risk_score: 95,
        summary: '5cm lesion suspicious for malignancy',
        detailed_findings: {},
      };

      const previousAnalyses = [
        {
          id: 'scan-1',
          scan_date: '2024-01-15T10:00:00Z',
          classification: 'indeterminate',
          risk_score: 55,
          summary: '3cm lesion',
          detailed_findings: {},
        },
      ];

      const result = await analyzeLongitudinal(newAnalysis, previousAnalyses);

      expect(result.longitudinal_changes.change_detected).toBe(true);
      expect(result.longitudinal_changes.progression_rate).toBe('rapid');
      expect(result.longitudinal_changes.clinical_significance).toContain(
        'Rapidly growing lesion'
      );
    });

    it('should handle empty previous analyses gracefully', async () => {
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  size_changes: [],
                  new_findings: [],
                  resolved_findings: [],
                  progression_pattern: 'no prior comparison',
                }),
              },
            },
          ],
          usage: { total_tokens: 100 },
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  direction: 'stable',
                  rate: 'static',
                  clinical_significance: 'Baseline study',
                  follow_up_recommendation: 'Return to clinical care',
                }),
              },
            },
          ],
          usage: { total_tokens: 150 },
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  executive_summary: 'Baseline pancreatic imaging',
                  current_assessment: 'Normal',
                  trajectory_assessment: 'Baseline, no prior studies',
                  recommendations: 'Return to clinical care',
                }),
              },
            },
          ],
          usage: { total_tokens: 200 },
        });

      const newAnalysis = {
        classification: 'normal',
        risk_score: 10,
        summary: 'Normal pancreas',
        detailed_findings: {},
      };

      const result = await analyzeLongitudinal(newAnalysis, []);

      expect(result.success).toBe(true);
      expect(result.compared_scan_ids).toEqual([]);
      expect(result.synthesis_report.trajectory_assessment).toContain('Baseline');
    });
  });

  describe('getPreviousScansForComparison', () => {
    it('should return empty array (placeholder implementation)', async () => {
      const result = await getPreviousScansForComparison('user-1', new Date(), 3);
      expect(result).toEqual([]);
    });

    it('should accept up to 3 scans as max count', async () => {
      const result = await getPreviousScansForComparison('user-1', new Date(), 3);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle errors gracefully', async () => {
      const result = await getPreviousScansForComparison('invalid-user', new Date(), 3);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
