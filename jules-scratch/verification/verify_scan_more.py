from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5175/index.html")

        # Open the search bar and set to deep search mode
        page.keyboard.press("Control+Shift+F")
        page.wait_for_selector("#findable-extension-root", state="visible")
        page.click(".settings-button")
        page.select_option("select#search-mode", "deep")

        # Type a search term
        search_input = page.locator('input[placeholder="Search this page..."]')
        search_input.type("the")

        # Wait for the initial result count
        result_count = page.locator(".result-count")
        expect(result_count).to_contain_text("/ 2")

        # Click the "Scan More" button
        page.click('button[title="Scan More"]')

        # Wait for the result count to update
        expect(result_count).to_contain_text("/ 3")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/scan_more.png")

        browser.close()

run()
