// src/assistant/tasks/page-analyzer.ts
import type { AssistantTask, TaskCategory } from '../types';

export interface PageAnalyzerResult {
  wordCount: number;
  readingTime: number;
  links: { text: string; url: string }[];
  headings: { level: number; text: string }[];
  images: { src: string; alt?: string }[];
}

export const pageAnalyzerTask: AssistantTask = {
  id: 'page-analyzer',
  name: 'Page Analyzer',
  description: 'Analyze the current webpage for content insights, statistics, and structure',
  icon: '📊',
  category: 'analysis' as TaskCategory,

  async execute(): Promise<PageAnalyzerResult> {
    const bodyText = document.body.innerText || '';
    const words = bodyText.split(/\s+/).filter(word => word.length > 0);
    const readingTime = Math.ceil(words.length / 200); // Average reading speed: 200 wpm

    // Extract links
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(link => ({
        text: (link as HTMLElement).innerText.trim(),
        url: (link as HTMLAnchorElement).href
      }))
      .filter(link => link.text.length > 0);

    // Extract headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(heading => ({
        level: parseInt(heading.tagName.charAt(1)),
        text: (heading as HTMLElement).innerText.trim()
      }))
      .filter(heading => heading.text.length > 0);

    // Extract images
    const images = Array.from(document.querySelectorAll('img[src]'))
      .map(img => ({
        src: (img as HTMLImageElement).src,
        alt: (img as HTMLImageElement).alt
      }));

    return {
      wordCount: words.length,
      readingTime,
      links: links.slice(0, 10), // Limit to first 10 links
      headings,
      images: images.slice(0, 5) // Limit to first 5 images
    };
  }
};