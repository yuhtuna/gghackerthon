// src/modules/semantic-engine.ts
import './ai-types';

// Simplified to reflect the focus on synonyms and related words
export interface SemanticMatch {
  word: string;
  score: number; // Score from 0.0 to 1.0
}

export interface SemanticTerms {
  correctedTerm: string;
  semanticMatches: SemanticMatch[];
}

let session: LanguageModelSession | null = null;
const sessionCache = new Map<string, SemanticTerms>();

export async function initializeAiSession() {
  if (session) return;
  if (typeof globalThis.LanguageModel === 'undefined') {
    console.error("Chrome's built-in AI API is not available.");
    return;
  }
  const availability = await globalThis.LanguageModel.availability();
  if (availability === 'readily' || availability === 'available') {
    session = await globalThis.LanguageModel.create();
    console.log("AI session initialized successfully!");
  } else {
    console.error("The on-device model is not ready:", availability);
  }
}

function parseJsonResponse(raw: string): Partial<SemanticTerms> | null {
  if (!raw) return null;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) { return null; }
  const jsonString = raw.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
}

export async function getSemanticTerms(term: string, pageContent: string, options?: { signal: AbortSignal }): Promise<SemanticTerms> {
  const cacheKey = `${term}-${pageContent.substring(0, 500)}`; // Create a more robust cache key
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey)!;
  }

  if (!session) {
    await initializeAiSession();
    if (!session) return { correctedTerm: term, semanticMatches: [] };
  }

  // --- REVISED, CONTEXT-AWARE PROMPT ---
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

  console.log('--- AI PROMPT (getSemanticTerms) ---', prompt);

  try {
    const aiResponseString = await session.prompt(prompt, options);
    console.log('--- AI RESPONSE (getSemanticTerms) ---', aiResponseString);
    const parsedResponse = parseJsonResponse(aiResponseString);
    if (!parsedResponse) throw new Error("JSON parsing failed.");
    
    const result: SemanticTerms = {
      correctedTerm: parsedResponse.correctedTerm || term,
      semanticMatches: parsedResponse.semanticMatches || [],
    };
    
    sessionCache.set(cacheKey, result);
    return result;

  } catch (error) {
    console.error("Error processing AI response:", error);
    return { correctedTerm: term, semanticMatches: [] };
  }
}

export async function getDescriptiveMatches(textChunk: string, description: string, options?: { signal: AbortSignal }): Promise<string[]> {
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
    Return a JSON object with a single key, "matches", which is an array of the full sentence strings that you found.
    Respond with ONLY the raw JSON.
  `;

  console.log('--- AI PROMPT (getDescriptiveMatches) ---', prompt);

  try {
    const aiResponseString = await session.prompt(prompt, options);
    console.log('--- AI RESPONSE (getDescriptiveMatches) ---', aiResponseString);
    const parsedResponse = JSON.parse(aiResponseString.replace(/```json|```/g, ''));
    return parsedResponse.matches || [];
  } catch (error) {
    console.error("Error getting descriptive matches:", error);
    return [];
  }
}