import { test, expect } from '@playwright/test';

test.describe('SOS V3: Home Dashboard (Pitch-Black OLED 50/50 Layout)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test('verifies OLED layout, greeting, semester calculator, live clock, and absence of Today Tasks', async ({ page }) => {
    // 1. Hero Greeting Card
    const greetingCard = page.locator('[data-testid="hero-greeting-card"]');
    await expect(greetingCard).toBeVisible();
    await expect(greetingCard.locator('[data-testid="greeting-heading"]')).toHaveText(/Good (Morning|Afternoon|Evening)/);
    await expect(greetingCard.locator('[data-testid="semester-days-badge"]')).toContainText('days left');
    await expect(greetingCard.locator('[data-testid="semester-percent-badge"]')).toContainText('%');

    // 2. Hero Clock Card (Analog + Live Digital + European Date)
    const clockCard = page.locator('[data-testid="hero-clock-card"]');
    await expect(clockCard).toBeVisible();
    await expect(clockCard.locator('[data-testid="analog-clock-svg"]')).toBeVisible();
    await expect(clockCard.locator('[data-testid="digital-time-readout"]')).toBeVisible();
    await expect(clockCard.locator('[data-testid="european-date"]')).toBeVisible();

    // 3. Editorial Stack: Daily Quote & Daily Article (112px height each)
    const quoteCard = page.locator('[data-testid="daily-quote-card"]');
    await expect(quoteCard).toBeVisible();
    await expect(quoteCard).toContainText('DAILY QUOTE');

    const articleCard = page.locator('[data-testid="daily-article-card"]');
    await expect(articleCard).toBeVisible();
    await expect(articleCard).toContainText('DAILY ARTICLE');

    // 4. Symmetrical 50/50 2-Column Grid: Flashcards (Left) & Continue Learning (Right)
    const flashcardsSection = page.locator('[data-testid="flashcards-section"]');
    await expect(flashcardsSection).toBeVisible();
    await expect(flashcardsSection).toContainText('FLASHCARDS');
    await expect(page.locator('[data-testid="deck-row-deck-snare"]')).toBeVisible();

    const continueLearning = page.locator('[data-testid="continue-learning-section"]');
    await expect(continueLearning).toBeVisible();
    await expect(continueLearning).toContainText('CONTINUE LEARNING');
    await expect(page.locator('[data-testid="continue-item-kandel-pdf"]')).toBeVisible();

    // 5. Verify LeftRail Home navigation item is present and active
    const homeNavItem = page.locator('[data-testid="nav-item-home"]');
    await expect(homeNavItem).toBeVisible();
    await expect(homeNavItem).toHaveAttribute('data-active', 'true');

    // 6. Verify Complete Absence of Today's Tasks on Home
    await expect(page.locator('[data-testid="tasks-section"]')).toHaveCount(0);
    await expect(page.getByText("TODAY'S TASKS")).toHaveCount(0);

    // 7. Verify Complete Absence of Legacy Scratchpad / Quick Capture on Home
    await expect(page.locator('[data-testid="open-quick-capture-btn"]')).toHaveCount(0);
    await expect(page.getByText('Quick Scratchpad Note')).toHaveCount(0);
    await expect(page.getByText('SOS Local Persistence')).toHaveCount(0);
  });

  test('clicking flashcard deck navigates to learning workspace with deck context', async ({ page }) => {
    const snareDeckRow = page.locator('[data-testid="deck-row-deck-snare"]');
    await expect(snareDeckRow).toBeVisible();
    await snareDeckRow.click();

    // Should navigate to /learning?deckId=deck-snare&mode=recall
    await expect(page).toHaveURL(/\/learning/);
    await expect(page.locator('[data-testid="learning-tab-bar"]')).toBeVisible();

    // Return to home via LeftRail Home icon
    await page.locator('[data-testid="nav-item-home"]').click();
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test('clicking continue learning item navigates to learning workspace and touches timestamp', async ({ page }) => {
    const kandelItem = page.locator('[data-testid="continue-item-kandel-pdf"]');
    await expect(kandelItem).toBeVisible();
    await kandelItem.click();

    // Should navigate to /learning?assetId=kandel-pdf
    await expect(page).toHaveURL(/\/learning/);
    await expect(page.locator('[data-testid="learning-tab-bar"]')).toBeVisible();

    // Return to home via LeftRail Home icon
    await page.locator('[data-testid="nav-item-home"]').click();
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test('deleting item from continue learning shows undo toast and can be undone', async ({ page }) => {
    const firstRow = page.locator('[data-testid^="continue-item-"]').first();
    await expect(firstRow).toBeVisible();
    await firstRow.hover();

    const deleteBtn = firstRow.locator('[data-testid^="delete-recent-"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Undo toast should appear
    const undoToast = page.locator('[data-testid="undo-toast"]');
    await expect(undoToast).toBeVisible();

    // Click undo
    const undoBtn = page.locator('[data-testid="undo-toast-button"]');
    await undoBtn.click();

    await expect(undoToast).not.toBeVisible();
  });
});
