// src/modules/semantic-engine.ts
import './ai-types';
import type { SearchOptions } from '../stores';

// Each term now includes a relevance score
export interface SemanticTerm {
  word: string;
  score: number;
}

export interface SemanticTerms {
  correctedTerm: string;
  semanticMatches: SemanticTerm[];
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

export async function getSemanticTerms(term: string, options: SearchOptions): Promise<SemanticTerms> {
  const activeOptions = Object.keys(options).filter(k => options[k as keyof SearchOptions]);
  // Always include auto-correct in the cache key logic
  const cacheKey = `${term}-autocorrect-${activeOptions.join('-')}`;
  
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey)!;
  }

  if (!session) {
    await initializeAiSession();
    if (!session) return { correctedTerm: term, semanticMatches: [] };
  }

  // --- UNIFIED PROMPT WITH -1 TO 1 SCORING ---
  const prompt = `
    For "${term}", provide a JSON object with keys: "correctedTerm" and "semanticMatches".
    The "correctedTerm" key is mandatory and should contain the spell-checked version of the input.
    "semanticMatches" should be an array of objects, each with a "word" and a "score" property.
    The "score" must be a number between -1.0 and 1.0:
    - A score > 0 indicates a synonym or related word (1.0 is a perfect synonym).
    - A score < 0 indicates an antonym or opposite concept (-1.0 is a direct antonym).
    - A score of 0 is a neutral or unrelated term.
    Base the matches on the corrected term. Provide 5-10 semantically related words.
    Respond with ONLY the raw JSON.
  `;

  console.log(`Dynamic prompt created: ${prompt}`);

  try {
    const aiResponseString = await session.prompt(prompt);
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

