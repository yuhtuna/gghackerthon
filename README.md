# Findable: Your Intelligent Search Companion

Findable is a Chrome extension that revolutionizes your on-page search experience. Powered by the Gemini Nano on-device AI model, it goes beyond simple text matching to understand the context of your search and the content of the page.

## Features

- **Multiple Search Modes:**
    - **Find:** A standard, instant search for the exact text you type.
    - **Basic:** Finds your term plus synonyms and related words.
    - **Deep:** Full page analysis for context, descriptions, and summaries.
- **AI-Powered Search:** Utilizes the Gemini Nano on-device model for intelligent, context-aware search.
- **Relevance Slider:** Fine-tune your search results to see the most relevant matches.
- **Image Search:** Find images on the page that are semantically related to your search term.
- **PDF Support:** Search for text within embedded PDFs.
- **Customizable:** Adjust the search mode and relevance threshold to fit your needs.

## Installation

1. Clone this repository.
2. Install the dependencies: `npm install`
3. Build the extension: `npm run build`
4. Open Chrome and navigate to `chrome://extensions`.
5. Enable "Developer mode".
6. Click "Load unpacked" and select the `dist` directory.

## Usage

1. Open any webpage.
2. Press `Ctrl+Shift+F` (or `Command+Shift+F` on Mac) to open the Findable search bar.
3. Select your desired search mode and adjust the relevance slider.
4. Type your search term and press Enter.
5. Use the next and previous buttons to navigate between the highlighted results.

## Tech Stack

- **Svelte:** A modern JavaScript framework for building user interfaces.
- **Vite:** A fast build tool and development server.
- **TypeScript:** A statically typed superset of JavaScript.
- **Playwright:** A framework for end-to-end testing.
- **Gemini Nano:** An on-device AI model for intelligent search.
