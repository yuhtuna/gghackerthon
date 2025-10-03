<script lang="ts">
  import SearchBar from './SearchBar.svelte';
  import { onMount, onDestroy } from 'svelte';

  let showSearchBar = false;

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
      event.preventDefault();
      showSearchBar = !showSearchBar;
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

{#if showSearchBar}
  <SearchBar on:close={() => (showSearchBar = false)} />
{/if}

<main>
  <h1>Findable</h1>
  <p>Press Ctrl+Shift+F (or Cmd+Shift+F on Mac) to open the search bar.</p>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
    color: #fff;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
