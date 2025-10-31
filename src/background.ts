// src/background.ts
import './modules/ai-types';
import { getSemanticTerms, initializeAiSession, getDescriptiveMatches } from './modules/semantic-engine';
import contentScript from './content?script';

// AI Session Pre-warming
chrome.runtime.onStartup.addListener(() => initializeAiSession());
chrome.runtime.onInstalled.addListener(() => initializeAiSession());

// Toggle UI on command
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-findable-search") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    // Inject the content script and send the message in the callback
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [contentScript],
    }, () => {
      if (chrome.runtime.lastError) {
        console.log(`Could not inject script into tab ${tab.id}: ${chrome.runtime.lastError.message}`);
        return;
      }
      // Now that we're sure the script is injected, send the message.
      chrome.tabs.sendMessage(tab.id, { type: 'toggle-findable-ui' });
    });
  }
});

// Inject content script on tab updates to ensure it's available
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [contentScript],
    }).catch(err => console.log('Error injecting script:', err));
  }
});

// Abort controllers to cancel in-progress AI requests
let semanticTermsController = new AbortController();
let descriptiveMatchesController = new AbortController();

// AI Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSemanticTerms') {
    // Abort any previous request and create a new controller
    semanticTermsController.abort();
    semanticTermsController = new AbortController();

    getSemanticTerms(request.term, request.pageContent, { signal: semanticTermsController.signal })
      .then(sendResponse)
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error("Error getting semantic terms:", error);
          sendResponse(null); // Or some default error response
        }
        // If it is an AbortError, we don't need to send a response.
      });
    return true; // Indicates we will respond asynchronously
  }

  if (request.type === 'getDescriptiveMatches') {
    // Abort any previous request and create a new controller
    descriptiveMatchesController.abort();
    descriptiveMatchesController = new AbortController();

    (async () => {
      const { pageContent, description } = request;
      const chunks = pageContent.match(/[\s\S]{1,2000}/g) || [];
      let allMatches = [];

      try {
        for (const chunk of chunks) {
          const matches = await getDescriptiveMatches(chunk, description, { signal: descriptiveMatchesController.signal });
          if (matches) {
            allMatches = allMatches.concat(matches);
          }
        }
        sendResponse(allMatches);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error in descriptive matches loop:", error);
          sendResponse(null); // Or some default error response
        }
        // If it is an AbortError, the loop is stopped, and we don't send a response.
      }
    })();
    return true; // Indicates we will respond asynchronously
  }
});

