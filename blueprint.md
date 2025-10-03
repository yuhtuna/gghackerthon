# Blueprint: Findable Chrome Extension

## 1. Overview

**Project:** Findable Chrome Extension
**Purpose:** A Chrome extension designed to make "everything findable" through a quick-access search bar. The goal is to provide a seamless and intuitive search experience directly within the browser.
**Technology Stack:** Svelte, Vite, TypeScript, Chrome Extension Manifest V3.

---

## 2. Project Outline (Current State)

This section documents all the style, design, and features implemented in the application from the initial version to the current version.

### 2.1. Architecture & Setup

*   **Frontend Framework:** Svelte for building reactive and component-based UI.
*   **Build Tool:** Vite for a lightning-fast development experience and optimized production builds.
*   **Chrome Extension Plugin:** `@crxjs/vite-plugin` is used to simplify the development workflow, automatically handling the manifest and service worker compilation.
*   **Language:** TypeScript is used for all scripting to ensure type safety and improve code quality.
*   **Manifest:** The project uses Chrome's Manifest V3.
*   **Dependencies:** All necessary dependencies are managed via `package.json` and installed with `npm`.

### 2.2. Implemented Features

*   **Core Extension:** The basic structure for a loadable Chrome extension has been created and confirmed to work without errors when loaded as an unpacked extension.
*   **Keyboard Shortcut:** The search bar can be toggled open and closed using the keyboard shortcut `Ctrl+Shift+F` (or `Cmd+Shift+F` on macOS).
*   **Search Bar Interactivity:** The search bar is now more user-friendly with multiple ways to close it:
    *   A dedicated **close button ("X")** has been added.
    *   The user can **click the semi-transparent background overlay** to dismiss the search bar.
    *   Pressing the **`Escape` key** will close the search bar.

### 2.3. UI & Design

The UI follows modern design principles, aiming for a clean, visually balanced, and intuitive experience.

*   **`App.svelte` (Main Component):**
    *   **Functionality:** Manages the visibility state of the `SearchBar` component and handles the "close" event dispatched from it.
    *   **Content:** Displays a simple landing message instructing the user how to activate the search bar.
    *   **Styling:**
        *   **Typography:** Features a large, uppercase, bold hero title (`<h1>Findable</h1>`) to establish a strong brand identity.
        *   **Color:** Uses a vibrant accent color (`#ff3e00`) for the main heading to create a focal point.

*   **`SearchBar.svelte` (Search Component):**
    *   **Layout:**
        *   A full-screen overlay (`findable-search-bar-overlay`) with a semi-transparent dark background (`rgba(0, 0, 0, 0.5)`) to focus the user's attention.
        *   The search bar itself is centered horizontally and positioned towards the top of the viewport for easy access.
    *   **Aesthetics:**
        *   **Container:** The search bar has a dark, modern background color (`#2a2a2e`), rounded corners, and a multi-layered drop shadow (`0 10px 30px rgba(0, 0, 0, 0.2)`) to create a sense of depth.
        *   **Input Field:** The text input is borderless with white text for a clean, integrated look. The font size is enlarged for readability.
        *   **Close Button:** A subtle "X" button is positioned in the top-right corner for an intuitive closing action.
    *   **Interactivity:**
        *   The search input field automatically receives focus (`.focus()`) when the component is mounted.
        *   The component dispatches a `close` event when the user initiates a close action (clicking the "X", the background, or pressing `Escape`). The parent component (`App.svelte`) listens for this event to hide the search bar.

---

## 3. Current Plan: Next Steps

This section outlines the plan and steps for the currently requested change.

1.  **Implement Core Search Functionality:**
    *   **Define Search Scope:** First, we will decide what to search through. I recommend starting with open browser tabs, as it's a common and useful feature.
    *   **Access Browser APIs:** Use the `chrome.tabs.query` API to get a list of all open tabs in the current window.
    *   **Filter Logic:** Implement the logic to filter the list of tabs based on the user's `searchTerm`. The search should match against the tab's title and URL.
    *   **Display Results:** Design and create a UI component to display the search results dynamically beneath the search bar as the user types.
    *   **Action on Selection:** Implement the functionality to switch to the selected tab when a user clicks on a search result.

2.  **Refine Visual Design & Style:**
    *   Incorporate iconography (e.g., a search icon in the input field).
    *   Apply a subtle noise texture to the main background.
    *   Enhance interactive elements with "glow" effects on focus or hover.
