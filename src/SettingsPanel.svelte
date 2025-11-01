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

  {#if $appSettings.searchMode === 'basic' || $appSettings.searchMode === 'deep'}
    <div class="slider-container">
      <label for="relevance">Relevance</label>
      <input
        type="range"
        id="relevance"
        min="0.1"
        max="1"
        step="0.05"
        bind:value={$appSettings.relevanceThreshold}
      />
      <span>{typeof $appSettings.relevanceThreshold === 'number' ? $appSettings.relevanceThreshold.toFixed(2) : '...'}</span>
    </div>
  {/if}
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
  .slider-container {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 15px;
  }
  .slider-container label {
    font-size: 0.8rem;
    color: #aaa;
  }
  .slider-container input[type="range"] {
    flex-grow: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    background: rgba(37, 99, 235, 0.3);
    border-radius: 4px;
    outline: none;
    transition: background 0.3s;
  }
  .slider-container input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: #2563eb;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: transform 0.2s ease;
  }
  .slider-container input[type="range"]:hover::-webkit-slider-thumb {
    transform: scale(1.2);
  }
  .slider-container input[type="range"]:active::-webkit-slider-thumb {
    transform: scale(1.3);
  }
  .slider-container span {
    font-size: 0.8rem;
    color: #888;
    width: 30px;
    text-align: right;
  }
</style>