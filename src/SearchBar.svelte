<!-- src/SearchBar.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  let inputElement: HTMLInputElement;
  let searchTerm = '';

  const dispatch = createEventDispatcher();

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    // Announce that a search has been requested
    dispatch('search', { term: searchTerm });
    return false;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      dispatch('close');
    }
  };

  const handleClose = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch('close');
  };

  onMount(async () => {
    inputElement.focus();
    window.addEventListener('keydown', handleKeyDown, true);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown, true);
  });

</script>

<div class="overlay" on:click={handleClose}>
  <div class="findable-container" on:click|stopPropagation>
      <form class="input-wrapper" on:submit={handleSubmit}>
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
        <input
          bind:this={inputElement}
          bind:value={searchTerm}
          type="text"
          placeholder="Search this page..."
        />
        <button type="button" class="close-button" on:click={handleClose}>
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
        </button>
      </form>
      <!-- Results will be re-implemented for in-page search later -->
  </div>
</div>

<style>
  /* Styles remain the same, they are excellent */
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
    margin: 0;
    border: none;
    background: none;
    width: 100%;
    box-sizing: border-box;
  }

  .search-icon {
    width: 18px !important;
    height: 18px !important;
    min-width: 18px;
    min-height: 18px;
    max-width: 18px;
    max-height: 18px;
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
      min-width: 28px;
      min-height: 28px;
      max-width: 28px;
      max-height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.15s ease;
      padding: 0;
      margin: 0;
  }

  .close-button:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
  }

  .close-button svg {
      width: 16px !important;
      height: 16px !important;
      min-width: 16px;
      min-height: 16px;
      max-width: 16px;
      max-height: 16px;
  }
</style>
