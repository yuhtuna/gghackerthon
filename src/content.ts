import type { DescriptiveMatch } from './modules/ai-types';
import SearchBar from './SearchBar.svelte';
import { highlightCategorized, clear, goToNext, goToPrev, goTo } from './highlighter';
import type { SemanticTerms } from './modules/semantic-engine';
import { appSettings } from './stores';
import { get } from 'svelte/store';
import { debounce } from './modules/utils';

function extractPdfText(): string | null {
  console.log('[Findable] Running PDF text extraction...');

  // --- Debugging Step 1: Log potential selectors ---
  const selectorsToTry = [
    'span[class*="textLayer"]', // The one we have
    '.textLayer span',           // A common pattern
    'div[data-page-number] span' // Another common pattern
  ];

  for (const selector of selectorsToTry) {
    const elements = document.querySelectorAll(selector);
    console.log(`[Findable] Found ${elements.length} elements with selector: "${selector}"`);
    if (elements.length > 0) {
      let fullText = '';
      elements.forEach(el => {
        fullText += (el as HTMLElement).innerText + ' ';
      });
      console.log('[Findable] Successfully extracted text from PDF structure.');
      return fullText;
    }
  }

  // --- Debugging Step 2: Check for iframes ---
  const iframes = document.querySelectorAll('iframe');
  if (iframes.length > 0) {
    console.log(`[Findable] Found ${iframes.length} iframe(s). The PDF might be inside one, which can block script access. This is a common issue.`);
  }

  // --- Debugging Step 3: Check for embedded PDFs ---
  const embed = document.querySelector('embed[type="application/pdf"]');
  if (embed) {
    console.log('[Findable] Found an <embed> tag for a PDF. Content is not accessible due to browser security.');
    return 'embedded_pdf';
  }

  console.log('[Findable] No known PDF text structure found on the page.');
  return null; // No known PDF structure found
}

function toggleFindableUI() {
  if (window.self === window.top) {
    // --- PERSONALITY 1: COMMANDER (Main Page) ---
    const existingRoot = document.querySelector('#findable-extension-root');
    if (existingRoot) {
      clear();
      existingRoot.remove();
      return;
    }
    
    const container = document.createElement('div');
    container.id = 'findable-extension-root';
    const shadowRoot = container.attachShadow({ mode: 'open' });
    
    const globalStyle = document.createElement('style');
    globalStyle.id = 'findable-highlight-styles';
    globalStyle.textContent = `
      mark.findable-highlight-original { background-color: rgba(253, 224, 71, 0.7) !important; color: #18181b !important; }
      mark.findable-highlight-semantic { background-color: rgba(134, 239, 172, var(--highlight-intensity, 0.5)) !important; color: #14532d !important; }
      mark.findable-highlight-sentence { background-color: rgba(147, 197, 253, 0.7) !important; color: #1e3a8a !important; }
      mark[class*="findable-highlight-"] { padding: 2px !important; border-radius: 3px !important; scroll-margin: 50vh !important; }
      mark.findable-highlight-current { box-shadow: 0 0 0 2px #60a5fa !important; background-color: #60a5fa !important; }
    `;
    shadowRoot.appendChild(globalStyle);

    const target = document.createElement('div');
    shadowRoot.appendChild(target);
    document.body.appendChild(container);

    const searchBar = new SearchBar({ target });

    let latestSearchId = 0;
    let iframeTextContent = '';
    let currentDeepScanTerm = '';
    let allMatches: DescriptiveMatch[] = [];

    const predictiveSmartSearch = debounce(async (term: string, searchId: number) => {
      searchBar.setLoading(true);
      const pageContent = iframeTextContent || document.body.innerText;
      const results: SemanticTerms = await chrome.runtime.sendMessage({
        type: 'getSemanticTerms',
        term,
        pageContent
      });
      
      if (searchId !== latestSearchId) return;

      if (results && results.semanticMatches) {
        const threshold = get(appSettings).relevanceThreshold;
        const filteredMatches = results.semanticMatches.filter(m => m.score >= threshold);

        const newTotal = highlightCategorized({
          original: [results.correctedTerm || term],
          semanticMatches: filteredMatches,
        });

        const mainFrame = frameResults.find(f => f.frame === window);
        if (mainFrame) mainFrame.count = newTotal;

        totalResults = frameResults.reduce((sum, f) => sum + f.count, 0);
        searchBar.setResults(totalResults, totalResults > 0 ? 0 : -1);
      }

      searchBar.setLoading(false);
    }, 800);

    const performDeepScan = async (description: string, searchId: number, isSubsequentScan = false) => {
      searchBar.setLoading(true);
      searchBar.showScanMoreButton(false);

      const pageText = iframeTextContent || extractPdfText() || document.body.innerText;

      const newMatches: DescriptiveMatch[] = await chrome.runtime.sendMessage({
        type: 'getDescriptiveMatches',
        pageContent: pageText,
        description
      });

      if (searchId !== latestSearchId) return;
      if (!newMatches) {
        searchBar.setLoading(false);
        searchBar.showScanMoreButton(true);
        return;
      }

      allMatches = allMatches.concat(newMatches);

      const threshold = get(appSettings).relevanceThreshold;
      const filteredMatches = allMatches.filter(m => m.relevanceScore >= threshold);

      const sentencesToHighlight = filteredMatches.map(m => ({ word: m.matchingSentence, score: m.relevanceScore }));
      const total = highlightCategorized({ original: [], semanticMatches: sentencesToHighlight, isSentence: true });

      searchBar.setResults(total, total > 0 ? 0 : -1);
      searchBar.setLoading(false);
      searchBar.showScanMoreButton(true);
    };

    let frameResults = [{ frame: window, count: 0 }];
    let totalResults = 0;
    let globalCurrentIndex = -1;

    // Listen for messages from soldier iframes
    window.addEventListener('message', (event) => {
      if (event.data.type === 'findable-text-content') {
        console.log('[Findable Commander] Received PDF text content from iframe');
        iframeTextContent = event.data.content;
      }
      
      if (event.data.type === 'findable-results') {
        console.log('[Findable Commander] Received results from iframe:', event.data.total);
        const frameSource = event.source as Window;
        const existingFrame = frameResults.find(f => f.frame === frameSource);
        if (existingFrame) {
          existingFrame.count = event.data.total;
        } else {
          frameResults.push({ frame: frameSource, count: event.data.total });
        }
        totalResults = frameResults.reduce((sum, f) => sum + f.count, 0);
        searchBar.setResults(totalResults, totalResults > 0 ? 0 : -1);
      }
    });

    searchBar.$on('scan_more', () => {
      const scrollContainer = document.querySelector('#viewerContainer') || document.documentElement;
      const beforeScroll = scrollContainer.scrollTop;

      scrollContainer.scrollBy({ top: window.innerHeight * 1.5, behavior: 'smooth' });

      // A small delay to allow new content to render after scroll
      setTimeout(() => {
        const afterScroll = scrollContainer.scrollTop;
        if (afterScroll > beforeScroll) {
          if (currentDeepScanTerm) {
            performDeepScan(currentDeepScanTerm, latestSearchId, true);
          }
        } else {
          // End of page reached
          searchBar.showScanMoreButton(false);
        }
      }, 500);
    });

    searchBar.$on('search', (event) => {
      latestSearchId++;
      const currentSearchId = latestSearchId;
      const { term } = event.detail;
      const mode = get(appSettings).searchMode;
      
      clear();
      searchBar.setLoading(false);
      searchBar.showScanMoreButton(false);

      frameResults = [{ frame: window, count: 0 }];
      totalResults = 0;
      globalCurrentIndex = -1;

      if (!term) {
        searchBar.setResults(0, -1);
        return;
      }

      // Send order to all iframes
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          iframe.contentWindow?.postMessage({ 
            type: 'findable-search', 
            term, 
            mode,
            searchId: currentSearchId 
          }, '*');
        } catch (e) {
          console.error('[Findable Commander] Could not send message to iframe:', e);
        }
      }

      // Also search on main page
      if (mode === 'find' || mode === 'basic' || mode === 'deep') {
        const mainFrameCount = highlightCategorized({ original: [term], semanticMatches: [] });
        const mainFrame = frameResults.find(f => f.frame === window);
        if (mainFrame) mainFrame.count = mainFrameCount;

        totalResults = frameResults.reduce((sum, f) => sum + f.count, 0);
        searchBar.setResults(totalResults, totalResults > 0 ? 0 : -1);
      }
      
      if (mode === 'basic') {
        predictiveSmartSearch(term, currentSearchId);
      }
      
      if (mode === 'deep') {
        allMatches = []; // Reset for new deep scan
        currentDeepScanTerm = term;
        performDeepScan(term, currentSearchId);
      }

      if (get(appSettings).extractImageInfo) {
        console.log('[Findable] Image extraction enabled.');
        document.querySelectorAll('img').forEach(async (img) => {
          if (!img.src || !img.src.startsWith('http')) {
            return;
          }
          try {
            // Fetch the image and get it as a blob
            const response = await fetch(img.src);
            if (!response.ok) {
                // Silently ignore failed fetches for now
                return;
            }
            const blob = await response.blob();

            // Send blob to background script for analysis
            const analysis = await chrome.runtime.sendMessage({
              type: 'extractImageInfo',
              imageData: blob,
              prompt: term,
            });

            console.log(`[Findable] Analysis for ${img.src}:`, analysis);

          } catch (error) {
              // Silently ignore failed fetches
          }
        });
      }
    });

    
    searchBar.$on('next', () => {
      if (totalResults === 0) return;
      globalCurrentIndex = (globalCurrentIndex + 1) % totalResults;
      updateGlobalHighlight();
    });

    searchBar.$on('prev', () => {
      if (totalResults === 0) return;
      globalCurrentIndex = (globalCurrentIndex - 1 + totalResults) % totalResults;
      updateGlobalHighlight();
    });

    function updateGlobalHighlight() {
      let cumulative = 0;
      for (const frame of frameResults) {
        if (globalCurrentIndex < cumulative + frame.count) {
          const localIndex = globalCurrentIndex - cumulative;
          if (frame.frame === window) {
            goToNext(localIndex);
          } else {
            (frame.frame as Window).postMessage({ type: 'findable-goto', index: localIndex }, '*');
          }
          // Clear highlights in other frames
          for (const otherFrame of frameResults) {
            if (otherFrame !== frame) {
              if (otherFrame.frame === window) {
                clear();
              } else {
                (otherFrame.frame as Window).postMessage({ type: 'findable-clear' }, '*');
              }
            }
          }
          break;
        }
        cumulative += frame.count;
      }
      searchBar.setResults(totalResults, globalCurrentIndex);
    }

    searchBar.$on('close', () => {
      clear();
      
      // Send close command to iframes
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          iframe.contentWindow?.postMessage({ type: 'findable-clear' }, '*');
        } catch (e) {
          console.error('[Findable Commander] Could not send clear to iframe:', e);
        }
      }
      
      globalStyle.remove();
      container.remove();
    });
    
  } else {
    // --- PERSONALITY 2: SOLDIER (iframe) ---
    console.log('[Findable Soldier] Running in iframe, listening for orders...');
    
    window.addEventListener('message', (event) => {
      if (event.data.type === 'findable-search') {
        console.log('[Findable Soldier] Received search order:', event.data.term);
        const { term, mode } = event.data;
        
        // Extract PDF text and send it back to commander
        const pdfText = extractPdfText();
        if (pdfText) {
          console.log('[Findable Soldier] Extracted PDF text, sending to commander...');
          window.parent.postMessage({ 
            type: 'findable-text-content', 
            content: pdfText 
          }, '*');
        }
        
        clear();
        
        if (mode === 'find') {
          const total = highlightCategorized({ original: [term], semanticMatches: [] });
          window.parent.postMessage({ type: 'findable-results', total }, '*');
        }
        
        if (mode === 'basic') {
          const total = highlightCategorized({ original: [term], semanticMatches: [] });
          window.parent.postMessage({ type: 'findable-results', total }, '*');
        }
        
        if (mode === 'deep') {
          const total = highlightCategorized({ original: [term], semanticMatches: [] });
          window.parent.postMessage({ type: 'findable-results', total }, '*');
        }
      }
      
      if (event.data.type === 'findable-next') {
        goToNext();
      }
      
      if (event.data.type === 'findable-prev') {
        goToPrev();
      }

      if (event.data.type === 'findable-goto') {
        goTo(event.data.index);
      }
      
      if (event.data.type === 'findable-clear') {
        clear();
      }
    });
  }
}

// Ensure the script's main logic runs only once
if (!(window as any).findableContentScriptLoaded) {
  (window as any).findableContentScriptLoaded = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'toggle-findable-ui') {
      toggleFindableUI();
      sendResponse({ success: true });
    }
    return true; // Keep the message channel open for async response
  });
}
