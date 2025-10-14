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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="15" y2="10"/>
      <line x1="9" y1="14" x2="13" y2="14"/>
    </svg>
  </button>
</div>

<style>
  .app {
    all: initial;
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483647;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  }
  .chat-fab {
    all: initial;
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #1a1a1a;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2147483648;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: auto;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .chat-fab:hover {
    background: #222;
    border-color: rgba(255, 255, 255, 0.25);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
    transform: scale(1.08);
  }
  
  .chat-fab:active {
    transform: scale(0.92);
  }
  
  .chat-popup {
    all: initial;
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 420px;
    max-width: calc(100vw - 40px);
    height: 580px;
    max-height: calc(100vh - 40px);
    background: #0a0a0a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
    z-index: 2147483648;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: popupIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    pointer-events: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    backdrop-filter: blur(40px);
  }
  @keyframes popupIn {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1);
    }
  }
  .chat-backdrop {
    all: initial;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 2147483646;
    pointer-events: auto;
    cursor: pointer;
    animation: backdropIn 0.2s ease both;
  }
  
  @keyframes backdropIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>