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

export async function getSemanticTerms(term: string): Promise<SemanticTerms> {
  const cacheKey = term;
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey)!;
  }

  if (!session) {
    await initializeAiSession();
    if (!session) return { correctedTerm: term, semanticMatches: [] };
  }

  // --- SIMPLIFIED PROMPT ---
  const prompt = `
    For "${term}", provide a JSON object with keys: "correctedTerm" and "semanticMatches".
    "correctedTerm" should be the spell-checked version of the input.
    "semanticMatches" should be an array of objects, each with a "word" and a "score".
    The "score" must be a number between 0.0 and 1.0, indicating how similar the word is to the corrected term (1.0 is a perfect synonym).
    Provide 5-10 relevant words.
    Respond with ONLY the raw JSON.
  `;

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