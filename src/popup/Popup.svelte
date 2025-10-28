<script lang="ts">
  import { appSettings, type SearchMode } from '../stores';

  const setMode = (mode: SearchMode) => {
    appSettings.update(settings => ({ ...settings, searchMode: mode }));
  };
</script>

<div class="popup-container">
  <div class="header">
    <img src="/logo.png" alt="Findable Logo" class="logo"/>
    <h2>Findable Mode</h2>
  </div>

  <div class="settings-list">
    <div class="setting-item" on:click={() => setMode('find')}>
      <input type="radio" id="find-mode" name="search-mode" bind:group={$appSettings.searchMode} value="find">
      <label for="find-mode" class="setting-label">
        <span class="label-text">Find</span>
        <span class="label-description">Standard, fast text search.</span>
      </label>
    </div>
    <div class="setting-item" on:click={() => setMode('basic')}>
      <input type="radio" id="basic-mode" name="search-mode" bind:group={$appSettings.searchMode} value="basic">
      <label for="basic-mode" class="setting-label">
        <span class="label-text">Basic AI</span>
        <span class="label-description">Smarter search with synonyms.</span>
      </label>
    </div>
    <div class="setting-item" on:click={() => setMode('deep')}>
      <input type="radio" id="deep-mode" name="search-mode" bind:group={$appSettings.searchMode} value="deep">
      <label for="deep-mode" class="setting-label">
        <span class="label-text">Deep Scan</span>
        <span class="label-description">Full page analysis.</span>
      </label>
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
  .popup-container { padding: 16px; }
  .header { display: flex; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 12px; }
  .logo { width: 24px; height: 24px; margin-right: 12px; }
  h2 { margin: 0; font-size: 1.1rem; font-weight: 600; }
  .settings-list { display: grid; gap: 8px; }
  .setting-item { display: flex; align-items: center; padding: 12px; border-radius: 8px; transition: background-color 0.2s; cursor: pointer; }
  .setting-item:hover { background-color: rgba(255, 255, 255, 0.05); }
  .setting-item input[type="radio"] { margin-right: 12px; }
  .setting-label { display: flex; flex-direction: column; }
  .label-text { font-weight: 500; font-size: 0.9rem; }
  .label-description { color: #888; font-size: 0.8rem; margin-top: 4px; }
</style>