import SearchBar from './SearchBar.svelte';

console.log("✅ Findable content script loaded!");

function main() {
  // Prevent the script from injecting the UI multiple times
  if (document.querySelector('.findable-search-bar-overlay')) {
    console.log("Findable UI is already on the page.");
    return;
  }
  
  console.log("Injecting Findable UI.");

  const target = document.createElement('div');
  document.body.appendChild(target);

  const searchBar = new SearchBar({
    target: target,
  });

  // Listen for the 'close' event from the Svelte component
  searchBar.$on('close', () => {
    // Clean up the DOM
    target.remove();
  });
}

main();
