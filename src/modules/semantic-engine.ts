
// src/modules/semantic-engine.ts
import type { DescriptiveMatch, SemanticMatch, SemanticTerms } from './ai-types';

let session: chrome.ai.TextSession | null = null;
const sessionCache = new Map<string, SemanticTerms>();

export async function initializeAiSession(): Promise<void> {
  if (session) return;

  if (typeof chrome === 'undefined' || !chrome.ai) {
    console.error("The chrome.ai API is not available. AI features will be disabled.");
    return;
  }

  try {
    const availability = await chrome.ai.canCreateTextSession();
    if (availability === 'readily' || availability === 'after-download') {
      session = await chrome.ai.createTextSession();
      console.log("AI session initialized successfully!");
    } else {
      console.error("The on-device model is not ready:", availability);
    }
  } catch (error) {
    console.error("Error initializing AI session:", error);
  }
}

function parseJsonResponse<T>(raw: string): Partial<T> | null {
  if (!raw) return null;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) { return null; }
  const jsonString = raw.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonString) as Partial<T>;
  } catch (error) {
    return null;
  }
}

export async function getSemanticTerms(term: string, pageContent: string, options?: { signal: AbortSignal }): Promise<SemanticTerms> {
  const cacheKey = `${term}-${pageContent.substring(0, 500)}`;
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey)!;
  }

  if (!session) {
    await initializeAiSession();
    if (!session) return { correctedTerm: term, semanticMatches: [] };
  }

  const prompt = `
    Analyze the following text content from a webpage:
    ---
    ${pageContent.substring(0, 4000)} 
    ---
    Based on the text above, for the search term "${term}", provide a JSON object with keys: "correctedTerm" and "semanticMatches".
    "correctedTerm" should be the spell-checked version of the input term.
    "semanticMatches" should be an array of objects. Each object must have a "word" (a synonym, alternative form, or highly related term for "${term}" that is ACTUALLY PRESENT in the provided text) and a "score" (a number between 0.0 and 1.0 indicating relevance).
    Only include words that are found in the text.
    Respond with ONLY the raw JSON.
  `;

  try {
    const aiResponseString = await session.prompt(prompt, options);
    const parsedResponse = parseJsonResponse<SemanticTerms>(aiResponseString);
    if (!parsedResponse) throw new Error("JSON parsing failed.");
    
    const result: SemanticTerms = {
      correctedTerm: parsedResponse.correctedTerm || term,
      semanticMatches: parsedResponse.semanticMatches || [],
    };
    
    sessionCache.set(cacheKey, result);
    return result;

  } catch (error) {
    console.error("Error processing AI response:", error);
    // If the session is destroyed, try to re-initialize it for the next call.
    if (error instanceof Error && error.message.includes('destroyed')) {
      session = null;
    }
    return { correctedTerm: term, semanticMatches: [] };
  }
}

export async function getDescriptiveMatches(textChunk: string, description: string, options?: { signal: AbortSignal }): Promise<DescriptiveMatch[]> {
  if (!session) {
    await initializeAiSession();
    if (!session) return [];
  }

  const prompt = `
    Analyze the following text:
    ---
    ${textChunk}
    ---
    Now, find all sentences from the text that match this description: "${description}".
    Return a JSON object with a single key, "matches", which is an array of objects.
    Each object must have two keys: "matchingSentence" (the full sentence string you found) and "relevanceScore" (a number from 0.0 to 1.0 indicating how well it matches).
    Respond with ONLY the raw JSON.
  `;

  try {
    const aiResponseString = await session.prompt(prompt, options);
    const parsedResponse = parseJsonResponse<{ matches: DescriptiveMatch[] }>(aiResponseString);
    if (!parsedResponse || !Array.isArray(parsedResponse.matches)) {
        console.warn("AI response for descriptive matches was malformed:", parsedResponse);
        return [];
    }
    return parsedResponse.matches;
  } catch (error) {
    console.error("Error getting descriptive matches:", error);
    if (error instanceof Error && error.message.includes('destroyed')) {
      session = null;
    }
    return [];
  }
}

export async function analyzeImage(imageData: Blob, promptText: string): Promise<string | { error: string }> {
  if (!session) {
    await initializeAiSession();
    if (!session) return { error: 'AI session not available.' };
  }

  try {
    const reader = new FileReader();
    const readerPromise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
    });
    reader.readAsDataURL(imageData);
    const base64ImageData = await readerPromise;

    // The Gemini API expects the base64 string without the data URL prefix
    const pureBase64 = base64ImageData.substring(base64ImageData.indexOf(',') + 1);

    const result = await session.prompt([
      { inlineData: { data: pureBase64, mimeType: 'image/jpeg' } },
      { text: promptText },
    ]);

    return result;

  } catch (error) {
    console.error("Error analyzing image:", error);
    if (error instanceof Error && error.message.includes('destroyed')) {
      session = null;
    }
    return { error: 'Failed to analyze image.' };
  }
}
