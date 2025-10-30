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
    chrome.tabs.sendMessage(tab.id, { type: 'toggle-findable-ui' });
  }
});

// Inject content script on tab updates to ensure it's available
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [contentScript],
    }).catch(err => console.log('Error injecting script:', err));
  }
});

// AI Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSemanticTerms') {
    getSemanticTerms(request.term, request.pageContent).then(sendResponse);
    return true; // Indicates we will respond asynchronously
  }

  if (request.type === 'getDescriptiveMatches') {
    getDescriptiveMatches(request.textChunk, request.description).then(sendResponse);
    return true; // Indicates we will respond asynchronously
  }
});

