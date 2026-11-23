import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'C:/Users/3BDALLA/.gemini/antigravity/brain/e96fcdf5-f3b1-4fa8-a788-6667a3121ebe/screenshots';

test.describe('Settings View & Modal Restrained Hover Glow Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  });

  test('Audit Account Tab cards and modals for restrained hover glow', async ({ page }) => {
    await page.locator('[data-testid="settings-nav-account"]').click();
    await page.waitForTimeout(200);

    const cards = page.locator('[data-testid="settings-account-tab"] .group\\/card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Hover over Profile Information card
    const profileCard = cards.nth(0);
    await profileCard.hover();
    await page.waitForTimeout(150);

    // Verify restrained hover border and shadow
    const hoverBorder = await profileCard.evaluate((el) => window.getComputedStyle(el).borderColor);
    const hoverShadow = await profileCard.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(hoverBorder).toBe('rgb(42, 42, 48)'); // #2A2A30
    expect(hoverShadow).toContain('rgba(0, 0, 0, 0.16)');

    // Verify restrained spotlight border and sheen gradients
    const spotlightGlow = await profileCard.locator('> div').nth(0).evaluate((el) => el.getAttribute('style') || '');
    expect(spotlightGlow).toContain('0.10');

    const sheenGlow = await profileCard.locator('> div').nth(1).evaluate((el) => el.getAttribute('style') || '');
    expect(sheenGlow).toContain('0.016');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01_settings_account_hover.png` });

    // Open Change Password Modal
    await page.getByRole('button', { name: 'Change', exact: true }).click();
    const pwModal = page.locator('text=Change Password').locator('xpath=ancestor::div[contains(@class, "group/card")]').first();
    await expect(pwModal).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02_settings_change_password_modal.png` });
    await page.locator('button:has-text("Cancel")').click();
    await expect(pwModal).toBeHidden();
  });

  test('Audit Usage Tab cards and Upgrade Plan modal for restrained hover glow', async ({ page }) => {
    await page.locator('[data-testid="settings-nav-usage"]').click();
    await page.waitForTimeout(200);

    const cards = page.locator('[data-testid="settings-usage-tab"] .group\\/card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Hover over Resource Limits card
    const resourceCard = cards.nth(1);
    await resourceCard.hover();
    await page.waitForTimeout(150);

    const hoverBorder = await resourceCard.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(hoverBorder).toBe('rgb(42, 42, 48)');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03_settings_usage_hover.png` });

    // Open Upgrade Plan Modal
    await page.locator('button:has-text("Upgrade Plan")').click();
    await page.waitForTimeout(200);

    const upgradeModal = page.locator('text=Upgrade Study Plan').locator('xpath=ancestor::div[contains(@class, "group/card")]').first();
    await expect(upgradeModal).toBeVisible();

    // Hover over Scholar Pro plan option card
    const proCard = page.locator('text=Scholar Pro').locator('xpath=ancestor::div[contains(@class, "group/card")]').first();
    await expect(proCard).toBeVisible();
    await proCard.hover();
    await page.waitForTimeout(150);

    const proCardBorder = await proCard.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(proCardBorder).not.toBeNull();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/04_settings_upgrade_modal_hover.png` });
    await page.locator('button[aria-label="Close Upgrade Plan"]').click();
  });

  test('Audit General Tab cards for restrained hover glow', async ({ page }) => {
    await page.locator('[data-testid="settings-nav-general"]').click();
    await page.waitForTimeout(200);

    const cards = page.locator('[data-testid="settings-general-tab"] .group\\/card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Hover over Focus & Pomodoro Defaults card
    const focusCard = cards.nth(2);
    await focusCard.hover();
    await page.waitForTimeout(150);

    const hoverBorder = await focusCard.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(hoverBorder).toBe('rgb(42, 42, 48)');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05_settings_general_hover.png` });
  });

  test('Audit Memory Tab cards and insights panel for restrained hover glow', async ({ page }) => {
    await page.locator('[data-testid="settings-nav-memory"]').click();
    await page.waitForTimeout(200);

    // Verify Enable Study Memory card uses SOSCard
    const enableMemoryCard = page.locator('text=Enable Study Memory').locator('xpath=ancestor::div[contains(@class, "group/card")]').first();
    await expect(enableMemoryCard).toBeVisible();
    await enableMemoryCard.hover();
    await page.waitForTimeout(150);

    expect(await enableMemoryCard.evaluate((el) => window.getComputedStyle(el).borderColor)).toBe('rgb(42, 42, 48)');

    // Verify What has SOS learned about me card uses SOSCard
    const learnedInsightsCard = page.locator('[data-testid="settings-memory-tab"] .group\\/card').nth(1);
    await expect(learnedInsightsCard).toBeVisible();
    await learnedInsightsCard.hover();
    await page.waitForTimeout(150);

    expect(await learnedInsightsCard.evaluate((el) => window.getComputedStyle(el).borderColor)).toBe('rgb(42, 42, 48)');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06_settings_memory_hover.png` });
  });

  test('Audit Skills Tab cards and SkillEditorModal for restrained hover glow', async ({ page }) => {
    await page.locator('[data-testid="settings-nav-skills"]').click();
    await page.waitForTimeout(200);

    const skillCards = page.locator('[data-testid="settings-skills-tab"] .group\\/card');
    const cardCount = await skillCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Hover over first skill card
    const firstSkill = skillCards.first();
    await firstSkill.hover();
    await page.waitForTimeout(150);

    expect(await firstSkill.evaluate((el) => window.getComputedStyle(el).borderColor)).toBe('rgb(42, 42, 48)');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07_settings_skills_hover.png` });

    // Open Skill Editor Modal
    await page.locator('button:has-text("New Skill")').click();
    await page.waitForTimeout(200);

    const modal = page.locator('text=New Skill').locator('xpath=ancestor::div[contains(@class, "group/card")]').first();
    await expect(modal).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08_settings_skill_editor_modal.png` });
    await page.locator('button:has-text("Cancel")').click();
    await expect(modal).toBeHidden();
  });
});

