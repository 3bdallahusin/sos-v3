import { test, expect } from '@playwright/test';

test.describe('Profile Module Pixel-Perfect UI & End-to-End Verification', () => {

  test('1. Visual layout, identity card, annual activity heatmap, and telemetry cards render cleanly', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="profile-page"]', { timeout: 10000 });

    // 1. Verify Page & Identity Card
    const profilePage = page.locator('[data-testid="profile-page"]');
    await expect(profilePage).toBeVisible();

    const identityCard = page.locator('[data-testid="profile-identity-card"]');
    await expect(identityCard).toBeVisible();

    // Verify 80px circular avatar
    const avatar = identityCard.locator('img[alt="Abdalla Husin"]');
    await expect(avatar).toBeVisible();

    // Verify Name & Monospace Username
    await expect(identityCard.getByRole('heading', { level: 2 })).toHaveText('Abdalla Husin');
    await expect(identityCard.locator('p.font-mono')).toContainText('@abdalla7usin');

    // Verify Bio
    const bioLocator = page.locator('[data-testid="profile-bio"]');
    await expect(bioLocator).toBeVisible();
    await expect(bioLocator).toContainText('distributed consensus', { timeout: 10000 });

    // Verify Metadata row: Location, Joined Date, Education
    await expect(identityCard.locator('text=Mansoura, Egypt')).toBeVisible();
    await expect(identityCard.locator('text=Joined November 2026')).toBeVisible();
    await expect(identityCard.locator('text=Mansoura University')).toBeVisible();

    // Verify Top-Right Action Buttons
    const shareBtn = page.locator('[data-testid="profile-share-button"]');
    const editBtn = page.locator('[data-testid="profile-edit-button"]');
    await expect(shareBtn).toBeVisible();
    await expect(editBtn).toBeVisible();

    // 2. Verify Bento Grid Layout & Heatmap Section (2/3 width)
    const bentoGrid = page.locator('[data-testid="profile-bento-grid"]');
    await expect(bentoGrid).toBeVisible();

    const heatmapSection = page.locator('[data-testid="profile-heatmap-section"]');
    await expect(heatmapSection).toBeVisible();
    await expect(heatmapSection.locator('text=ANNUAL ACTIVITY')).toBeVisible();
    await expect(heatmapSection.locator('text=Less')).toBeVisible();
    await expect(heatmapSection.locator('text=More')).toBeVisible();

    // Verify heatmap grid fits comfortably without unwanted horizontal scroll
    const scrollOverflow = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="annual-activity-heatmap"] .overflow-x-auto');
      if (!el) return false;
      return el.scrollWidth > el.clientWidth + 2; // allowance of 2px for subpixel rounding
    });
    expect(scrollOverflow).toBe(false);

    // 3. Verify Right-Side Stacked 3 Telemetry Cards (1/3 width)
    const studyTimeCard = page.locator('[data-testid="profile-total-study-time-card"]');
    const streakCard = page.locator('[data-testid="profile-current-streak-card"]');
    const dailyAvgCard = page.locator('[data-testid="profile-daily-average-card"]');

    await expect(studyTimeCard).toBeVisible();
    await expect(studyTimeCard.locator('text=TOTAL STUDY TIME')).toBeVisible();
    await expect(streakCard).toBeVisible();
    await expect(streakCard.locator('text=CURRENT STREAK')).toBeVisible();
    await expect(dailyAvgCard).toBeVisible();
    await expect(dailyAvgCard.locator('text=DAILY AVERAGE')).toBeVisible();

    // Capture visual screenshot
    await page.screenshot({ path: 'e2e/screenshots/profile-visual-verification.png', fullPage: true });
  });

  test('2. Action buttons: Share copies profile link & shows toast; Edit routes to /settings', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/profile');
    await page.waitForSelector('[data-testid="profile-page"]', { timeout: 10000 });

    // Test Share Button
    const shareBtn = page.locator('[data-testid="profile-share-button"]');
    await shareBtn.click();

    // Verify Toast appears
    const toast = page.locator('[data-testid="profile-toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Profile link copied to clipboard');

    // Test Edit Button: MUST route directly to /settings (no modal!)
    const editBtn = page.locator('[data-testid="profile-edit-button"]');
    await editBtn.click();
    await page.waitForURL('**/settings');
    expect(page.url()).toContain('/settings');
  });

  test('3. End-to-End Data Flow: Editing Bio & Location in Settings updates database and reflects in Profile', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-account-tab"]', { timeout: 10000 });

    // Find Location edit button and update
    const locationRow = page.locator('text=Location').locator('..').locator('..');
    const locationEditBtn = locationRow.getByTitle('Edit Location');
    await locationEditBtn.click();

    const locationInput = locationRow.locator('input[type="text"]');
    await locationInput.fill('Alexandria, Egypt');
    await locationRow.locator('button:has(svg.lucide-check)').click();
    await page.waitForTimeout(500);

    // Find Bio edit button and update
    const bioRow = page.locator('span:text-is("Bio")').locator('..').locator('..');
    const bioEditBtn = bioRow.getByTitle('Edit Bio');
    await bioEditBtn.click();

    const bioTextarea = bioRow.locator('textarea');
    await bioTextarea.fill('Pioneering neuro-symbolic cognitive architectures and local-first memory protocols.');
    await bioRow.locator('button:has(svg.lucide-check)').click();
    await page.waitForTimeout(500);

    // Navigate to /profile and verify updated values
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="profile-page"]', { timeout: 10000 });

    const identityCard = page.locator('[data-testid="profile-identity-card"]');
    await expect(identityCard.locator('text=Alexandria, Egypt')).toBeVisible();
    await expect(identityCard.locator('text=Pioneering neuro-symbolic cognitive architectures')).toBeVisible();

    // Restore original values for clean state
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-account-tab"]', { timeout: 10000 });

    const locRow2 = page.locator('text=Location').locator('..').locator('..');
    await locRow2.getByTitle('Edit Location').click();
    await locRow2.locator('input[type="text"]').fill('Mansoura, Egypt');
    await locRow2.locator('button:has(svg.lucide-check)').click();
    await page.waitForTimeout(300);

    const bioRow2 = page.locator('span:text-is("Bio")').locator('..').locator('..');
    await bioRow2.getByTitle('Edit Bio').click();
    await bioRow2.locator('textarea').fill('Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.');
    await bioRow2.locator('button:has(svg.lucide-check)').click();
    await page.waitForTimeout(300);
  });

  test('4. Real Backend Telemetry: Verifies Total Study Time, Current Streak, and Daily Average from database', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="profile-page"]', { timeout: 10000 });

    const studyTimeCard = page.locator('[data-testid="profile-total-study-time-card"]');
    const streakCard = page.locator('[data-testid="profile-current-streak-card"]');
    const dailyAvgCard = page.locator('[data-testid="profile-daily-average-card"]');

    // Verify non-empty calculated values
    const studyTimeText = await studyTimeCard.locator('.text-\\[22px\\]').textContent();
    const streakText = await streakCard.locator('.text-\\[22px\\]').textContent();
    const dailyAvgText = await dailyAvgCard.locator('.text-\\[22px\\]').textContent();

    expect(studyTimeText).toMatch(/^\d+(\.\d+)? (Hour|Hours)$/);
    expect(streakText).toMatch(/^\d+ (Day|Days)$/);
    expect(dailyAvgText).toMatch(/^\d+(\.\d+)? (Hour|Hours)$/);
  });

  test('5. Telemetry Verification: Completing a session dynamically increments Total Study Time on /profile', async ({ page, request }) => {
    // 1. Fetch current telemetry to get baseline hours
    const baselineRes = await request.get('/api/profile/telemetry');
    expect(baselineRes.ok()).toBeTruthy();
    const baseline = await baselineRes.json();
    const initialHours = baseline.totalStudyTimeHours;

    // 2. Create and complete a study session for today with 3600 focus seconds (1 hour)
    const today = new Date().toISOString().split('T')[0];
    const newSessionId = `test-telemetry-session-${Date.now()}`;
    
    // Insert completed session via Fastify calendar endpoint
    const blockRes = await request.post('/api/calendar/blocks', {
      data: {
        title: 'Deep Distributed Consensus Review',
        domain: 'Computer Science',
        date: today,
        startTime: '10:00',
        endTime: '11:00'
      }
    });
    expect(blockRes.ok()).toBeTruthy();
    const blockData = await blockRes.json();
    const blockId = blockData.block.id;

    // Complete the block
    const updateRes = await request.patch(`/api/calendar/blocks/${blockId}`, {
      data: {
        status: 'completed'
      }
    });
    expect(updateRes.ok()).toBeTruthy();

    // 3. Navigate / reload /profile and verify Total Study Time incremented by 1 hour
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="profile-page"]', { timeout: 10000 });

    const studyTimeCard = page.locator('[data-testid="profile-total-study-time-card"]');
    const expectedHours = initialHours + 1;
    await expect(studyTimeCard.locator('.text-\\[22px\\]')).toHaveText(`${expectedHours} Hours`);

    // Clean up created test block
    await request.delete(`/api/calendar/blocks/${blockId}`);
  });
});
