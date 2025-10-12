// src/modules/semantic-engine.ts
import './ai-types';
import type { SearchOptions } from '../stores';

// THE FIX: Re-introduce `correctedTerm` to our interface
export interface SemanticTerms {
  correctedTerm: string;
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
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
    if (!session) return { correctedTerm: term, synonyms: [], antonyms: [], relatedWords: [] };
  }

  // --- DYNAMIC PROMPT WITH ALWAYS-ON AUTOCORRECT ---
  const requestedFields = ['"correctedTerm"']; // Always request the corrected term
  if (options.synonyms) requestedFields.push('"synonyms"');
  if (options.antonyms) requestedFields.push('"antonyms"');
  if (options.relatedWords) requestedFields.push('"relatedWords"');

  // The prompt now includes auto-correct as a mandatory first step.
  const prompt = `
    For "${term}", provide a JSON object with keys: ${requestedFields.join(", ")}.
    The "correctedTerm" key is mandatory and should contain the spell-checked version of the input.
    The other keys should be based on the corrected term.
    Respond with ONLY the raw JSON.
  `;

  console.log(`Dynamic prompt created: ${prompt}`);

  try {
    const aiResponseString = await session.prompt(prompt);
    const parsedResponse = parseJsonResponse(aiResponseString);
    if (!parsedResponse) throw new Error("JSON parsing failed.");
    
    const result: SemanticTerms = {
      // Ensure we always have a corrected term, falling back to the original
      correctedTerm: parsedResponse.correctedTerm || term,
      synonyms: parsedResponse.synonyms || [],
      antonyms: parsedResponse.antonyms || [],
      relatedWords: parsedResponse.relatedWords || [],
    };
    
    sessionCache.set(cacheKey, result);
    return result;

  } catch (error) {
    console.error("Error processing AI response:", error);
    return { correctedTerm: term, synonyms: [], antonyms: [], relatedWords: [] };
  }
}

