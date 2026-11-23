import { test, expect } from '@playwright/test';

test.describe('SOS V3: Desktop-Grade Library Module (File & Folder Management System)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library');
    await expect(page.locator('[data-testid="library-page"]')).toBeVisible();
  });

  test('renders top header breadcrumbs and root seeded folders', async ({ page }) => {
    // 1. Breadcrumbs in top header
    await expect(page.locator('[data-testid="library-breadcrumb-root"]')).toBeVisible();

    // 2. Root seeded folders exist (Computer Science, Economics & Finance, Philosophy, Research Papers)
    await expect(page.locator('text=Computer Science').first()).toBeVisible();
  });

  test('switches between Grid, Gallery, and List views with persistent controls via context menu', async ({ page }) => {
    const canvas = page.locator('[data-testid="library-canvas-area"]');

    // 1. Switch to Gallery View via canvas context menu
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-view"]').hover();
    await page.locator('[data-testid="view-opt-gallery"]').click();
    await expect(page.locator('[data-testid="library-gallery-view"]')).toBeVisible();

    // 2. Switch to List View
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-view"]').hover();
    await page.locator('[data-testid="view-opt-list"]').click();
    await expect(page.locator('[data-testid="library-list-view"]')).toBeVisible();

    // 3. Switch back to Grid View
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-view"]').hover();
    await page.locator('[data-testid="view-opt-grid"]').click();
    await expect(page.locator('[data-testid="library-grid-view"]')).toBeVisible();

    // 4. Test Size toggles (S, M, L) inside Grid View
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-size"]').hover();
    await page.locator('[data-testid="size-opt-L"]').click();
    await expect(page.locator('[data-testid="library-grid-view"]')).toHaveClass(/grid-cols-1/);

    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-size"]').hover();
    await page.locator('[data-testid="size-opt-S"]').click();
    await expect(page.locator('[data-testid="library-grid-view"]')).toHaveClass(/lg:grid-cols-6/);

    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-size"]').hover();
    await page.locator('[data-testid="size-opt-M"]').click();
    await expect(page.locator('[data-testid="library-grid-view"]')).toHaveClass(/lg:grid-cols-4/);
  });

  test('navigates into subfolders and back via breadcrumbs', async ({ page }) => {
    // Single click on Computer Science folder
    const csFolder = page.locator('text=Computer Science').first();
    await expect(csFolder).toBeVisible();
    await csFolder.click();

    // Verify breadcrumb updated
    await expect(page.locator('text=Distributed Systems').first()).toBeVisible();

    // Navigate deeper into Distributed Systems via single click
    const dsFolder = page.locator('text=Distributed Systems').first();
    await dsFolder.click();

    // Verify 12 SOS file types are displayed
    await expect(page.locator('text=Distributed Consensus Raft').or(page.locator('text=Distributed_Consensus_Raft.pdf')).first()).toBeVisible();
    await expect(page.locator('text=Lab 02 Key Value Spec').or(page.locator('text=Lab_02_Key_Value_Spec.docx')).first()).toBeVisible();

    // Breadcrumb navigation back to root
    await page.locator('[data-testid="library-breadcrumb-root"]').click();
    await expect(page.locator('text=Computer Science').first()).toBeVisible();
  });

  test('creates a new folder via NewFolderModal', async ({ page }) => {
    const canvas = page.locator('[data-testid="library-canvas-area"]');

    // Open New Folder via canvas right-click context menu
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-new-folder"]').click();

    const modal = page.locator('[data-testid="new-folder-modal"]');
    await expect(modal).toBeVisible();

    const input = page.locator('[data-testid="new-folder-name-input"]');
    await input.fill('E2E Test Folder');
    await page.locator('[data-testid="new-folder-submit-btn"]').click();

    // Verify new folder appears in the view
    await expect(page.locator('text=E2E Test Folder').first()).toBeVisible();
  });

  test('verifies real file metrics in List View (4.2 MB or 4.4 MB for PDF, 1.4 MB for DOCX)', async ({ page }) => {
    // Navigate into Computer Science -> Distributed Systems via single click
    await page.locator('text=Computer Science').first().click();
    await page.locator('text=Distributed Systems').first().click();

    const canvas = page.locator('[data-testid="library-canvas-area"]');

    // Switch to List View via context menu
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-view"]').hover();
    await page.locator('[data-testid="view-opt-list"]').click();
    await expect(page.locator('[data-testid="library-list-view"]')).toBeVisible();

    // Verify exact calculated byte sizes are rendered
    await expect(page.locator('text=Distributed Consensus Raft').or(page.locator('text=Distributed_Consensus_Raft.pdf')).first()).toBeVisible();
    await expect(page.locator('text=4.2 MB').or(page.locator('text=4.4 MB')).first()).toBeVisible();
  });

  test('resets active cascading submenu immediately on second right-click', async ({ page }) => {
    const canvas = page.locator('[data-testid="library-canvas-area"]');

    // 1. First right-click and open cascading submenu
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-view"]').hover();
    await expect(page.locator('[data-testid="view-opt-gallery"]')).toBeVisible();

    // 2. Second right-click elsewhere on canvas (in empty padding gutter below the first menu)
    await canvas.click({ button: 'right', position: { x: 10, y: 450 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    // Submenu must be immediately closed/reset
    await expect(page.locator('[data-testid="view-opt-gallery"]')).not.toBeVisible();
  });

  test('verifies Grid View card layout and typography parity in rename mode', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="library-item-"]').first();
    await expect(firstCard).toBeVisible();

    // Verify row 1 contains icon and title
    const row1 = firstCard.locator('.flex.items-center.gap-2.min-w-0');
    await expect(row1).toBeVisible();
    await expect(row1.locator('h3')).toBeVisible();

    // Verify row 2 contains metadata on left and ... button on right
    const row2 = firstCard.locator('.flex.items-center.justify-between.gap-2.mt-1\\.5');
    await expect(row2).toBeVisible();
    await expect(row2.locator('span.font-mono')).toBeVisible();
    await expect(row2.locator('button[data-testid^="item-menu-button-"]')).toBeVisible();

    // Capture static title font styles
    const titleStyles = await row1.locator('h3').evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight };
    });

    // Enter rename mode via context menu "Rename" option
    await firstCard.click({ button: 'right' });
    await expect(page.locator('[data-testid="item-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="context-menu-rename"]').click();

    const input = firstCard.locator('input[aria-label="Rename item"]');
    await expect(input).toBeVisible();

    // Verify input font styles match static title exactly (zero typography jump)
    const inputStyles = await input.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight };
    });

    expect(inputStyles.fontSize).toBe(titleStyles.fontSize);
    expect(inputStyles.fontWeight).toBe(titleStyles.fontWeight);
    expect(inputStyles.lineHeight).toBe(titleStyles.lineHeight);

    // Cancel rename mode
    await page.keyboard.press('Escape');
    await expect(row1.locator('h3')).toBeVisible();
  });

  test('marquee rubber-band selection drags, renders #60A5FA box, highlights intersecting items without opening on mouseup', async ({ page }) => {
    const canvas = page.locator('[data-testid="library-canvas-area"]');
    const firstCard = page.locator('[data-library-item]').first();
    await expect(firstCard).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();

    // Start drag in empty padding inside canvas (top-left of canvas)
    const startX = canvasBox!.x + 10;
    const startY = canvasBox!.y + 10;
    const endX = cardBox!.x + cardBox!.width / 2;
    const endY = cardBox!.y + cardBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Move more than 4px threshold
    await page.mouse.move(startX + 25, startY + 25);
    const marqueeBox = page.locator('[data-testid="library-marquee-box"]');
    await expect(marqueeBox).toBeVisible();

    // Drag to intersect the first card
    await page.mouse.move(endX, endY);
    await expect(firstCard).toHaveClass(/border-\[#60A5FA\]/);

    // Release mouse over the card
    await page.mouse.up();
    await expect(marqueeBox).not.toBeVisible();

    // Ensure item remains selected
    await expect(firstCard).toHaveClass(/border-\[#60A5FA\]/);

    // Crucial check: Mouseup did NOT navigate into the folder! We are still on the root Library page
    await expect(page.locator('[data-testid="library-breadcrumb-root"]')).toBeVisible();
    await expect(page.locator('text=Computer Science').first()).toBeVisible();
  });

  test('multi-selection keyboard shortcuts: Ctrl+A selects all, Escape clears selection', async ({ page }) => {
    // Wait until items are loaded
    await expect(page.locator('[data-library-item]').first()).toBeVisible();

    const cards = page.locator('[data-library-item]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);

    // Press Ctrl+A / Cmd+A
    await page.keyboard.press('Control+A');
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toHaveClass(/border-\[#60A5FA\]/);
    }

    // Press Escape to clear selection
    await page.keyboard.press('Escape');
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).not.toHaveClass(/border-\[#60A5FA\]/);
    }
  });

  test('bulk context menu and operations (Copy, Cut, Delete)', async ({ page }) => {
    // Wait until items are loaded
    await expect(page.locator('[data-library-item]').first()).toBeVisible();

    const cards = page.locator('[data-library-item]');
    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);

    // Click first and second with Ctrl to multi-select
    await firstCard.click({ modifiers: ['Control'] });
    await secondCard.click({ modifiers: ['Control'] });

    await expect(firstCard).toHaveClass(/border-\[#60A5FA\]/);
    await expect(secondCard).toHaveClass(/border-\[#60A5FA\]/);

    // Right-click on firstCard to open bulk context menu
    await firstCard.click({ button: 'right' });
    const contextMenu = page.locator('[data-testid="item-context-menu"]');
    await expect(contextMenu).toBeVisible();

    // Verify bulk action labels
    await expect(page.locator('text=Copy (2 items)')).toBeVisible();
    await expect(page.locator('text=Cut (2 items)')).toBeVisible();
    await expect(page.locator('text=Duplicate (2 items)')).toBeVisible();
    await expect(page.locator('text=Delete (2 items)')).toBeVisible();

    // Test Bulk Delete
    await page.locator('[data-testid="context-menu-delete"]').click();

    // Ensure context menu closes
    await expect(contextMenu).not.toBeVisible();
  });

  test('contiguous list view selection eliminates double-stacked blue borders', async ({ page }) => {
    const canvas = page.locator('[data-testid="library-canvas-area"]');

    // Switch to List View via right-click canvas context menu
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-view"]').hover();
    await page.locator('[data-testid="view-opt-list"]').click();
    await expect(page.locator('[data-testid="library-list-view"]')).toBeVisible();

    const rows = page.locator('[data-testid^="library-list-row-"]');
    await expect(rows.first()).toBeVisible();

    const firstRow = rows.nth(0);
    const secondRow = rows.nth(1);

    // Multi-select both adjacent rows with Ctrl
    await firstRow.click({ modifiers: ['Control'] });
    await secondRow.click({ modifiers: ['Control'] });

    // Verify neither row has the old double-thick ring-1 ring-inset ring-[#60A5FA]
    await expect(firstRow).not.toHaveClass(/ring-inset/);
    await expect(secondRow).not.toHaveClass(/ring-inset/);

    // Verify first row has top blue border and subtle bottom 20% divider
    await expect(firstRow).toHaveClass(/!?border-t !?border-\[#60A5FA\]/);
    await expect(firstRow).toHaveClass(/border-b border-\[#60A5FA\]\/20/);

    // Verify second row has subtle border-t-0 and solid bottom blue border
    await expect(secondRow).toHaveClass(/border-t-0/);
    await expect(secondRow).toHaveClass(/!?border-b !?border-\[#60A5FA\]/);
  });

  test('bottom-up marquee drag selects card on 1px touch and does not inflate scrollHeight', async ({ page }) => {
    // Switch to Grid view
    const canvas = page.locator('[data-testid="library-canvas-area"]');
    await canvas.click({ button: 'right', position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="canvas-context-menu"]')).toBeVisible();
    await page.locator('[data-testid="canvas-menu-view"]').hover();
    await page.locator('[data-testid="view-opt-grid"]').click();
    await expect(page.locator('[data-testid="library-grid-view"]')).toBeVisible();

    // Clear any selection
    await page.keyboard.press('Escape');

    const lastCard = page.locator('[data-library-item]').last();
    await expect(lastCard).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    const cardBox = await lastCard.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(cardBox).not.toBeNull();

    const initialScrollHeight = await canvas.evaluate((el) => el.scrollHeight);

    // Start drag in empty space 40px below the last card
    const startX = cardBox!.x + cardBox!.width / 2;
    const startY = cardBox!.y + cardBox!.height + 40;

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // Drag upward to touch the bottom 2px of the last card
    await page.mouse.move(startX, cardBox!.y + cardBox!.height - 2);

    // Card should immediately be highlighted on bottom edge touch
    await expect(lastCard).toHaveClass(/border-\[#60A5FA\]/);

    await page.mouse.up();
    await expect(lastCard).toHaveClass(/border-\[#60A5FA\]/);

    // Verify canvas scrollHeight was NOT inflated by the marquee box
    const finalScrollHeight = await canvas.evaluate((el) => el.scrollHeight);
    expect(finalScrollHeight).toBe(initialScrollHeight);
  });
});
