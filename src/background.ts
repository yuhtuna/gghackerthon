// src/background.ts
import './modules/ai-types';
import { getSemanticTerms, initializeAiSession } from './modules/semantic-engine';
import contentScript from './content?script';

// AI Session Pre-warming
chrome.runtime.onStartup.addListener(() => initializeAiSession());
chrome.runtime.onInstalled.addListener(() => initializeAiSession());

// Inject UI on command
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-findable-search") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [contentScript],
    });
  }
});

// AI Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSemanticTerms') {
    // THE FIX: Pass the 'options' object from the request to the engine
    getSemanticTerms(request.term, request.options).then(sendResponse);
    return true; // Indicates we will respond asynchronously
  }
});

