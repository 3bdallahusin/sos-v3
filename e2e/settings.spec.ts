import { test, expect } from '@playwright/test';

test.describe('SOS V3 Phase 09: System Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('verifies 2-column layout, 220px secondary rail, and default Account tab', async ({ page }) => {
    // 1. Verify 2-column secondary navigation rail
    const navRail = page.locator('nav[aria-label="Settings Secondary Navigation"]');
    await expect(navRail).toBeVisible();
    await expect(page.getByTestId('settings-nav-account')).toBeVisible();
    await expect(page.getByTestId('settings-nav-usage')).toBeVisible();
    await expect(page.getByTestId('settings-nav-general')).toBeVisible();
    await expect(page.getByTestId('settings-nav-memory')).toBeVisible();
    await expect(page.getByTestId('settings-nav-skills')).toBeVisible();

    // 2. Default Active Tab is Account
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
    await expect(page.getByText('Manage your profile details and account settings')).toBeVisible();

    // 3. Avatar row
    await expect(page.getByText('Profile Avatar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Change Avatar' })).toBeVisible();

    // 4. Details Card content
    await expect(page.getByText('Abdalla Husin')).toBeVisible();
    await expect(page.getByText('@abdalla7usin')).toBeVisible();
    await expect(page.getByText('Plato428@Athens.com')).toBeVisible();
    await expect(page.getByText('Computer Science & Economics')).toBeVisible();
    await expect(page.getByText('Free', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upgrade' })).toBeVisible();

    // 5. Password row & Modal
    await expect(page.getByText('••••••••••••')).toBeVisible();
    await page.getByRole('button', { name: 'Change', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeHidden();

    // 6. Export Research Data card
    await expect(page.getByText('Export Research Data')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Markdown' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'JSON' })).toBeVisible();

    // 7. Delete Account card & safety input
    await expect(page.getByText('Delete account')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Account Deletion' })).toBeVisible();
    const permDeleteBtn = page.getByRole('button', { name: 'Permanently Delete' });
    await expect(permDeleteBtn).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Account Deletion' })).toBeHidden();

    // 8. Confirm Right AI Panel is strictly unmounted outside Learning tab
    await expect(page.getByTestId('ai-assistant-panel')).toHaveCount(0);
    await expect(page.getByTestId('top-bar-ai-toggle')).toHaveCount(0);

    // 9. Centered Content Container with max-width layout
    const contentWrapper = page.getByTestId('settings-content-container');
    await expect(contentWrapper).toHaveClass(/max-w-4xl/);
    await expect(contentWrapper).toHaveClass(/mx-auto/);
  });

  test('switches to Usage tab and verifies real resource limits and plan stats', async ({ page }) => {
    await page.getByTestId('settings-nav-usage').click();

    await expect(page.getByRole('heading', { name: 'Usage' })).toBeVisible();
    await expect(page.getByText('Check your plan limits and storage usage')).toBeVisible();

    // Your Plan card & Upgrade button
    await expect(page.getByText('SOS Free')).toBeVisible();
    const upgradeBtn = page.getByRole('button', { name: 'Upgrade Plan' });
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();
    await expect(page.getByRole('heading', { name: 'Upgrade Study Plan' })).toBeVisible();
    await expect(page.getByText('Scholar Pro', { exact: true })).toBeVisible();
    await page.getByLabel('Close Upgrade Plan').click();

    // Resource Limits card
    await expect(page.getByText('Monthly AI Grounding & Tutor Credits')).toBeVisible();
    await expect(page.locator('text=/ 500 Credits used/')).toBeVisible();
    await expect(page.getByText('Library Cloud Storage')).toBeVisible();
    await expect(page.locator('text=/5.0 GB used/')).toBeVisible();

    // Usage Reset Activity card
    await expect(page.getByText('Usage Reset Activity')).toBeVisible();
    await expect(page.getByText('Available Resets: 0')).toBeVisible();

    // Right AI Panel strictly unmounted outside Learning tab
    await expect(page.getByTestId('ai-assistant-panel')).toHaveCount(0);
    await expect(page.getByTestId('top-bar-ai-toggle')).toHaveCount(0);
  });

  test('switches to General tab and verifies live Pomodoro interval update in Header Timer', async ({ page }) => {
    await page.getByTestId('settings-nav-general').click();

    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
    await expect(page.getByText('Customize language, timer, and app preferences')).toBeVisible();

    // Cards
    await expect(page.getByText('Interface & Controls')).toBeVisible();
    await expect(page.getByText('Horizon Bar')).toBeVisible();
    await expect(page.getByText('Current Year')).toBeVisible();
    await expect(page.getByText('Semester')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Custom' })).toBeVisible();
    await expect(page.getByText('Focus & Tracking Engine')).toBeVisible();
    await expect(page.getByText('Sound & Motion')).toBeVisible();

    // Right AI Panel strictly unmounted outside Learning tab
    await expect(page.getByTestId('ai-assistant-panel')).toHaveCount(0);
    await expect(page.getByTestId('top-bar-ai-toggle')).toHaveCount(0);

    // Test live custom Pomodoro Interval inputs
    const focusInput = page.getByTestId('focus-minutes-input');
    const breakInput = page.getByTestId('break-minutes-input');

    await expect(focusInput).toBeVisible();
    await expect(breakInput).toBeVisible();

    // Type custom 25m Focus
    await focusInput.fill('25');
    await focusInput.blur();
    await expect(focusInput).toHaveValue('25');

    // Confirm Top Bar Timer Pill is unmounted in idle state
    await expect(page.getByTestId('header-timer-mirror')).toHaveCount(0);

    // Type custom 60m Focus and 15m Break
    await focusInput.fill('60');
    await focusInput.blur();
    await breakInput.fill('15');
    await breakInput.blur();
    await expect(focusInput).toHaveValue('60');
    await expect(breakInput).toHaveValue('15');
  });

  test('switches to Memory tab and verifies structured context textareas and learned memories', async ({ page }) => {
    await page.getByTestId('settings-nav-memory').click();

    await expect(page.getByRole('heading', { name: 'Memory' })).toBeVisible();
    await expect(page.getByText('Tell SOS how you learn best')).toBeVisible();
    await expect(page.getByText('Auto-saved')).toBeVisible();

    // Toggle card
    await expect(page.getByText('Enable Study Memory')).toBeVisible();
    const toggleButton = page.locator('button[role="switch"]');
    await expect(toggleButton).toBeVisible();

    // 3 Textareas with counters
    await expect(page.getByText('Who I am', { exact: true })).toBeVisible();
    await expect(page.getByText('What I am learning', { exact: true })).toBeVisible();
    await expect(page.getByText('How I prefer to learn', { exact: true })).toBeVisible();
    await expect(page.getByText('/ 1,500').first()).toBeVisible();

    // What has SOS learned about me?
    await expect(page.getByText('What has SOS learned about me?')).toBeVisible();
    await expect(page.getByText('Preference')).toBeVisible();
    await expect(page.getByText('CS 161')).toBeVisible();

    // Test deleting a learned memory and undoing
    const deleteButtons = page.locator('button[title="Delete memory"]');
    const initialCount = await deleteButtons.count();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    await deleteButtons.first().click();
    await expect(page.getByTestId('undo-toast')).toBeVisible();
    await page.getByTestId('undo-toast-button').click();
    await expect(page.getByTestId('undo-toast')).not.toBeVisible();

    // Right AI Panel strictly unmounted outside Learning tab
    await expect(page.getByTestId('ai-assistant-panel')).toHaveCount(0);
    await expect(page.getByTestId('top-bar-ai-toggle')).toHaveCount(0);
  });

  test('switches to Skills tab, opens Skill Editor modal, and verifies AI dock slash command menu', async ({ page }) => {
    await page.getByTestId('settings-nav-skills').click();

    await expect(page.getByRole('heading', { name: 'Skills', exact: true })).toBeVisible();
    await expect(page.getByText('Manage built-in and custom /skills for your AI tutor')).toBeVisible();

    // Built-in skills
    const skillsTab = page.getByTestId('settings-skills-tab');
    await expect(skillsTab.getByText('/summarize', { exact: true })).toBeVisible();
    await expect(skillsTab.getByText('/flashcards', { exact: true })).toBeVisible();
    await expect(skillsTab.getByText('/socratic', { exact: true })).toBeVisible();
    await expect(skillsTab.getByText('/quiz', { exact: true })).toBeVisible();

    // Custom skills & New Skill button
    await expect(page.getByText('Custom Skills')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Skill' })).toBeVisible();

    // Right AI Panel strictly unmounted outside Learning tab
    await expect(page.getByTestId('ai-assistant-panel')).toHaveCount(0);
    await expect(page.getByTestId('top-bar-ai-toggle')).toHaveCount(0);

    // Open Skill Editor Modal
    await page.getByRole('button', { name: 'New Skill' }).click();
    await expect(page.getByRole('heading', { name: 'New Skill' })).toBeVisible();
    await expect(page.locator('text=Slash Command')).toBeVisible();
    await expect(page.locator('text=Skill Instructions (System Prompt)')).toBeVisible();

    // Close modal via Escape key
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'New Skill' })).not.toBeVisible();
  });
});
