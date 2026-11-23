import { test, expect } from '@playwright/test';

test.describe('SOS Learning — Dual-Layer Notes Workspace Clean E2E Suite', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    try {
      await request.post('http://127.0.0.1:3001/api/learning/reset');
    } catch (e) {
      console.warn('Reset endpoint warning:', e);
    }

    await page.goto('http://localhost:5173/learning');
    await page.waitForLoadState('networkidle');
  });

  test('01. Mount Dual-Layer Notes, Header Elements & Native BlockNote Content', async ({ page }) => {
    // 1. Open Notes from New Tab Launcher Grid
    const notesCard = page.locator('[data-testid="tool-card-notes"]');
    await expect(notesCard).toBeVisible();
    await notesCard.click();

    // 2. Verify UniversalCanvasHost container
    const canvasHost = page.locator('[data-testid="universal-canvas-host"]');
    await expect(canvasHost).toBeVisible();

    // 3. Verify Cover Banner and Change Cover button
    const coverBanner = page.locator('[data-testid="notes-cover-banner"]');
    await expect(coverBanner).toBeVisible();
    await expect(page.locator('[data-testid="btn-change-cover"]')).toBeVisible();

    // 4. Verify Overlapping Emoji Icon Badge
    const iconBadge = page.locator('[data-testid="notes-icon-badge"]');
    await expect(iconBadge).toBeVisible();
    await expect(iconBadge).toContainText('🧠');

    // 5. Verify Document Title and Subtitle inputs
    const docTitle = page.locator('[data-testid="notes-document-title"]');
    await expect(docTitle).toBeVisible();
    await expect(docTitle).toHaveValue('Synaptic Transmission & Plasticity');

    const docSubtitle = page.locator('[data-testid="notes-document-subtitle"]');
    await expect(docSubtitle).toBeVisible();
    await expect(docSubtitle).toHaveValue(
      'Folder workspace containing lecture notes and canonical learning assets'
    );

    // 6. Verify Pure Native BlockNote View is mounted
    const blocknoteView = page.locator('[data-testid="blocknote-view"]');
    await expect(blocknoteView).toBeVisible();

    // 7. Verify native seeded headings and paragraphs are rendered
    await expect(
      page.getByText('Chemical synapses mediate unidirectional information transfer across the synaptic cleft')
    ).toBeVisible();
    await expect(
      page.getByText('Retrograde Messengers & Long-Term Plasticity')
    ).toBeVisible();
  });

  test('02. Live Editable Header & PostgreSQL Persistence (Title, Subtitle, Icon, Cover)', async ({
    page,
    request
  }) => {
    // Open Notes tab
    await page.locator('[data-testid="tool-card-notes"]').click();

    // 1. Edit Title
    const docTitle = page.locator('[data-testid="notes-document-title"]');
    await docTitle.click();
    await docTitle.fill('Advanced Neural Circuitry & Synaptic Plasticity');

    // 2. Edit Subtitle
    const docSubtitle = page.locator('[data-testid="notes-document-subtitle"]');
    await docSubtitle.click();
    await docSubtitle.fill('Updated high-yield medical board review lecture series');

    // 3. Change Icon via Popover
    const iconBadge = page.locator('[data-testid="notes-icon-badge"]');
    await iconBadge.click();
    const emojiOption = page.locator('[data-testid="emoji-option-⚡"]');
    await expect(emojiOption).toBeVisible();
    await emojiOption.click();
    await expect(iconBadge).toContainText('⚡');

    // 4. Change Cover via Preset
    const changeCoverBtn = page.locator('[data-testid="btn-change-cover"]');
    await changeCoverBtn.click();
    await expect(page.getByText('Choose Cover Preset')).toBeVisible();
    await page.locator('[data-testid="cover-preset-obsidian-wave"]').click();

    // Wait for debounced PATCH requests
    await page.waitForTimeout(1000);

    // 5. Verify backend database persistence
    const res = await request.get('http://127.0.0.1:3001/api/learning/notes/doc-synaptic-plasticity');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.document.title).toBe('Advanced Neural Circuitry & Synaptic Plasticity');
    expect(data.document.subtitle).toBe('Updated high-yield medical board review lecture series');
    expect(data.document.iconEmoji).toBe('⚡');
    expect(data.document.coverUrl).toContain('unsplash.com');

    // 6. Reload page and assert persisted state survives reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="notes-document-title"]')).toHaveValue(
      'Advanced Neural Circuitry & Synaptic Plasticity'
    );
    await expect(page.locator('[data-testid="notes-icon-badge"]')).toContainText('⚡');
  });

  test('03. Layer Mode Switcher: Blended, Doc, Canvas & Optical Opacity', async ({ page }) => {
    // Open Notes tab
    await page.locator('[data-testid="tool-card-notes"]').click();

    const layerDoc = page.locator('[data-testid="layer-doc"]');
    const layerCanvas = page.locator('[data-testid="layer-canvas"]');

    // Default: Blended -> both visible
    await expect(layerDoc).toHaveClass(/opacity-100/);
    await expect(layerCanvas).toHaveClass(/opacity-100/);

    // Click Doc Only
    await page.locator('[data-testid="mode-doc"]').click();
    await expect(layerDoc).toHaveClass(/opacity-100/);
    await expect(layerCanvas).toHaveClass(/opacity-0/);

    // Click Canvas Only
    await page.locator('[data-testid="mode-canvas"]').click();
    await expect(layerDoc).toHaveClass(/opacity-0/);
    await expect(layerCanvas).toHaveClass(/opacity-100/);

    // Click Blended
    await page.locator('[data-testid="mode-blended"]').click();
    await expect(layerDoc).toHaveClass(/opacity-100/);
    await expect(layerCanvas).toHaveClass(/opacity-100/);
  });

  test('04. Docked 2-Row Annotation Toolbar: Calibrated Weights, Inks & Tool State', async ({
    page
  }) => {
    // Open Notes tab
    await page.locator('[data-testid="tool-card-notes"]').click();

    const toolbar = page.locator('[data-testid="docked-bottom-bar"]');
    await expect(toolbar).toBeVisible();

    // 1. Check 3 Calibrated Stroke Weights (1px, 2px, 3.5px)
    const weight1 = page.locator('[data-testid="stroke-weight-1"]');
    const weight2 = page.locator('[data-testid="stroke-weight-2"]');
    const weight35 = page.locator('[data-testid="stroke-weight-3.5"]');
    await expect(weight1).toBeVisible();
    await expect(weight2).toBeVisible();
    await expect(weight35).toBeVisible();

    // Click Thick 3.5px
    await weight35.click();
    await expect(weight35).toHaveAttribute('aria-checked', 'true');

    // 2. Check Ink Colors (Off-White, Amber, Slate Blue, etc.)
    const inkOffWhite = page.locator('[data-testid="ink-color-off-white"]');
    const inkAmber = page.locator('[data-testid="ink-color-amber"]');
    const inkSlate = page.locator('[data-testid="ink-color-slate-blue"]');
    await expect(inkOffWhite).toBeVisible();
    await expect(inkAmber).toBeVisible();
    await expect(inkSlate).toBeVisible();

    // Click Slate Blue
    await inkSlate.click();
    await expect(inkSlate).toHaveAttribute('aria-checked', 'true');

    // 3. Check All Primary Tools in Row 2
    const toolSelect = page.locator('[data-testid="tool-select"]');
    const toolPen = page.locator('[data-testid="tool-pen"]');
    const toolHighlighter = page.locator('[data-testid="tool-highlighter"]');
    const toolLine = page.locator('[data-testid="tool-line"]');
    const toolArrow = page.locator('[data-testid="tool-arrow"]');
    const toolShape = page.locator('[data-testid="tool-shape"]');
    const toolText = page.locator('[data-testid="tool-text"]');
    const toolEraser = page.locator('[data-testid="tool-eraser"]');
    const toolLaser = page.locator('[data-testid="tool-laser"]');

    await expect(toolSelect).toBeVisible();
    await expect(toolPen).toBeVisible();
    await expect(toolHighlighter).toBeVisible();
    await expect(toolLine).toBeVisible();
    await expect(toolArrow).toBeVisible();
    await expect(toolShape).toBeVisible();
    await expect(toolText).toBeVisible();
    await expect(toolEraser).toBeVisible();
    await expect(toolLaser).toBeVisible();

    // Select Pen
    await toolPen.click();
    await expect(page.locator('[data-testid="layer-canvas"]')).toHaveClass(/pointer-events-auto/);

    // Switch back to Select
    await toolSelect.click();
  });

  test('05. 1:1 Scroll Lockstep & Spatial Margin Cards', async ({ page }) => {
    // Open Notes tab
    await page.locator('[data-testid="tool-card-notes"]').click();

    // Check pre-seeded spatial margin cards
    const clinicalCard = page.locator('[data-testid="spatial-card-elem-card-clinical-alert"]');
    const mnemonicCard = page.locator('[data-testid="spatial-card-elem-card-mnemonic"]');
    const retrogradeCard = page.locator('[data-testid="spatial-card-elem-card-retrograde"]');

    await expect(clinicalCard).toBeVisible();
    await expect(clinicalCard).toContainText('CLINICAL ALERT');
    await expect(clinicalCard).toContainText('Memantine');

    await expect(mnemonicCard).toBeVisible();
    await expect(mnemonicCard).toContainText('Mnemonic');
    await expect(mnemonicCard).toContainText('CA1');

    await expect(retrogradeCard).toBeVisible();
    await expect(retrogradeCard).toContainText('Retrograde Loop');

    // Verify 1:1 Scroll Lockstep:
    // When scrolling #layer-doc down, the margin cards scroll natively with the document
    const initialBbox = await clinicalCard.boundingBox();
    expect(initialBbox).not.toBeNull();

    // Scroll #layer-doc down by 300px
    await page.evaluate(() => {
      const doc = document.getElementById('layer-doc');
      if (doc) doc.scrollTop = 300;
    });
    await page.waitForTimeout(300);

    const scrolledBbox = await clinicalCard.boundingBox();
    expect(scrolledBbox).not.toBeNull();
    // The card's viewport Y should have shifted up by approximately 300px (scroll offset)
    const deltaY = (initialBbox?.y ?? 0) - (scrolledBbox?.y ?? 0);
    expect(deltaY).toBeGreaterThanOrEqual(280);
    expect(deltaY).toBeLessThanOrEqual(320);
  });

  test('06. AI Assistant Grounding & Spatial Action Highlight', async ({ page }) => {
    // Open Notes tab
    await page.locator('[data-testid="tool-card-notes"]').click();

    // 1. Verify AI Header Badge
    const aiPanel = page.locator('#ai-panel');
    await expect(aiPanel).toBeVisible();
    await expect(aiPanel).toContainText('Dual-Layer Notes Synced');

    // 2. Click Suggested Prompt
    const promptBtn = page.getByRole('button', {
      name: 'Summarize retrograde messengers like Nitric Oxide (NO) in one concise note.'
    });
    await expect(promptBtn).toBeVisible();
    await promptBtn.click();

    // 3. Verify AI Response and Action Pill
    await page.waitForTimeout(1000);
    await expect(aiPanel).toContainText('Nitric oxide synthase (NOS) is activated by Ca²⁺/Calmodulin');
    const actionBtn = aiPanel.getByRole('button', { name: 'Spatial note added to margin' });
    await expect(actionBtn).toBeVisible();

    // 4. Click Action Pill -> Dispatches highlight event
    await actionBtn.click();
    await page.waitForTimeout(500);

    // 5. Capture Desktop 1440x900 Screenshot for Visual Verification
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'screenshots/08_notes_dual_layer.png' });
  });

  test('07. Real Native BlockNote Live Typing & Debounced PostgreSQL Persistence', async ({
    page,
    request
  }) => {
    // Open Notes tab
    await page.locator('[data-testid="tool-card-notes"]').click();

    const blocknoteView = page.locator('[data-testid="blocknote-view"]');
    await expect(blocknoteView).toBeVisible();

    // Find the first editable paragraph block inside BlockNote
    const editableBlock = blocknoteView.locator('.bn-block-content p, .bn-block-content [contenteditable="true"]').first();
    await expect(editableBlock).toBeVisible();

    // Click into the block and type additional text
    await editableBlock.click();
    await page.keyboard.type(' [Verified Live Typing in Pure Native BlockNote]');

    // Wait for the debounced save to PATCH /api/learning/notes/:documentId/blocks
    await page.waitForTimeout(1000);

    // Verify backend received and persisted the edit in PostgreSQL
    const res = await request.get('http://127.0.0.1:3001/api/learning/notes/doc-synaptic-plasticity');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const blocksStr = JSON.stringify(data.document.blocksJson);
    expect(blocksStr).toContain('Verified Live Typing in Pure Native BlockNote');

    // Reload the page and ensure the text is rendered directly from PostgreSQL
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Verified Live Typing in Pure Native BlockNote')).toBeVisible();
  });

  test('08. Real Excalidraw Engine Drawing & Tool Dock Interactions', async ({ page }) => {
    // Open Notes tab
    await page.locator('[data-testid="tool-card-notes"]').click();

    // Verify Excalidraw container is mounted
    const excalidrawContainer = page.locator('.sos-excalidraw-container');
    await expect(excalidrawContainer).toBeVisible();

    // 1. Select Pen Tool from Docked Toolbar
    const toolPen = page.locator('[data-testid="tool-pen"]');
    await toolPen.click();
    await expect(toolPen).toBeVisible();

    // 2. Draw on the Excalidraw interactive canvas
    const canvasStage = page.locator('#notes-stage');
    const stageBox = await canvasStage.boundingBox();
    if (stageBox) {
      await page.mouse.move(stageBox.x + 300, stageBox.y + 200);
      await page.mouse.down();
      await page.mouse.move(stageBox.x + 450, stageBox.y + 250);
      await page.mouse.move(stageBox.x + 400, stageBox.y + 350);
      await page.mouse.up();
    }

    // 3. Switch to Highlighter tool and change color to Amber
    const toolHighlighter = page.locator('[data-testid="tool-highlighter"]');
    await toolHighlighter.click();
    const inkAmber = page.locator('[data-testid="ink-color-amber"]');
    await inkAmber.click();
    await expect(inkAmber).toHaveAttribute('aria-checked', 'true');

    // 4. Switch to Shapes (Rectangle)
    const shapeBtn = page.locator('[data-testid="tool-shape"]');
    await shapeBtn.click();
    await expect(shapeBtn).toBeVisible();

    // 5. Switch back to Select tool
    const toolSelect = page.locator('[data-testid="tool-select"]');
    await toolSelect.click();
    await expect(toolSelect).toBeVisible();
  });
});
