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

  const handleWindowKeyDown = (event: KeyboardEvent) => {
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

  const handleWindowClick = (event: MouseEvent) => {
      if (barElement && !barElement.contains(event.target as Node)) {
          dispatch('close');
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
    window.addEventListener('keydown', handleWindowKeyDown, true);
    // Use a timeout to prevent the click that opened the bar from immediately closing it
    setTimeout(() => window.addEventListener('click', handleWindowClick), 0);

    allTabs = await chrome.tabs.query({});
    searchResults = allTabs;
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleWindowKeyDown, true);
    window.removeEventListener('click', handleWindowClick);
  });

  $: searchTabs();

</script>

<div class="findable-bar" bind:this={barElement}>
    <div class="input-wrapper">
      <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
      <input
        bind:this={inputElement}
        bind:value={searchTerm}
        type="text"
        placeholder="Search tabs..."
      />
      <button class="close-button" on:click={() => dispatch('close')}>Done</button>
    </div>

    {#if searchResults.length > 0}
      <div class="results-separator"></div>
      <ul class="search-results">
          {#each searchResults as result, i (result.id)}
            <li class:selected={i === selectedIndex} on:click={() => switchToTab(result.id)} on:mouseenter={() => selectedIndex = i}>
              <img src={result.favIconUrl || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='} alt="Tab favicon" class="favicon" />
              <div class="tab-info">
                <span class="title">{result.title}</span>
                <span class="url">{result.url}</span>
              </div>
            </li>
          {/each}
      </ul>
    {/if}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');

  .findable-bar {
    position: fixed;
    top: 60px;
    right: 60px;
    width: 480px;
    max-height: 500px;
    display: flex;
    flex-direction: column;
    background: rgba(45, 45, 45, 0.6);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    font-family: 'Inter', sans-serif;
    z-index: 2147483647;
    color: #f0f0f0;
    overflow: hidden;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    padding: 8px;
    flex-shrink: 0;
  }

  .search-icon {
    width: 20px;
    height: 20px;
    color: #999;
    margin: 0 8px 0 10px;
  }

  input[type="text"] {
    flex-grow: 1;
    background: none;
    border: none;
    outline: none;
    color: #fff;
    font-size: 1rem;
    padding: 8px;
    font-family: 'Inter', sans-serif;
  }

  input::placeholder {
    color: #888;
  }

  .close-button {
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 6px;
    color: #ddd;
    font-size: 0.8rem;
    font-weight: 500;
    padding: 6px 12px;
    margin-right: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .close-button:hover {
    background: rgba(255,255,255,0.2);
  }

  .results-separator {
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
    margin: 0 8px;
  }

  .search-results {
    list-style: none;
    margin: 0;
    padding: 8px;
    overflow-y: auto;
  }

  li {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    color: #ccc;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  li.selected {
    background: rgba(0, 122, 255, 0.8);
    color: #fff;
  }

  .favicon {
    width: 18px;
    height: 18px;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .tab-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    line-height: 1.3;
  }

  .title {
    font-size: 0.9rem;
    font-weight: 500;
    color: inherit; /* Inherits from li */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  li.selected .title {
      color: #fff;
  }

  .url {
    font-size: 0.75rem;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  li.selected .url {
      color: rgba(255,255,255,0.7);
  }
</style>