import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/3BDALLA/.gemini/antigravity/brain/3189668b-dde8-41a9-b14d-0085d7d28a66/screenshots';

test.describe('Sidebar Refinements Visual & Centerline Verification', () => {
  test('Capture screenshots and verify exact geometry in Collapsed and Expanded states', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/');

    const leftRail = page.locator('[data-testid="left-rail"]');
    await expect(leftRail).toBeVisible();

    // Ensure it starts in collapsed state
    const railBox = await leftRail.boundingBox();
    expect(railBox).not.toBeNull();
    expect(railBox!.width).toBe(56);

    // 1. Collapsed state screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_collapsed_rail.png'),
      clip: { x: railBox!.x, y: railBox!.y, width: railBox!.width + 20, height: railBox!.height }
    });

    // Verify Centerline in Collapsed state
    // Let's get the centers of all icons and the avatar
    const navItemIds = ['home', 'library', 'learning', 'community', 'tracking', 'calendar', 'settings'];
    const centers: { id: string; centerX: number; centerY: number }[] = [];

    for (const id of navItemIds) {
      const link = page.locator(`[data-testid="nav-item-${id}"]`);
      await expect(link).toBeVisible();
      const svg = link.locator('svg').first();
      const svgBox = await svg.boundingBox();
      expect(svgBox).not.toBeNull();
      centers.push({
        id,
        centerX: svgBox!.x + svgBox!.width / 2,
        centerY: svgBox!.y + svgBox!.height / 2
      });
    }

    const profileLink = page.locator('[data-testid="nav-item-profile"]');
    await expect(profileLink).toBeVisible();
    const avatar = profileLink.locator('img').first();
    const avatarBox = await avatar.boundingBox();
    expect(avatarBox).not.toBeNull();
    const avatarCenterXCollapsed = avatarBox!.x + avatarBox!.width / 2;

    console.log('Collapsed Icon Centers:', centers.map(c => `${c.id}: ${c.centerX}`));
    console.log('Collapsed Avatar Center:', avatarCenterXCollapsed);

    // Every icon centerline in collapsed mode should match the avatar centerline within 1px
    for (const c of centers) {
      expect(Math.abs(c.centerX - avatarCenterXCollapsed)).toBeLessThanOrEqual(1);
    }

    // 2. Expand Sidebar
    const expandButton = page.locator('button[aria-label="Expand navigation rail"]');
    await expandButton.click();
    await page.waitForTimeout(300);

    const expandedRailBox = await leftRail.boundingBox();
    expect(expandedRailBox).not.toBeNull();
    expect(expandedRailBox!.width).toBe(240);

    // Verify "Learner Profile" is completely absent
    await expect(page.locator('text=Learner Profile')).toHaveCount(0);

    // Expanded state screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02_expanded_sidebar_home_active.png'),
      clip: { x: expandedRailBox!.x, y: expandedRailBox!.y, width: expandedRailBox!.width + 20, height: expandedRailBox!.height }
    });

    // Verify Centerline in Expanded state
    const expandedCenters: { id: string; centerX: number }[] = [];
    for (const id of navItemIds) {
      const link = page.locator(`[data-testid="nav-item-${id}"]`);
      const svg = link.locator('svg').first();
      const svgBox = await svg.boundingBox();
      expect(svgBox).not.toBeNull();
      expandedCenters.push({
        id,
        centerX: svgBox!.x + svgBox!.width / 2
      });
    }

    const expandedAvatarBox = await avatar.boundingBox();
    expect(expandedAvatarBox).not.toBeNull();
    const avatarCenterXExpanded = expandedAvatarBox!.x + expandedAvatarBox!.width / 2;

    console.log('Expanded Icon Centers:', expandedCenters.map(c => `${c.id}: ${c.centerX}`));
    console.log('Expanded Avatar Center:', avatarCenterXExpanded);

    // Every icon centerline in expanded mode should match the avatar centerline within 1px
    for (const c of expandedCenters) {
      expect(Math.abs(c.centerX - avatarCenterXExpanded)).toBeLessThanOrEqual(1);
    }

    // Verify vertical centering of Abdalla name next to avatar
    const nameLabel = profileLink.locator('span:has-text("Abdalla")');
    await expect(nameLabel).toBeVisible();
    const nameBox = await nameLabel.boundingBox();
    expect(nameBox).not.toBeNull();
    const nameCenterY = nameBox!.y + nameBox!.height / 2;
    const avatarCenterY = expandedAvatarBox!.y + expandedAvatarBox!.height / 2;
    console.log('Name Center Y:', nameCenterY, 'Avatar Center Y:', avatarCenterY);
    // Should be vertically centered alongside each other within 2px
    expect(Math.abs(nameCenterY - avatarCenterY)).toBeLessThanOrEqual(2);

    // 3. Hover over an inactive item (Tracking)
    const trackingLink = page.locator('[data-testid="nav-item-tracking"]');
    await trackingLink.hover();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_expanded_sidebar_hover_tracking.png'),
      clip: { x: expandedRailBox!.x, y: expandedRailBox!.y, width: expandedRailBox!.width + 20, height: expandedRailBox!.height }
    });

    // 4. Navigate to Tracking (active state on Tracking)
    await trackingLink.click();
    await page.waitForTimeout(300);
    await expect(trackingLink).toHaveAttribute('data-active', 'true');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_expanded_sidebar_tracking_active.png'),
      clip: { x: expandedRailBox!.x, y: expandedRailBox!.y, width: expandedRailBox!.width + 20, height: expandedRailBox!.height }
    });

    // 5. Navigate to Profile (active state on Profile)
    await profileLink.click();
    await page.waitForTimeout(300);
    await expect(profileLink).toHaveAttribute('data-active', 'true');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05_expanded_sidebar_profile_active.png'),
      clip: { x: expandedRailBox!.x, y: expandedRailBox!.y, width: expandedRailBox!.width + 20, height: expandedRailBox!.height }
    });

    // 6. Collapse back and take collapsed screenshot with Profile active
    const collapseButton = page.locator('button[aria-label="Collapse navigation rail"]');
    await collapseButton.click();
    await page.waitForTimeout(300);
    const reCollapsedBox = await leftRail.boundingBox();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06_collapsed_sidebar_profile_active.png'),
      clip: { x: reCollapsedBox!.x, y: reCollapsedBox!.y, width: reCollapsedBox!.width + 20, height: reCollapsedBox!.height }
    });
  });
});
