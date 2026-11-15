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
      { id: 'home', label: 'Home', path: '/', expectedText: 'Good morning' },
      { id: 'library', label: 'Library', path: '/library', expectedText: 'Library & Knowledge Base' },
      { id: 'learning', label: 'Learning', path: '/learning', expectedText: 'Learning Workspace' },
      { id: 'tracking', label: 'Tracking', path: '/tracking', expectedText: 'Study Tracking' },
      { id: 'calendar', label: 'Calendar', path: '/calendar', expectedText: 'Academic Calendar' },
      { id: 'community', label: 'Community', path: '/community', expectedText: 'Peer Community' },
      { id: 'profile', label: 'Profile', path: '/profile', expectedText: 'Student Profile' },
      { id: 'settings', label: 'Settings', path: '/settings', expectedText: 'System Settings' }
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

      // Verify target screen content mounts in central viewport
      await expect(page.getByText(item.expectedText, { exact: false }).first()).toBeVisible();
    }
  });

  test('confirms Docked Toolbar is NOT rendered or reserved in App Shell', async ({ page }) => {
    // Docked toolbar is strictly excluded from Phase 01
    const toolbar = page.locator('[data-testid="docked-toolbar"]');
    await expect(toolbar).toHaveCount(0);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCount(0);
  });

  test('verifies Focus Timer pill is displayed in global header', async ({ page }) => {
    const timerMirror = page.locator('[data-testid="header-timer-mirror"]');
    await expect(timerMirror).toBeVisible();
    await expect(timerMirror).toContainText('24:18');
  });

  test('verifies Right AI Panel toggle functionality', async ({ page }) => {
    const aiPanel = page.locator('[data-testid="right-ai-panel"]');
    await expect(aiPanel).toBeVisible();

    // Click collapse button in AI panel header
    const toggleButton = page.locator('button[aria-label="Collapse AI panel"]');
    await toggleButton.click();
    await expect(aiPanel).toBeHidden();

    // Re-open via keyboard shortcut (Ctrl+J / ⌘J)
    await page.keyboard.press('Control+j');
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

  test('verifies pixel-accurate Home screen editorial cards and interactive tasks', async ({ page }) => {
    const homePage = page.locator('[data-testid="home-page"]');
    await expect(homePage).toBeVisible();

    // 1. Greeting and Date
    await expect(homePage.getByRole('heading', { name: 'Good morning, Abdalla' })).toBeVisible();
    await expect(homePage.getByText('Saturday, November 14, 2026')).toBeVisible();

    // 2. Horizon Bar
    await expect(homePage.getByText('Fall Semester 2026')).toBeVisible();
    await expect(homePage.getByText('48 days left')).toBeVisible();
    await expect(homePage.getByText('50%')).toBeVisible();

    // 3. Editorial Cards
    await expect(homePage.getByText('DAILY QUOTE')).toBeVisible();
    await expect(homePage.getByText(/We are what we repeatedly do/)).toBeVisible();
    await expect(homePage.getByText('— Aristotle')).toBeVisible();

    await expect(homePage.getByText('DAILY ESSAY')).toBeVisible();
    await expect(homePage.getByText('On the Architecture of Deep Memory & Forgetting')).toBeVisible();
    await expect(homePage.getByText('3 MIN READ')).toBeVisible();

    // 4. Continue Where You Left Off
    await expect(homePage.getByText('CONTINUE WHERE YOU LEFT OFF')).toBeVisible();
    await expect(homePage.getByText('Kandel_Principles_Ch12.pdf')).toBeVisible();
    await expect(homePage.getByText('Stanford_Neuro_Lecture_04.mp4')).toBeVisible();
    await expect(homePage.getByText('Cellular_Plasticity_Synthesis.md')).toBeVisible();
    await expect(homePage.getByText('SNARE_Machinery_Deck')).toBeVisible();

    // 5. Today's Tasks
    await expect(homePage.getByText("TODAY'S TASKS")).toBeVisible();
    await expect(homePage.getByText('1 / 4')).toBeVisible();

    // Toggle a task checkbox
    const firstTask = homePage.getByText('Neurobiology Lecture 04');
    await firstTask.click();
    await expect(homePage.getByText('2 / 4')).toBeVisible();

    // Quick add a task
    const input = homePage.locator('input[placeholder="Add a task..."]');
    await input.fill('Complete Mitochondria Review');
    await input.press('Enter');
    await expect(homePage.getByText('Complete Mitochondria Review')).toBeVisible();
    await expect(homePage.getByText('2 / 5')).toBeVisible();
  });
});
