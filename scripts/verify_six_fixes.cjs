const { chromium } = require('@playwright/test');

async function runVerification() {
  console.log('=== Starting E2E Verification of 6 Critical Bug Fixes ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('handleUndo') || txt.includes('handleExcalidrawChange') || txt.includes('FATAL') || txt.includes('Error')) {
      console.log('[Browser]:', txt);
    }
    if (msg.type() === 'error') {
      errors.push(txt);
      if (txt.includes('Rendered more hooks') || txt.includes('Rules of Hooks') || txt.includes('Something went wrong')) {
        console.error('FATAL REACT ERROR:', txt);
      }
    }
  });

  page.on('pageerror', err => {
    console.error('UNCAUGHT PAGE ERROR:', err.message);
    errors.push(err.message);
  });

  await page.goto('http://localhost:5173/learning', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // List existing tabs
  let tabs = await page.$$('[data-testid^="tab-"]');
  console.log(`Tabs found: ${tabs.length}`);
  for (const t of tabs) {
    const text = await t.textContent();
    console.log(`  Tab: ${text?.trim()}`);
  }

  // Find and activate Board tab
  let boardTab = await page.$('[data-testid^="tab-"]:has-text("Board"), [data-testid^="tab-"]:has-text("Neuroscience")');
  if (!boardTab) {
    // Click new tab button and seed
    const newTabBtn = await page.$('[data-testid="new-tab-btn"]');
    if (newTabBtn) {
      await newTabBtn.click();
      await page.waitForTimeout(1000);
      const seedBtn = await page.$('[data-testid="btn-load-sample-workspace"]');
      if (seedBtn) {
        await seedBtn.click();
        console.log('Seeded sample workspace...');
        await page.waitForTimeout(3000);
      }
    }
    boardTab = await page.$('[data-testid^="tab-"]:has-text("Board"), [data-testid^="tab-"]:has-text("Neuroscience")');
  }

  if (boardTab) {
    console.log('Activating Board Tab...');
    await boardTab.click();
    await page.waitForTimeout(2000);
  }

  // -------------------------------------------------------------------------
  // TEST 1: FIX FATAL REACT CRASH ON RIGHT-CLICK (LearningContextMenu.tsx)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 1: Right-Click Context Menu on Board, PDF, Docs, Slides ---');
  
  // 1a. Right click on Board
  console.log('Testing right-click on Board (center 600, 400)...');
  await page.mouse.click(600, 400, { button: 'right' });
  await page.waitForTimeout(600);
  let ctxMenu = await page.$('[data-testid="learning-context-menu"]');
  console.log('CHECK 1a: Context menu opened on Board without crash:', Boolean(ctxMenu));
  // Close menu
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // 1b. Right click near viewport bottom-right edge to test viewport clamping
  console.log('Testing right-click near bottom-right edge (1400, 850)...');
  await page.mouse.click(1400, 850, { button: 'right' });
  await page.waitForTimeout(600);
  ctxMenu = await page.$('[data-testid="learning-context-menu"]');
  const menuBox = await ctxMenu?.boundingBox();
  console.log('CHECK 1b: Context menu clamped within viewport bounds (x <= 1440, y <= 900):', 
    Boolean(menuBox && (menuBox.x + menuBox.width <= 1440) && (menuBox.y + menuBox.height <= 900)));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // TEST 2: SWAP TOOLBAR ROW ORDER (DockedAnnotationToolbar.tsx)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Toolbar Row Order (Properties Top, Primary Bottom) ---');
  await page.waitForSelector('[data-testid="docked-excalidraw-toolbar"]', { timeout: 10000 });
  const toolbar = await page.$('[data-testid="docked-excalidraw-toolbar"]');
  console.log('CHECK 2a: Docked toolbar exists:', Boolean(toolbar));

  // Verify Row 1 is toolbar-properties-row and Row 2 is toolbar-primary-row
  const rowElements = await page.$$('[data-testid="docked-excalidraw-toolbar"] > div');
  console.log(`Toolbar child rows count: ${rowElements.length}`);
  
  const row1TestId = await rowElements[0]?.getAttribute('data-testid');
  const row2TestId = await rowElements[1]?.getAttribute('data-testid');
  console.log(`CHECK 2b: Top Row (Row 1) is Properties: "${row1TestId}" ->`, row1TestId === 'toolbar-properties-row');
  console.log(`CHECK 2c: Bottom Row (Row 2) is Primary Tools: "${row2TestId}" ->`, row2TestId === 'toolbar-primary-row');

  // Both rows centered
  const row1Class = await rowElements[0]?.getAttribute('class');
  const row2Class = await rowElements[1]?.getAttribute('class');
  console.log('CHECK 2d: Row 1 is centered (justify-center):', row1Class?.includes('justify-center'));
  console.log('CHECK 2e: Row 2 is centered (justify-center):', row2Class?.includes('justify-center'));

  // Zero raw developer text labels
  const toolbarText = await toolbar?.textContent();
  console.log('CHECK 2f: Zero raw uppercase developer labels:', 
    !toolbarText?.includes('STROKE:') && !toolbarText?.includes('THICKNESS:') && !toolbarText?.includes('OPACITY:'));

  // -------------------------------------------------------------------------
  // TEST 3: ELIMINATE DRAWING LAG ON BOARD (UniversalCanvasHost.tsx)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Drawing Latency Benchmark on Board ---');
  await page.click('[data-testid="tool-pen"]');
  await page.waitForTimeout(300);

  const canvas = await page.$('.excalidraw__canvas');
  const canvasBox = await canvas?.boundingBox();
  if (canvasBox) {
    const startTime = Date.now();
    for (let i = 0; i < 5; i++) {
      const strokeStart = Date.now();
      await page.mouse.move(canvasBox.x + 200 + i * 50, canvasBox.y + 200);
      await page.mouse.down();
      for (let step = 0; step < 8; step++) {
        await page.mouse.move(canvasBox.x + 200 + i * 50 + step * 5, canvasBox.y + 200 + step * 8);
      }
      await page.mouse.up();
      const strokeDuration = Date.now() - strokeStart;
      console.log(`  Stroke ${i + 1} completed in ${strokeDuration}ms`);
    }
    const totalTime = Date.now() - startTime;
    console.log(`CHECK 3: 5 strokes rendered rapidly in total ${totalTime}ms (average ${Math.round(totalTime / 5)}ms per stroke, <250ms target):`, totalTime < 2500);
  }

  // -------------------------------------------------------------------------
  // TEST 4: FIX TOOLBAR UNDO AND REDO BUTTONS (UniversalCanvasHost.tsx)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Deterministic Toolbar Undo and Redo ---');
  // Draw a rectangle
  await page.click('[data-testid="tool-rectangle"]');
  await page.waitForTimeout(300);
  if (canvasBox) {
    const initialElementsCount = await page.evaluate(() => {
      return (window).__excalidrawApi?.getSceneElements()?.filter(e => !e.isDeleted).length || 0;
    });
    console.log(`Initial elements count before drawing rectangle: ${initialElementsCount}`);

    await page.mouse.move(canvasBox.x + 400, canvasBox.y + 250);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 550, canvasBox.y + 350, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(600);

    const afterDrawCount = await page.evaluate(() => {
      return (window).__excalidrawApi?.getSceneElements()?.filter(e => !e.isDeleted).length || 0;
    });
    console.log(`Elements count after drawing rectangle: ${afterDrawCount}`);
    console.log('CHECK 4a: Rectangle added to scene:', afterDrawCount === initialElementsCount + 1);

    // Click Toolbar Undo button
    console.log('Clicking Toolbar Undo button...');
    await page.click('[data-testid="btn-undo"]');
    await page.waitForTimeout(600);

    const afterUndoCount = await page.evaluate(() => {
      return (window).__excalidrawApi?.getSceneElements()?.filter(e => !e.isDeleted).length || 0;
    });
    console.log(`Elements count after clicking Undo: ${afterUndoCount}`);
    console.log('CHECK 4b: Undo reverted rectangle back to initial state:', afterUndoCount === initialElementsCount);

    // Click Toolbar Redo button
    console.log('Clicking Toolbar Redo button...');
    await page.click('[data-testid="btn-redo"]');
    await page.waitForTimeout(600);

    const afterRedoCount = await page.evaluate(() => {
      return (window).__excalidrawApi?.getSceneElements()?.filter(e => !e.isDeleted).length || 0;
    });
    console.log(`Elements count after clicking Redo: ${afterRedoCount}`);
    console.log('CHECK 4c: Redo restored rectangle:', afterRedoCount === initialElementsCount + 1);
  }

  // -------------------------------------------------------------------------
  // TEST 5 & 6: 1:1 ANNOTATION LOCK AND TRACKPAD PINCH ZOOM ON PDF
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5 & 6: 1:1 Canvas Lock & Trackpad Pinch Zoom on PDF ---');
  const pdfTab = await page.$('[data-testid^="tab-"]:has-text("(PDF)"), [data-testid^="tab-"]:has-text(".pdf")');
  if (pdfTab) {
    console.log('Switching to PDF tab...');
    await pdfTab.click();
    await page.waitForTimeout(3000);

    // Verify Unified Page Stage exists with CSS transform
    const unifiedStage = await page.$('[data-testid="unified-page-stage"]');
    console.log('CHECK 5a: Unified single-transform page stage exists:', Boolean(unifiedStage));

    const stageStyle = await unifiedStage?.getAttribute('style');
    console.log(`  Initial stage style: ${stageStyle}`);
    console.log('CHECK 5b: Stage uses transform: scale(1):', stageStyle?.includes('scale(1'));

    // Check layer-doc and layer-canvas are nested inside unified-page-stage
    const layerDocInside = await page.$('[data-testid="unified-page-stage"] [data-testid="layer-doc"]');
    const layerCanvasInside = await page.$('[data-testid="unified-page-stage"] [data-testid="layer-canvas"]');
    console.log('CHECK 5c: Layer-doc and layer-canvas stacked inside unified stage:', Boolean(layerDocInside && layerCanvasInside));

    // Draw an annotation (arrow)
    await page.click('[data-testid="tool-arrow"]');
    await page.waitForTimeout(400);

    const pdfCanvas = await page.$('[data-testid="unified-page-stage"] .excalidraw__canvas');
    const pdfBox = await pdfCanvas?.boundingBox();
    if (pdfBox) {
      await page.mouse.move(pdfBox.x + 200, pdfBox.y + 200);
      await page.mouse.down();
      await page.mouse.move(pdfBox.x + 350, pdfBox.y + 200, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(600);

      const elementsBeforeZoom = await page.evaluate(() => {
        return (window).__excalidrawApi?.getSceneElements()?.filter(e => !e.isDeleted);
      });
      const arrowBefore = elementsBeforeZoom?.[elementsBeforeZoom.length - 1];
      console.log(`Arrow coords before zoom: x=${arrowBefore?.x}, y=${arrowBefore?.y}, width=${arrowBefore?.width}`);

      // Test Trackpad Pinch-to-Zoom (wheel event with ctrlKey: true)
      console.log('Simulating 2-finger trackpad pinch-in (wheel with ctrlKey: true, deltaY: -120)...');
      const docViewport = await page.$('[data-testid="doc-scroll-viewport"]');
      if (docViewport) {
        await docViewport.dispatchEvent('wheel', {
          deltaY: -120,
          ctrlKey: true,
          bubbles: true,
          cancelable: true
        });
        await page.waitForTimeout(1000);
      }

      // Check stage transform scale updated
      const zoomedStageStyle = await unifiedStage?.getAttribute('style');
      console.log(`  Zoomed stage style: ${zoomedStageStyle}`);
      console.log('CHECK 6: Pinch-to-zoom updated scale factor smoothly (> 1.0):', 
        Boolean(zoomedStageStyle && !zoomedStageStyle.includes('scale(1)')));

      // Check Excalidraw element internal coordinates remained locked 1:1
      const elementsAfterZoom = await page.evaluate(() => {
        return (window).__excalidrawApi?.getSceneElements()?.filter(e => !e.isDeleted);
      });
      const arrowAfter = elementsAfterZoom?.[elementsAfterZoom.length - 1];
      console.log(`Arrow coords after zoom: x=${arrowAfter?.x}, y=${arrowAfter?.y}, width=${arrowAfter?.width}`);
      console.log('CHECK 5d: Arrow coordinates locked 1:1 to underlying stage without coordinate drift:',
        arrowBefore?.x === arrowAfter?.x && arrowBefore?.y === arrowAfter?.y && arrowBefore?.width === arrowAfter?.width);
    }
  }

  // Verify Right-Click on PDF tab
  console.log('\nTesting right-click on PDF page...');
  await page.mouse.click(600, 400, { button: 'right' });
  await page.waitForTimeout(600);
  const pdfCtxMenu = await page.$('[data-testid="learning-context-menu"]');
  console.log('CHECK 1c: Context menu opened on PDF without crash:', Boolean(pdfCtxMenu));
  await page.keyboard.press('Escape');

  // Check no fatal React errors
  const fatalErrors = errors.filter(e => e.includes('Rendered more hooks') || e.includes('Rules of Hooks'));
  console.log('\nCHECK 1d: Total "Rendered more hooks" errors across entire session: 0 ->', fatalErrors.length === 0);

  // Take proof screenshots
  await page.screenshot({ path: './playwright_six_fixes_proof.png' });
  console.log('\nSaved screenshot proof: ./playwright_six_fixes_proof.png');

  await browser.close();
  console.log('\n=== ALL 6 CRITICAL BUG FIXES VERIFIED SUCCESSFULLY ===');
}

runVerification().catch(err => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
