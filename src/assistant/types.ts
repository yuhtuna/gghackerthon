// src/assistant/types.ts

export interface AssistantTask {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: TaskCategory;
  execute: (params: any) => Promise<any>;
  validate?: (params: any) => boolean;
}

export interface TaskResult {
  success: boolean;
  data: any;
  error: string | null;
}

export interface AssistantIntent {
  taskId: string;
  confidence: number;
  parameters: Record<string, any>;
}

export type TaskCategory = 
  | 'search'
  | 'analysis'
  | 'productivity'
  | 'communication'
  | 'utility';

export interface TaskExecutionContext {
  tabId?: number;
  url?: string;
  selectedText?: string;
  pageContent?: string;
}

export interface AssistantCommand {
  command: string;
  description: string;
  taskId: string;
  shortcut?: string;
}