<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  let searchTerm = '';
  let inputElement: HTMLInputElement;
  let searchResults: chrome.tabs.Tab[] = [];
  let allTabs: chrome.tabs.Tab[] = [];

  const dispatch = createEventDispatcher();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  };

  const searchTabs = () => {
    if (searchTerm.trim() === '') {
      searchResults = [];
      return;
    }

    searchResults = allTabs.filter(
      (tab) =>
        tab.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tab.url?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const switchToTab = (tabId: number) => {
    chrome.tabs.update(tabId, { active: true });
    dispatch('close');
  };

  onMount(async () => {
    inputElement.focus();
    window.addEventListener('keydown', handleKeyDown);
    allTabs = await chrome.tabs.query({});
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  $: searchTabs();
</script>

<div class="findable-search-bar-overlay" on:click={() => dispatch('close')}>
  <div class="findable-search-bar-container">
    <div class="findable-search-bar" on:click|stopPropagation>
      <input
        bind:this={inputElement}
        bind:value={searchTerm}
        type="text"
        placeholder="Search open tabs..."
      />
      <button on:click={() => dispatch('close')} class="close-button">X</button>
    </div>
    {#if searchResults.length > 0}
      <div class="search-results">
        <ul>
          {#each searchResults as result (result.id)}
            <li on:click={() => switchToTab(result.id!)}>
              <img src={result.favIconUrl} alt="" class="favicon" />
              <span>{result.title}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

<style>
  .findable-search-bar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 20vh;
    z-index: 9999;
  }

  .findable-search-bar-container {
    width: 500px;
    max-width: 90%;
  }

  .findable-search-bar {
    background-color: #2a2a2e;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    position: relative;
  }

  input[type="text"] {
    flex-grow: 1;
    background-color: transparent;
    border: none;
    color: #fff;
    font-size: 1.2rem;
    padding: 10px;
    outline: none;
  }

  .close-button {
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.5rem;
    position: absolute;
    top: 5px;
    right: 15px;
    cursor: pointer;
    transition: color 0.2s;
  }

  .close-button:hover {
    color: #fff;
  }

  .search-results {
    background-color: #333;
    border-radius: 0 0 10px 10px;
    margin-top: -10px;
    padding: 10px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 10px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 5px;
    transition: background-color 0.2s;
  }

  li:hover {
    background-color: #444;
  }

  .favicon {
    width: 16px;
    height: 16px;
    margin-right: 10px;
  }
</style>
