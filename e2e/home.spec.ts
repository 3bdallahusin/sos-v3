import { test, expect } from '@playwright/test';

test.describe('SOS V3 Phase 02: Home Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test('verifies complete Home dashboard layout, dynamic greeting and date, and absence of bottom status bar', async ({ page }) => {
    // 1. Dynamic Greeting Header (Generic fallback for guest, dynamic time of day)
    const greetingHeader = page.locator('[data-testid="greeting-header"]');
    await expect(greetingHeader).toBeVisible();
    await expect(greetingHeader.locator('[data-testid="greeting-heading"]')).toHaveText(/Good (morning|afternoon|evening)/);

    // Dynamic date in local timezone
    const expectedDate = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
    await expect(greetingHeader.locator('[data-testid="greeting-date"]')).toHaveText(expectedDate);

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

    // 5. Verify Complete Removal of Bottom Status Footer
    await expect(page.locator('[data-testid="open-quick-capture-btn"]')).toHaveCount(0);
    await expect(page.getByText('Quick Scratchpad Note')).toHaveCount(0);
    await expect(page.getByText('SOS Local Persistence')).toHaveCount(0);
    await expect(page.getByText('Dexie v2')).toHaveCount(0);
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

    // Allow Dexie transaction to commit before page reload
    await page.waitForTimeout(300);

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

  test('swaps corner-bracket fullscreen icons dynamically on CentralWorkspace and RightAiPanel', async ({ page }) => {
    // 1. Central Workspace Fullscreen Toggle
    const centerFsBtn = page.locator('button[aria-label="Toggle Workspace Fullscreen"]');
    await expect(centerFsBtn).toBeVisible();

    // In default state (AI panel open), outward corner brackets are rendered
    await centerFsBtn.click(); // Collapses AI panel into fullscreen focus mode
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'home-center-fullscreen.png' });

    // AI panel is now closed, central workspace is in Fullscreen Focus Mode
    // The button title now says "Exit Fullscreen Focus Mode"
    await expect(centerFsBtn).toHaveAttribute('title', /Exit Fullscreen Focus Mode/);

    // Click again to exit fullscreen
    await centerFsBtn.click();
    await page.waitForTimeout(400);
    await expect(centerFsBtn).toHaveAttribute('title', /Focus Mode/);

    // 2. Right AI Panel Fullscreen Toggle
    const aiFsBtn = page.locator('button[aria-label="Fullscreen AI panel"]');
    await expect(aiFsBtn).toBeVisible();

    // Click to enter AI Panel Fullscreen
    await aiFsBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'home-ai-fullscreen.png' });
    const exitAiFsBtn = page.locator('button[aria-label="Exit AI panel fullscreen"]');
    await expect(exitAiFsBtn).toBeVisible();

    // Click again to restore default width
    await exitAiFsBtn.click();
    await page.waitForTimeout(400);
    await expect(page.locator('button[aria-label="Fullscreen AI panel"]')).toBeVisible();
  });

  test('navigates to learning view when clicking a resume item', async ({ page }) => {
    const kandelItem = page.locator('[data-testid="resume-item-kandel-pdf"]');
    await kandelItem.click();

    // Router should transition to /learning?assetId=kandel-pdf
    await expect(page).toHaveURL(/\/learning/);
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });
});
