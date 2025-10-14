# WebNano Assistant# Svelte + Vite



A powerful and flexible Chrome extension that transforms any webpage into an intelligent workspace. WebNano is your personal AI-powered web assistant that can find, analyze, and interact with web content.This template should help get you started developing with Svelte in Vite.



## 🚀 Features## Recommended IDE Setup



### 🔍 Smart Word Finding[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

- Find words, phrases, and related terms on any webpage

- Semantic search with synonyms, antonyms, and related words## Need an official Svelte framework?

- Intelligent highlighting with visual navigation

- AI-powered term expansion and spell correctionCheck out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.



### 📊 Page Analysis## Technical considerations

- Comprehensive webpage content analysis

- Reading time estimation and word counts**Why use this over SvelteKit?**

- Extract headings, links, and images

- Content structure insights- It brings its own routing solution which might not be preferable for some users.

- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

### 📝 Text Processing

- **Smart Summarization**: Summarize selected text or entire pagesThis template contains as little as possible to get started with Vite + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

- **Keyword Extraction**: Identify key terms and phrases

- **Content Analysis**: Understand page structure and contextShould you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.



### 🎯 Intent Recognition**Why include `.vscode/extensions.json`?**

- Natural language commands

- Automatic task detectionOther templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

- Context-aware assistance

**Why enable `checkJs` in the JS template?**

## 🛠 Technical Architecture

It is likely that most cases of changing variable types in runtime are likely to be accidental, rather than deliberate. This provides advanced typechecking out of the box. Should you like to take advantage of the dynamically-typed nature of JavaScript, it is trivial to change the configuration.

### Assistant Core

The WebNano assistant is built on a modular task-based architecture:**Why is HMR not preserving my local component state?**



```typescriptHMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr#preservation-of-local-state).

// Task-based system

interface AssistantTask {If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

  id: string;

  name: string;```js

  description: string;// store.js

  icon?: string;// An extremely simple external store

  category: TaskCategory;import { writable } from 'svelte/store'

  execute: (params: any) => Promise<any>;export default writable(0)

}```

```

### Available Tasks
- **Word Finder**: `word-finder` - Find and highlight text on pages
- **Page Analyzer**: `page-analyzer` - Analyze webpage structure and content
- **Text Summarizer**: `text-summarizer` - Summarize text content
- **Keyword Extractor**: `keyword-extractor` - Extract key terms

### Usage Commands

#### Text Search
- "find [term]" - Search for specific words
- "search [term]" - Find and highlight terms
- "highlight [term]" - Highlight specific content

#### Page Analysis
- "analyze page" - Get comprehensive page insights
- "page info" - Quick page statistics
- "page analysis" - Detailed content breakdown

#### Text Processing
- "summarize" - Summarize selected text or page
- "extract keywords" - Find key terms
- "keywords" - Extract important phrases

## 🎨 Modern UI

WebNano features a sleek, modern interface with:
- **Command Palette**: Type natural language commands
- **Smart Suggestions**: Task recommendations based on input
- **Keyboard Navigation**: Full keyboard support (Arrow keys, Tab, Enter, Escape)
- **Visual Feedback**: Real-time loading states and results
- **Responsive Design**: Adapts to different screen sizes

## 🔧 Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Load the `dist` folder as an unpacked extension in Chrome
5. Use `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac) to activate

## 🎯 Keyboard Shortcuts

- **Ctrl+Shift+N** (Windows) / **Cmd+Shift+N** (Mac): Open WebNano Assistant
- **Arrow Keys**: Navigate through task suggestions
- **Tab**: Execute selected task
- **Enter**: Execute command or task
- **Escape**: Close assistant

## 🔮 Future Enhancements

- **Translation Services**: Multi-language support
- **Content Extraction**: Smart data scraping
- **Web Automation**: Automated web interactions
- **AI Integration**: Enhanced natural language processing
- **Custom Tasks**: User-defined assistant capabilities
- **Cross-page Memory**: Remember context across pages
- **Collaboration Features**: Share insights and findings

## 🏗 Development

### Project Structure
```
src/
├── assistant/           # Core assistant system
│   ├── core.ts         # Main assistant logic
│   ├── types.ts        # TypeScript interfaces
│   ├── index.ts        # Task registration
│   └── tasks/          # Individual task modules
├── ui/                 # User interface components
├── modules/            # Utility modules
├── popup/              # Extension popup
├── content.ts          # Content script
└── background.ts       # Service worker
```

### Adding New Tasks

Create a new task file in `src/assistant/tasks/`:

```typescript
import type { AssistantTask, TaskCategory } from '../types';

export const myTask: AssistantTask = {
  id: 'my-task',
  name: 'My Task',
  description: 'Description of what this task does',
  icon: '🔧',
  category: 'utility',
  
  async execute(params: any): Promise<any> {
    // Task implementation
    return result;
  }
};
```

Then register it in `src/assistant/index.ts`:

```typescript
import { myTask } from './tasks/my-task';

export async function initializeAssistant() {
  const assistant = await getAssistant();
  assistant.registerTask(myTask);
  return assistant;
}
```

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests, create issues, or suggest new features.

---

**WebNano** - Your intelligent web assistant for the modern web. 🔬✨