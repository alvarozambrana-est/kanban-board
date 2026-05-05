import { test, expect } from "@playwright/test";

test.describe("Kanban Board E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("board CRUD: create, edit, delete a board", async ({ page }) => {
    // Create board
    await page.click("text=New Board");
    await page.fill('input[placeholder="Enter board name"]', "E2E Test Board");
    await page.click("button:has-text('Create')");

    // Verify board appears
    await expect(page.locator("text=E2E Test Board")).toBeVisible();

    // Edit board
    await page.hover("text=E2E Test Board");
    await page.click('[aria-label="Edit E2E Test Board"]');
    await page.fill('input[placeholder="Enter board name"]', "E2E Edited");
    await page.click("button:has-text('Save')");
    await expect(page.locator("text=E2E Edited")).toBeVisible();

    // Delete board
    await page.hover("text=E2E Edited");
    await page.click('[aria-label="Delete E2E Edited"]');
    await expect(page.locator("text=E2E Edited")).not.toBeVisible();
    await expect(page.locator("text=No boards yet")).toBeVisible();
  });

  test("dialog closes with ESC and X button", async ({ page }) => {
    // Open create board dialog
    await page.click("text=New Board");
    await expect(page.locator("text=Create Board")).toBeVisible();

    // Close with ESC
    await page.keyboard.press("Escape");
    await expect(page.locator("text=Create Board")).not.toBeVisible();

    // Re-open and close with X button
    await page.click("text=New Board");
    await expect(page.locator("text=Create Board")).toBeVisible();
    // shadcn Dialog close button uses sr-only "Close" span
    await page.locator('[role="dialog"] button:has(.sr-only)').click();
    await expect(page.locator("text=Create Board")).not.toBeVisible();
  });

  test("full kanban workflow: columns, cards, labels, manage panel", async ({ page }) => {
    // Create board
    await page.click("text=New Board");
    await page.fill('input[placeholder="Enter board name"]', "Workflow Board");
    await page.click("button:has-text('Create')");

    // Navigate to board
    await page.click("text=Workflow Board");
    await expect(page.locator("text=Workflow Board")).toBeVisible();

    // Add columns with proper sequencing
    await page.click("text=Add Column");
    await page.fill('input[placeholder="Column name..."]', "Todo");
    await page.keyboard.press("Enter");
    await expect(page.locator("text=Todo")).toBeVisible();

    await page.click("text=Add Column");
    await page.fill('input[placeholder="Column name..."]', "Done");
    await page.keyboard.press("Enter");
    await expect(page.locator("text=Done")).toBeVisible();

    // Add cards to Todo column
    await page.locator("text=Add Card").first().click();
    await page.fill('input[placeholder="Enter card title"]', "Setup CI/CD");
    await page.click("button:has-text('Create')");
    await expect(page.locator("text=Setup CI/CD")).toBeVisible();

    // Edit card
    await page.click("text=Setup CI/CD");
    await expect(page.locator("text=Edit Card")).toBeVisible();
    await page.fill('input[placeholder="Enter card title"]', "Setup CI/CD Pipeline");
    await page.click("button:has-text('Save')");
    await expect(page.locator("text=Setup CI/CD Pipeline")).toBeVisible();

    // Open Manage panel
    await page.click("text=Manage");
    await expect(page.locator("text=Manage Board")).toBeVisible();

    // Switch to Labels tab
    await page.click("text=Labels");
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="New label name"]', "urgent");
    // Target the Add button inside the open dialog
    await page.locator('[role="dialog"] button:has-text("Add")').click();
    await expect(page.locator("text=urgent")).toBeVisible();

    // Switch to Types tab
    await page.click("text=Types");
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="New type name"]', "Bug");
    await page.locator('[role="dialog"] button:has-text("Add")').click();
    await expect(page.locator("text=Bug")).toBeVisible();

    // Close Manage panel with ESC
    await page.keyboard.press("Escape");
    await expect(page.locator("text=Manage Board")).not.toBeVisible();

    // Verify board still has data
    await expect(page.locator("text=Setup CI/CD Pipeline")).toBeVisible();
  });

  test("create card with priority and due date", async ({ page }) => {
    await page.click("text=New Board");
    await page.fill('input[placeholder="Enter board name"]', "Priority Board");
    await page.click("button:has-text('Create')");
    await page.click("text=Priority Board");

    // Add a column
    await page.click("text=Add Column");
    await page.fill('input[placeholder="Column name..."]', "Tasks");
    await page.click("button:has-text('Add')");

    // Create card with priority
    await page.click("text=Add Card");
    await page.fill('input[placeholder="Enter card title"]', "Critical bug");

    // Select priority
    await page.click("#card-priority");
    await page.click('[role="option"]:has-text("High")');

    // Set due date
    await page.fill("#card-due", "2026-06-15");
    await page.click("button:has-text('Create')");

    // Verify card shows priority badge
    await expect(page.locator("text=Critical bug")).toBeVisible();
    await expect(page.locator("text=High")).toBeVisible();
    await expect(page.locator("text=2026-06-15")).toBeVisible();
  });
});
