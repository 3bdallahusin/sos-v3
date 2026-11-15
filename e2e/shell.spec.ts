import { test, expect } from '@playwright/test';

test.describe('SOS V3 App Shell & Foundations (Phase 01)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app shell to mount
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('verifies exact App Shell geometry and island layout', async ({ page }) => {
    // 1. Global Header: 48px height
    const header = page.locator('[data-testid="global-header"]');
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox!.height).toBe(48);

    // 2. Left Rail: Collapsed state is exactly 56px
    const leftRail = page.locator('[data-testid="left-rail"]');
    await expect(leftRail).toBeVisible();
    let railBox = await leftRail.boundingBox();
    expect(railBox).not.toBeNull();
    expect(railBox!.width).toBe(56);

    // 3. Right AI Panel: Exactly 340px
    const aiPanel = page.locator('[data-testid="right-ai-panel"]');
    await expect(aiPanel).toBeVisible();
    const aiBox = await aiPanel.boundingBox();
    expect(aiBox).not.toBeNull();
    expect(aiBox!.width).toBe(340);

    // 4. Central Workspace: Takes remaining horizontal width
    const central = page.locator('[data-testid="central-workspace"]');
    await expect(central).toBeVisible();
    const centralBox = await central.boundingBox();
    expect(centralBox).not.toBeNull();
    // 1440 - (8px outer * 2) - 56px (rail) - 340px (ai) - (8px gap * 2) = 1012px
    expect(centralBox!.width).toBeGreaterThan(950);

    // 5. Expand Left Rail to 240px
    const toggleButton = page.locator('button[aria-label="Expand navigation rail"]');
    await toggleButton.click();
    await page.waitForTimeout(400); // Allow spring animation
    railBox = await leftRail.boundingBox();
    expect(railBox!.width).toBe(240);

    // Collapse it back to 56px
    const collapseButton = page.locator('button[aria-label="Collapse navigation rail"]');
    await collapseButton.click();
    await page.waitForTimeout(400);
    railBox = await leftRail.boundingBox();
    expect(railBox!.width).toBe(56);
  });

  test('verifies eight navigation destinations in canonical order and routing', async ({ page }) => {
    const expectedDestinations = [
      { id: 'home', label: 'Home', path: '/', placeholder: 'Home Dashboard' },
      { id: 'library', label: 'Library', path: '/library', placeholder: 'Library & Knowledge Base' },
      { id: 'learning', label: 'Learning', path: '/learning', placeholder: 'Learning Workspace' },
      { id: 'tracking', label: 'Tracking', path: '/tracking', placeholder: 'Study Tracking' },
      { id: 'calendar', label: 'Calendar', path: '/calendar', placeholder: 'Academic Calendar' },
      { id: 'community', label: 'Community', path: '/community', placeholder: 'Peer Community' },
      { id: 'profile', label: 'Profile', path: '/profile', placeholder: 'Student Profile' },
      { id: 'settings', label: 'Settings', path: '/settings', placeholder: 'System Settings' }
    ];

    // Check all nav items exist in left rail in order
    const navItems = page.locator('nav a[data-testid^="nav-item-"]');
    await expect(navItems).toHaveCount(8);

    for (let i = 0; i < expectedDestinations.length; i++) {
      const item = expectedDestinations[i];
      const navLink = page.locator(`[data-testid="nav-item-${item.id}"]`);
      await expect(navLink).toBeVisible();

      // Click each navigation destination
      await navLink.click();
      await expect(page).toHaveURL(new RegExp(`${item.path === '/' ? '/$' : item.path}`));

      // Verify active styling
      await expect(navLink).toHaveAttribute('data-active', 'true');

      // Verify placeholder content mounts in central viewport
      await expect(page.getByText(item.placeholder)).toBeVisible();
    }
  });

  test('confirms Docked Toolbar is NOT rendered or reserved in App Shell', async ({ page }) => {
    // Docked toolbar is strictly excluded from Phase 01
    const toolbar = page.locator('[data-testid="docked-toolbar"]');
    await expect(toolbar).toHaveCount(0);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCount(0);
  });

  test('verifies static Header Timer mirror in neutral idle state', async ({ page }) => {
    const timerMirror = page.locator('[data-testid="header-timer-mirror"]');
    await expect(timerMirror).toBeVisible();
    await expect(timerMirror).toContainText('--:--');
    await expect(timerMirror).toContainText('Idle');
  });

  test('verifies Right AI Panel toggle functionality', async ({ page }) => {
    const aiPanel = page.locator('[data-testid="right-ai-panel"]');
    await expect(aiPanel).toBeVisible();

    // Click collapse button in header
    const toggleButton = page.locator('button[aria-label="Collapse AI panel"]');
    await toggleButton.click();
    await expect(aiPanel).toBeHidden();

    // Re-open with toggle button in global header
    const openButton = page.locator('button[aria-label="Expand AI panel"]');
    await openButton.click();
    await expect(aiPanel).toBeVisible();
  });

  test('verifies local Guest Workspace initialization and resumption', async ({ page }) => {
    // Check that guest mode indicator is visible in bottom rail
    const guestIndicator = page.locator('[data-testid="left-rail-bottom"]');
    await expect(guestIndicator).toBeVisible();

    // Check indexedDB has 'sos_local_v3' database
    const hasIndexedDb = await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      return dbs.some((db) => db.name === 'sos_local_v3');
    });
    expect(hasIndexedDb).toBe(true);
  });
});
