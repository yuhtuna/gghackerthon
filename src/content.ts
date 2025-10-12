import SearchBar from './SearchBar.svelte';
import { highlightCategorized, clear, goToNext, goToPrev } from './highlighter';
import type { SemanticTerms } from './modules/semantic-engine';
import { searchOptions } from './stores';
import { get } from 'svelte/store';
import { debounce } from './modules/utils';

function toggleFindableUI() {
  const existingRoot = document.querySelector('#findable-extension-root');
  if (existingRoot) {
    clear();
    existingRoot.remove();
    return;
  }
  
  const container = document.createElement('div');
  container.id = 'findable-extension-root';
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  const style = document.createElement('style');
  style.textContent = `
    ::slotted(mark.findable-highlight-original) { background-color: #fde047; color: #18181b; }
    ::slotted(mark.findable-highlight-synonym) { background-color: #86efac; color: #14532d; }
    ::slotted(mark.findable-highlight-antonym) { background-color: #fca5a5; color: #7f1d1d; }
    ::slotted(mark.findable-highlight-related) { background-color: #93c5fd; color: #1e3a8a; }
    ::slotted(mark) { 
      padding: 2px; 
      border-radius: 3px; 
      transition: all 0.2s ease;
      scroll-margin: 50vh; /* Ensures the element is centered when scrolling */
    }
    /* --- THE FIX: NEW STYLE FOR THE CURRENT HIGHLIGHT --- */
    ::slotted(mark.findable-highlight-current) { 
      background-color: #fb923c; /* Bright Orange */
      box-shadow: 0 0 0 2px #fb923c;
      transform: scale(1.05);
    }
  `;
  shadowRoot.appendChild(style);

  const target = document.createElement('div');
  shadowRoot.appendChild(target);
  document.body.appendChild(container);

  const searchBar = new SearchBar({ target });

  const debouncedSemanticSearch = debounce(async (term: string) => {
    const options = get(searchOptions);
    if (!options.synonyms && !options.antonyms && !options.relatedWords) return;
    
    const semanticTerms: SemanticTerms = await chrome.runtime.sendMessage({
      type: 'getSemanticTerms',
      term: term,
      options: options
    });

    if (!semanticTerms) return;

    const termsToHighlight = {
      original: [semanticTerms.correctedTerm],
      synonyms: options.synonyms ? semanticTerms.synonyms : [],
      antonyms: options.antonyms ? semanticTerms.antonyms : [],
      relatedWords: options.relatedWords ? semanticTerms.relatedWords : [],
    };

    const total = highlightCategorized(termsToHighlight);
    searchBar.setResults(total, total > 0 ? 0 : -1);
  }, 500);

  searchBar.$on('search', (event) => {
    const { term } = event.detail;
    clear();
    searchBar.setResults(0, -1);

    if (term) {
      const total = highlightCategorized({ original: [term], synonyms: [], antonyms: [], relatedWords: [] });
      searchBar.setResults(total, total > 0 ? 0 : -1);
      debouncedSemanticSearch(term);
    }
  });
  
  searchBar.$on('next', () => {
    const { current, total } = goToNext();
    searchBar.setResults(total, current);
  });

  searchBar.$on('prev', () => {
    const { current, total } = goToPrev();
    searchBar.setResults(total, current);
  });

  searchBar.$on('close', () => {
    clear();
    container.remove();
  });
}

toggleFindableUI();

