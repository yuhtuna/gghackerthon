// src/assistant/core.ts
import { AssistantTask, TaskResult, AssistantIntent } from './types';

export class WebNanoAssistant {
  private readonly tasks: Map<string, AssistantTask> = new Map();
  private isInitialized = false;

  static async create(): Promise<WebNanoAssistant> {
    const assistant = new WebNanoAssistant();
    await assistant.initialize();
    return assistant;
  }

  private constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Load available tasks
    await this.loadTasks();
    this.isInitialized = true;
  }

  registerTask(task: AssistantTask): void {
    this.tasks.set(task.id, task);
  }

  async executeTask(taskId: string, params: any = {}): Promise<TaskResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return {
        success: false,
        error: `Task "${taskId}" not found`,
        data: null
      };
    }

    try {
      const result = await task.execute(params);
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async interpretIntent(input: string): Promise<AssistantIntent> {
    // Simple intent recognition - can be enhanced with AI
    const lowerInput = input.toLowerCase().trim();
    
    if (lowerInput.startsWith('find ') || lowerInput.includes('search') || lowerInput.includes('highlight')) {
      return {
        taskId: 'word-finder',
        confidence: 0.9,
        parameters: { query: input.replace(/^find\s+/i, '') }
      };
    }

    if (lowerInput.includes('analyze page') || lowerInput.includes('page analysis') || lowerInput.includes('page info')) {
      return {
        taskId: 'page-analyzer',
        confidence: 0.9,
        parameters: {}
      };
    }

    if (lowerInput.includes('summarize') || lowerInput.includes('summary')) {
      return {
        taskId: 'text-summarizer',
        confidence: 0.8,
        parameters: { text: input.replace(/^summarize\s+/i, '') }
      };
    }

    if (lowerInput.includes('keywords') || lowerInput.includes('extract') || lowerInput.includes('key terms')) {
      return {
        taskId: 'keyword-extractor',
        confidence: 0.8,
        parameters: { text: input.replace(/^extract\s+(keywords?\s+)?/i, '') }
      };
    }

    // Default to word finder for simple queries
    return {
      taskId: 'word-finder',
      confidence: 0.5,
      parameters: { query: input }
    };
  }

  getAvailableTasks(): AssistantTask[] {
    return Array.from(this.tasks.values());
  }

  private async loadTasks(): Promise<void> {
    // Tasks will be registered here
    // This allows for dynamic task loading in the future
  }
}

// Singleton instance
let assistantInstance: WebNanoAssistant | null = null;

export async function getAssistant(): Promise<WebNanoAssistant> {
  if (!assistantInstance) {
    assistantInstance = await WebNanoAssistant.create();
  }
  return assistantInstance;
}