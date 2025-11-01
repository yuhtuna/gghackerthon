
// src/offscreen.ts
import { initializeAiSession, getSemanticTerms, getDescriptiveMatches, analyzeImage } from './modules/semantic-engine';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.target !== 'offscreen') {
    return;
  }

  if (request.type === 'getSemanticTerms') {
    getSemanticTerms(request.term, request.pageContent, { signal: new AbortController().signal })
      .then(sendResponse)
      .catch(error => {
        console.error("Error getting semantic terms in offscreen document:", error);
        sendResponse(null);
      });
    return true;
  }

  if (request.type === 'getDescriptiveMatches') {
    (async () => {
      const { pageContent, description } = request;
      const chunks = pageContent.match(/[\s\S]{1,2000}/g) || [];
      let allMatches = [];

      try {
        for (const chunk of chunks) {
          const matches = await getDescriptiveMatches(chunk, description, { signal: new AbortController().signal });
          if (matches) {
            allMatches = allMatches.concat(matches);
          }
        }
        sendResponse(allMatches);
      } catch (error) {
        console.error("Error in descriptive matches loop in offscreen document:", error);
        sendResponse(null);
      }
    })();
    return true;
  }

  if (request.type === 'extractImageInfo') {
    analyzeImage(request.imageData, request.prompt)
      .then(sendResponse)
      .catch(error => {
        console.error("Error analyzing image in offscreen document:", error);
        sendResponse({ error: 'Failed to analyze image.' });
      });
    return true;
  }
});

(async () => {
  await initializeAiSession();
  chrome.runtime.sendMessage({ type: 'offscreen-ready' });
})();
