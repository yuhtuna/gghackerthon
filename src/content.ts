console.log("✅ Findable content script loaded!");

// This function will be the entry point for all our page-related logic
function main() {
  console.log("Findable main() executed.");
  // Later, this is where we will inject our Svelte UI component.
}

// Ensure the main function runs only once
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}