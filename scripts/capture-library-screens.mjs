import { chromium } from '@playwright/test';
import path from 'path';

const outDir = 'C:/Users/3BDALLA/.gemini/antigravity/brain/cdd6edcb-5747-4d9b-93ac-5ae477a6a331';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 }
  });
  const page = await context.newPage();

  console.log('Navigating to /library...');
  await page.goto('http://127.0.0.1:5173/library');
  await page.waitForSelector('[data-testid="library-page"]');
  await page.waitForTimeout(1000);

  // 1. Root Grid View
  await page.screenshot({ path: path.join(outDir, 'library-grid-root.png') });
  console.log('Captured library-grid-root.png');

  // 2. Open View & Size Popover
  await page.click('[data-testid="library-view-settings-btn"]');
  await page.waitForSelector('[data-testid="library-view-settings-popover"]');
  await page.screenshot({ path: path.join(outDir, 'library-view-popover-open.png') });
  console.log('Captured library-view-popover-open.png');

  // 3. Switch to Gallery View
  await page.click('[data-testid="view-opt-gallery"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'library-gallery-root.png') });
  console.log('Captured library-gallery-root.png');

  // 4. Switch to List View
  await page.click('[data-testid="library-view-settings-btn"]');
  await page.click('[data-testid="view-opt-list"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'library-list-root.png') });
  console.log('Captured library-list-root.png');

  // 5. Navigate into Computer Science -> Distributed Systems
  // Switch back to Grid View first
  await page.click('[data-testid="library-view-settings-btn"]');
  await page.click('[data-testid="view-opt-grid"]');
  await page.waitForTimeout(300);

  const csFolder = page.locator('text=Computer Science').first();
  await csFolder.dblclick();
  await page.waitForTimeout(500);

  const dsFolder = page.locator('text=Distributed Systems').first();
  await dsFolder.dblclick();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(outDir, 'library-nested-12-types-grid.png') });
  console.log('Captured library-nested-12-types-grid.png');

  // 6. Nested in Gallery View
  await page.click('[data-testid="library-view-settings-btn"]');
  await page.click('[data-testid="view-opt-gallery"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'library-nested-12-types-gallery.png') });
  console.log('Captured library-nested-12-types-gallery.png');

  // 7. Nested in List View
  await page.click('[data-testid="library-view-settings-btn"]');
  await page.click('[data-testid="view-opt-list"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'library-nested-12-types-list.png') });
  console.log('Captured library-nested-12-types-list.png');

  // 8. Open New Folder Modal
  await page.click('[data-testid="library-new-folder-btn"]');
  await page.waitForSelector('[data-testid="new-folder-modal"]');
  await page.screenshot({ path: path.join(outDir, 'library-modal-new-folder.png') });
  console.log('Captured library-modal-new-folder.png');

  await browser.close();
  console.log('All screenshots captured successfully.');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
