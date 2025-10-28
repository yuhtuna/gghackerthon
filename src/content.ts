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
    mark.findable-highlight-sentence { background-color: rgba(147, 197, 253, 0.7) !important; color: #1e3a8a !important; } /* Blue for sentences */
    mark[class*="findable-highlight-"] { padding: 2px !important; border-radius: 3px !important; scroll-margin: 50vh !important; }
    mark.findable-highlight-current { box-shadow: 0 0 0 2px #60a5fa !important; background-color: #60a5fa !important; }
  `;
  document.head.appendChild(globalStyle);

  const target = document.createElement('div');
  shadowRoot.appendChild(target);
  document.body.appendChild(container);

  const searchBar = new SearchBar({ target });

  let smartResults: SemanticTerms | null = null;
  let latestSearchId = 0;

  const predictiveSmartSearch = debounce(async (term: string, searchId: number) => {
    const pageContent = document.body.innerText;
    const results = await chrome.runtime.sendMessage({ 
      type: 'getSemanticTerms', 
      term, 
      pageContent 
    });
    
    if (searchId !== latestSearchId) return; // Stale search, discard results

    smartResults = results;
    searchBar.setSmartState('ready'); // Notify UI that smart results are ready
  }, 800);

  const performDeepScan = async (term: string, searchId: number) => {
    searchBar.setLoading(true);
    
    const pageText = document.body.innerText;
    const chunks = pageText.match(/[\s\S]{1,2000}/g) || [];
    let allMatches: string[] = [];

    for (const chunk of chunks) {
      if (searchId !== latestSearchId) return; // Check signal between chunks
      const matches = await chrome.runtime.sendMessage({ 
        type: 'getDescriptiveMatches', 
        textChunk: chunk, 
        description: term 
      });
      if (matches && matches.length > 0) {
        allMatches = allMatches.concat(matches);
      }
    }
    
    if (searchId !== latestSearchId) return; // Final check before applying highlights

    const total = highlightCategorized({ original: allMatches, semanticMatches: [] });
    searchBar.setResults(total, total > 0 ? 0 : -1);
    searchBar.setLoading(false);
  };

  searchBar.$on('search', (event) => {
    latestSearchId++;
    const currentSearchId = latestSearchId;
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
      predictiveSmartSearch(term, currentSearchId);
    }
    
    // Mode 3: Deep Scan (Descriptive Search)
    if (mode === 'deep' && term.split(' ').length > 3) {
      performDeepScan(term, currentSearchId);
    } else if (mode === 'deep') {
      // Fallback for short queries in deep mode
      const total = highlightCategorized({ original: [term], semanticMatches: [] });
      searchBar.setResults(total, total > 0 ? 0 : -1);
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