<!-- src/SearchBar.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import SettingsPanel from './SettingsPanel.svelte';
  import { fade } from 'svelte/transition';

  let inputElement: HTMLInputElement;
  let searchTerm = '';
  let resultCount = 0;
  let currentIndex = -1; // Start at -1 to correctly show "1 / total" on first match
  let isLoading = false;

  let showSettings = false;

  const dispatch = createEventDispatcher();

  // Expose a method to be called from the content script
  export function setResults(total: number, current: number) {
    resultCount = total;
    currentIndex = current;
  }

  // Expose a method to set loading state
  export function setLoading(loading: boolean) {
    isLoading = loading;
  }

  const handleInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // On Enter, go to the next result if a search is active
      if (resultCount > 0) {
        // Use event.shiftKey to decide direction
        if (event.shiftKey) {
          goToPrev();
        } else {
          goToNext();
        }
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    dispatch('search', { term: searchTerm });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  };

  const handleClose = () => {
    dispatch('close');
  };

  const toggleSettings = () => {
    showSettings = !showSettings;
  };

  const goToNext = () => {
    if (resultCount > 0) dispatch('next');
  };

  const goToPrev = () => {
    if (resultCount > 0) dispatch('prev');
  };

  onMount(async () => {
    inputElement.focus();
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<!-- The overlay is removed, this container is now the root element -->
<div class="findable-container">
  <div class="input-wrapper">
    <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
    <input
      bind:this={inputElement}
      bind:value={searchTerm}
      type="text"
      placeholder="Search this page..."
      on:keydown={handleInputKeyDown}
      on:input={handleSubmit}
    />
    
    <!-- Status area (Loading Spinner or Results Count) -->
    <div class="status-area">
      {#if isLoading}
        <div class="loading-spinner" title="Searching for semantic matches...">
          <svg class="spinner" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="25.133" stroke-dashoffset="25.133">
              <animate attributeName="stroke-dasharray" dur="1.5s" values="0 25.133;12.566 12.566;0 25.133" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-12.566;-25.133" repeatCount="indefinite"/>
            </svg>
          </div>
      {:else if searchTerm && resultCount > 0}
        <span class="result-count">{currentIndex + 1} / {resultCount}</span>
      {:else if searchTerm}
        <span class="result-count">0 / 0</span>
      {/if}
    </div>

    <!-- Navigation Buttons -->
    <button type="button" class="icon-button" on:click={goToPrev} disabled={resultCount === 0} title="Previous result">
      <!-- Corrected "Chevron Left" Icon -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" /></svg>
    </button>
    <button type="button" class="icon-button" on:click={goToNext} disabled={resultCount === 0} title="Next result">
      <!-- Corrected "Chevron Right" Icon -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
    </button>
    
    <button type="button" class="icon-button settings-button" on:click={toggleSettings} title="Settings">
      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
    </button>
    <button type="button" class="icon-button close-button" on:click={handleClose} title="Close">
      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
    </button>
  </div>
  
  {#if showSettings}
    <div class="settings-panel-wrapper" transition:fade={{ duration: 150 }}>
      <SettingsPanel />
    </div>
  {/if}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');

  :global(#findable-extension-root) {
    pointer-events: none; /* Let clicks pass through the container */
  }

  .findable-container {
    pointer-events: auto; /* But allow interaction with our UI */
    position: fixed;
    top: 20px;
    right: 20px;
    width: 450px; /* A bit smaller to be less intrusive */
    z-index: 2147483647;
    background: rgba(40,40,40,0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    padding: 5px 10px 5px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .search-icon {
    width: 18px !important;
    height: 18px !important;
    color: #777;
    margin-right: 12px;
    flex-shrink: 0;
  }

  input[type="text"] {
    flex-grow: 1;
    background: none;
    border: none;
    outline: none;
    color: #eee;
    font-size: 1.1rem; /* Slightly smaller for the compact view */
    padding: 10px 0;
    font-family: inherit;
  }

  input::placeholder {
    color: #777;
  }

  .status-area {
    width: 60px; /* Fixed width to prevent any layout shifts */
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .result-count {
    color: #888;
    font-size: 0.8rem;
    user-select: none;
    text-align: center;
    width: 100%;
  }

  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .spinner {
    width: 20px;
  height: 20px;
    color: #525862ff;
    flex-shrink: 0;
  }
  
  .icon-button {
      background: transparent;
      border: none;
      border-radius: 50%;
      color: #888;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s ease;
      padding: 0;
      margin: 0 1px;
  }

  .icon-button:disabled {
    color: #555;
    cursor: not-allowed;
  }

  .icon-button:not(:disabled):hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
  }

  .icon-button svg {
      width: 16px !important;
      height: 16px !important;
  }
  
  .settings-panel-wrapper {
    /* No changes needed here, it will still pop out below the search bar */
  }
</style>

