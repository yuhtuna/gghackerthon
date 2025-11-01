
// src/background.ts
import './modules/ai-types';
import contentScript from './content?script';
import offscreenDocumentUrl from './offscreen.html?url';

const readyTabs = new Set<number>();
const messageQueue = new Map<number, any[]>();

let creating: Promise<void> | null;
let isOffscreenReady = false;
const offscreenQueue: { request: any; sendResponse: (response?: any) => void }[] = [];

async function setupOffscreenDocument(path: string) {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }

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

function processOffscreenQueue() {
  while (offscreenQueue.length > 0) {
    const { request, sendResponse } = offscreenQueue.shift()!;
    chrome.runtime.sendMessage({ ...request, target: 'offscreen' })
      .then(sendResponse)
      .catch(error => {
        console.error('Error sending message from queue to offscreen document:', error);
        sendResponse({ error: 'Failed to communicate with offscreen document after queuing.' });
      });
  }
}

async function forwardToOffscreen(request: any, sendResponse: (response?: any) => void) {
  if (!isOffscreenReady) {
    offscreenQueue.push({ request, sendResponse });
    await setupOffscreenDocument(offscreenDocumentUrl);
  } else {
    try {
      const response = await chrome.runtime.sendMessage({ ...request, target: 'offscreen' });
      sendResponse(response);
    } catch (error: any) {
      if (error.message === 'Could not establish connection. Receiving end does not exist.') {
        console.log('Offscreen document disconnected. Re-queuing and setting up again.');
        isOffscreenReady = false;
        offscreenQueue.push({ request, sendResponse });
        await setupOffscreenDocument(offscreenDocumentUrl);
      } else {
        console.error('Error forwarding message to offscreen document:', error);
        sendResponse({ error: 'Failed to communicate with offscreen document.' });
      }
    }
  }
}

chrome.runtime.onStartup.addListener(() => setupOffscreenDocument(offscreenDocumentUrl));
chrome.runtime.onInstalled.addListener(() => setupOffscreenDocument(offscreenDocumentUrl));

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [contentScript],
    }).catch(err => console.log('Error injecting script:', err));
  }
});

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

  if (request.type === 'offscreen-ready') {
    isOffscreenReady = true;
    processOffscreenQueue();
    return;
  }

  if (request.type === 'getSemanticTerms' || request.type === 'getDescriptiveMatches' || request.type === 'extractImageInfo') {
    forwardToOffscreen(request, sendResponse);
    return true;
  }

  return false;
});
