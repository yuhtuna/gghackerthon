
// src/background.ts
import './modules/ai-types';
import contentScript from './content?script';

let offscreenDocumentPath = 'src/offscreen.html';

async function hasOffscreenDocument() {
    // @ts-ignore
    const clients = await self.clients.matchAll();
    return clients.some(client => client.url.endsWith(offscreenDocumentPath));
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        return;
    }
    await chrome.offscreen.createDocument({
        url: offscreenDocumentPath,
        reasons: [chrome.offscreen.Reason.LOCAL_STORAGE],
        justification: 'To access the chrome.ai API which is not available in service workers'
    });
}

// AI Session Pre-warming
chrome.runtime.onStartup.addListener(() => setupOffscreenDocument());
chrome.runtime.onInstalled.addListener(() => setupOffscreenDocument());

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
  if (request.type === 'getSemanticTerms' || request.type === 'getDescriptiveMatches' || request.type === 'extractImageInfo') {
    (async () => {
        await setupOffscreenDocument();
        const response = await chrome.runtime.sendMessage(request);
        sendResponse(response);
    })();
    return true;
  }
});
