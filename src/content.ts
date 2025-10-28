import SearchBar from './SearchBar.svelte';
import { highlightCategorized, clear, goToNext, goToPrev } from './highlighter';
import type { SemanticTerms } from './modules/semantic-engine';
import { appSettings } from './stores';
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
  
  // Styles are simplified as we no longer need an antonym color
  const globalStyle = document.createElement('style');
  globalStyle.id = 'findable-highlight-styles';
  globalStyle.textContent = `
    mark.findable-highlight-original { background-color: rgba(253, 224, 71, 0.7) !important; color: #18181b !important; }
    mark.findable-highlight-semantic { background-color: rgba(134, 239, 172, var(--highlight-intensity, 0.5)) !important; color: #14532d !important; }
    mark[class*="findable-highlight-"] { padding: 2px !important; border-radius: 3px !important; scroll-margin: 50vh !important; }
    mark.findable-highlight-current { box-shadow: 0 0 0 2px #60a5fa !important; background-color: #60a5fa !important; }
  `;
  document.head.appendChild(globalStyle);

  const target = document.createElement('div');
  shadowRoot.appendChild(target);
  document.body.appendChild(container);

  const searchBar = new SearchBar({ target });

  let smartResults: SemanticTerms | null = null;

  const predictiveSmartSearch = debounce(async (term: string) => {
    searchBar.setLoading(true);
    const results = await chrome.runtime.sendMessage({ type: 'getSemanticTerms', term });
    smartResults = results;
    searchBar.setSmartState('ready'); // Notify UI that smart results are ready
  }, 800);

  searchBar.$on('search', (event) => {
    const { term } = event.detail;
    const mode = get(appSettings).searchMode;
    
    clear();
    smartResults = null;
    searchBar.setSmartState('idle');
    searchBar.setLoading(false);

    if (!term) {
      searchBar.setResults(0, -1);
      return;
    }

    // Mode 1: Standard Find (No AI)
    if (mode === 'find') {
      const total = highlightCategorized({ original: [term], semanticMatches: [] });
      searchBar.setResults(total, total > 0 ? 0 : -1);
    }
    
    // Mode 2: Basic AI (Predictive Fetch)
    if (mode === 'basic') {
      const total = highlightCategorized({ original: [term], semanticMatches: [] });
      searchBar.setResults(total, total > 0 ? 0 : -1);
      predictiveSmartSearch(term);
    }
    
    // Mode 3: Deep Scan (Placeholder for now)
    if (mode === 'deep') {
      // For now, it will behave like 'basic'. This is where you'd add the chunking logic.
      const total = highlightCategorized({ original: [term], semanticMatches: [] });
      searchBar.setResults(total, total > 0 ? 0 : -1);
      predictiveSmartSearch(term); // Re-using predictive search for now
    }
  });

  searchBar.$on('apply_smart_results', () => {
    if (!smartResults) return;
    
    clear();
    const total = highlightCategorized({
      original: [smartResults.correctedTerm],
      semanticMatches: smartResults.semanticMatches,
    });
    searchBar.setResults(total, total > 0 ? 0 : -1);
    searchBar.setSmartState('idle');
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
    globalStyle.remove();
    container.remove();
  });
}

toggleFindableUI();