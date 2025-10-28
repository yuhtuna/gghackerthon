// src/assistant/index.ts
import { getAssistant } from './core';
import { wordFinderTask, wordFinderNavigationTasks } from './tasks/word-finder';
import { pageAnalyzerTask } from './tasks/page-analyzer';
import { textProcessorTasks } from './tasks/text-processor';

// Initialize and register all tasks
export async function initializeAssistant() {
  const assistant = await getAssistant();
  
  // Register word finder tasks
  assistant.registerTask(wordFinderTask);
  assistant.registerTask(wordFinderNavigationTasks.next);
  assistant.registerTask(wordFinderNavigationTasks.previous);
  assistant.registerTask(wordFinderNavigationTasks.clear);

  // Register analysis tasks
  assistant.registerTask(pageAnalyzerTask);
  
  // Register text processing tasks
  assistant.registerTask(textProcessorTasks.summarizer);
  assistant.registerTask(textProcessorTasks.keywordExtractor);

  return assistant;
}

export { getAssistant } from './core';
export type { AssistantTask, TaskResult, AssistantIntent } from './types';