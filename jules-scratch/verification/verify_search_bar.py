from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/index.html")

        # Check that the search bar is not visible initially
        search_bar_visible = page.is_visible("#findable-extension-root")
        print(f"Search bar visible on load: {search_bar_visible}")

        # Take a screenshot before toggling
        page.screenshot(path="jules-scratch/verification/before_toggle.png")

        # Simulate the shortcut
        page.keyboard.press("Control+Shift+F")

        # Check if the search bar is visible after the shortcut
        page.wait_for_selector("#findable-extension-root", state="visible")
        search_bar_visible_after = page.is_visible("#findable-extension-root")
        print(f"Search bar visible after shortcut: {search_bar_visible_after}")

        # Take a screenshot after toggling
        page.screenshot(path="jules-scratch/verification/after_toggle.png")

        browser.close()

run()
