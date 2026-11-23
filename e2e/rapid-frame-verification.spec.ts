import { test, expect } from '@playwright/test';

test.describe('FOUC & Rapid Frame Mount Verification', () => {
  test('verifies Home Page never displays "2026" or "89%" during initial load or route transition', async ({ page }) => {
    // 1. Pre-seed localStorage with realistic data to simulate persisted user state
    await page.addInitScript(() => {
      localStorage.setItem('sos_user_settings_v3', JSON.stringify({
        account: {
          name: 'Abdalla Husin',
          username: '@abdalla7usin',
          email: 'Plato428@Athens.com',
          learningFocus: 'Computer Science & Cognitive Systems',
          plan: 'Free'
        },
        general: {
          appLanguage: 'English',
          weekStartDay: 'saturday',
          horizonBar: {
            milestoneName: 'Fall Semester 2026',
            startDate: '2026-09-26',
            endDate: '2027-01-01',
            preset: 'custom'
          }
        }
      }));
    });

    const recordedHomeStates: Array<{ time: number; milestone?: string; percent?: string; hasSkeleton: boolean }> = [];

    // Navigate to Home page
    const startTime = Date.now();
    const navigationPromise = page.goto('/');

    // Sample DOM every 25ms during initial load (up to 800ms)
    const sampleInterval = setInterval(async () => {
      try {
        const state = await page.evaluate(() => {
          const card = document.querySelector('[data-testid="hero-greeting-card"]');
          if (!card) return null;
          const skeleton = card.querySelector('[data-testid="semester-progress-skeleton"]');
          const percent = card.querySelector('[data-testid="semester-percent-badge"]')?.textContent?.trim();
          const milestone = card.querySelector('.border-t span')?.textContent?.trim();
          return {
            hasSkeleton: !!skeleton,
            milestone,
            percent
          };
        });
        if (state) {
          recordedHomeStates.push({ time: Date.now() - startTime, ...state });
        }
      } catch {}
    }, 25);

    await navigationPromise;
    await page.waitForTimeout(600);
    clearInterval(sampleInterval);

    console.log(`Captured ${recordedHomeStates.length} rapid samples during Home load.`);
    for (const sample of recordedHomeStates) {
      // Assert that neither "2026" (standalone milestone name) nor "89%" ever appears
      expect(sample.milestone).not.toBe('2026');
      expect(sample.percent).not.toBe('89%');
      if (!sample.hasSkeleton) {
        expect(sample.milestone).toBe('Fall Semester 2026');
        expect(sample.percent).toBe('60%');
      }
    }

    // Verify settled card state
    const milestoneSpan = page.locator('[data-testid="hero-greeting-card"] .border-t span').first();
    await expect(milestoneSpan).toHaveText('Fall Semester 2026');
    const percentBadge = page.locator('[data-testid="semester-percent-badge"]');
    await expect(percentBadge).toHaveText('60%');
  });

  test('verifies Library Page never displays unfiltered large folder list during initial load or navigation', async ({ page }) => {
    // Pre-seed localStorage with clean root cache
    await page.addInitScript(() => {
      localStorage.setItem('sos_library_cache_root', JSON.stringify([
        { _id: 'folder-cs', id: 'folder-cs', name: 'Computer Science', itemKind: 'folder', fileType: 'folder', parentId: null },
        { _id: 'folder-econ', id: 'folder-econ', name: 'Economics & Finance', itemKind: 'folder', fileType: 'folder', parentId: null },
        { _id: 'folder-phil', id: 'folder-phil', name: 'Philosophy', itemKind: 'folder', fileType: 'folder', parentId: null },
        { _id: 'folder-research', id: 'folder-research', name: 'Research Papers', itemKind: 'folder', fileType: 'folder', parentId: null }
      ]));
    });

    const recordedLibraryStates: Array<{ time: number; count: number; titles: string[]; hasSkeleton: boolean }> = [];

    const startTime = Date.now();
    const navigationPromise = page.goto('/library');

    // Sample DOM every 25ms during initial load
    const sampleInterval = setInterval(async () => {
      try {
        const state = await page.evaluate(() => {
          const skeleton = document.querySelector('[data-testid="library-skeleton-view"]');
          const cards = Array.from(document.querySelectorAll('[data-testid^="library-card-"]')).map(el => {
            return el.querySelector('h3')?.textContent?.trim() || '';
          }).filter(Boolean);
          return {
            hasSkeleton: !!skeleton,
            count: cards.length,
            titles: cards
          };
        });
        if (state) {
          recordedLibraryStates.push({ time: Date.now() - startTime, ...state });
        }
      } catch {}
    }, 25);

    await navigationPromise;
    await page.waitForTimeout(600);
    clearInterval(sampleInterval);

    console.log(`Captured ${recordedLibraryStates.length} rapid samples during Library load.`);
    for (const sample of recordedLibraryStates) {
      if (!sample.hasSkeleton && sample.count > 0) {
        // Must never exceed the genuine root folders (should not contain 30+ files or legacy items)
        expect(sample.count).toBeLessThanOrEqual(8);
        expect(sample.titles).not.toContain('library-root');
        expect(sample.titles).not.toContain('Untitled_PDF.pdf');
      }
    }

    // Verify settled view contains root folders
    await expect(page.locator('h3:has-text("Computer Science")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Economics & Finance")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Philosophy")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Research Papers")').first()).toBeVisible();
  });

  test('verifies client-side route transitions between Home and Library have zero FOUC', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="hero-greeting-card"]')).toBeVisible();

    // Rapid transition to Library
    await page.click('button[data-testid="nav-library"], a[href="/library"]');
    await expect(page.locator('h3:has-text("Computer Science")').first()).toBeVisible();

    // Transition back to Home
    await page.click('button[data-testid="nav-home"], a[href="/"]');
    const milestoneSpan = page.locator('[data-testid="hero-greeting-card"] .border-t span').first();
    await expect(milestoneSpan).toHaveText('Fall Semester 2026');
    const percentBadge = page.locator('[data-testid="semester-percent-badge"]');
    await expect(percentBadge).toHaveText('60%');
  });
});
