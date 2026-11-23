import { chromium } from '@playwright/test';
import fs from 'fs';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Reset DB state to single clean new tab
await page.request.post('http://127.0.0.1:3001/api/learning/reset');

// 1. New Tab
await page.goto('http://localhost:5173/learning');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/01_new_tab.png' });
console.log('Captured 01_new_tab.png');

// 2. Flashcards
await page.locator('[data-testid="tool-card-flashcards"]').click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshots/02_flashcards.png' });
console.log('Captured 02_flashcards.png');

// 3. Quizzes
await page.locator('[data-testid="new-tab-btn"]').click();
await page.waitForTimeout(500);
await page.locator('[data-testid="tool-card-quizzes"]').click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshots/03_quizzes.png' });
console.log('Captured 03_quizzes.png');

// 4. Exam
await page.locator('[data-testid="new-tab-btn"]').click();
await page.waitForTimeout(500);
await page.locator('[data-testid="tool-card-exam"]').click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshots/04_exam.png' });
console.log('Captured 04_exam.png');

// 5. Videos
await page.locator('[data-testid="new-tab-btn"]').click();
await page.waitForTimeout(500);
await page.locator('[data-testid="tool-card-videos"]').click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshots/05_videos.png' });
console.log('Captured 05_videos.png');

// 6. Audios
await page.locator('[data-testid="new-tab-btn"]').click();
await page.waitForTimeout(500);
await page.locator('[data-testid="tool-card-audios"]').click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshots/06_audios.png' });
console.log('Captured 06_audios.png');

// 7. Coming Soon
await page.locator('[data-testid="new-tab-btn"]').click();
await page.waitForTimeout(500);
await page.locator('[data-testid="tool-card-pdf"]').click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshots/07_coming_soon_pdf.png' });
console.log('Captured 07_coming_soon_pdf.png');

await browser.close();
console.log('All screenshots captured successfully!');
