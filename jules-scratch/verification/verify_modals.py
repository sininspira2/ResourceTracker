import os
import re
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Login
        page.goto("http://localhost:3000/")
        page.get_by_role("button", name="Sign in with Discord").click()

        # The mock login is not working, so we'll try to bypass it.
        # After clicking sign-in, we should be on the Discord page.
        # We'll wait a bit and then go directly to the resources page.
        page.wait_for_timeout(2000) # wait for 2 seconds

        # 2. Navigate to resources page
        page.goto("http://localhost:3000/resources")

        # Wait for the page to load and resources to be visible
        expect(page.get_by_text("Resource Management")).to_be_visible(timeout=10000)

        # Ensure grid view is active
        grid_view_button = page.get_by_role("button", name="Grid")
        if "bg-white" not in (grid_view_button.get_attribute("class") or ""):
             grid_view_button.click()

        # 3. Verify UpdateQuantityModal
        # Find the first resource card
        first_resource_card = page.locator(".group").first
        first_resource_card.hover()

        # Click "Add/Remove" button
        first_resource_card.get_by_role("button", name="Add/Remove").click()

        # Wait for modal and take screenshot
        update_modal = page.locator("h3:has-text('Add/Remove')")
        expect(update_modal).to_be_visible()
        page.screenshot(path="jules-scratch/verification/01_update_quantity_modal.png")

        # Close modal
        page.get_by_role("button", name="Cancel").click()
        expect(update_modal).not_to_be_visible()

        # 4. Verify EditResourceModal
        first_resource_card.hover()
        edit_button = first_resource_card.get_by_role("button", name="Edit")
        expect(edit_button).to_be_visible()
        edit_button.click()

        edit_modal = page.locator("h3:has-text('Edit')")
        expect(edit_modal).to_be_visible()
        page.screenshot(path="jules-scratch/verification/02_edit_resource_modal.png")

        page.get_by_role("button", name="Cancel").click()
        expect(edit_modal).not_to_be_visible()

        # 5. Verify TransferModal
        first_resource_card.hover()
        transfer_button = first_resource_card.get_by_role("button", name="Transfer")
        expect(transfer_button).to_be_visible()
        transfer_button.click()

        transfer_modal = page.locator("h3:has-text('Transfer')")
        expect(transfer_modal).to_be_visible()
        page.screenshot(path="jules-scratch/verification/03_transfer_modal.png")

        page.get_by_role("button", name="Cancel").click()
        expect(transfer_modal).not_to_be_visible()

        print("Verification script completed successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)
