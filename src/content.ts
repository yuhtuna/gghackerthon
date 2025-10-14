import App from './ui/App.svelte';

let appInstance: any = null;

function initWebNanoUI() {
  const existingRoot = document.querySelector('#webnano-extension-root');
  if (existingRoot) {
    return; // Already initialized
  }
  
  // Create container directly in document (not shadow DOM) so position:fixed works
  const container = document.createElement('div');
  container.id = 'webnano-extension-root';
  // Allow all pointer events to pass through to the website (only children with pointer-events:auto will be clickable)
  container.style.cssText = 'all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;';
  
  const target = document.createElement('div');
  target.style.cssText = 'width: 100%; height: 100%; pointer-events: none;';
  container.appendChild(target);

  appInstance = new App({ target });

  document.body.appendChild(container);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWebNanoUI);
} else {
  initWebNanoUI();
}

// Listen for toggle command
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'toggle-chat') {
    // Dispatch custom event to App component
    window.dispatchEvent(new CustomEvent('webnano-toggle-chat'));
  }
});
