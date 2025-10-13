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
  
  // Add global styles for highlights to the document head
  const globalStyle = document.createElement('style');
  globalStyle.id = 'findable-highlight-styles';
  globalStyle.textContent = `
    /* Base colors are now defined with RGB values for opacity manipulation */
    mark.findable-highlight-original { background-color: rgba(253, 224, 71, var(--highlight-intensity, 0.5)) !important; color: #18181b !important; }
    mark.findable-highlight-synonym { background-color: rgba(134, 239, 172, var(--highlight-intensity, 0.5)) !important; color: #14532d !important; }
    mark.findable-highlight-antonym { background-color: rgba(252, 165, 165, var(--highlight-intensity, 0.5)) !important; color: #7f1d1d !important; }
    mark.findable-highlight-related { background-color: rgba(147, 197, 253, var(--highlight-intensity, 0.5)) !important; color: #1e3a8a !important; }
    mark[class*="findable-highlight-"] { 
      padding: 2px !important; 
      border-radius: 3px !important; 
      transition: all 0.2s ease !important;
      scroll-margin: 50vh !important; /* Ensures the element is centered when scrolling */
      /* Default intensity if not set */
      --highlight-intensity: 0.5;
    }
    /* Current highlight styling */
    mark.findable-highlight-current { 
      background-color: #60a5fa !important; /* Bright Blue */
      box-shadow: 0 0 0 2px #60a5fa !important;
      transform: scale(1.05) !important;
    }
  `;
  
  // Remove existing styles if any
  const existingStyles = document.getElementById('findable-highlight-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
  document.head.appendChild(globalStyle);
  
  const style = document.createElement('style');
  style.textContent = `
    /* Styles for the search bar UI inside shadow DOM */
    .search-container {
      /* Add any shadow DOM specific styles here */
    }
  `;
  shadowRoot.appendChild(style);

  const target = document.createElement('div');
  shadowRoot.appendChild(target);
  document.body.appendChild(container);

  const searchBar = new SearchBar({ target });

  const debouncedSemanticSearch = debounce(async (term: string) => {
    const options = get(searchOptions);
    // We only need to check if at least one semantic option is enabled.
    if (!options.synonyms && !options.antonyms && !options.relatedWords) return;
    
    const semanticTerms: SemanticTerms = await chrome.runtime.sendMessage({
      type: 'getSemanticTerms',
      term: term,
      options: options // Pass all options, engine will decide what to do
    });

    if (!semanticTerms) return;

    const termsToHighlight = {
      original: [semanticTerms.correctedTerm],
      semanticMatches: semanticTerms.semanticMatches || [],
    };

    const total = highlightCategorized(termsToHighlight);
    searchBar.setResults(total, total > 0 ? 0 : -1);
  }, 1200); // --- THE FIX: Increased debounce delay to 1.2 seconds ---

  searchBar.$on('search', (event) => {
    const { term } = event.detail;
    clear();
    searchBar.setResults(0, -1);

    if (term) {
      // Initial highlight of just the searched term
      const total = highlightCategorized({ original: [term], semanticMatches: [] });
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

  searchBar.$on('close', a => {
    clear();
    // Remove global styles
    const existingStyles = document.getElementById('findable-highlight-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    container.remove();
  });
}

toggleFindableUI();