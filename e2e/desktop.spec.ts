import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

test.describe('SOS V3 Desktop Electron Integration (Phase 01)', () => {
  test('launches Electron with secure defaults and loads the app shell', async () => {
    const mainScript = path.resolve(currentDir, '../apps/desktop/dist/main/index.js');

    const app = await electron.launch({
      args: [mainScript],
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Verify window title
    const title = await window.title();
    expect(title).toBe('SOS — Studying Operating System');

    // Verify App Shell is visible in Electron window
    const shell = window.locator('[data-testid="app-shell"]');
    await expect(shell).toBeVisible();

    // Verify preload bridge is exposed
    const isDesktop = await window.evaluate(() => {
      // @ts-expect-error window.sosDesktop is exposed via preload
      return window.sosDesktop?.isDesktop;
    });
    expect(isDesktop).toBe(true);

    await app.close();
  });
});
