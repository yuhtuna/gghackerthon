
// src/background.ts
import './modules/ai-types';
import contentScript from './content?script';
import offscreenDocumentUrl from './offscreen.html?url';

const readyTabs = new Set<number>();
const messageQueue = new Map<number, any[]>();

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
    if (readyTabs.has(tab.id)) {
        chrome.tabs.sendMessage(tab.id, { type: 'toggle-findable-ui' });
    } else {
        if (!messageQueue.has(tab.id)) {
            messageQueue.set(tab.id, []);
        }
        messageQueue.get(tab.id)?.push({ type: 'toggle-findable-ui' });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [contentScript],
        });
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

// AI Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'content-script-ready' && sender.tab?.id) {
    readyTabs.add(sender.tab.id);
    if (messageQueue.has(sender.tab.id)) {
        messageQueue.get(sender.tab.id)?.forEach(message => {
            chrome.tabs.sendMessage(sender.tab.id, message);
        });
        messageQueue.delete(sender.tab.id);
    }
    return;
  }

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
