# Findable - A Chrome Extension

Everything is findable.

## AI Features Setup

**Important:** The AI features of this extension rely on Chrome's built-in Gemini Nano model, which is an experimental technology and requires manual setup.

**Requirements:**
*   **Chrome Version:** You must be using a recent version of Chrome that supports the `chrome.ai` API (version 127 or higher is recommended).
*   **Enabled Flags:** You need to enable specific flags in Chrome to allow access to the on-device model.

**Instructions:**

1.  Navigate to `chrome://flags` in your browser.
2.  Enable the following flags:
    *   `#prompt-api-for-gemini-nano`
    *   `#optimization-guide-on-device-model`
3.  Relaunch your browser.

After relaunching, you may need to wait for the on-device model to be downloaded. You can check the status at `chrome://components` under "Optimization Guide On Device Model". If the model is not yet available, check back after some time.

**How it Works:**

This extension uses an offscreen document to interact with the `chrome.ai` API, as it is not directly available in the extension's service worker. All AI-related tasks are processed in this offscreen document.
