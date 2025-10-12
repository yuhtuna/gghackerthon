// src/modules/highlighter.ts

const HIGHLIGHT_CLASSES = {
  original: 'findable-highlight-original',
  synonym: 'findable-highlight-synonym',
  antonym: 'findable-highlight-antonym',
  related: 'findable-highlight-related',
};
// This is the new class for the currently focused highlight
const CURRENT_HIGHLIGHT_CLASS = 'findable-highlight-current';

let highlights: HTMLElement[] = [];
let currentIndex = -1;

interface TermGroup {
  original: string[];
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
}

export function highlightCategorized(terms: TermGroup): number {
  clear();

  highlightTermList(terms.original, HIGHLIGHT_CLASSES.original);
  highlightTermList(terms.synonyms, HIGHLIGHT_CLASSES.synonym);
  highlightTermList(terms.antonyms, HIGHLIGHT_CLASSES.antonym);
  highlightTermList(terms.relatedWords, HIGHLIGHT_CLASSES.related);
  
  highlights = Array.from(document.querySelectorAll(`mark[class*="findable-highlight-"]`)) as HTMLElement[];
  highlights.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  if (highlights.length > 0) {
    currentIndex = 0;
    // Apply the "current" style to the first result immediately
    updateCurrentHighlight();
  }

  return highlights.length;
}

function highlightTermList(termList: string[], className: string) {
    const validTerms = termList ? termList.filter(term => typeof term === 'string' && term.trim() !== '') : [];
    if (validTerms.length === 0) return;

    const escapedTerms = validTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = `\\b(${escapedTerms.join('|')})\\b`;
  
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Text) => {
        if (node.parentElement?.closest('#findable-extension-root') || node.parentElement?.tagName === 'SCRIPT' || node.parentElement?.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        const checkRegex = new RegExp(regexPattern, 'gi');
        return checkRegex.test(node.textContent || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
  
    const nodesToProcess: Text[] = [];
    while (walker.nextNode()) {
      nodesToProcess.push(walker.currentNode as Text);
    }
  
    nodesToProcess.forEach(node => {
      const parent = node.parentNode;
      if (!parent) return;
  
      const splitRegex = new RegExp(regexPattern, 'gi');
      const parts = node.textContent?.split(splitRegex);
  
      if (parts && parts.length > 1) {
        const fragment = document.createDocumentFragment();
        parts.forEach((part, index) => {
          if (index % 2 === 1) {
            const mark = document.createElement('mark');
            mark.className = className;
            mark.textContent = part;
            fragment.appendChild(mark);
          } else if (part) {
            fragment.appendChild(document.createTextNode(part));
          }
        });
        parent.replaceChild(fragment, node);
      }
    });
}

export function goToNext(): { current: number; total: number } {
  if (highlights.length === 0) return { current: -1, total: 0 };
  currentIndex = (currentIndex + 1) % highlights.length;
  updateCurrentHighlight();
  return { current: currentIndex, total: highlights.length };
}

export function goToPrev(): { current: number; total: number } {
  if (highlights.length === 0) return { current: -1, total: 0 };
  currentIndex = (currentIndex - 1 + highlights.length) % highlights.length;
  updateCurrentHighlight();
  return { current: currentIndex, total: highlights.length };
}

// --- THE FIX: This function now manages the current highlight style ---
function updateCurrentHighlight() {
  // First, remove the 'current' class from all highlights
  highlights.forEach(h => {
    h.classList.remove(CURRENT_HIGHLIGHT_CLASS);
  });

  // Then, add it to the one at the current index
  const currentEl = highlights[currentIndex];
  if (currentEl) {
    currentEl.classList.add(CURRENT_HIGHLIGHT_CLASS);
    // Scroll the element into the center of the viewport
    currentEl.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  }
}

export function clear() {
  const allHighlights = document.querySelectorAll('mark[class*="findable-highlight-"]');
  allHighlights.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
  highlights = [];
  currentIndex = -1;
}

