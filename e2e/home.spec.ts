import { test, expect } from '@playwright/test';

test.describe('SOS V3 Phase 02: Home Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test('verifies complete Home dashboard layout and Stitch visual structure', async ({ page }) => {
    // 1. Greeting Header
    const greetingHeader = page.locator('[data-testid="greeting-header"]');
    await expect(greetingHeader).toBeVisible();
    await expect(greetingHeader.locator('h1')).toContainText('Abdalla');

    // 2. Horizon Bar
    const horizonBar = page.locator('[data-testid="horizon-bar"]');
    await expect(horizonBar).toBeVisible();
    await expect(horizonBar).toContainText('Fall Semester 2026');
    await expect(horizonBar).toContainText('48 days left');
    await expect(horizonBar).toContainText('50%');

    // 3. Editorial Stack: Daily Quote & Daily Essay
    const quoteCard = page.locator('[data-testid="daily-quote-card"]');
    await expect(quoteCard).toBeVisible();
    await expect(quoteCard).toContainText('DAILY QUOTE');
    await expect(quoteCard).toContainText('We are what we repeatedly do');
    await expect(quoteCard).toContainText('Aristotle');

    const essayCard = page.locator('[data-testid="daily-essay-card"]');
    await expect(essayCard).toBeVisible();
    await expect(essayCard).toContainText('DAILY ESSAY');
    await expect(essayCard).toContainText('3 MIN READ');
    await expect(essayCard).toContainText('On the Architecture of Deep Memory & Forgetting');

    // 4. 50/50 Grid: Quick Resume (Left) and Tasks (Right)
    const quickResume = page.locator('[data-testid="quick-resume-section"]');
    await expect(quickResume).toBeVisible();
    await expect(quickResume).toContainText('CONTINUE WHERE YOU LEFT OFF');
    await expect(quickResume.locator('[data-testid="resume-item-kandel-pdf"]')).toBeVisible();
    await expect(quickResume.locator('[data-testid="resume-item-stanford-video"]')).toBeVisible();
    await expect(quickResume.locator('[data-testid="resume-item-plasticity-notes"]')).toBeVisible();
    await expect(quickResume.locator('[data-testid="resume-item-snare-flashcards"]')).toBeVisible();

    const tasksSection = page.locator('[data-testid="tasks-section"]');
    await expect(tasksSection).toBeVisible();
    await expect(tasksSection).toContainText("TODAY'S TASKS");
    await expect(page.locator('[data-testid="tasks-counter"]')).toContainText('1 / 4');
  });

  test('interactively adds, completes, and deletes tasks with persistence', async ({ page }) => {
    // Check initial counter
    const counter = page.locator('[data-testid="tasks-counter"]');
    await expect(counter).toContainText('1 / 4');

    // Add a new task
    const input = page.locator('[data-testid="add-task-input"]');
    await input.fill('Master Synaptic Plasticity Mechanisms');
    await input.press('Enter');

    // Verify task is added
    const newTaskRow = page.locator('[data-testid="tasks-list"]').getByText('Master Synaptic Plasticity Mechanisms');
    await expect(newTaskRow).toBeVisible();
    await expect(counter).toContainText('1 / 5');

    // Toggle completion on the new task
    const lastCheckbox = page.locator('[data-testid^="task-checkbox-"]').last();
    await lastCheckbox.click();
    await expect(counter).toContainText('2 / 5');

    // Reload the page to verify local Dexie persistence
    await page.reload();
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="tasks-counter"]')).toContainText('2 / 5');
    await expect(page.locator('[data-testid="tasks-list"]').getByText('Master Synaptic Plasticity Mechanisms')).toBeVisible();

    // Delete the task
    const addedTaskRow = page.locator('[data-testid^="task-row-"]').last();
    await addedTaskRow.hover();
    const deleteBtn = addedTaskRow.locator('[data-testid^="task-delete-"]');
    await deleteBtn.click();

    // Verify task is removed and counter drops back to 1 / 4
    await expect(counter).toContainText('1 / 4');
  });

  test('opens quick-capture scratchpad modal and saves notes to Dexie', async ({ page }) => {
    // Open Quick Capture modal via button
    const openBtn = page.locator('[data-testid="open-quick-capture-btn"]');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    const modal = page.locator('[data-testid="quick-capture-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Quick Capture Note');

    // Fill in title and content
    const titleInput = page.locator('[data-testid="quick-capture-title-input"]');
    const contentInput = page.locator('[data-testid="quick-capture-content-input"]');
    await titleInput.fill('Dopamine Receptor Signaling Pathways');
    await contentInput.fill('D1-like receptors stimulate adenylyl cyclase via Gs, whereas D2-like inhibit via Gi.');

    // Capture visual screenshot of modal
    await page.screenshot({ path: 'home-quick-capture-modal-verification.png' });

    // Save note
    const saveBtn = page.locator('[data-testid="quick-capture-save-btn"]');
    await saveBtn.click();

    // Verify modal closes and toast appears
    await expect(modal).not.toBeVisible();
    const toast = page.locator('[data-testid="home-toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Dopamine Receptor Signaling Pathways');
  });

  test('navigates to learning view when clicking a resume item', async ({ page }) => {
    const kandelItem = page.locator('[data-testid="resume-item-kandel-pdf"]');
    await kandelItem.click();

    // Router should transition to /learning?assetId=kandel-pdf
    await expect(page).toHaveURL(/\/learning/);
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });
});
