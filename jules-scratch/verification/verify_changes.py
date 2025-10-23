from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Sign in as admin
    page.goto("http://localhost:3000/auth/signin")
    page.click("button:has-text('Sign In as Agent')")
    page.select_option("#permissionLevel", "4")
    page.wait_for_url("http://localhost:3000/dashboard")

    # Go to resources page and take screenshot of buttons
    page.goto("http://localhost:3000/resources")
    page.wait_for_selector("h1:has-text('Resource Management')")
    page.screenshot(path="jules-scratch/verification/buttons.png")

    # Click import button and take screenshot of modal
    page.click("button:has-text('Import CSV')")
    page.wait_for_selector("h3:has-text('Import CSV')")
    page.screenshot(path="jules-scratch/verification/modal.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
