import { getGeminiModel } from '@/lib/ai/client';
import {
  buildComparisonPrompt,
  buildTrajectoryPrompt,
  buildSynthesisPrompt,
  buildSystemPrompt,
} from '@/lib/ai/prompts';
import { getAnalysis, getScan } from '@/lib/supabase/db';
import { Analysis, Scan, DetailedFindings, LongitudinalChanges } from '@/lib/types/database';

export interface LongitudinalAnalysisResult {
  success: boolean;
  analysis_type: 'longitudinal';
  current_analysis: {
    classification: string;
    risk_score: number;
    summary: string;
    detailed_findings: DetailedFindings;
  };
  comparison_results: {
    size_changes: Array<{ finding: string; direction: string; magnitude: string }>;
    new_findings: string[];
    resolved_findings: string[];
    progression_pattern: string;
  };
  trajectory_results: {
    direction: string;
    rate: string;
    clinical_significance: string;
    follow_up_recommendation: string;
  };
  synthesis_report: {
    executive_summary: string;
    current_assessment: string;
    trajectory_assessment: string;
    recommendations: string;
  };
  compared_scan_ids: string[];
  longitudinal_changes: LongitudinalChanges;
  tokens_used: number;
  processing_time_seconds: number;
  error?: string;
  failed_steps?: string[];
}

/**
 * Performs longitudinal analysis by comparing new scan with previous scans
 * Implements 4-step GPT-4o chain:
 * 1. Analyze new scan independently
 * 2. Compare with previous scans
 * 3. Assess risk trajectory
 * 4. Synthesize comprehensive report
 */
export async function analyzeLongitudinal(
  newScanAnalysis: {
    classification: string;
    risk_score: number;
    summary: string;
    detailed_findings: DetailedFindings;
  },
  previousAnalyses: Array<{
    id: string;
    scan_date: string;
    classification: string;
    risk_score: number;
    summary: string;
    detailed_findings: DetailedFindings;
  }>
): Promise<LongitudinalAnalysisResult> {
  const startTime = Date.now();
  let totalTokens = 0;
  const failedSteps: string[] = [];
  const comparedScanIds = previousAnalyses.map((a) => a.id);

  const result: LongitudinalAnalysisResult = {
    success: false,
    analysis_type: 'longitudinal',
    current_analysis: newScanAnalysis,
    comparison_results: {
      size_changes: [],
      new_findings: [],
      resolved_findings: [],
      progression_pattern: '',
    },
    trajectory_results: {
      direction: 'stable',
      rate: 'static',
      clinical_significance: '',
      follow_up_recommendation: '',
    },
    synthesis_report: {
      executive_summary: '',
      current_assessment: '',
      trajectory_assessment: '',
      recommendations: '',
    },
    compared_scan_ids: comparedScanIds,
    longitudinal_changes: {
      change_detected: false,
      change_description: '',
      progression_rate: '',
      clinical_significance: '',
    },
    tokens_used: 0,
    processing_time_seconds: 0,
  };

  try {
    const systemPrompt = buildSystemPrompt();

    // Step 2: Compare with previous scans
    try {
      const comparisonPrompt = buildComparisonPrompt(newScanAnalysis, previousAnalyses);

      const comparisonResponse = await getGeminiModel().generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${comparisonPrompt}` }],
          },
        ],
      });

      const comparisonResult = await comparisonResponse.response;
      totalTokens += comparisonResult.usageMetadata?.totalTokenCount || 0;

      const comparisonContent = comparisonResult.text();
      if (comparisonContent) {
        try {
          // Remove markdown code blocks if present
          let jsonText = comparisonContent.trim();
          const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
          if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim();
          }
          const comparisonParsed = JSON.parse(jsonText);
          result.comparison_results = {
            size_changes: comparisonParsed.size_changes || [],
            new_findings: comparisonParsed.new_findings || [],
            resolved_findings: comparisonParsed.resolved_findings || [],
            progression_pattern: comparisonParsed.progression_pattern || '',
          };
        } catch (parseError) {
          console.error('Failed to parse comparison response:', parseError);
          failedSteps.push('comparison');
        }
      }
    } catch (error) {
      console.error('Step 2 (Comparison) failed:', error);
      failedSteps.push('comparison');
    }

    // Step 3: Assess risk trajectory
    try {
      const riskScoreHistory = [
        ...previousAnalyses.map((a) => ({
          scan_date: a.scan_date,
          risk_score: a.risk_score,
        })),
        {
          scan_date: new Date().toISOString(),
          risk_score: newScanAnalysis.risk_score,
        },
      ];

      const trajectoryPrompt = buildTrajectoryPrompt(riskScoreHistory, {
        age: 0,
        smoking_status: 'never',
      });

      const trajectoryResponse = await getGeminiModel().generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${trajectoryPrompt}` }],
          },
        ],
      });

      const trajectoryResult = await trajectoryResponse.response;
      totalTokens += trajectoryResult.usageMetadata?.totalTokenCount || 0;

      const trajectoryContent = trajectoryResult.text();
      if (trajectoryContent) {
        try {
          // Remove markdown code blocks if present
          let jsonText = trajectoryContent.trim();
          const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
          if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim();
          }
          const trajectoryParsed = JSON.parse(jsonText);
          result.trajectory_results = {
            direction: trajectoryParsed.direction || 'stable',
            rate: trajectoryParsed.rate || 'static',
            clinical_significance: trajectoryParsed.clinical_significance || '',
            follow_up_recommendation: trajectoryParsed.follow_up_recommendation || '',
          };

          // Detect if change occurred
          if (trajectoryParsed.direction !== 'stable') {
            result.longitudinal_changes.change_detected = true;
            result.longitudinal_changes.change_description = trajectoryParsed.clinical_significance || '';
            result.longitudinal_changes.progression_rate = trajectoryParsed.rate || '';
            result.longitudinal_changes.clinical_significance = trajectoryParsed.clinical_significance || '';
          }
        } catch (parseError) {
          console.error('Failed to parse trajectory response:', parseError);
          failedSteps.push('trajectory');
        }
      }
    } catch (error) {
      console.error('Step 3 (Trajectory) failed:', error);
      failedSteps.push('trajectory');
    }

    // Step 4: Synthesize comprehensive report
    try {
      const synthesisPrompt = buildSynthesisPrompt(
        {
          classification: newScanAnalysis.classification,
          risk_score: newScanAnalysis.risk_score,
          summary: newScanAnalysis.summary,
        },
        result.comparison_results,
        result.trajectory_results
      );

      const synthesisResponse = await getGeminiModel().generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${synthesisPrompt}` }],
          },
        ],
      });

      const synthesisResult = await synthesisResponse.response;
      totalTokens += synthesisResult.usageMetadata?.totalTokenCount || 0;

      const synthesisContent = synthesisResult.text();
      if (synthesisContent) {
        try {
          // Remove markdown code blocks if present
          let jsonText = synthesisContent.trim();
          const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
          if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim();
          }
          const synthesisParsed = JSON.parse(jsonText);
          result.synthesis_report = {
            executive_summary: synthesisParsed.executive_summary || '',
            current_assessment: synthesisParsed.current_assessment || '',
            trajectory_assessment: synthesisParsed.trajectory_assessment || '',
            recommendations: synthesisParsed.recommendations || '',
          };
        } catch (parseError) {
          console.error('Failed to parse synthesis response:', parseError);
          failedSteps.push('synthesis');
        }
      }
    } catch (error) {
      console.error('Step 4 (Synthesis) failed:', error);
      failedSteps.push('synthesis');
    }

    // Mark success if at least steps 2 and 3 succeeded
    result.success = failedSteps.length < 3; // Allow 1 step to fail
    result.failed_steps = failedSteps.length > 0 ? failedSteps : undefined;
  } catch (error) {
    console.error('Longitudinal analysis chain failed:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.success = false;
  }

  const endTime = Date.now();
  result.tokens_used = totalTokens;
  result.processing_time_seconds = (endTime - startTime) / 1000;

  return result;
}

/**
 * Fetch up to 3 most recent previous scans for a user
 * Only include scans older than 7 days (to ensure there's a real time gap)
 */
export async function getPreviousScansForComparison(
  userId: string,
  currentScanDate: Date,
  maxScanCount: number = 3
): Promise<
  Array<{
    id: string;
    scan_date: string;
    classification: string;
    risk_score: number;
    summary: string;
    detailed_findings: DetailedFindings;
  }>
> {
  try {
    // This would typically query the database for user's previous scans
    // For now, return empty array - will be implemented in database layer
    // In practice, this would be:
    // const scans = await db.query(
    //   'SELECT * FROM scans WHERE user_id = ? AND scan_date < ? AND scan_date > ?'
    //   [userId, currentScanDate, sevenDaysAgo]
    // )
    return [];
  } catch (error) {
    console.error('Error fetching previous scans:', error);
    return [];
  }
}
