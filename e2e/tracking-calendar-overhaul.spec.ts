import { test, expect } from '@playwright/test';

test.describe('Tracking & Calendar Module Architectural Overhaul Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Check 1: Custom Domain Creation via API & Reflection in UI Combobox', async ({ page }) => {
    // 1. Create a custom domain via API
    const testDomainName = `Neuroscience_${Date.now()}`;
    const apiRes = await page.request.post('http://127.0.0.1:3001/api/domains', {
      data: {
        name: testDomainName,
        colorToken: 'accent-100'
      }
    });
    expect(apiRes.ok()).toBeTruthy();
    const data = await apiRes.json();
    const createdDomain = data.domain;
    expect(createdDomain.name).toBe(testDomainName);

    // Add a topic to this custom domain
    const topicRes = await page.request.post(`http://127.0.0.1:3001/api/domains/${createdDomain.id}/topics`, {
      data: {
        name: 'Synaptic Plasticity'
      }
    });
    expect(topicRes.ok()).toBeTruthy();

    // 2. Navigate to Calendar page and open Create Block Modal
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-view"]');

    // Click "+ New Event" in toolbar
    const newBlockBtn = page.locator('[data-testid="calendar-new-event-btn"]');
    await expect(newBlockBtn).toBeVisible();
    await newBlockBtn.click();

    // Wait for the modal and combobox
    const comboboxBtn = page.locator('[data-testid="domain-topic-combobox-btn"]');
    await expect(comboboxBtn).toBeVisible();
    await comboboxBtn.click();

    // Verify custom domain is present in the list
    const domainItem = page.locator(`[data-testid="domain-option-${createdDomain.id}"]`);
    await expect(domainItem).toBeVisible();
    await domainItem.click();

    // Verify combobox selected name reflects custom domain
    await expect(comboboxBtn).toContainText(testDomainName);

    // Close combobox then cancel modal
    await comboboxBtn.click();
    await page.locator('[data-testid="modal-cancel-btn"]').click();
  });

  test('Check 2 & 3: Calendar -> Tracking Sync & 0-Minute Abort Rule', async ({ page }) => {
    // Today's date YYYY-MM-DD
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Create a planned calendar session for today
    const sessionTitle = `E2E Sync Test ${Date.now()}`;
    const createRes = await page.request.post('http://127.0.0.1:3001/api/study-sessions', {
      data: {
        title: sessionTitle,
        domainName: 'Computer Science',
        topicName: 'Distributed Systems',
        date: today,
        plannedStartTime: '10:00',
        plannedEndTime: '11:00',
        source: 'calendar',
        status: 'planned'
      }
    });
    expect(createRes.ok()).toBeTruthy();
    const createdSession = await createRes.json();

    // 2. Navigate to Tracking page
    await page.goto('/tracking');
    await page.waitForSelector('[data-testid="tracking-page"]');

    // 3. Verify session appears in "Today's Sessions" under Upcoming
    const upcomingCard = page.locator(`[data-testid="session-planned-${createdSession.id}"]`);
    await expect(upcomingCard).toBeVisible();
    await expect(upcomingCard).toContainText(sessionTitle);

    // 4. Click Start Focus Session (▶ Start)
    const startBtn = page.locator(`[data-testid="start-upcoming-btn-${createdSession.id}"]`);
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 5. Verify Active Hero Timer is loaded with the matching title
    const titleInput = page.locator('[data-testid="session-title-input"]');
    await expect(titleInput).toHaveValue(sessionTitle);

    // Timer is already running, wait 1.5 seconds
    await page.waitForTimeout(1500);

    // 6. Abort before 1 minute by clicking Stop
    const stopBtn = page.locator('[data-testid="finish-timer-btn"]');
    await stopBtn.click();

    // Wait for abort API call to finish
    await page.waitForTimeout(1000);

    // 7. Verify 0-minute abort rule:
    // Session should revert to 'planned' in database
    const checkRes = await page.request.get(`http://127.0.0.1:3001/api/study-sessions?start=${today}&end=${today}`);
    expect(checkRes.ok()).toBeTruthy();
    const checkData = await checkRes.json();
    const found = checkData.sessions.find((s: any) => s.id === createdSession.id);
    expect(found).toBeDefined();
    expect(found.status).toBe('planned');
    expect(found.actualFocusSeconds).toBe(0);

    // Verify session still appears in Upcoming on Tracking page
    await expect(upcomingCard).toBeVisible();
  });

  test('Check 4: Complete Ad-hoc Session writes times and renders on Calendar', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const adhocTitle = `Adhoc Deep Work ${Date.now()}`;

    // 1. Create and complete an ad-hoc session via study-sessions API
    const activeRes = await page.request.post('http://127.0.0.1:3001/api/study-sessions', {
      data: {
        title: adhocTitle,
        domainName: 'Philosophy',
        date: today,
        plannedStartTime: '15:00',
        plannedEndTime: '16:00',
        source: 'timer_adhoc',
        status: 'in_progress',
        actualFocusSeconds: 1200
      }
    });
    expect(activeRes.ok()).toBeTruthy();
    const activeSession = await activeRes.json();

    // Complete the session
    const completeRes = await page.request.post(`http://127.0.0.1:3001/api/study-sessions/${activeSession.id}/complete`, {
      data: {
        actualFocusSeconds: 1200,
        actualBreakSeconds: 0
      }
    });
    expect(completeRes.ok()).toBeTruthy();
    const completedSession = await completeRes.json();
    expect(completedSession.status).toBe('completed');
    expect(completedSession.plannedStartTime).toBeDefined();
    expect(completedSession.plannedEndTime).toBeDefined();

    // 2. Navigate to Calendar page and verify block appears
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-view"]');

    // Day view should contain the completed block
    const blockEl = page.locator(`[data-testid="calendar-block-${completedSession.id}"]`);
    await expect(blockEl).toBeVisible();
    await expect(blockEl).toContainText(adhocTitle);
  });

  test('Check 5: Overlapping Column Subdivision & Recurrence Rules', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const prefix = `Overlap_${Date.now()}`;

    // 1. Create two overlapping blocks on the same date/time
    const b1Res = await page.request.post('http://127.0.0.1:3001/api/study-sessions', {
      data: {
        title: `${prefix} Alpha`,
        domainName: 'Computer Science',
        date: today,
        plannedStartTime: '11:00',
        plannedEndTime: '12:30',
        source: 'calendar',
        status: 'planned'
      }
    });
    expect(b1Res.ok()).toBeTruthy();
    const b1 = await b1Res.json();

    const b2Res = await page.request.post('http://127.0.0.1:3001/api/study-sessions', {
      data: {
        title: `${prefix} Beta`,
        domainName: 'Economics',
        date: today,
        plannedStartTime: '11:30',
        plannedEndTime: '13:00',
        source: 'calendar',
        status: 'planned'
      }
    });
    expect(b2Res.ok()).toBeTruthy();
    const b2 = await b2Res.json();

    // 2. Open Calendar Day View
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-view"]');

    // Switch to Day view
    const dayBtn = page.locator('[data-testid="calendar-view-day"]');
    await dayBtn.click();

    // Verify both blocks are visible side-by-side with divided widths
    const el1 = page.locator(`[data-testid="calendar-block-${b1.id}"]`);
    const el2 = page.locator(`[data-testid="calendar-block-${b2.id}"]`);
    await expect(el1).toBeVisible();
    await expect(el2).toBeVisible();

    const box1 = await el1.boundingBox();
    const box2 = await el2.boundingBox();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();

    if (box1 && box2) {
      expect(Math.abs(box1.x - box2.x)).toBeGreaterThan(40);
    }

    // 3. Test Recurrence: Create a recurring series for 3 days
    const recRes = await page.request.post('http://127.0.0.1:3001/api/study-sessions', {
      data: {
        title: `${prefix} Recurring Daily`,
        domainName: 'Languages',
        date: today,
        plannedStartTime: '14:00',
        plannedEndTime: '15:00',
        source: 'calendar',
        status: 'planned',
        recurrenceRule: {
          frequency: 'daily',
          endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
        }
      }
    });
    expect(recRes.ok()).toBeTruthy();
    const recData = await recRes.json();
    expect(recData.seriesId).toBeDefined();

    const seriesQuery = await page.request.get(`http://127.0.0.1:3001/api/study-sessions?search=${prefix}`);
    expect(seriesQuery.ok()).toBeTruthy();
    const seriesResults = await seriesQuery.json();
    const instances = seriesResults.sessions.filter((s: any) => s.seriesId === recData.seriesId);
    expect(instances.length).toBeGreaterThanOrEqual(2);
  });

  test('Visual Inspection & Screenshot Capture across all 4 key views', async ({ page }) => {
    // 1. Capture Tracking Page (Dashboard)
    await page.goto('/tracking');
    await page.waitForSelector('[data-testid="tracking-page"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/tracking-overhaul.png', fullPage: true });

    // 2. Capture Session History View
    const historyBtn = page.locator('[data-testid="view-history-btn"]');
    await historyBtn.click();
    await page.waitForSelector('[data-testid="session-history-view"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/session-history-overhaul.png', fullPage: true });

    // 3. Capture Calendar Day View
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-view"]');
    const dayBtn = page.locator('[data-testid="calendar-view-day"]');
    await dayBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/calendar-day-overhaul.png', fullPage: true });

    // 4. Capture Calendar Week View
    const weekBtn = page.locator('[data-testid="calendar-view-week"]');
    await weekBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/calendar-week-overhaul.png', fullPage: true });

    // 5. Clean up any temporary test records to leave clean academic seed data
    await page.request.post('http://127.0.0.1:3001/api/dev/clean-test-sessions');
  });
});
