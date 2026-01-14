import { ClinicalContext } from '@/lib/types/database';

export function buildSystemPrompt(): string {
  return `You are an expert radiologist AI assistant specializing in pancreatic cancer screening and CT imaging analysis. Your role is to analyze CT scan images and provide clinical assessment for pancreatic pathology detection.

Your analysis should be thorough, evidence-based, and consider:
- Pancreatic parenchymal appearance and homogeneity
- Ductal system features
- Vascular involvement
- Presence of mass lesions or focal abnormalities
- Signs of acute or chronic pancreatitis
- Fat stranding or surrounding tissue changes

Provide your assessment in a structured JSON format with clear classifications and quantified risk assessment. Be conservative in your risk scoring - only classify as "suspicious" when there is reasonable imaging evidence of potential malignancy.

Always consider patient age, clinical context, and typical imaging patterns for benign vs. malignant pathology.`;
}

export function buildUserPrompt(clinicalContext: ClinicalContext): string {
  const ageInfo = clinicalContext.age ? `Patient age: ${clinicalContext.age} years` : 'Patient age: Not provided';
  const symptomsInfo = clinicalContext.symptoms?.length
    ? `Reported symptoms: ${clinicalContext.symptoms.join(', ')}`
    : 'No specific symptoms reported';
  const familyHistoryInfo = clinicalContext.family_history
    ? 'Family history of pancreatic cancer: Yes'
    : 'Family history of pancreatic cancer: No';
  const smokingInfo = clinicalContext.smoking_status
    ? `Smoking status: ${clinicalContext.smoking_status}`
    : 'Smoking status: Unknown';

  return `Please analyze the provided pancreatic CT scan images and provide a detailed assessment.

Clinical Context:
- ${ageInfo}
- ${symptomsInfo}
- ${familyHistoryInfo}
- ${smokingInfo}

Analyze all provided slices (showing different anatomical levels through the pancreas) and provide:

1. Classification: Either "normal" (benign findings) or "suspicious" (concerning for malignancy)
2. Risk Score: A percentage from 0-100 where:
   - 0-29: Normal finding, very low malignancy risk
   - 30-49: Borderline findings, warrant follow-up
   - 50-100: Suspicious for malignancy, requires clinical correlation and possible further workup

3. Summary: A brief clinical summary (50-200 words) describing your findings

4. Detailed Findings:
   - Radiomic Features: List of observed imaging features (e.g., "hypodense region in pancreatic head", "ductal dilation", "normal homogeneous parenchyma")
   - Areas of Concern: Specific regions or findings that influenced the risk score
   - Measurements: Any relevant measurements (if apparent size or location)

5. Clinical Reasoning: Brief explanation of how patient age, symptoms, and other clinical context influenced your assessment

Return your response as a valid JSON object. Ensure risk_score is numeric (0-100) and classification is exactly "normal" or "suspicious".`;
}

/**
 * Builds the complete system prompt for initial scan analysis
 */
export function getSystemPrompt(): string {
  return buildSystemPrompt();
}

/**
 * Builds the user prompt with clinical context interpolated
 */
export function getUserPrompt(clinicalContext: ClinicalContext): string {
  return buildUserPrompt(clinicalContext);
}

/**
 * Build comparison prompt for longitudinal analysis step 2
 * Compares new scan with previous scans to identify changes
 */
export function buildComparisonPrompt(
  newScanAnalysis: {
    classification: string;
    risk_score: number;
    summary: string;
    detailed_findings: {
      pancreatic_observations?: string[];
      risk_factors_identified?: string[];
      recommendations?: string[];
    };
  },
  previousAnalyses: Array<{
    scan_date: string;
    classification: string;
    risk_score: number;
    summary: string;
    detailed_findings: {
      pancreatic_observations?: string[];
      risk_factors_identified?: string[];
      recommendations?: string[];
    };
  }>
): string {
  const previousScansSummary = previousAnalyses
    .map(
      (analysis, idx) =>
        `Previous Scan ${idx + 1} (${new Date(analysis.scan_date).toLocaleDateString()}):
- Classification: ${analysis.classification}
- Risk Score: ${analysis.risk_score}%
- Summary: ${analysis.summary}
- Key Observations: ${(analysis.detailed_findings.pancreatic_observations || []).slice(0, 3).join('; ')}`
    )
    .join('\n\n');

  return `You are comparing a new pancreatic CT scan analysis with previous analyses to identify temporal changes and progression patterns.

NEW SCAN ANALYSIS:
Classification: ${newScanAnalysis.classification}
Risk Score: ${newScanAnalysis.risk_score}%
Summary: ${newScanAnalysis.summary}
Key Observations: ${(newScanAnalysis.detailed_findings.pancreatic_observations || []).join('; ')}

PREVIOUS SCANS:
${previousScansSummary}

Please analyze the changes between scans and identify:

1. Size Changes: Have any lesions grown, shrunk, or remained stable? Quantify if possible.
2. New Findings: What new imaging features or abnormalities appear in the current scan?
3. Resolved Findings: What previously observed findings are no longer present or have improved?
4. Progression Pattern: Is there a pattern of change (e.g., slow growth, rapid change, improvement)?

Return your response as a valid JSON object with the following structure:
{
  "size_changes": [{"finding": "description", "direction": "increased/decreased/stable", "magnitude": "mild/moderate/significant"}],
  "new_findings": ["finding 1", "finding 2"],
  "resolved_findings": ["finding 1", "finding 2"],
  "progression_pattern": "description of overall temporal pattern"
}`;
}

/**
 * Build trajectory prompt for longitudinal analysis step 3
 * Assesses risk trajectory based on multiple scan timeline
 */
export function buildTrajectoryPrompt(
  riskScoreHistory: Array<{
    scan_date: string;
    risk_score: number;
  }>,
  clinicalContext: ClinicalContext
): string {
  const timelineStr = riskScoreHistory
    .map((entry) => `${new Date(entry.scan_date).toLocaleDateString()}: ${entry.risk_score}%`)
    .join('\n');

  const ageInfo = clinicalContext.age ? `Patient age: ${clinicalContext.age} years` : '';

  return `You are assessing the risk trajectory (temporal trend) of pancreatic findings across multiple CT scans.

RISK SCORE TIMELINE:
${timelineStr}

CLINICAL CONTEXT:
${ageInfo}

Based on this timeline, assess:

1. Direction: Is the risk trajectory INCREASING, DECREASING, or STABLE?
2. Rate: How fast is the change occurring? (rapid, moderate, slow)
3. Clinical Significance: How clinically meaningful is the observed trajectory?
   - For INCREASING: Suggests progression, may warrant more frequent follow-up or intervention
   - For DECREASING: Suggests improvement, reassuring pattern
   - For STABLE: No significant change, continue routine surveillance

Return your response as a valid JSON object:
{
  "direction": "increasing|decreasing|stable",
  "rate": "rapid|moderate|slow|static",
  "clinical_significance": "description of what this trajectory means clinically",
  "follow_up_recommendation": "suggested follow-up timing or intensity"
}`;
}

/**
 * Build synthesis prompt for longitudinal analysis step 4
 * Creates comprehensive report synthesizing all analysis steps
 */
export function buildSynthesisPrompt(
  initialAnalysis: {
    classification: string;
    risk_score: number;
    summary: string;
  },
  comparisonResults: {
    size_changes: Array<{ finding: string; direction: string; magnitude: string }>;
    new_findings: string[];
    resolved_findings: string[];
    progression_pattern: string;
  },
  trajectoryResults: {
    direction: string;
    rate: string;
    clinical_significance: string;
    follow_up_recommendation: string;
  }
): string {
  return `You are synthesizing a comprehensive longitudinal analysis report for a patient with serial pancreatic CT scans.

CURRENT SCAN ASSESSMENT:
- Classification: ${initialAnalysis.classification}
- Risk Score: ${initialAnalysis.risk_score}%
- Summary: ${initialAnalysis.summary}

COMPARISON WITH PREVIOUS SCANS:
- Size Changes: ${comparisonResults.size_changes.map((c) => `${c.finding} (${c.direction})`).join('; ')}
- New Findings: ${comparisonResults.new_findings.join('; ') || 'None'}
- Resolved Findings: ${comparisonResults.resolved_findings.join('; ') || 'None'}
- Overall Pattern: ${comparisonResults.progression_pattern}

RISK TRAJECTORY:
- Direction: ${trajectoryResults.direction}
- Rate: ${trajectoryResults.rate}
- Clinical Significance: ${trajectoryResults.clinical_significance}
- Recommended Follow-up: ${trajectoryResults.follow_up_recommendation}

Please synthesize this information into a comprehensive report that includes:

1. Executive Summary: 1-2 sentence overview of current status and trajectory
2. Current Assessment: What do the current findings mean in light of prior studies?
3. Trajectory Assessment: Is the patient improving, worsening, or stable? What does this trend mean?
4. Clinical Recommendations: What should be done next? (follow-up interval, additional imaging, clinical consultation)

Return your response as a valid JSON object:
{
  "executive_summary": "brief overview",
  "current_assessment": "detailed assessment of current findings",
  "trajectory_assessment": "interpretation of temporal trend",
  "recommendations": "clinical recommendations for next steps"
}`;
}

