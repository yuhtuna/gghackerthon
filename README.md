# Findable - A Chrome Extension

Everything is findable.

## AI Features Setup

**Important:** The AI features of this extension rely on Chrome's built-in Gemini Nano model. This is an experimental technology and requires manual setup.

**Requirements:**
*   **Chrome Version:** You must be using Chrome version 127 or higher (Dev or Canary channels recommended).
*   **Enabled Flags:** You need to enable a couple of flags in Chrome.

**Instructions:**

1.  Navigate to `chrome://flags` in your browser.
2.  Enable the following flags:
    *   `#prompt-api-for-gemini-nano`
    *   `#optimization-guide-on-device-model`
3.  Relaunch your browser.

After relaunching, you may need to wait for the on-device model to be downloaded. You can check the status at `chrome://components` under "Optimization Guide On Device Model". If the model is not yet available, check back after some time.
