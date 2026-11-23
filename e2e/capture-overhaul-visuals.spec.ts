import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Visual and Functional Verification of Tracking & Calendar Overhaul', () => {
  test('Capture all screenshots and verify overhaul flows', async ({ page }) => {
    // Ensure screenshots folder exists
    const screenshotsDir = path.resolve(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // 1. Navigate to /tracking
    await page.goto('/tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="today-sessions-card"]');
    await page.waitForSelector('[data-testid="focus-timer-card"]');
    await page.waitForSelector('[data-testid="annual-activity-heatmap"]');
    await page.waitForSelector('[data-testid="annual-metrics-summary-card"]');
    await page.waitForSelector('[data-testid="analytics-section"]');

    // Wait for animations and SVG render to settle
    await page.waitForTimeout(1000);

    // Verify 3 metrics in right 1/3 card
    await expect(page.locator('[data-testid="metric-total-study-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-current-streak"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-daily-average"]')).toBeVisible();

    // Verify borderless session title input
    const titleInput = page.locator('[data-testid="session-title-input"]');
    await expect(titleInput).toBeVisible();

    // Capture Screenshot 1: Tracking Dashboard
    await page.screenshot({
      path: path.join(screenshotsDir, 'tracking-overhaul.png'),
      fullPage: false
    });

    // Open Session Settings Modal
    const settingsBtn = page.locator('[data-testid="timer-settings-btn"]');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // Wait for Domain input
    const domainInput = page.locator('[data-testid="domain-input"]');
    await expect(domainInput).toBeVisible();
    await domainInput.click();
    await page.waitForTimeout(400);

    // Capture Screenshot 2: Session Settings Modal with monochrome floating dropdown
    await page.screenshot({
      path: path.join(screenshotsDir, 'session-settings-monochrome-modal.png'),
      fullPage: false
    });

    // Close settings modal
    const cancelModalBtn = page.getByRole('button', { name: 'Cancel' });
    if (await cancelModalBtn.isVisible()) {
      await cancelModalBtn.click();
    }

    // 2. Click "History" in Today's Sessions card
    const viewHistoryBtn = page.locator('[data-testid="view-history-btn"]');
    await expect(viewHistoryBtn).toBeVisible();
    await viewHistoryBtn.click();

    // Verify Session History View is rendered
    await page.waitForSelector('[data-testid="session-history-view"]');
    // Verify Header Breadcrumb is rendered
    const breadcrumb = page.locator('[data-testid="tracking-header-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Verify that NO "Completed" pill badge is rendered next to session titles
    const historyView = page.locator('[data-testid="session-history-view"]');
    const completedBadge = historyView.locator('text="Completed"');
    await expect(completedBadge).toHaveCount(0);

    await page.waitForTimeout(500);

    // Capture Screenshot 3: Session History (No completed badges)
    await page.screenshot({
      path: path.join(screenshotsDir, 'session-history-overhaul.png'),
      fullPage: false
    });

    // Test Top Bar Breadcrumb Back Button
    const backBtn = page.locator('[data-testid="history-back-to-dashboard-btn"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify returned to Dashboard
    await expect(page.locator('[data-testid="today-sessions-card"]')).toBeVisible();

    // 3. Navigate to /calendar (Day View)
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="calendar-view"]');

    // Switch to Day View
    const dayViewBtn = page.locator('[data-testid="calendar-view-day"]');
    await expect(dayViewBtn).toBeVisible();
    await dayViewBtn.click();
    await page.waitForSelector('[data-testid="calendar-day-view"]');

    // Click on a calendar block to select it and test the #60A5FA accent border
    const firstBlock = page.locator('[data-testid^="calendar-block-"]').first();
    if (await firstBlock.isVisible()) {
      await firstBlock.click();
    }

    await page.waitForTimeout(1000);

    // Capture Screenshot 4: Calendar Day View
    await page.screenshot({
      path: path.join(screenshotsDir, 'calendar-day-overhaul.png'),
      fullPage: false
    });

    // 4. Switch to Week View
    const weekViewBtn = page.locator('[data-testid="calendar-view-week"]');
    await expect(weekViewBtn).toBeVisible();
    await weekViewBtn.click();
    await page.waitForSelector('[data-testid="calendar-week-view"]');
    await page.waitForTimeout(1000);

    // Capture Screenshot 5: Calendar Week View
    await page.screenshot({
      path: path.join(screenshotsDir, 'calendar-week-overhaul.png'),
      fullPage: false
    });
  });
});
