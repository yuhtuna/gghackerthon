<script lang="ts">
  import { onMount } from 'svelte';
  import ChatPanel from './ChatPanel.svelte';
  let showChat = false;

  function openChat() {
    console.log('WebNano: Opening chat');
    showChat = true;
  }
  
  function closeChat() {
    console.log('WebNano: Closing chat');
    showChat = false;
  }
  
  function toggleChat() {
    showChat = !showChat;
    console.log('WebNano: Toggled chat to', showChat);
  }
  
  onMount(() => {
    // Listen for toggle command from keyboard shortcut
    window.addEventListener('webnano-toggle-chat', toggleChat);
    return () => {
      window.removeEventListener('webnano-toggle-chat', toggleChat);
    };
  });
</script>

<div class="app">
  {#if showChat}
    <div class="chat-backdrop" on:click={closeChat} />
    <div class="chat-popup">
      <ChatPanel />
    </div>
  {/if}
  <button class="chat-fab" on:click={openChat} aria-label="Open Assistant">
    <span>🔬</span>
  </button>
</div>

<style>
  .app {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  }
  .chat-fab {
    position: fixed;
    bottom: 32px;
    right: 32px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4f9cf9 0%, #9c88ff 100%);
    color: #fff;
    border: none;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    font-size: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10001;
    transition: background 0.2s, box-shadow 0.2s;
  }
  .chat-fab:hover {
    background: linear-gradient(135deg, #2d8cff 0%, #6c5ce7 100%);
    box-shadow: 0 8px 24px rgba(0,0,0,0.22);
  }
  .chat-popup {
    all: initial;
    position: fixed;
    bottom: 100px;
    right: 40px;
    width: 480px;
    max-width: 96vw;
    height: 600px;
    max-height: 90vh;
    background: #18181b;
    border-radius: 18px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.28);
    z-index: 2147483648;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: popupIn 0.18s cubic-bezier(.4,1.4,.6,1) both;
    pointer-events: auto;
    font-family: system-ui, -apple-system, sans-serif;
  }
  @keyframes popupIn {
    from { opacity: 0; transform: translateY(40px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  .chat-backdrop {
    all: initial;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.18);
    z-index: 2147483646;
    pointer-events: auto;
    cursor: pointer;
  }
</style>