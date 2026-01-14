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
