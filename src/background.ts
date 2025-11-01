
// src/background.ts
import './modules/ai-types';
import contentScript from './content?script';
import offscreenDocumentUrl from './offscreen.html?url';

let creating: Promise<void> | null; // A promise that resolves when the offscreen document is created

async function setupOffscreenDocument(path: string) {
  // Check if we have an existing document.
  // @ts-ignore
  if (await chrome.offscreen.hasDocument()) {
    return;
  }

  // Create the document if we don't have one.
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.LOCAL_STORAGE],
      justification: 'To access the chrome.ai API which is not available in service workers',
    });
    await creating;
    creating = null;
  }
}

// AI Session Pre-warming
chrome.runtime.onStartup.addListener(() => setupOffscreenDocument(offscreenDocumentUrl));
chrome.runtime.onInstalled.addListener(() => setupOffscreenDocument(offscreenDocumentUrl));

// A robust function to send a message to a tab, with retries.
async function sendMessageToTabWithRetries(tabId: number, message: any, retries = 3, delay = 100) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, message);
            if (response && response.success) {
                return;
            }
        } catch (error) {
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error("Failed to send message to tab after multiple retries:", error);
                throw error;
            }
        }
    }
}

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
      sendMessageToTabWithRetries(tab.id, { type: 'toggle-findable-ui' });
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

// AI Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSemanticTerms' || request.type === 'getDescriptiveMatches' || request.type === 'extractImageInfo') {
    (async () => {
      await setupOffscreenDocument(offscreenDocumentUrl);
      // @ts-ignore
      const response = await chrome.runtime.sendMessage({ ...request, target: 'offscreen' });
      sendResponse(response);
    })();
    return true;
  }
});
