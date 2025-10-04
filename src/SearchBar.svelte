<!-- src/SearchBar.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  let barElement: HTMLDivElement;
  let inputElement: HTMLInputElement;
  let searchTerm = '';
  let searchResults: chrome.tabs.Tab[] = [];
  let allTabs: chrome.tabs.Tab[] = [];
  let selectedIndex = 0;

  const dispatch = createEventDispatcher();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dispatch('close');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % searchResults.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = (selectedIndex - 1 + searchResults.length) % searchResults.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selectedTab = searchResults[selectedIndex];
      switchToTab(selectedTab?.id);
    }
  };

  const searchTabs = () => {
    if (searchTerm.trim() === '') {
      searchResults = allTabs;
    } else {
      searchResults = allTabs.filter(
        (tab) =>
          tab.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tab.url?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    selectedIndex = 0;
  };

  const switchToTab = (tabId: number | undefined) => {
    if (tabId) {
      chrome.tabs.update(tabId, { active: true });
      chrome.tabs.get(tabId, (tab) => {
        if (tab.windowId) {
          chrome.windows.update(tab.windowId, { focused: true });
        }
      });
      dispatch('close');
    }
  };

  onMount(async () => {
    inputElement.focus();
    window.addEventListener('keydown', handleKeyDown, true);
    allTabs = await chrome.tabs.query({});
    searchResults = allTabs;
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown, true);
  });

  $: searchTabs();

</script>

<div class="overlay" on:click={() => dispatch('close')}>
  <div class="findable-container" on:click|stopPropagation>
      <div class="input-wrapper">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
        <input
          bind:this={inputElement}
          bind:value={searchTerm}
          type="text"
          placeholder="Search tabs..."
        />
        <button class="close-button" on:click={() => dispatch('close')}>
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
        </button>
      </div>

      {#if searchResults.length > 0}
        <div class="results-separator"></div>
        <ul class="search-results">
            {#each searchResults as result, i (result.id)}
              <li class:selected={i === selectedIndex} on:click={() => switchToTab(result.id)} on:mouseenter={() => selectedIndex = i}>
                <img src={result.favIconUrl || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='} alt="" class="favicon" />
                <div class="tab-info">
                  <span class="title">{result.title}</span>
                </div>
              </li>
            {/each}
        </ul>
      {/if}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');

  .overlay {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(10px) saturate(120%);
    -webkit-backdrop-filter: blur(10px) saturate(120%);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    z-index: 2147483647;
  }

  .findable-container {
    width: 600px;
    margin-top: 20vh;
    background: rgba(40,40,40,0.7);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    overflow: hidden;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    padding: 5px 10px 5px 15px;
  }

  .search-icon {
    width: 18px;
    height: 18px;
    color: #777;
    margin-right: 12px;
  }

  input[type="text"] {
    flex-grow: 1;
    background: none;
    border: none;
    outline: none;
    color: #eee;
    font-size: 1.25rem;
    padding: 15px 0;
    font-family: inherit;
  }

  input::placeholder {
    color: #777;
  }
  
  .close-button {
      background: transparent;
      border: none;
      border-radius: 50%;
      color: #888;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.15s ease;
  }

  .close-button:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
  }

  .close-button svg {
      width: 16px;
      height: 16px;
  }

  .results-separator {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  .search-results {
    list-style: none;
    margin: 0;
    padding: 8px;
    max-height: 350px;
    overflow-y: auto;
  }

  li {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: default;
    color: #ddd;
    transition: background-color 0.1s ease, color 0.1s ease;
  }

  li.selected {
    background-color: #007aff;
    color: #fff;
  }

  .favicon {
    width: 16px;
    height: 16px;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .tab-info {
    overflow: hidden;
  }

  .title {
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    color: inherit;
  }

</style>