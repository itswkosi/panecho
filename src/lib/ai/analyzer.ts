'use server';

import { geminiVision } from '@/lib/ai/client';
import { getSystemPrompt, getUserPrompt } from '@/lib/ai/prompts';
import { ClinicalContext, DetailedFindings } from '@/lib/types/database';

export interface AnalysisResponse {
  classification: 'normal' | 'suspicious';
  risk_score: number;
  summary: string;
  detailed_findings: DetailedFindings;
  clinical_reasoning?: string;
}

export interface AnalysisResult {
  classification: 'normal' | 'suspicious';
  risk_score: number;
  summary: string;
  detailed_findings: DetailedFindings;
  clinical_reasoning?: string;
  tokens_used: number;
  processing_time_seconds: number;
}

/**
 * Validates the analysis response from GPT-4o
 * @throws Error if validation fails
 */
function validateAnalysisResponse(data: any): AnalysisResponse {
  // Validate classification
  if (!['normal', 'suspicious'].includes(data.classification)) {
    throw new Error(
      `Invalid classification: ${data.classification}. Must be 'normal' or 'suspicious'.`
    );
  }

  // Validate risk score
  if (typeof data.risk_score !== 'number' || data.risk_score < 0 || data.risk_score > 100) {
    throw new Error(
      `Invalid risk score: ${data.risk_score}. Must be a number between 0 and 100.`
    );
  }

  // Validate summary
  if (typeof data.summary !== 'string' || data.summary.length < 10) {
    throw new Error('Summary must be a string with at least 10 characters.');
  }

  // Validate detailed findings
  if (typeof data.detailed_findings !== 'object' || data.detailed_findings === null) {
    throw new Error('Detailed findings must be a valid object.');
  }

  // Auto-correct classification based on risk score if needed
  const expectedClassification = data.risk_score < 30 ? 'normal' : 'suspicious';
  if (data.classification !== expectedClassification) {
    console.warn(
      `Classification mismatch: risk_score ${data.risk_score} suggests "${expectedClassification}" but got "${data.classification}". Auto-correcting.`
    );
    data.classification = expectedClassification;
  }

  return {
    classification: data.classification,
    risk_score: data.risk_score,
    summary: data.summary,
    detailed_findings: data.detailed_findings,
    clinical_reasoning: data.clinical_reasoning,
  };
}

/**
 * Fetches an image from URL and converts to base64
 * @param url - Image URL
 * @returns Base64 encoded image
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log(`Fetching image: ${url.substring(0, 100)}... (type: ${contentType})`);

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error(`Empty image file from ${url}`);
    }
    
    console.log(`Successfully fetched image: ${buffer.byteLength} bytes`);
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Image fetch timeout after 30s: ${url}`);
    }
    throw error;
  }
}

/**
 * Analyzes initial scan using GPT-4o vision capabilities
 * @param sliceUrls - URLs of PNG slices to analyze
 * @param clinicalContext - Patient clinical context
 * @returns Analysis result with classification and risk score
 */
export async function analyzeInitialScan(
  sliceUrls: string[],
  clinicalContext: ClinicalContext
): Promise<AnalysisResult> {
  if (!sliceUrls || sliceUrls.length === 0) {
    throw new Error('At least one slice URL is required for analysis.');
  }

  const startTime = Date.now();

  try {
    // Fetch and convert images to base64
    console.log(`Fetching ${sliceUrls.length} slice images for analysis...`);
    const sliceImages = await Promise.all(
      sliceUrls.map(url =>
        fetchImageAsBase64(url).catch(err => {
          throw new Error(`Failed to fetch slice image: ${err.message}`);
        })
      )
    );

    // Build prompts
    const systemPrompt = getSystemPrompt();
    const userPrompt = getUserPrompt(clinicalContext);

    // Combine system and user prompts for Gemini
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Build Gemini content parts with text and images
    const parts: any[] = [
      { text: fullPrompt },
    ];

    // Add images as inline data
    sliceImages.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: img, // base64 string without data URL prefix
        },
      });
    });

    console.log('Calling Gemini 2.0 Flash API for analysis...');

    // Call Gemini with vision
    const result = await geminiVision.generateContent({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    // Extract response text
    const response = await result.response;
    const responseText = response.text();
    
    if (!responseText) {
      throw new Error('Empty response from Gemini API.');
    }

    console.log('Gemini response received, parsing JSON...');

    // Parse JSON response - strip markdown code blocks if present
    let parsedResponse: AnalysisResponse;
    try {
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      let jsonText = responseText.trim();
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }
      
      parsedResponse = JSON.parse(jsonText);
    } catch (err) {
      throw new Error(
        `Failed to parse Gemini response as JSON: ${responseText.substring(0, 200)}...`
      );
    }

    // Validate response structure
    const validatedResponse = validateAnalysisResponse(parsedResponse);

    // Calculate processing time
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Get token counts from Gemini
    const promptTokens = response.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = response.usageMetadata?.totalTokenCount || 0;

    console.log(`Analysis complete. Risk score: ${validatedResponse.risk_score}, Processing time: ${processingTime}s, Tokens: ${totalTokens}`);

    return {
      ...validatedResponse,
      tokens_used: totalTokens,
      processing_time_seconds: processingTime,
    };
  } catch (error) {
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Enhance error message with context
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      throw new Error(`Gemini rate limit exceeded: ${errorMessage}`);
    }

    if (errorMessage.includes('API key') || errorMessage.includes('API_KEY')) {
      throw new Error(`Gemini API key error: ${errorMessage}`);
    }

    throw new Error(`Analysis failed after ${processingTime}s: ${errorMessage}`);
  }
}
