import { test, expect } from '@playwright/test';

test.describe('Profile & Settings UI Fixes Verification', () => {

  test('1. Text selection is fully enabled on /profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="profile-page"]', { timeout: 10000 });

    const identityCard = page.locator('[data-testid="profile-identity-card"]');
    await expect(identityCard).toBeVisible();

    // Verify computed style for user-select on Name, username, bio
    const nameEl = page.locator('[data-testid="profile-name"]');
    await expect(nameEl).toBeVisible();
    const nameUserSelect = await nameEl.evaluate((el) => window.getComputedStyle(el).userSelect);
    expect(nameUserSelect).not.toBe('none');

    const bioEl = page.locator('[data-testid="profile-bio"]');
    await expect(bioEl).toBeVisible();
    const bioUserSelect = await bioEl.evaluate((el) => window.getComputedStyle(el).userSelect);
    expect(bioUserSelect).not.toBe('none');

    // Verify cover banner gradient overlay has pointer-events: none so it doesn't intercept clicks/selection
    const bannerOverlay = identityCard.locator('div.pointer-events-none').first();
    await expect(bannerOverlay).toBeVisible();
    const pointerEvents = await bannerOverlay.evaluate((el) => window.getComputedStyle(el).pointerEvents);
    expect(pointerEvents).toBe('none');

    // Programmatically select text on the page and verify window.getSelection() is populated
    await page.evaluate(() => {
      const heading = document.querySelector('[data-testid="profile-name"]');
      if (heading) {
        const range = document.createRange();
        range.selectNodeContents(heading);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });

    const selectedText = await page.evaluate(() => window.getSelection()?.toString());
    expect(selectedText).toBe('Abdalla Husin');
  });

  test('2. /tracking renders unified Annual Activity heatmap matching /profile without E2E test sessions', async ({ page }) => {
    await page.goto('/tracking');
    await page.waitForSelector('[data-testid="annual-activity-heatmap"]', { timeout: 10000 });

    const heatmap = page.locator('[data-testid="annual-activity-heatmap"]');
    await expect(heatmap).toBeVisible();

    // Verify header title and date range
    await expect(heatmap.locator('text=ANNUAL ACTIVITY')).toBeVisible();
    await expect(heatmap.locator('text=Nov 2025 - Nov 2026')).toBeVisible();

    // Verify Less ... More legend
    await expect(heatmap.locator('text=Less')).toBeVisible();
    await expect(heatmap.locator('text=More')).toBeVisible();

    // Verify legend has 5 rounded squares
    const legendSquares = heatmap.locator('.border-t span.rounded-\\[3px\\]');
    await expect(legendSquares).toHaveCount(5);

    // Verify NO legacy bottom-left contribution count text (e.g. "X contributions in the last year")
    const bottomText = heatmap.locator('text=/contributions in the last year/i');
    await expect(bottomText).toHaveCount(0);

    // Verify Today's Sessions has ZERO "E2E Sync Test" dummy entries
    const syncTestItems = page.locator('text=/E2E Sync Test/i');
    await expect(syncTestItems).toHaveCount(0);

    // Capture visual screenshot of tracking heatmap
    await page.screenshot({ path: 'e2e/screenshots/tracking-heatmap-verification.png', fullPage: true });
  });

  test('3. Settings -> Account has exact 12-item logical order and updated username copy', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-account-tab"]', { timeout: 10000 });

    // Verify updated username copy
    const usernameSubtext = page.locator('text=Your unique handle across SOS');
    await expect(usernameSubtext).toBeVisible();
    // Verify legacy copy is NOT present
    const legacySubtext = page.locator('text=across SOS Communities');
    await expect(legacySubtext).toHaveCount(0);

    // Verify sequence of fields inside Details card
    const fieldTitles = await page.evaluate(() => {
      const detailsCard = document.querySelector('[data-testid="settings-account-tab"]');
      if (!detailsCard) return [];
      
      const items: string[] = [];
      const spans = detailsCard.querySelectorAll('span.font-medium.text-\\[\\#F4F4F5\\]');
      spans.forEach(s => items.push(s.textContent?.trim() || ''));
      return items;
    });

    // Expected exact order:
    // 1. Profile Avatar, 2. Cover Banner, 3. Name, 4. Username, 5. Bio, 6. Education, 7. Location, 8. Learning Focus
    // (divider: Account & Security)
    // 9. Email, 10. Password, 11. Plan
    expect(fieldTitles).toContain('Profile Avatar');
    expect(fieldTitles).toContain('Cover Banner');
    expect(fieldTitles).toContain('Name');
    expect(fieldTitles).toContain('Username');
    expect(fieldTitles).toContain('Bio');
    expect(fieldTitles).toContain('Education');
    expect(fieldTitles).toContain('Location');
    expect(fieldTitles).toContain('Learning Focus');
    expect(fieldTitles).toContain('Email');
    expect(fieldTitles).toContain('Password');
    expect(fieldTitles).toContain('Plan');

    const avatarIndex = fieldTitles.indexOf('Profile Avatar');
    const coverIndex = fieldTitles.indexOf('Cover Banner');
    const nameIndex = fieldTitles.indexOf('Name');
    const usernameIndex = fieldTitles.indexOf('Username');
    const bioIndex = fieldTitles.indexOf('Bio');
    const eduIndex = fieldTitles.indexOf('Education');
    const locIndex = fieldTitles.indexOf('Location');
    const focusIndex = fieldTitles.indexOf('Learning Focus');
    const emailIndex = fieldTitles.indexOf('Email');
    const passwordIndex = fieldTitles.indexOf('Password');
    const planIndex = fieldTitles.indexOf('Plan');

    expect(avatarIndex).toBeLessThan(coverIndex);
    expect(coverIndex).toBeLessThan(nameIndex);
    expect(nameIndex).toBeLessThan(usernameIndex);
    expect(usernameIndex).toBeLessThan(bioIndex);
    expect(bioIndex).toBeLessThan(eduIndex);
    expect(eduIndex).toBeLessThan(locIndex);
    expect(locIndex).toBeLessThan(focusIndex);
    expect(focusIndex).toBeLessThan(emailIndex);
    expect(emailIndex).toBeLessThan(passwordIndex);
    expect(passwordIndex).toBeLessThan(planIndex);

    // Verify Account & Security divider section header
    const sectionDivider = page.locator('text=Account & Security');
    await expect(sectionDivider).toBeVisible();
  });

  test('4. Global Left Sidebar avatar dynamically reflects real user avatar', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="profile-page"]', { timeout: 10000 });

    // Fetch user profile data to get real avatarUrl
    const res = await page.request.get('/api/profile');
    expect(res.ok()).toBeTruthy();
    const userData = await res.json();
    const expectedAvatarUrl = userData.avatarUrl;

    // Check LeftRail avatar dynamically updates to match the user avatar
    const sidebarAvatar = page.locator('[data-testid="nav-item-profile"] img');
    await expect(sidebarAvatar).toBeVisible();
    await expect(sidebarAvatar).toHaveAttribute('src', expectedAvatarUrl, { timeout: 10000 });
    const actualSrc = await sidebarAvatar.getAttribute('src');
    expect(actualSrc).not.toContain('images.unsplash.com');
  });

});
