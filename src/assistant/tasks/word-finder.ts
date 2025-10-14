// src/assistant/tasks/word-finder.ts
import type { AssistantTask, TaskCategory } from '../types';
import { highlightCategorized, goToNext, goToPrev, clear } from '../../highlighter';
import { getSemanticTerms } from '../../modules/semantic-engine';
import type { SearchOptions } from '../../stores';

export interface WordFinderParams {
  query: string;
  options?: SearchOptions;
}

export interface WordFinderResult {
  totalMatches: number;
  currentIndex: number;
  terms: {
    original: string[];
    semanticMatches: { word: string; score: number }[];
  };
}

export const wordFinderTask: AssistantTask = {
  id: 'word-finder',
  name: 'Word Finder',
  description: 'Find and highlight words, synonyms, antonyms, and related terms on the current page',
  icon: '🔍',
  category: 'search' as TaskCategory,

  async execute(params: WordFinderParams): Promise<WordFinderResult> {
    const { query, options } = params;
    
    if (!query || query.trim().length === 0) {
      throw new Error('Query is required');
    }

    // Get semantic terms if options are provided
    let semanticTerms = null;
    if (options) {
      semanticTerms = await getSemanticTerms(query, options);
    }

    const terms = {
      original: [query.trim()],
      semanticMatches: semanticTerms?.semanticMatches || []
    };

    // Highlight the terms
    const totalMatches = highlightCategorized(terms);

    return {
      totalMatches,
      currentIndex: 0,
      terms
    };
  },

  validate(params: WordFinderParams): boolean {
    return Boolean(params.query && params.query.trim().length > 0);
  }
};

export const wordFinderNavigationTasks = {
  next: {
    id: 'word-finder-next',
    name: 'Next Match',
    description: 'Navigate to the next highlighted match',
    icon: '⬇️',
    category: 'search' as TaskCategory,
    async execute(): Promise<{ current: number; total: number }> {
      return goToNext();
    }
  },

  previous: {
    id: 'word-finder-previous', 
    name: 'Previous Match',
    description: 'Navigate to the previous highlighted match',
    icon: '⬆️',
    category: 'search' as TaskCategory,
    async execute(): Promise<{ current: number; total: number }> {
      return goToPrev();
    }
  },

  clear: {
    id: 'word-finder-clear',
    name: 'Clear Highlights',
    description: 'Clear all highlighted matches',
    icon: '🧹',
    category: 'search' as TaskCategory,
    async execute(): Promise<void> {
      clear();
    }
  }
};