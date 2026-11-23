import { test, expect } from '@playwright/test';

test.describe('Global UI/UX Consistency Refinement & Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  const tabs = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'library', label: 'Library', path: '/library' },
    { id: 'learning', label: 'Learning', path: '/learning' },
    { id: 'community', label: 'Community', path: '/community' },
    { id: 'tracking', label: 'Tracking', path: '/tracking' },
    { id: 'calendar', label: 'Calendar', path: '/calendar' },
    { id: 'settings', label: 'Settings', path: '/settings' },
    { id: 'profile', label: 'Profile', path: '/profile' }
  ];

  test('1. AI Assistant Panel & Top Bar Toggle is strictly scoped to Learning tab across all navigation', async ({ page }) => {
    // Navigate through every single tab and verify AI panel and toggle visibility
    for (const tab of tabs) {
      const navItem = page.locator(`[data-testid="nav-item-${tab.id}"]`);
      await navItem.click();
      await page.waitForTimeout(200);

      const topBarAiToggle = page.locator('#central-workspace button[aria-label="Expand AI panel"]');
      const aiPanel = page.locator('[data-testid="right-ai-panel"]');

      if (tab.id === 'learning') {
        // Inside Learning: Top Bar AI toggle must be visible when panel is closed
        await expect(topBarAiToggle).toBeVisible();
        await expect(aiPanel).toBeHidden();

        // Open AI panel
        await topBarAiToggle.click();
        await expect(aiPanel).toBeVisible();
        await expect(topBarAiToggle).toBeHidden();

        // Collapse AI panel via header button
        const collapseBtn = page.locator('[data-testid="right-ai-panel"] button[aria-label="Collapse AI panel"]');
        await expect(collapseBtn).toBeVisible();
        await collapseBtn.click();

        // AI panel closed, toggle button reappears
        await expect(aiPanel).toBeHidden();
        await expect(topBarAiToggle).toBeVisible();
      } else {
        // On all other tabs: Top Bar AI toggle and AI panel must be strictly absent
        await expect(topBarAiToggle).toHaveCount(0);
        await expect(aiPanel).toBeHidden();
      }
    }
  });

  test('1b. AI Panel state cleanup on navigation: closes when leaving Learning and toggle reappears on return', async ({ page }) => {
    // 1. Go to Learning tab
    await page.locator('[data-testid="nav-item-learning"]').click();
    await page.waitForTimeout(200);

    const topBarAiToggle = page.locator('#central-workspace button[aria-label="Expand AI panel"]');
    const aiPanel = page.locator('[data-testid="right-ai-panel"]');

    // 2. Open AI panel inside Learning
    await topBarAiToggle.click();
    await expect(aiPanel).toBeVisible();

    // 3. Switch to Home tab
    await page.locator('[data-testid="nav-item-home"]').click();
    await page.waitForTimeout(200);

    // AI panel must automatically close and not bleed into Home
    await expect(aiPanel).toBeHidden();
    await expect(page.locator('#central-workspace button[aria-label="Expand AI panel"]')).toHaveCount(0);

    // 4. Switch to Library tab
    await page.locator('[data-testid="nav-item-library"]').click();
    await page.waitForTimeout(200);
    await expect(aiPanel).toBeHidden();
    await expect(page.locator('#central-workspace button[aria-label="Expand AI panel"]')).toHaveCount(0);

    // 5. Switch back to Learning tab
    await page.locator('[data-testid="nav-item-learning"]').click();
    await page.waitForTimeout(200);

    // When returning to Learning, panel should remain closed and Top Bar toggle should cleanly reappear
    await expect(aiPanel).toBeHidden();
    await expect(page.locator('#central-workspace button[aria-label="Expand AI panel"]')).toBeVisible();
  });

  test('2a. Center Panel Fullscreen icon is completely absent from Top Bar across all tabs', async ({ page }) => {
    // Navigate through every tab and verify Center Panel fullscreen icon is never present
    for (const tab of tabs) {
      await page.locator(`[data-testid="nav-item-${tab.id}"]`).click();
      await page.waitForTimeout(150);

      const fsBtn = page.locator('#central-workspace button[aria-label="Toggle Workspace Fullscreen"]');
      await expect(fsBtn).toHaveCount(0);
    }

    // Inside Learning tab, verify fullscreen icon remains absent whether AI panel is closed or open
    await page.locator('[data-testid="nav-item-learning"]').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#central-workspace button[aria-label="Toggle Workspace Fullscreen"]')).toHaveCount(0);

    const topBarAiToggle = page.locator('#central-workspace button[aria-label="Expand AI panel"]');
    await topBarAiToggle.click();
    await expect(page.locator('[data-testid="right-ai-panel"]')).toBeVisible();
    await expect(page.locator('#central-workspace button[aria-label="Toggle Workspace Fullscreen"]')).toHaveCount(0);
  });

  test('2b. Inactive State: Top Bar Timer Pill is completely unmounted across all tabs when idle', async ({ page }) => {
    for (const tab of tabs) {
      await page.locator(`[data-testid="nav-item-${tab.id}"]`).click();
      await page.waitForTimeout(150);

      const timerPill = page.locator('[data-testid="header-timer-mirror"]');
      await expect(timerPill).toHaveCount(0);
    }
  });

  test('2c. Running & Paused States: Top Bar Timer Pill styling, accent parity, and session lifecycle', async ({ page }) => {
    // 1. Navigate to Tracking tab
    await page.locator('[data-testid="nav-item-tracking"]').click();
    await page.waitForTimeout(300);

    // Verify timer pill is inactive initially
    await expect(page.locator('[data-testid="header-timer-mirror"]')).toHaveCount(0);

    // 2. Start a focus session -> Running State
    const startBtn = page.locator('[data-testid="start-timer-btn"]');
    await expect(startBtn).toBeVisible();
    await startBtn.click();
    await page.waitForTimeout(300);

    // Top Bar Timer Pill must now be visible
    const timerPill = page.locator('[data-testid="header-timer-mirror"]');
    await expect(timerPill).toBeVisible();

    // Verify status indicator dot is #60A5FA (rgb(96, 165, 250))
    const timerDot = page.locator('[data-testid="header-timer-indicator-dot"]');
    await expect(timerDot).toBeVisible();
    const runningDotColor = await timerDot.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(runningDotColor).toBe('rgb(96, 165, 250)');

    // Verify neutral dark container styling (ZERO blue tint on background and border)
    const containerStyles = await timerPill.evaluate((el) => {
      const s = window.getComputedStyle(el);
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d')!;

      // Parse background
      ctx.fillStyle = s.backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      const [bgR, bgG, bgB] = ctx.getImageData(0, 0, 1, 1).data;

      // Parse border
      ctx.fillStyle = s.borderColor;
      ctx.fillRect(0, 0, 1, 1);
      const [bdrR, bdrG, bdrB] = ctx.getImageData(0, 0, 1, 1).data;

      return {
        bg: { r: bgR, g: bgG, b: bgB, raw: s.backgroundColor },
        bdr: { r: bdrR, g: bdrG, b: bdrB, raw: s.borderColor }
      };
    });

    // #141417 is rgb(20, 20, 23)
    expect(Math.abs(containerStyles.bg.r - 20)).toBeLessThanOrEqual(2);
    expect(Math.abs(containerStyles.bg.g - 20)).toBeLessThanOrEqual(2);
    expect(Math.abs(containerStyles.bg.b - 23)).toBeLessThanOrEqual(2);

    // #27272A is rgb(39, 39, 42)
    expect(Math.abs(containerStyles.bdr.r - 39)).toBeLessThanOrEqual(2);
    expect(Math.abs(containerStyles.bdr.g - 39)).toBeLessThanOrEqual(2);
    expect(Math.abs(containerStyles.bdr.b - 42)).toBeLessThanOrEqual(2);

    // Confirm neither has high blue accent tint
    expect(containerStyles.bg.b).toBeLessThan(50);
    expect(containerStyles.bdr.b).toBeLessThan(60);

    // 3. Navigate across other tabs while Running: timer pill remains visible with blue dot & neutral container
    const testTabs = ['home', 'library', 'learning', 'calendar', 'settings'];
    for (const tabId of testTabs) {
      await page.locator(`[data-testid="nav-item-${tabId}"]`).click();
      await page.waitForTimeout(150);

      const headerTimer = page.locator('[data-testid="header-timer-mirror"]');
      await expect(headerTimer).toBeVisible();

      const currentDot = headerTimer.locator('[data-testid="header-timer-indicator-dot"]');
      const currentColor = await currentDot.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(currentColor).toBe('rgb(96, 165, 250)');
    }

    // 4. Return to Tracking tab and Pause session -> Paused State
    await page.locator('[data-testid="nav-item-tracking"]').click();
    await page.waitForTimeout(200);

    const pauseBtn = page.locator('[data-testid="pause-timer-btn"]');
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
    await page.waitForTimeout(300);

    // In Paused State: Timer pill is still visible, dot switches to white #FAFAFA (rgb(250, 250, 250))
    await expect(timerPill).toBeVisible();
    const pausedDotColor = await timerDot.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(pausedDotColor).toBe('rgb(250, 250, 250)');

    // Verify container remains neutral dark
    const pausedContainerBg = await timerPill.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(pausedContainerBg).toBe('rgb(20, 20, 23)');

    // 5. Navigate to Home and Library while paused: pill remains visible with white dot
    await page.locator('[data-testid="nav-item-home"]').click();
    await page.waitForTimeout(150);
    await expect(page.locator('[data-testid="header-timer-mirror"]')).toBeVisible();
    expect(await page.locator('[data-testid="header-timer-indicator-dot"]').evaluate((el) => window.getComputedStyle(el).backgroundColor)).toBe('rgb(250, 250, 250)');

    // 6. Return to Tracking and End Session -> Inactive State
    await page.locator('[data-testid="nav-item-tracking"]').click();
    await page.waitForTimeout(200);

    const finishBtn = page.locator('[data-testid="finish-timer-btn"]');
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();
    await page.waitForTimeout(300);

    // If End Session modal appears, save session
    const saveBtn = page.locator('[data-testid="save-session-btn"]');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(200);
    }

    // Timer pill must now be completely unmounted across all tabs
    for (const tab of tabs) {
      await page.locator(`[data-testid="nav-item-${tab.id}"]`).click();
      await page.waitForTimeout(100);
      await expect(page.locator('[data-testid="header-timer-mirror"]')).toHaveCount(0);
    }
  });

  test('3. Card Surface Styling in Library matches Home and Tracking tabs', async ({ page }) => {
    // 1. Get Home card baseline computed styles
    await page.locator('[data-testid="nav-item-home"]').click();
    await page.waitForTimeout(300);

    const homeCard = page.locator('[data-testid="daily-quote-card"]');
    await expect(homeCard).toBeVisible();
    const homeStyles = await homeCard.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        borderRadius: s.borderRadius
      };
    });

    expect(homeStyles.backgroundColor).toBe('rgb(17, 17, 19)'); // #111113
    expect(homeStyles.borderColor).toBe('rgb(30, 30, 34)');     // #1E1E22
    expect(homeStyles.borderRadius).toBe('12px');

    // 2. Get Tracking card baseline computed styles
    await page.locator('[data-testid="nav-item-tracking"]').click();
    await page.waitForTimeout(300);

    const trackingCard = page.locator('[data-testid="focus-timer-card"]');
    await expect(trackingCard).toBeVisible();
    const trackingStyles = await trackingCard.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        borderRadius: s.borderRadius
      };
    });

    expect(trackingStyles.backgroundColor).toBe(homeStyles.backgroundColor);
    expect(trackingStyles.borderColor).toBe(homeStyles.borderColor);
    expect(trackingStyles.borderRadius).toBe(homeStyles.borderRadius);

    // 3. Navigate to Library and inspect Grid cards (folders and files)
    await page.locator('[data-testid="nav-item-library"]').click();
    await page.waitForTimeout(300);

    // Folder cards in Library Grid view
    const gridView = page.locator('[data-testid="library-grid-view"]');
    await expect(gridView).toBeVisible();

    const csFolderCard = gridView.locator('text=Computer Science').first().locator('xpath=ancestor::div[contains(@class, "group/card")][1]');
    await expect(csFolderCard).toBeVisible();

    const libraryFolderStyles = await csFolderCard.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        borderRadius: s.borderRadius
      };
    });

    // Verify folder cards in Library match Home and Tracking card styling
    expect(libraryFolderStyles.backgroundColor).toBe(homeStyles.backgroundColor); // rgb(17, 17, 19), NOT rgb(22, 22, 25)
    expect(libraryFolderStyles.borderColor).toBe(homeStyles.borderColor);         // rgb(30, 30, 34), NOT rgb(38, 38, 42)
    expect(libraryFolderStyles.borderRadius).toBe('12px');

    // Verify hover state on Library folder card matches SOSCard interactive hover (#2A2A30)
    await csFolderCard.hover();
    await page.waitForTimeout(200);
    const hoverBorderColor = await csFolderCard.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(hoverBorderColor).toBe('rgb(42, 42, 48)'); // #2A2A30

    // 4. Navigate into subfolder (Distributed Systems) and inspect nested cards
    const csFolderText = gridView.locator('text=Computer Science').first();
    await expect(csFolderText).toBeVisible();
    await csFolderText.dblclick();

    const dsSubfolder = gridView.locator('text=Distributed Systems').first();
    await expect(dsSubfolder).toBeVisible();
    await dsSubfolder.dblclick();

    // Inspect a nested file card (e.g. Distributed Consensus Raft)
    const raftFileCard = gridView.locator('text=/Distributed.*Consensus.*Raft/i').first().locator('xpath=ancestor::div[contains(@class, "group/card")][1]');
    await expect(raftFileCard).toBeVisible();

    const nestedCardStyles = await raftFileCard.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        borderRadius: s.borderRadius
      };
    });

    expect(nestedCardStyles.backgroundColor).toBe(homeStyles.backgroundColor);
    expect(nestedCardStyles.borderColor).toBe(homeStyles.borderColor);
    expect(nestedCardStyles.borderRadius).toBe('12px');

    // 5. Test Gallery view card surface
    await page.locator('[data-testid="library-breadcrumb-root"]').click();
    await page.waitForTimeout(200);

    const settingsBtn = page.locator('[data-testid="library-view-settings-btn"]');
    await settingsBtn.click();
    const popover = page.locator('[data-testid="library-view-settings-popover"]');
    await expect(popover).toBeVisible();
    await popover.locator('[data-testid="view-opt-gallery"]').click();
    await page.waitForTimeout(200);

    const galleryCard = page.locator('[data-testid^="library-gallery-item-"]').first();
    await expect(galleryCard).toBeVisible();

    const galleryStyles = await galleryCard.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        borderRadius: s.borderRadius
      };
    });

    expect(galleryStyles.backgroundColor).toBe(homeStyles.backgroundColor);
    expect(galleryStyles.borderColor).toBe(homeStyles.borderColor);
    expect(galleryStyles.borderRadius).toBe('12px');
  });
});
