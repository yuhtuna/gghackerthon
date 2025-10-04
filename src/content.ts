import SearchBar from './SearchBar.svelte';

console.log("✅ Findable content script loaded!");

function main() {
  // Prevent the script from injecting the UI multiple times
  if (document.querySelector('#findable-extension-root')) {
    console.log("Findable UI is already on the page.");
    return;
  }
  
  console.log("Injecting Findable UI.");

  // Create a container with shadow DOM to isolate styles
  const container = document.createElement('div');
  container.id = 'findable-extension-root';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '0';
  container.style.height = '0';
  container.style.zIndex = '2147483647';
  
  // Attach shadow DOM
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  // Create target inside shadow DOM
  const target = document.createElement('div');
  shadowRoot.appendChild(target);
  
  // Append container to body
  document.body.appendChild(container);

  const searchBar = new SearchBar({
    target: target,
  });

  // Listen for the 'close' event from the Svelte component
  searchBar.$on('close', () => {
    // Clean up the DOM
    container.remove();
  });
}

main();
