
// src/offscreen.ts
import { initializeAiSession, getSemanticTerms, getDescriptiveMatches } from './modules/semantic-engine';

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
    (async () => {
      try {
        if (await chrome.ai.canCreateTextSession() !== 'readily') {
          console.log('[Findable] AI Text Session not available.');
          sendResponse({ error: 'AI not available' });
          return;
        }

        const session = await chrome.ai.createTextSession();
        const { imageData, prompt } = request;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64ImageData = reader.result;
            const result = await session.prompt(`data:image/jpeg;base64,${base64ImageData} ${prompt}`);
            sendResponse(result);
        };
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            sendResponse({ error: "Failed to read image data." });
        };
        reader.readAsDataURL(imageData);

      } catch (error) {
        console.error("Error extracting image info:", error);
        sendResponse({ error: 'Failed to extract image info' });
      }
    })();
    return true;
  }
});

initializeAiSession();

// Signal to the background script that the offscreen document is ready
chrome.runtime.sendMessage({ type: 'offscreen-ready' });
