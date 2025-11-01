
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

// Toggle UI on command
chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "open-findable-search") return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
        try {
            chrome.tabs.sendMessage(tab.id, { type: 'toggle-findable-ui' });
        } catch (error) {
            console.error("Failed to send toggle-findable-ui message:", error);
        }
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

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "content-script") {
        port.onMessage.addListener((request) => {
            (async () => {
                await setupOffscreenDocument(offscreenDocumentUrl);
                // @ts-ignore
                const response = await chrome.runtime.sendMessage({ ...request, target: 'offscreen' });
                port.postMessage({ type: `${request.type}-response`, ...response });
            })();
        });
    }
});
