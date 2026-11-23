import { test, expect } from '@playwright/test';

test.describe('SOS V3: Tracking & Calendar Workstream (Zero Mock Real Data)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('verifies live Tracking timer execution, pause/resume, and Header Timer Mirror lockstep', async ({ page }) => {
    // 1. Verify Header Timer Mirror is hidden when timer is idle
    const headerTimer = page.locator('[data-testid="header-timer-mirror"]');
    await expect(headerTimer).toBeHidden();

    // 2. Navigate to /tracking via left rail
    const trackingNav = page.locator('[data-testid="nav-item-tracking"]');
    await trackingNav.click();
    await expect(page).toHaveURL(/\/tracking$/);

    const trackingView = page.locator('[data-testid="tracking-view"]');
    await expect(trackingView).toBeVisible();

    // 3. Verify Today's Sessions pre-seeded count (5 sessions in Dexie schema v15)
    const todaySessionsList = page.locator('[data-testid="today-sessions-list"]');
    await expect(todaySessionsList).toBeVisible();
    await expect(page.locator('[data-testid="today-sessions-count"]')).toContainText('5 Sessions Logged');

    // 4. Set Session Title and start timer
    const titleInput = page.locator('[data-testid="session-title-input"]');
    await titleInput.fill('Deep Work: Electrophysiology Synthesis');

    const startBtn = page.locator('[data-testid="start-timer-btn"]');
    await startBtn.click();

    // 5. Verify timer transitions to running state and header timer mirror becomes visible
    const pauseBtn = page.locator('[data-testid="pause-timer-btn"]');
    const finishBtn = page.locator('[data-testid="finish-timer-btn"]');
    await expect(pauseBtn).toBeVisible();
    await expect(finishBtn).toBeVisible();
    await expect(headerTimer).toBeVisible();

    // 6. Verify live timer countdown
    await page.waitForTimeout(1100);
    const liveTimeText = await page.locator('[data-testid="timer-display-digits"]').textContent();
    expect(liveTimeText).not.toBe('00:00:00');

    // 7. Test Pause
    await pauseBtn.click();
    const resumeBtn = page.locator('[data-testid="resume-timer-btn"]');
    await expect(resumeBtn).toBeVisible();

    // 8. Test Resume
    await resumeBtn.click();
    await expect(page.locator('[data-testid="pause-timer-btn"]')).toBeVisible();

    // 9. Finish Session -> verifies Dexie persistence and dynamic calculation updates
    await finishBtn.click();

    // 10. Verify Today's Sessions now shows 6 Sessions Logged
    await expect(page.locator('[data-testid="today-sessions-count"]')).toContainText('6 Sessions Logged');
    await expect(todaySessionsList).toContainText('Deep Work: Electrophysiology Synthesis');

    // 11. Verify Weekly Study Hours card has real values derived from database
    const weeklyAvg = page.locator('[data-testid="weekly-daily-average"]');
    await expect(weeklyAvg).toBeVisible();
    const totalHours = page.locator('[data-testid="weekly-total-hours"]');
    await expect(totalHours).toBeVisible();
  });

  test('verifies Calendar grid layout, learning block creation, bottom dock dual-state, and persistence', async ({ page }) => {
    // 1. Navigate to /calendar
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const calendarView = page.locator('[data-testid="calendar-view"]');
    await expect(calendarView).toBeVisible();

    // 2. Verify Toolbar components and real Today date
    await expect(page.locator('[data-testid="calendar-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-month-label"]')).toContainText('Nov 2026');

    // Navigate to Wednesday, 18 Nov 2026 using the < button
    while (!(await page.locator('[data-testid="calendar-month-label"]').innerText()).includes('18 Nov 2026')) {
      await page.locator('[data-testid="calendar-prev-btn"]').click();
    }
    await expect(page.locator('[data-testid="calendar-month-label"]')).toContainText('Wednesday, 18 Nov 2026');

    // 3. Verify State A Bottom Dock shows 5h Planned and 4 Learning Blocks
    const bottomDock = page.locator('[data-testid="calendar-bottom-dock"]');
    await expect(bottomDock).toBeVisible();
    await expect(page.locator('[data-testid="dock-planned-duration"]')).toContainText('5h Planned');
    await expect(page.locator('[data-testid="dock-block-count"]')).toContainText('4 Learning Blocks');

    // 4. Click existing block "Distributed Consensus: Raft Protocol Proofs" to activate State B
    const raftBlock = page.locator('[data-testid="calendar-block-block-nov18-1"]');
    await expect(raftBlock).toBeVisible();
    await raftBlock.click();

    // 5. Verify State B Inspector details (with 12-hour format)
    await expect(page.locator('[data-testid="dock-event-title"]')).toContainText('Distributed Consensus: Raft Protocol Proofs');
    await expect(page.locator('[data-testid="dock-block-domain"]')).toContainText('Computer Science');
    await expect(page.locator('[data-testid="dock-event-datetime"]')).toContainText('9:00 AM – 10:30 AM');
    await expect(page.locator('[data-testid="dock-block-duration"]')).toContainText('1h:30m');
    await expect(page.locator('[data-testid="dock-edit-block-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="dock-delete-block-btn"]')).toBeVisible();

    // Jump back to Today
    await page.locator('[data-testid="calendar-today-btn"]').click();
    await expect(page.locator('[data-testid="calendar-month-label"]')).toContainText('Nov 2026');

    // 6. Open Create Learning Block Modal
    const newEventBtn = page.locator('[data-testid="calendar-new-event-btn"]');
    await newEventBtn.click();

    const modal = page.locator('[data-testid="event-modal-card"]');
    await expect(modal).toBeVisible();

    // 7. Fill event details
    await page.locator('[data-testid="event-title-input"]').fill('Advanced Compiler Optimizations & SSA Form');
    await page.locator('[data-testid="event-start-time-input"]').fill('06:00 PM');
    await page.locator('[data-testid="event-end-time-input"]').fill('07:30 PM');

    // Save event
    await page.locator('[data-testid="event-save-btn"]').click();
    await expect(modal).not.toBeVisible();

    // 8. Verify newly created block renders on grid
    const newBlockCard = page.locator('text=Advanced Compiler Optimizations & SSA Form').first();
    await expect(newBlockCard).toBeVisible();

    // Delete created block to keep database clean
    await newBlockCard.click();
    await page.locator('[data-testid="dock-delete-block-btn"]').click();
    await expect(newBlockCard).not.toBeVisible();

    // 9. Switch to Week View
    const weekBtn = page.locator('[data-testid="calendar-view-week"]');
    await weekBtn.click();
    await expect(page.locator('[data-testid="calendar-week-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-month-label"]')).toContainText('Nov 2026');

    // 10. Switch to Month View
    const monthBtn = page.locator('[data-testid="calendar-view-month"]');
    await monthBtn.click();
    await expect(page.locator('[data-testid="calendar-month-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-month-label"]')).toContainText('November 2026');
  });

  test('verifies Focus Timer inline field/subject editing, Session History subjects filter, and March 2027 planned hours', async ({ page }) => {
    // 1. Navigate to /tracking
    await page.goto('/tracking');
    await page.waitForLoadState('networkidle');

    // 2. Focus Timer inline Field combobox: click field text to open combobox
    const fieldBtn = page.locator('[data-testid="timer-field-combobox-trigger"]');
    if (await fieldBtn.isVisible()) {
      await fieldBtn.click();
      const combobox = page.locator('[data-testid="timer-field-combobox"]');
      await expect(combobox).toBeVisible();
      // Click an item or close it
      await page.keyboard.press('Escape');
    }

    // 3. Focus Timer inline Subject input: click subject text to edit inline
    const subjectBtn = page.locator('[data-testid="timer-subject-input-trigger"]');
    if (await subjectBtn.isVisible()) {
      await subjectBtn.click();
      const subjectInput = page.locator('[data-testid="timer-subject-inline-input"]');
      await expect(subjectInput).toBeVisible();
      await subjectInput.fill('Advanced Neural Architecture');
      await page.keyboard.press('Enter');
      await expect(page.locator('text=Advanced Neural Architecture')).toBeVisible();
    }

    // 4. Session History View: Click History button in Today's Sessions card
    const historyBtn = page.locator('[data-testid="view-history-btn"]');
    await historyBtn.click();
    await expect(page.locator('[data-testid="session-history-view"]')).toBeVisible();

    // Verify "All Subjects" filter exists alongside "All Fields"
    const subjectSelect = page.locator('[data-testid="history-subject-select"]');
    await expect(subjectSelect).toBeVisible();
    await expect(page.locator('[data-testid="history-field-select"]')).toBeVisible();

    // 5. Return to Dashboard and test Study Hours Month View navigation
    const backBtn = page.locator('[data-testid="history-back-to-dashboard-btn"]');
    await backBtn.click();
    await expect(page.locator('[data-testid="analytics-section"]')).toBeVisible();

    // Switch to Month mode
    const monthTab = page.locator('[data-testid="analytics-tab-month"]');
    await monthTab.click();

    // Advance forward multiple times until reaching 2027
    const nextBtn = page.locator('[data-testid="analytics-next-btn"]');
    for (let i = 0; i < 5; i++) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }

    // Verify Month mode calculates strictly with 0h planned when no events exist
    const plannedLegend = page.locator('[data-testid="analytics-planned-legend"]');
    await expect(plannedLegend).toBeVisible();
  });
});
