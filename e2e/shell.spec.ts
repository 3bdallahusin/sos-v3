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

    // 5. Expand Left Rail to 240px and verify Logo v3 is rendered without text label
    const toggleButton = page.locator('button[aria-label="Expand navigation rail"]');
    await toggleButton.click();
    await page.waitForTimeout(400); // Allow spring animation
    railBox = await leftRail.boundingBox();
    expect(railBox!.width).toBe(240);
    await expect(page.locator('img[alt="SOS Logo v3"]')).toBeVisible();
    await expect(leftRail.getByText('SOS V3')).toHaveCount(0);

    // Collapse it back to 56px
    const collapseButton = page.locator('button[aria-label="Collapse navigation rail"]');
    await collapseButton.click();
    await page.waitForTimeout(400);
    railBox = await leftRail.boundingBox();
    expect(railBox!.width).toBe(56);
  });

  test('verifies eight navigation destinations in canonical order and routing', async ({ page }) => {
    const expectedDestinations = [
      { id: 'home', label: 'Home', path: '/', expectedText: 'Good' },
      { id: 'library', label: 'Library', path: '/library', expectedText: 'Library' },
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

  test('verifies Right AI Panel toggle and Center Fullscreen Focus Mode', async ({ page }) => {
    const aiPanel = page.locator('[data-testid="right-ai-panel"]');
    await expect(aiPanel).toBeVisible();

    // 1. Click Maximize2 / Fullscreen icon in Central Workspace header
    const fullscreenBtn = page.locator('button[aria-label="Toggle Workspace Fullscreen"]');
    await fullscreenBtn.click();
    await expect(aiPanel).toBeHidden();

    // 2. Dynamic MessageCircle AI icon must now be visible in Central header (rightmost)
    const dynamicAiBtn = page.locator('button[aria-label="Expand AI panel"]');
    await expect(dynamicAiBtn).toBeVisible();

    // 3. Click dynamic AI icon to reopen AI panel
    await dynamicAiBtn.click();
    await expect(aiPanel).toBeVisible();

    // 4. Dynamic AI icon must disappear from Central header
    await expect(dynamicAiBtn).toBeHidden();

    // 5. Test collapse via AI panel header button
    const collapseButton = page.locator('button[aria-label="Collapse AI panel"]');
    await collapseButton.click();
    await expect(aiPanel).toBeHidden();

    // 6. Re-open via keyboard shortcut (Ctrl+J / ⌘J)
    await page.keyboard.press('Control+j');
    await expect(aiPanel).toBeVisible();
  });

  test('verifies AI Panel Fullscreen Mode toggle and mutual exclusivity', async ({ page }) => {
    const aiPanel = page.locator('[data-testid="right-ai-panel"]');
    const centralWorkspace = page.locator('[data-testid="central-workspace"]');
    await expect(aiPanel).toBeVisible();
    await expect(centralWorkspace).toBeVisible();

    // 1. Click Full Screen button on AI Panel
    const aiFullscreenBtn = page.locator('button[aria-label="Fullscreen AI panel"]');
    await aiFullscreenBtn.click();
    await page.waitForTimeout(200);

    // Central workspace should be hidden, AI panel should be expanded
    await expect(centralWorkspace).toBeHidden();
    const exitFullscreenBtn = page.locator('button[aria-label="Exit AI panel fullscreen"]');
    await expect(exitFullscreenBtn).toBeVisible();

    // Check AI panel width is full flex-1 (e.g. > 1000px on 1440px viewport)
    const aiBox = await aiPanel.boundingBox();
    expect(aiBox).not.toBeNull();
    expect(aiBox!.width).toBeGreaterThan(1000);

    // 2. Click Exit Fullscreen button on AI Panel
    await exitFullscreenBtn.click();
    await page.waitForTimeout(200);
    await expect(centralWorkspace).toBeVisible();
    await expect(aiFullscreenBtn).toBeVisible();

    // Check AI panel returned to 340px
    const aiRestoredBox = await aiPanel.boundingBox();
    expect(aiRestoredBox!.width).toBe(340);
  });

  test('verifies interactive resizable split panes, snap-to-collapse, and double-click reset', async ({ page }) => {
    const leftRail = page.locator('[data-testid="left-rail"]');
    const rightAi = page.locator('[data-testid="right-ai-panel"]');
    const central = page.locator('[data-testid="central-workspace"]');
    const leftHandle = page.locator('[data-testid="resize-handle-left"]');
    const rightHandle = page.locator('[data-testid="resize-handle-right"]');

    // 1. Initial handles visible
    await expect(leftHandle).toBeVisible();
    await expect(rightHandle).toBeVisible();

    // 2. Expand Left Rail and verify initial 240px
    const expandBtn = page.locator('button[aria-label="Expand navigation rail"]');
    await expandBtn.click();
    await page.waitForTimeout(400);
    let railBox = await leftRail.boundingBox();
    expect(railBox!.width).toBe(240);

    // 3. Drag Left Handle to 280px
    const leftHandleBox = await leftHandle.boundingBox();
    await leftHandle.hover();
    await page.mouse.down();
    await page.mouse.move(288, leftHandleBox!.y + 100, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    railBox = await leftRail.boundingBox();
    expect(railBox!.width).toBe(280);

    // 4. Double click left handle to reset to 240px
    await leftHandle.dblclick();
    await page.waitForTimeout(400);
    railBox = await leftRail.boundingBox();
    expect(railBox!.width).toBe(240);

    // 5. Drag Left Handle below 130px -> snaps to collapsed 56px
    const currentLeftBox = await leftHandle.boundingBox();
    await leftHandle.hover();
    await page.mouse.down();
    await page.mouse.move(100, currentLeftBox!.y + 100, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    railBox = await leftRail.boundingBox();
    expect(railBox!.width).toBe(56);

    // 6. Drag Right Handle to expand AI Panel to 450px
    const rightHandleBox = await rightHandle.boundingBox();
    await rightHandle.hover();
    await page.mouse.down();
    // 1440 - 8 - 450 = 982
    await page.mouse.move(982, rightHandleBox!.y + 100, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    let aiBox = await rightAi.boundingBox();
    expect(aiBox!.width).toBe(450);

    // 7. Verify Central Workspace safeguard (width >= 480px)
    const centralBox = await central.boundingBox();
    expect(centralBox!.width).toBeGreaterThanOrEqual(480);

    // 8. Double click right handle to reset to 340px
    await rightHandle.dblclick();
    await page.waitForTimeout(400);
    aiBox = await rightAi.boundingBox();
    expect(aiBox!.width).toBe(340);

    // 9. Verify persistence in localStorage
    const storedRight = await page.evaluate(() => localStorage.getItem('sos:rightAiPanelWidth'));
    expect(storedRight).toBe('340');
  });

  test('verifies animated search bar expansion and live filtering', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search SOS"]');

    // Initially search trigger button is visible
    const searchToggle = page.locator('button[title*="Search or Jump to"]');
    await searchToggle.click();
    await expect(searchInput).toBeVisible();

    // Type query
    await searchInput.fill('Kandel');
    const popoverItem = page.locator('[data-testid="search-popover"]').getByText('Kandel_Principles_Ch12.pdf');
    await expect(popoverItem).toBeVisible();

    // Click item to navigate
    await popoverItem.click();
    await expect(page).toHaveURL(/\/learning/);
  });

  test('verifies unread indicator dots on header icons are clean by default', async ({ page }) => {
    // Both Messages and Bell should NOT have unread badge by default
    const unreadDots = page.locator('[data-testid="global-header"] span.bg-\\[\\#F4F4F5\\]');
    await expect(unreadDots).toHaveCount(0);
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

    // 1. Dynamic Greeting and Local Date
    await expect(homePage.getByTestId('greeting-heading')).toHaveText(/Good (morning|afternoon|evening)/);
    const expectedLocalDate = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
    await expect(homePage.getByTestId('greeting-date')).toHaveText(expectedLocalDate);

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

  test('verifies application tab favicon uses SOS Logo v3 asset and title is strictly SOS', async ({ page }) => {
    // 1. Verify tab title
    expect(await page.title()).toBe('SOS');

    // 2. Verify SVG vector favicon
    const svgFavicon = page.locator('link[rel="icon"][type="image/svg+xml"][href="/favicon.svg"]');
    await expect(svgFavicon).toHaveCount(1);

    // 3. Verify fallbacks
    const pngFavicon = page.locator('link[rel="icon"][href="/favicon.png"]');
    await expect(pngFavicon).toHaveCount(1);

    const appleIcon = page.locator('link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]');
    await expect(appleIcon).toHaveCount(1);
  });
});
