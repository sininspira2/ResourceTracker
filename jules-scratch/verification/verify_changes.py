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

    # Go to resources page and take screenshot
    page.goto("http://localhost:3000/resources")
    page.wait_for_selector("h1:has-text('Resource Management')")
    page.screenshot(path="jules-scratch/verification/resources_page.png")

    # Go to dashboard page and take screenshot
    page.goto("http://localhost:3000/dashboard")
    page.wait_for_selector("h1:has-text('Dashboard')")
    page.screenshot(path="jules-scratch/verification/dashboard_page.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
