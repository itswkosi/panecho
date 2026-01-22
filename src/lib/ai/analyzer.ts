'use server';

import { openai } from '@/lib/ai/client';
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

    // Build message content with text + images
    const messageContent: any[] = [
      {
        type: 'text',
        text: userPrompt,
      },
    ];

    // Add images with auto detail for faster processing
    // 'auto' is significantly faster than 'high' while still providing good accuracy
    sliceImages.forEach((img, index) => {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${img}`,
          detail: 'auto', // Faster processing than 'high'
        },
      });
    });

    console.log('Calling GPT-5.2 Pro API for analysis...');

    // Call GPT-5.2 Pro with vision
    const response = await openai.chat.completions.create({
      model: 'gpt-5.2-pro',
      max_tokens: 1000, // Reduced for faster response
      temperature: 0.3, // Lower temperature for more consistent medical judgments
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: messageContent,
        },
      ],
    });

    // Extract response content
    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from GPT-4o API.');
    }

    // Parse JSON response
    let parsedResponse: AnalysisResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (err) {
      throw new Error(
        `Failed to parse GPT-4o response as JSON: ${responseContent.substring(0, 200)}...`
      );
    }

    // Validate response structure
    const validatedResponse = validateAnalysisResponse(parsedResponse);

    // Calculate processing time
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    console.log(`Analysis complete. Risk score: ${validatedResponse.risk_score}, Processing time: ${processingTime}s`);

    return {
      ...validatedResponse,
      tokens_used: response.usage?.total_tokens || 0,
      processing_time_seconds: processingTime,
    };
  } catch (error) {
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Enhance error message with context
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('rate limit')) {
      throw new Error(`OpenAI rate limit exceeded: ${errorMessage}`);
    }

    if (errorMessage.includes('API key')) {
      throw new Error(`OpenAI API key error: ${errorMessage}`);
    }

    throw new Error(`Analysis failed after ${processingTime}s: ${errorMessage}`);
  }
}
