// src/background.ts
import './modules/ai-types';
import { getSemanticTerms, initializeAiSession } from './modules/semantic-engine';

// AI Session Pre-warming
chrome.runtime.onStartup.addListener(() => initializeAiSession());
chrome.runtime.onInstalled.addListener(() => initializeAiSession());

// Toggle chat on command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-webnano-assistant" || command === "toggle-chat") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
      // Send message to content script to toggle chat
      chrome.tabs.sendMessage(tab.id, { type: 'toggle-chat' }).catch(() => {
        // Content script might not be loaded yet, ignore error
      });
    }
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

