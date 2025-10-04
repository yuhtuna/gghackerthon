// @ts-ignore
import content from './content.ts?script';
// Listen for the command we defined in manifest.json
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command \"${command}\" triggered`);

  if (command === "open-findable-search") {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.id) {
      // Programmatically inject our content script into the active tab
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [content],
      });
    }
  }
});