<!-- src/ui/ChatPanel.svelte -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { AssistantTask } from '../assistant/types';
  import { initializeAssistant } from '../assistant';

  const dispatch = createEventDispatcher();

  let chatHistory: Array<{ role: 'user' | 'assistant', content: string, fileName?: string }> = [
    {
      role: 'assistant',
      content: `👋 Hi! I'm **WebNano**, your intelligent web assistant.

I can help you with:
• 📧 **Craft emails** - Write professional emails
• 🌍 **Translate** - Translate text between languages  
• 📝 **Summarize** - Summarize documents and web pages
• 🔍 **Analyze** - Extract insights from content
• 📄 **Process files** - Work with your uploaded documents

What would you like me to help you with?`
    }
  ];
  let inputValue = '';
  let isLoading = false;
  let assistant: any = null;
  let fileInput: HTMLInputElement | null = null;
  let contextWebsites: string[] = [];
  let uploadedDocs: Array<{ name: string, content: string }> = [];

  onMount(async () => {
    assistant = await initializeAssistant();
  });
  
  function quickAction(action: string) {
    inputValue = action;
  }

  async function handleSend() {
    if (!inputValue.trim() && uploadedDocs.length === 0) return;
    
    const userMessage = inputValue;
    chatHistory = [...chatHistory, { role: 'user', content: userMessage }];
    inputValue = '';
    isLoading = true;
    
    try {
      if (!assistant) {
        assistant = await initializeAssistant();
      }
      
      // Build context from uploaded docs and websites
      let context = '';
      if (uploadedDocs.length > 0) {
        context += `\n\nUploaded Documents:\n${uploadedDocs.map(d => `- ${d.name}: ${d.content.substring(0, 500)}...`).join('\n')}`;
      }
      if (contextWebsites.length > 0) {
        context += `\n\nContext Websites: ${contextWebsites.join(', ')}`;
      }
      
      const fullPrompt = context ? `${userMessage}\n${context}` : userMessage;
      
      // Use Chrome's built-in AI to generate response
      const response = await generateAIResponse(fullPrompt);
      
      chatHistory = [...chatHistory, { role: 'assistant', content: response }];
      uploadedDocs = []; // Clear uploaded docs after processing
    } catch (error) {
      console.error('Error generating response:', error);
      chatHistory = [...chatHistory, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please make sure Chrome\'s built-in AI is enabled.' 
      }];
    } finally {
      isLoading = false;
    }
  }
  
  async function generateAIResponse(prompt: string): Promise<string> {
    // Check if Chrome's built-in AI is available
    if (typeof globalThis.LanguageModel === 'undefined') {
      return 'Chrome\'s built-in AI is not available. Please ensure you have Chrome Canary with AI features enabled.';
    }
    
    const availability = await globalThis.LanguageModel.availability();
    if (availability !== 'readily' && availability !== 'available') {
      return 'The AI model is not ready. Please check your Chrome AI settings.';
    }
    
    const session = await globalThis.LanguageModel.create({
      systemPrompt: `You are WebNano, an intelligent web assistant. You help users with:
- Crafting professional emails
- Translating text between languages
- Summarizing content from documents and web pages
- Analyzing and extracting information
- Answering questions about uploaded documents

Be helpful, concise, and professional.`
    });
    
    const response = await session.prompt(prompt);
    return response;
  }

  function handleFileUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedDocs = [...uploadedDocs, { name: file.name, content: e.target?.result as string }];
      };
      reader.readAsText(file);
    });
    if (fileInput) fileInput.value = '';
  }

  async function handleAddWebsite() {
    try {
      // Get all open tabs
      const tabs = await chrome.tabs.query({});
      const tabOptions = tabs
        .filter(tab => tab.url && !tab.url.startsWith('chrome://'))
        .map(tab => `${tab.title} - ${tab.url}`)
        .join('\n');
      
      const choice = prompt(`Select a website to add as context:\n\n${tabOptions}\n\nEnter the URL:`);
      if (choice && !contextWebsites.includes(choice)) {
        contextWebsites = [...contextWebsites, choice];
      }
    } catch (error) {
      // Fallback to manual entry
      const url = prompt('Enter website URL to add as context:');
      if (url && !contextWebsites.includes(url)) {
        contextWebsites = [...contextWebsites, url];
      }
    }
  }

  function removeWebsite(idx: number) {
    contextWebsites = contextWebsites.filter((_, i) => i !== idx);
  }
</script>

<div class="chat-overlay">
  <div class="chat-sidebar">
    <h3>Context</h3>
      <div class="context-section">
        <div class="context-title">Websites</div>
        <ul>
          {#each contextWebsites as site, idx}
            <li>{site} <button on:click={() => removeWebsite(idx)}>✕</button></li>
          {/each}
        </ul>
        <button class="add-btn" on:click={handleAddWebsite}>+ Add Website</button>
      </div>
      <div class="context-section">
        <div class="context-title">Documents</div>
        <ul>
          {#each uploadedDocs as doc}
            <li>{doc.name}</li>
          {/each}
        </ul>
      </div>
    </div>
    <div class="chat-main">
      <div class="chat-history">
        {#each chatHistory as msg}
          <div class="chat-msg {msg.role}">
            <div class="msg-content">{msg.content}</div>
            {#if msg.fileName}
              <div class="msg-file">📄 {msg.fileName}</div>
            {/if}
          </div>
        {/each}
        {#if isLoading}
          <div class="chat-msg assistant loading">Thinking...</div>
        {/if}
        {#if chatHistory.length === 1}
          <div class="quick-actions">
            <button class="quick-btn" on:click={() => quickAction('Help me write a professional email')}>📧 Write Email</button>
            <button class="quick-btn" on:click={() => quickAction('Translate this text for me')}>🌍 Translate</button>
            <button class="quick-btn" on:click={() => quickAction('Summarize this content')}>📝 Summarize</button>
          </div>
        {/if}
      </div>
      <div class="chat-input-row">
        <input
          class="chat-input"
          type="text"
          placeholder="Type your message..."
          bind:value={inputValue}
          on:keydown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <input
          type="file"
          accept=".txt,.md,.csv,.json,.pdf,.docx"
          multiple
          bind:this={fileInput}
          on:change={handleFileUpload}
          style="display:none"
        />
        <button class="file-btn" on:click={() => fileInput && fileInput.click()}>📎</button>
        <button class="send-btn" on:click={handleSend} disabled={isLoading || (!inputValue.trim() && uploadedDocs.length === 0)}>➤</button>
      </div>
    </div>
  </div>

<style>
  .chat-overlay {
    all: initial;
    display: flex;
    width: 100%;
    height: 100%;
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    box-sizing: border-box;
    border-radius: 16px;
    overflow: hidden;
    backdrop-filter: blur(20px);
  }
  
  * {
    box-sizing: border-box;
  }
  .chat-sidebar {
    width: 200px;
    background: linear-gradient(180deg, #0f0f0f 0%, #050505 100%);
    padding: 20px 14px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  h3 {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 0 0 12px 0;
  }
  
  ul {
    all: initial;
    display: block;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  li {
    all: initial;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #b0b0b0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
    padding: 8px 12px;
    margin-bottom: 4px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    transition: background 0.2s;
  }
  
  li:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  
  li button {
    color: #666;
    padding: 2px 6px;
    font-size: 12px;
  }
  
  li button:hover {
    color: #ff4444;
  }
  
  button {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    cursor: pointer;
    border: none;
    outline: none;
    display: inline-block;
  }
  
  input {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    outline: none;
    border: none;
    display: block;
  }
  .context-section {
    margin-bottom: 16px;
  }
  .context-title {
    font-size: 11px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .add-btn {
    margin-top: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #888;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    width: 100%;
    text-align: center;
    transition: all 0.2s;
  }
  
  .add-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.15);
  }
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #000;
  }
  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 20px 18px 12px 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .chat-history::-webkit-scrollbar {
    width: 6px;
  }
  
  .chat-history::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .chat-history::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  .chat-history::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .chat-msg {
    max-width: 75%;
    padding: 14px 18px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
  }
  .chat-msg.user {
    align-self: flex-end;
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  .chat-msg.assistant {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.03);
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .chat-msg.loading {
    font-style: italic;
    opacity: 0.6;
    color: #888;
  }
  .chat-input-row {
    display: flex;
    align-items: center;
    padding: 16px 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: linear-gradient(180deg, #0a0a0a 0%, #000 100%);
    gap: 10px;
  }
  .chat-input {
    flex: 1;
    padding: 14px 18px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }
  
  .chat-input:focus {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }
  
  .chat-input::placeholder {
    color: #555;
  }
  
  .file-btn, .send-btn {
    background: rgba(255, 255, 255, 0.08);
    color: #ccc;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .file-btn:hover, .send-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    transform: translateY(-1px);
  }
  .file-btn:disabled, .send-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
  }
  .quick-actions {
    display: flex;
    gap: 10px;
    padding: 16px 0;
    flex-wrap: wrap;
  }
  .quick-btn {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    padding: 10px 18px;
    background: rgba(255, 255, 255, 0.04);
    color: #b0b0b0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .quick-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
  .msg-content {
    white-space: pre-wrap;
    line-height: 1.7;
    letter-spacing: 0.2px;
  }
</style>
