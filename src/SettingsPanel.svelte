<script lang="ts">
  import { appSettings, type SearchMode } from './stores';

  const setMode = (mode: SearchMode) => {
    appSettings.update(settings => ({ ...settings, searchMode: mode }));
  };

  const descriptions = {
    find: 'A standard, instant search for the exact text you type.',
    basic: 'Finds your term plus synonyms and related words in the background.',
    deep: 'Full page analysis for context, descriptions, and summaries. (Slower)',
  };
</script>

<div class="settings-panel">
  <div class="mode-selector">
    <button class="mode-button" class:active={$appSettings.searchMode === 'find'} on:click={() => setMode('find')}>
      Find
    </button>
    <button class="mode-button" class:active={$appSettings.searchMode === 'basic'} on:click={() => setMode('basic')}>
      Basic
    </button>
    <button class="mode-button" class:active={$appSettings.searchMode === 'deep'} on:click={() => setMode('deep')}>
      Deep
    </button>
  </div>
  <p class="mode-description">{descriptions[$appSettings.searchMode]}</p>
</div>

<style>
  .settings-panel {
    padding: 15px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  .mode-selector {
    display: flex;
    background-color: rgba(0,0,0,0.2);
    border-radius: 8px;
    padding: 4px;
  }
  .mode-button {
    flex: 1;
    padding: 8px 12px;
    background: none;
    border: none;
    color: #aaa;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .mode-button:hover {
    background-color: rgba(255,255,255,0.05);
  }
  .mode-button.active {
    background-color: #3b82f6;
    color: white;
  }
  .mode-description {
    font-size: 0.8rem;
    color: #888;
    text-align: center;
    margin: 12px 0 0;
  }
</style>