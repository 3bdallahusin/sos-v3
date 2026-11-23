import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/3BDALLA/.gemini/antigravity/brain/4262f130-c796-40c2-8b63-de17d7a48ce9/calendar_v3_polish';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to http://127.0.0.1:5173/calendar...');
  await page.goto('http://127.0.0.1:5173/calendar');
  await page.waitForLoadState('networkidle');

  // 1. Day View (Today: Friday, 20 Nov 2026)
  await page.waitForSelector('[data-testid="calendar-day-view"]');
  await page.screenshot({ path: path.join(outDir, '01_day_view_today_polished.png') });
  console.log('Captured 01_day_view_today_polished.png');

  // Hover over an empty hourly slot (e.g. 3 AM) to capture hover feedback
  const emptyRow = page.locator('.h-\\[64px\\]').nth(3);
  if (await emptyRow.isVisible()) {
    await emptyRow.hover({ force: true });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, '01b_day_view_slot_hover.png') });
    console.log('Captured 01b_day_view_slot_hover.png');
  }

  // Scroll to bottom of timeline to verify flush 11 PM
  const dayContainer = page.locator('[data-testid="calendar-day-view"]');
  await dayContainer.evaluate(el => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '01c_day_view_bottom_flush.png') });
  console.log('Captured 01c_day_view_bottom_flush.png');

  // 2. Week View
  await page.locator('[data-testid="calendar-view-week"]').click();
  await page.waitForSelector('[data-testid="calendar-week-view"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '02_week_view_unified.png') });
  console.log('Captured 02_week_view_unified.png');

  // 3. Month View (November 2026)
  await page.locator('[data-testid="calendar-view-month"]').click();
  await page.waitForSelector('[data-testid="calendar-month-view"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '03_month_view_november_2026.png') });
  console.log('Captured 03_month_view_november_2026.png');

  // 4. Navigate forward to January 2027 (click next twice)
  const nextBtn = page.locator('[data-testid="calendar-next-btn"]');
  await nextBtn.click(); // December 2026
  await page.waitForTimeout(200);
  await nextBtn.click(); // January 2027
  await page.waitForTimeout(300);

  // Verify header says January 2027
  const headerText = await page.locator('[data-testid="calendar-month-label"]').innerText();
  console.log('Month View Header after 2 clicks:', headerText);

  await page.screenshot({ path: path.join(outDir, '04_month_view_january_2027_no_today_circle.png') });
  console.log('Captured 04_month_view_january_2027_no_today_circle.png');

  await browser.close();
  console.log('All verification captures completed successfully!');
}

main().catch(err => {
  console.error('Error in capture script:', err);
  process.exit(1);
});
