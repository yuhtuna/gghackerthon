<!-- src/SettingsPanel.svelte -->
<script lang="ts">
  import { searchOptions } from './stores';

  const toggleOption = (option: keyof typeof $searchOptions) => {
    searchOptions.update(options => ({
      ...options,
      [option]: !options[option]
    }));
  };
</script>

<div class="settings-panel">
  <div class="settings-grid">
    <!-- Synonyms -->
    <div class="setting-item">
      <label for="synonyms-toggle" class="setting-label">
        <span class="label-text">Synonyms</span>
        <span class="label-description">Find words with similar meanings.</span>
      </label>
      <button
        id="synonyms-toggle"
        role="switch"
        aria-checked={$searchOptions.synonyms}
        class="toggle-switch"
        class:active={$searchOptions.synonyms}
        on:click={() => toggleOption('synonyms')}
      >
        <span class="toggle-slider"></span>
      </button>
    </div>

    <!-- Antonyms -->
    <div class="setting-item">
      <label for="antonyms-toggle" class="setting-label">
        <span class="label-text">Antonyms</span>
        <span class="label-description">Find words with opposite meanings.</span>
      </label>
      <button
        id="antonyms-toggle"
        role="switch"
        aria-checked={$searchOptions.antonyms}
        class="toggle-switch"
        class:active={$searchOptions.antonyms}
        on:click={() => toggleOption('antonyms')}
      >
        <span class="toggle-slider"></span>
      </button>
    </div>

    <!-- Related Words -->
    <div class="setting-item">
      <label for="related-words-toggle" class="setting-label">
        <span class="label-text">Related Words</span>
        <span class="label-description">Find conceptually related terms.</span>
      </label>
      <button
        id="related-words-toggle"
        role="switch"
        aria-checked={$searchOptions.relatedWords}
        class="toggle-switch"
        class:active={$searchOptions.relatedWords}
        on:click={() => toggleOption('relatedWords')}
      >
        <span class="toggle-slider"></span>
      </button>
    </div>

    <!-- Image Search -->
    <div class="setting-item">
      <label for="image-search-toggle" class="setting-label">
        <span class="label-text">Image Search</span>
        <span class="label-description">Analyze and search content within images.</span>
      </label>
      <button
        id="image-search-toggle"
        role="switch"
        aria-checked={$searchOptions.imageSearch}
        class="toggle-switch"
        class:active={$searchOptions.imageSearch}
        on:click={() => toggleOption('imageSearch')}
      >
        <span class="toggle-slider"></span>
      </button>
    </div>
  </div>
</div>

<style>
  .settings-panel {
    padding: 10px 20px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(30, 30, 30, 0.6);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .setting-label {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    user-select: none;
  }

  .label-text {
    color: #eee;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .label-description {
    color: #888;
    font-size: 0.8rem;
    margin-top: 2px;
  }

  .toggle-switch {
    all: initial;
    position: relative;
    display: inline-block;
    width: 40px;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 34px;
    transition: background-color 0.3s;
    cursor: pointer;
    flex-shrink: 0;
    margin-left: 15px;
  }

  .toggle-switch.active {
    background-color: #3b82f6;
  }

  .toggle-slider {
    position: absolute;
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s;
  }

  .toggle-switch.active .toggle-slider {
    transform: translateX(16px);
  }
</style>
