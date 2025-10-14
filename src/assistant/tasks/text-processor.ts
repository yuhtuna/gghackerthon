// src/assistant/tasks/text-processor.ts
import type { AssistantTask, TaskCategory } from '../types';

export interface TextProcessorParams {
  text: string;
  action: 'summarize' | 'translate' | 'analyze-sentiment' | 'extract-keywords';
  targetLanguage?: string;
}

export interface TextProcessorResult {
  originalText: string;
  result: string;
  action: string;
  metadata?: Record<string, any>;
}

export const textProcessorTasks = {
  summarizer: {
    id: 'text-summarizer',
    name: 'Text Summarizer',
    description: 'Summarize selected text or page content using AI',
    icon: '📝',
    category: 'productivity' as TaskCategory,
    
    async execute(params: { text?: string }): Promise<TextProcessorResult> {
      let textToSummarize = params.text;
      
      if (!textToSummarize) {
        const selection = window.getSelection()?.toString();
        textToSummarize = selection || document.body.innerText;
      }
      
      if (!textToSummarize || textToSummarize.length < 50) {
        throw new Error('Please select text to summarize or ensure the page has sufficient content');
      }

      // For now, return a mock summary - in a real implementation, this would use an AI API
      const wordCount = textToSummarize.split(/\s+/).length;
      const sentences = textToSummarize.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      return {
        originalText: textToSummarize.substring(0, 200) + '...',
        result: `Summary: This text contains ${wordCount} words across ${sentences.length} sentences. Main topics appear to focus on the content presented in the document.`,
        action: 'summarize',
        metadata: { wordCount, sentenceCount: sentences.length }
      };
    }
  },

  keywordExtractor: {
    id: 'keyword-extractor',
    name: 'Keyword Extractor',
    description: 'Extract key terms and phrases from text content',
    icon: '🔑',
    category: 'analysis' as TaskCategory,
    
    async execute(params: { text?: string }): Promise<TextProcessorResult> {
      let textToAnalyze = params.text;
      
      if (!textToAnalyze) {
        const selection = window.getSelection()?.toString();
        textToAnalyze = selection || document.body.innerText;
      }
      
      if (!textToAnalyze) {
        throw new Error('No text available for keyword extraction');
      }

      // Simple keyword extraction - count word frequency
      const words = textToAnalyze.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      const frequency: Record<string, number> = {};
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });

      const keywords = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => `${word} (${count})`)
        .join(', ');

      return {
        originalText: textToAnalyze.substring(0, 200) + '...',
        result: `Top keywords: ${keywords}`,
        action: 'extract-keywords',
        metadata: { totalWords: words.length, uniqueWords: Object.keys(frequency).length }
      };
    }
  }
};