// src/modules/ai-types.d.ts

// This file tells TypeScript about the new, experimental Chrome AI API.
// We are correcting the global variable name to LanguageModel.

declare global {
  // Use `var` to declare it in the global scope for the service worker.
  var LanguageModel: LanguageModel;

  interface LanguageModel {
    create(): Promise<LanguageModelSession>;
    // include 'available' because runtime may return it
    availability(): Promise<'readily' | 'available' | 'after-download' | 'no' | 'unavailable'>;
    params(): Promise<any>;
  }

  interface LanguageModelSession {
    prompt(prompt: string): Promise<string>;
    promptStreaming(prompt: string): AsyncGenerator<string, void, void>;
    destroy(): void;
  }
}

// This export is needed to make the file a module.
export {};

