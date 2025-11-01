
// src/background.ts
import './modules/ai-types';
import contentScript from './content?script';
import offscreenDocumentUrl from './offscreen.html?url';

let creating: Promise<void> | null; // A promise that resolves when the offscreen document is created
let offscreenReady = false;
const messageQueue: any[] = [];

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

function processQueue() {
  while (messageQueue.length > 0) {
    const { request, port } = messageQueue.shift();
    (async () => {
      try {
        await setupOffscreenDocument(offscreenDocumentUrl);
        // @ts-ignore
        const response = await chrome.runtime.sendMessage({ ...request, target: 'offscreen' });
        port.postMessage({ type: `${request.type}-response`, ...response });
      } catch (error) {
        console.error("Error processing message from queue:", error);
        port.postMessage({ type: `${request.type}-response`, error: 'Failed to process request in offscreen document' });
      }
    })();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'offscreen-ready') {
    offscreenReady = true;
    processQueue();
  }
  return true;
});


// AI Session Pre-warming
chrome.runtime.onStartup.addListener(() => setupOffscreenDocument(offscreenDocumentUrl));
chrome.runtime.onInstalled.addListener(() => setupOffscreenDocument(offscreenDocumentUrl));

// Toggle UI on command
chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "open-findable-search") return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
        // First, try sending a message to check if the content script is already there.
        chrome.tabs.sendMessage(tab.id, { type: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
                // If it fails, the script is not injected. Inject and then send the toggle command.
                console.log('[Findable] Content script not found, injecting...');
                chrome.scripting.executeScript({
                    target: { tabId: tab.id! },
                    files: [contentScript],
                }).then(() => {
                    // After injecting, send the message to toggle the UI.
                    chrome.tabs.sendMessage(tab.id!, { type: 'toggle-findable-ui' });
                }).catch(err => console.error('[Findable] Error injecting script on command:', err));
            } else {
                // If the script is already there, just send the toggle command.
                chrome.tabs.sendMessage(tab.id!, { type: 'toggle-findable-ui' });
            }
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

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "content-script") {
        port.onMessage.addListener((request) => {
          if (offscreenReady) {
            (async () => {
                try {
                    await setupOffscreenDocument(offscreenDocumentUrl);
                    // @ts-ignore
                    const response = await chrome.runtime.sendMessage({ ...request, target: 'offscreen' });
                    port.postMessage({ type: `${request.type}-response`, ...response });
                } catch (error) {
                    console.error("Error sending message to offscreen document:", error);
                    port.postMessage({ type: `${request.type}-response`, error: 'Failed to communicate with offscreen document' });
                }
            })();
          } else {
            messageQueue.push({ request, port });
          }
        });
    }
});
