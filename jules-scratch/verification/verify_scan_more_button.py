
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173')

        # Press the shortcut to open the search bar
        page.keyboard.press('Control+Shift+F')

        # Wait for the search bar to appear
        search_bar_selector = 'div.findable-container'
        page.wait_for_selector(search_bar_selector, state='visible')

        # Click the settings button
        settings_button_selector = 'button.settings-button'
        page.click(settings_button_selector)

        # Wait for the settings panel to appear
        settings_panel_selector = 'div.settings-panel-wrapper'
        page.wait_for_selector(settings_panel_selector, state='visible')

        # Select the "Deep" search mode
        deep_mode_selector = 'button.mode-button:has-text("Deep")'
        page.click(deep_mode_selector)

        # Type a search term to trigger the deep scan
        input_selector = 'input[type="text"]'
        page.fill(input_selector, 'deep scan test')

        # Wait for the "Scan More" button to appear
        scan_more_button_selector = 'button[title="Scan more of the document"]'
        page.wait_for_selector(scan_more_button_selector, state='visible')

        # Take a screenshot of the search bar with the "Scan More" button
        page.screenshot(path='jules-scratch/verification/verification.png')

        browser.close()

run()
