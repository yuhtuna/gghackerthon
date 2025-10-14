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
    background: transparent;
    color: #fff;
    font-family: system-ui, -apple-system, sans-serif;
    box-sizing: border-box;
  }
  
  * {
    box-sizing: border-box;
  }
  .chat-sidebar {
    width: 260px;
    background: #23232b;
    padding: 20px 12px;
    border-right: 1px solid #222;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  h3 {
    all: initial;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 8px 0;
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
    display: block;
    color: #fff;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    padding: 6px 0;
  }
  
  button {
    all: initial;
    font-family: system-ui, -apple-system, sans-serif;
    cursor: pointer;
    border: none;
    outline: none;
    display: inline-block;
  }
  
  input {
    all: initial;
    font-family: system-ui, -apple-system, sans-serif;
    outline: none;
    border: none;
    display: block;
  }
  .context-section {
    margin-bottom: 18px;
  }
  .context-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .add-btn {
    margin-top: 8px;
    background: #2d8cff;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 13px;
  }
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px 12px 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .chat-msg {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 4px;
    font-size: 15px;
    line-height: 1.5;
    word-break: break-word;
  }
  .chat-msg.user {
    align-self: flex-end;
    background: linear-gradient(90deg, #4f9cf9 0%, #9c88ff 100%);
    color: #fff;
  }
  .chat-msg.assistant {
    align-self: flex-start;
    background: #23232b;
    color: #fff;
    border: 1px solid #333;
  }
  .chat-msg.loading {
    font-style: italic;
    opacity: 0.7;
  }
  .chat-input-row {
    display: flex;
    align-items: center;
    padding: 16px 32px;
    border-top: 1px solid #222;
    background: #1a1a1f;
    gap: 8px;
  }
  .chat-input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #333;
    background: #23232b;
    color: #fff;
    font-size: 15px;
    outline: none;
  }
  .file-btn, .send-btn {
    background: #2d8cff;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .file-btn:hover, .send-btn:hover {
    background: #1a6ed8;
  }
  .file-btn:disabled, .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .quick-actions {
    display: flex;
    gap: 8px;
    padding: 12px 0;
    flex-wrap: wrap;
  }
  .quick-btn {
    all: initial;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 8px 16px;
    background: #2d2d35;
    color: #fff;
    border: 1px solid #444;
    border-radius: 20px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-block;
  }
  .quick-btn:hover {
    background: #3d3d45;
    border-color: #555;
    transform: translateY(-1px);
  }
  .msg-content {
    white-space: pre-wrap;
    line-height: 1.6;
  }
</style>
