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
  semanticMatches: { word: string; score: number }[];
}

export function highlightCategorized(terms: TermGroup): number {
  clear();

  // Highlight original term in yellow
  highlightTermList(terms.original.map(word => ({ word, score: 1.0 })), HIGHLIGHT_CLASSES.original);
  
  // Separate semantic matches based on score
  const synonyms = (terms.semanticMatches || []).filter(t => t.score > 0);
  const antonyms = (terms.semanticMatches || []).filter(t => t.score < 0);

  // Highlight synonyms in green and antonyms in red
  highlightTermList(synonyms, HIGHLIGHT_CLASSES.synonym);
  highlightTermList(antonyms, HIGHLIGHT_CLASSES.antonym);
  
  highlights = Array.from(document.querySelectorAll(`mark[class*="findable-highlight-"]`)) as HTMLElement[];
  highlights.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  if (highlights.length > 0) {
    currentIndex = 0;
    // Apply the "current" style to the first result immediately
    updateCurrentHighlight();
  }

  return highlights.length;
}

function highlightTermList(termList: { word: string; score: number }[], className: string) {
    const validTerms = termList ? termList.filter(term => typeof term.word === 'string' && term.word.trim() !== '') : [];
    if (validTerms.length === 0) return;

    const escapedTerms = validTerms.map(term => term.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = `(${escapedTerms.join('|')})`;
  
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
      const text = node.nodeValue;
      if (!text) return;
  
      const regex = new RegExp(regexPattern, 'gi');
      let match;
      const fragments = document.createDocumentFragment();
      let lastIndex = 0;
  
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragments.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        
        const matchedWord = match[0];
        const termData = validTerms.find(t => t.word.toLowerCase() === matchedWord.toLowerCase());
        // Use absolute value of score for intensity (both +0.8 and -0.8 should be intense)
        const score = termData ? Math.abs(termData.score) : 1.0;

        const mark = document.createElement('mark');
        mark.textContent = matchedWord;
        mark.className = className;
        mark.style.setProperty('--highlight-intensity', score.toString());
        fragments.appendChild(mark);
  
        lastIndex = regex.lastIndex;
      }
  
      if (lastIndex < text.length) {
        fragments.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
  
      if (fragments.childNodes.length > 1) {
        node.parentNode?.replaceChild(fragments, node);
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
  highlights.forEach(h => h.classList.remove(CURRENT_HIGHLIGHT_CLASS));
  
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