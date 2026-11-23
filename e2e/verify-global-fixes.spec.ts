import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('C:/Users/3BDALLA/.gemini/antigravity/brain/3189668b-dde8-41a9-b14d-0085d7d28a66/screenshots/verified');

test('Visual Verification: Capture all 5 refined states and verify fixes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Home Page Verification
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Issue 2: Progress Bar Contrast & Symmetrical Geometry
  const heroCard = page.locator('[data-testid="hero-greeting-card"]');
  await expect(heroCard).toBeVisible();
  await heroCard.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_hero_greeting_progress.png')
  });

  // Issue 1 & 4: Continue Learning Humanized Titles + Rest State
  const continueCard = page.locator('[data-testid="continue-learning-section"]');
  await expect(continueCard).toBeVisible();
  await continueCard.screenshot({
    path: path.join(SCREENSHOT_DIR, '02_continue_learning_titles.png')
  });

  // Issue 4: Row Hover State (shows delete button)
  const firstContinueRow = continueCard.locator('.sos-exec-row').first();
  await firstContinueRow.hover();
  await page.waitForTimeout(200);
  await continueCard.screenshot({
    path: path.join(SCREENSHOT_DIR, '03_continue_learning_row_hover.png')
  });

  // Issue 4: Delete Button Direct Hover (shows red destructive state & non-clipped tooltip)
  const firstDeleteBtn = firstContinueRow.locator('button[data-testid^="delete-recent-"]');
  await firstDeleteBtn.hover();
  await page.waitForTimeout(250);
  await continueCard.screenshot({
    path: path.join(SCREENSHOT_DIR, '04_continue_delete_btn_tooltip.png')
  });

  // Issue 1: Flashcards humanized titles
  const flashcardsCard = page.locator('[data-testid="flashcards-section"]');
  await expect(flashcardsCard).toBeVisible();
  await flashcardsCard.screenshot({
    path: path.join(SCREENSHOT_DIR, '05_flashcards_humanized.png')
  });

  // Issue 3: Subtle Global Card Hover Glow
  await continueCard.hover({ position: { x: 100, y: 100 } });
  await page.waitForTimeout(200);
  await continueCard.screenshot({
    path: path.join(SCREENSHOT_DIR, '06_card_hover_glow_subtle.png')
  });

  // 2. Library Page Verification (Issue 1 & 5)
  await page.locator('[data-testid="nav-item-library"]').click();
  await page.waitForTimeout(500);

  const libraryGrid = page.locator('[data-testid="library-grid-view"]');
  await expect(libraryGrid).toBeVisible();

  // Navigate into Computer Science -> Distributed Systems to see files
  const csFolder = libraryGrid.locator('text=Computer Science').first();
  await csFolder.dblclick();
  await page.waitForTimeout(400);

  const dsFolder = libraryGrid.locator('text=Distributed Systems').first();
  await dsFolder.dblclick();
  await page.waitForTimeout(400);

  // Capture grid items (check humanized titles + uniform icon container corner radii)
  await libraryGrid.screenshot({
    path: path.join(SCREENSHOT_DIR, '07_library_grid_items.png')
  });

  // 3. Tracking Page Verification (Issue 4 & 5)
  await page.locator('[data-testid="nav-item-tracking"]').click();
  await page.waitForTimeout(500);

  // Capture "History" button and "Today's Sessions"
  const todaySessionsCard = page.locator('[data-testid="today-sessions-card"]');
  await expect(todaySessionsCard).toBeVisible();
  await todaySessionsCard.screenshot({
    path: path.join(SCREENSHOT_DIR, '08_tracking_today_sessions.png')
  });

  // Capture "+" button and "Today's Tasks"
  const todayTasksCard = page.locator('[data-testid="today-tasks-card"]');
  await expect(todayTasksCard).toBeVisible();
  await todayTasksCard.screenshot({
    path: path.join(SCREENSHOT_DIR, '09_tracking_tasks_card.png')
  });

  // Hover over a delete button on Tracking to verify unified destructive styling + tooltip
  const firstSessionRow = todaySessionsCard.locator('[data-testid^="session-item-"]').first();
  if (await firstSessionRow.isVisible()) {
    await firstSessionRow.hover();
    await page.waitForTimeout(200);
    const sessionDeleteBtn = firstSessionRow.locator('button[data-testid^="delete-session-"]');
    if (await sessionDeleteBtn.isVisible()) {
      await sessionDeleteBtn.hover();
      await page.waitForTimeout(250);
      await todaySessionsCard.screenshot({
        path: path.join(SCREENSHOT_DIR, '10_tracking_delete_tooltip.png')
      });
    }
  }
});
