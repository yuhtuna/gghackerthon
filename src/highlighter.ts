// src/modules/highlighter.ts

// Simplified class names for the new 3-mode system
const HIGHLIGHT_CLASSES = {
  original: 'findable-highlight-original',
  semantic: 'findable-highlight-semantic', 
};
const CURRENT_HIGHLIGHT_CLASS = 'findable-highlight-current';

let highlights: HTMLElement[] = [];
let currentIndex = -1;

interface TermGroup {
  original: string[];
  semanticMatches: { word: string; score: number }[];
}

export function highlightCategorized(terms: TermGroup): number {
  clear();

  // Highlight original term (yellow)
  highlightTermList(terms.original.map(word => ({ word, score: 1.0 })), HIGHLIGHT_CLASSES.original);
  
  // Highlight semantic matches (green)
  highlightTermList(terms.semanticMatches || [], HIGHLIGHT_CLASSES.semantic);
  
  highlights = Array.from(document.querySelectorAll(`mark[class*="findable-highlight-"]`)) as HTMLElement[];
  highlights.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  if (highlights.length > 0) {
    currentIndex = 0;
    updateCurrentHighlight();
  }

  return highlights.length;
}

function highlightTermList(termList: { word: string; score: number }[], className: string) {
    const validTerms = termList ? termList.filter(t => typeof t.word === 'string' && t.word.trim() !== '') : [];
    if (validTerms.length === 0) return;

    const escapedTerms = validTerms.map(t => t.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = `(${escapedTerms.join('|')})`;
    const regex = new RegExp(regexPattern, 'gi');

    // --- THE FIX: We now look for ELEMENT nodes, not just TEXT nodes ---
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node: Element) => {
        // Filter out our own UI, scripts, and styles.
        if (node.closest('#findable-extension-root') || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Check if the element's direct text content contains a match.
        // We only check for child nodes that are text nodes to be efficient.
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE && regex.test(child.nodeValue || '')) {
                return NodeFilter.FILTER_ACCEPT;
            }
        }
        return NodeFilter.FILTER_REJECT;
      }
    });
  
    const nodesToProcess: Node[] = [];
    while (walker.nextNode()) {
      nodesToProcess.push(walker.currentNode);
    }
  
    // --- THE FIX: The highlighting logic now handles element children ---
    nodesToProcess.forEach(node => {
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(child => {
            if (child.nodeType !== Node.TEXT_NODE || !child.nodeValue) return;

            const text = child.nodeValue;
            if (!regex.test(text)) return;

            const fragment = document.createDocumentFragment();
            const parts = text.split(regex);

            parts.forEach((part, index) => {
                if (index % 2 === 1) { // This is a matched part
                    const matchedWord = part;
                    const termData = validTerms.find(t => t.word.toLowerCase() === matchedWord.toLowerCase());
                    const score = termData ? Math.abs(termData.score) : 1.0;

                    const mark = document.createElement('mark');
                    mark.textContent = matchedWord;
                    mark.className = className;
                    mark.style.setProperty('--highlight-intensity', score.toString());
                    fragment.appendChild(mark);
                } else if (part) {
                    fragment.appendChild(document.createTextNode(part));
                }
            });
            node.replaceChild(fragment, child);
        });
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

function updateCurrentHighlight() {
  highlights.forEach(h => {
    h.classList.remove(CURRENT_HIGHLIGHT_CLASS);
  });
  const currentEl = highlights[currentIndex];
  if (currentEl) {
    currentEl.classList.add(CURRENT_HIGHLIGHT_CLASS);
    currentEl.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  }
}

export function clear() {
  const marks = document.querySelectorAll(`mark[class*="findable-highlight-"]`);
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
  highlights = [];
  currentIndex = -1;
}