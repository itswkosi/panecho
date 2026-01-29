import { GoogleGenerativeAI } from '@google/generative-ai';

// Known-good fallback model that should always be available
const FALLBACK_MODEL = 'gemini-1.5-flash';

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MS = 60 * 1000; // 60 seconds between API calls

interface ModelInfo {
  name: string;
  displayName: string;
  description?: string;
}

interface CachedModels {
  models: ModelInfo[];
  timestamp: number;
}

// In-memory cache and rate limiting
let modelsCache: CachedModels | null = null;
let lastApiCallTimestamp = 0;

/**
 * Lists all available Gemini models for the configured API key
 * Implements caching (5min TTL) and rate limiting (60s between calls)
 */
export async function listAvailableModels(apiKey: string): Promise<ModelInfo[]> {
  const now = Date.now();
  
  // Return cached results if still valid
  if (modelsCache && (now - modelsCache.timestamp) < CACHE_TTL_MS) {
    console.log('[Model Validation] Using cached models list');
    return modelsCache.models;
  }
  
  // Rate limiting: prevent API calls within 60 seconds of last call
  const timeSinceLastCall = now - lastApiCallTimestamp;
  if (timeSinceLastCall < RATE_LIMIT_MS && modelsCache) {
    console.log(`[Model Validation] Rate limited, using cached models (${Math.round(timeSinceLastCall / 1000)}s since last call)`);
    return modelsCache.models;
  }
  
  try {
    console.log('[Model Validation] Fetching available models from Google API...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the listModels method from the SDK
    const models = await genAI.listModels();
    
    const modelList = models.map(model => ({
      name: model.name.replace('models/', ''),
      displayName: model.displayName || model.name,
      description: model.description,
    }));
    
    // Update cache
    modelsCache = {
      models: modelList,
      timestamp: now,
    };
    lastApiCallTimestamp = now;
    
    console.log(`[Model Validation] Successfully fetched ${modelList.length} models`);
    return modelList;
  } catch (error) {
    console.error('[Model Validation] Failed to list available models:', error);
    
    // If we have stale cache, return it as fallback
    if (modelsCache) {
      console.warn('[Model Validation] Using stale cache due to API error');
      return modelsCache.models;
    }
    
    return [];
  }
}

/**
 * Validates that a specific model is available and accessible
 * Returns the model name if valid, or the fallback model if not
 */
export async function validateAndGetModel(
  apiKey: string,
  preferredModel: string
): Promise<{ model: string; isFallback: boolean; availableModels: string[] }> {
  console.log(`[Model Validation] Checking availability of: ${preferredModel}`);
  
  const availableModels = await listAvailableModels(apiKey);
  const modelNames = availableModels.map(m => m.name);
  
  if (modelNames.length === 0) {
    console.warn('[Model Validation] ⚠️  Could not retrieve available models list');
    console.warn(`[Model Validation] Using configured model: ${preferredModel}`);
    return { 
      model: preferredModel, 
      isFallback: false,
      availableModels: []
    };
  }
  
  console.log(`[Model Validation] Found ${modelNames.length} available models`);
  
  // Check if preferred model is available
  const isAvailable = modelNames.some(name => 
    name === preferredModel || name.includes(preferredModel)
  );
  
  if (isAvailable) {
    console.log(`[Model Validation] ✅ Model "${preferredModel}" is available`);
    return { 
      model: preferredModel, 
      isFallback: false,
      availableModels: modelNames
    };
  }
  
  // Check if fallback model is available
  const fallbackAvailable = modelNames.some(name => 
    name === FALLBACK_MODEL || name.includes(FALLBACK_MODEL)
  );
  
  if (fallbackAvailable) {
    console.warn(`[Model Validation] ⚠️  Model "${preferredModel}" not found`);
    console.warn(`[Model Validation] 🔄 Falling back to: ${FALLBACK_MODEL}`);
    console.warn(`[Model Validation] Available models: ${modelNames.slice(0, 5).join(', ')}${modelNames.length > 5 ? '...' : ''}`);
    return { 
      model: FALLBACK_MODEL, 
      isFallback: true,
      availableModels: modelNames
    };
  }
  
  // If even fallback is not available, return error info
  console.error(`[Model Validation] ❌ Neither "${preferredModel}" nor fallback "${FALLBACK_MODEL}" found`);
  console.error(`[Model Validation] Available models: ${modelNames.join(', ')}`);
  
  return { 
    model: '', // Empty string indicates failure
    isFallback: false,
    availableModels: modelNames
  };
}

/**
 * Validates model availability and throws fatal error if no valid models found
 * This is used at server startup to fail fast if configuration is invalid
 */
export async function validateOrThrow(
  apiKey: string,
  preferredModel: string
): Promise<{ model: string; isFallback: boolean }> {
  const result = await validateAndGetModel(apiKey, preferredModel);
  
  if (!result.model) {
    const availableList = result.availableModels.length > 0 
      ? `\n\nAvailable models:\n  - ${result.availableModels.join('\n  - ')}`
      : '\n\nCould not retrieve available models list from Google API.';
    
    const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ FATAL: No valid Gemini models found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Requested model: ${preferredModel}
Fallback model:  ${FALLBACK_MODEL}

Neither the requested model nor the fallback model are available
with your current API key.${availableList}

Possible solutions:
  1. Check your GEMINI_API_KEY in .env.local
  2. Verify API key has proper permissions at https://aistudio.google.com/apikey
  3. Update PREFERRED_MODEL in src/lib/ai/client.ts to one of the available models
  4. Ensure you have internet connectivity to reach Google API

Server cannot start without a valid model configuration.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    throw new Error(errorMessage);
  }
  
  return {
    model: result.model,
    isFallback: result.isFallback,
  };
}

/**
 * Simple check if a specific model exists in the available models list
 */
export async function modelExists(apiKey: string, modelName: string): Promise<boolean> {
  const models = await listAvailableModels(apiKey);
  return models.some(m => m.name === modelName || m.name.includes(modelName));
}
