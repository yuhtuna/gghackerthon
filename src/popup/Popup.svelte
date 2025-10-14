<script lang="ts">
  import { searchOptions } from '../stores';

  // This reactive statement automatically handles updates to the store
  $: settings = $searchOptions;

  const toggleOption = (option: keyof typeof settings) => {
    // We can update the store directly, and our persistent store logic will handle saving.
    searchOptions.update(currentSettings => ({
      ...currentSettings,
      [option]: !currentSettings[option]
    }));
  };
</script>

<div class="popup-container">
  <div class="header">
    <span class="logo">🔬</span>
    <h2>WebNano Assistant</h2>
  </div>

  <div class="settings-grid">
    <!-- Synonyms -->
    <div class="setting-item">
      <label for="synonyms-toggle" class="setting-label">
        <span class="label-text">Synonyms</span>
        <span class="label-description">Find similar words.</span>
      </label>
      <button
        id="synonyms-toggle"
        role="switch"
        aria-checked={settings.synonyms}
        class="toggle-switch"
        class:active={settings.synonyms}
        on:click={() => toggleOption('synonyms')}
      >
        <span class="toggle-slider"></span>
      </button>
    </div>

    <!-- Antonyms -->
    <div class="setting-item">
      <label for="antonyms-toggle" class="setting-label">
        <span class="label-text">Antonyms</span>
        <span class="label-description">Find opposite words.</span>
      </label>
      <button
        id="antonyms-toggle"
        role="switch"
        aria-checked={settings.antonyms}
        class="toggle-switch"
        class:active={settings.antonyms}
        on:click={() => toggleOption('antonyms')}
      >
        <span class="toggle-slider"></span>
      </button>
    </div>

    <!-- Related Words -->
    <div class="setting-item">
      <label for="related-words-toggle" class="setting-label">
        <span class="label-text">Related Words</span>
        <span class="label-description">Find related concepts.</span>
      </label>
      <button
        id="related-words-toggle"
        role="switch"
        aria-checked={settings.relatedWords}
        class="toggle-switch"
        class:active={settings.relatedWords}
        on:click={() => toggleOption('relatedWords')}
      >
        <span class="toggle-slider"></span>
      </button>
    </div>

    <!-- Image Search -->
    <div class="setting-item">
      <label for="image-search-toggle" class="setting-label">
        <span class="label-text">Image Search</span>
        <span class="label-description">Search inside images.</span>
      </label>
      <button
        id="image-search-toggle"
        role="switch"
        aria-checked={settings.imageSearch}
        class="toggle-switch"
        class:active={settings.imageSearch}
        on:click={() => toggleOption('imageSearch')}
      >
        <span class="toggle-slider"></span>
      </button>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #282828;
    color: #eee;
    width: 320px;
  }
  .popup-container {
    padding: 16px;
  }
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 12px;
  }
  .logo {
    width: 24px;
    height: 24px;
    margin-right: 12px;
  }
  h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-radius: 6px;
    transition: background-color 0.2s;
  }
  .setting-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
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
    margin-top: 4px;
  }
  .toggle-switch {
    all: unset;
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

