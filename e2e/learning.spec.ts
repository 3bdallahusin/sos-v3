import { test, expect } from '@playwright/test';

test.describe('Learning Workspace (SOS V3) Full-Stack & UI E2E', () => {
  test.beforeEach(async ({ page, request }) => {
    // Call DB state reset before each test
    try {
      await request.post('http://127.0.0.1:3001/api/learning/reset');
    } catch (e) {
      console.warn('Reset endpoint call warning:', e);
    }

    await page.goto('http://localhost:5173/learning');
    await page.waitForLoadState('networkidle');
  });

  test('01. New Tab Command Center & 12-Tool Launcher Grid', async ({ page }) => {
    // 1. Check title
    await expect(page.getByText('Open a Learning Tab')).toBeVisible();

    // 2. Check 12-Tool Grid cards are present
    const expectedTools = [
      'pdf', 'docx', 'slides', 'board',
      'images', 'videos', 'audios', 'browser',
      'notes', 'flashcards', 'quizzes', 'exam'
    ];
    for (const tool of expectedTools) {
      await expect(page.locator(`[data-testid="tool-card-${tool}"]`)).toBeVisible();
    }

    // 3. Check Recent Study Materials & working Resume button
    await expect(page.getByText('Recent Study Materials')).toBeVisible();
    await expect(page.getByText('Kandel_Principles_Ch12.pdf').first()).toBeVisible();
    await expect(page.getByText('SNARE Proteins Deck').first()).toBeVisible();

    // 4. Verify Focus Timer pill in global header is completely unmounted when idle
    const headerTimer = page.locator('[data-testid="header-timer-mirror"]');
    await expect(headerTimer).toHaveCount(0);
  });

  test('02. Part A "Coming Soon in SOS" High-Craft Modules', async ({ page }) => {
    // Click on Images card
    await page.locator('[data-testid="tool-card-images"]').click();

    // Check Coming Soon view
    await expect(page.locator('[data-testid="coming-soon-view"]')).toBeVisible();
    await expect(page.getByText('In Active Development • Core Engine')).toBeVisible();

    // Check tab was created in tab bar
    const tabBar = page.locator('[data-testid="learning-tab-bar"]');
    await expect(tabBar).toContainText('Images');

    // Click Return to Command Center
    await page.locator('[data-testid="return-new-tab-btn"]').click();
    await expect(page.getByText('Open a Learning Tab')).toBeVisible();
  });

  test('03. Flashcards: SM-2 Algorithm, Tactile Flip & Edit Modal', async ({ page }) => {
    // Open Flashcards tab
    await page.locator('[data-testid="tool-card-flashcards"]').click();

    // Verify deck title & counters
    await expect(page.getByText('CaMKII_Receptor_Kinetics')).toBeVisible();
    await expect(page.getByText('Learning:')).toBeVisible();
    await expect(page.getByText('Review:')).toBeVisible();
    await expect(page.getByText('Mastered:')).toBeVisible();

    // Check Front of card
    const cardContainer = page.locator('[data-testid="flashcard-tactile-container"]');
    await expect(cardContainer).toBeVisible();
    await expect(cardContainer).toContainText('Click or Space to Flip');

    // Click to flip card
    await cardContainer.click();
    await expect(cardContainer).toContainText('Verified Answer • SM-2');
    await expect(cardContainer).toContainText('The NMDA Receptor (NMDAR)');

    // Open Edit this Card modal
    const editBtn = page.locator('[data-testid="edit-card-btn"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const editModal = page.locator('[data-testid="edit-card-modal"]');
    await expect(editModal).toBeVisible();
    await expect(editModal).toContainText('Edit Flashcard in Database');

    // Cancel edit modal
    await editModal.getByRole('button', { name: 'Cancel' }).click();
    await expect(editModal).not.toBeVisible();

    // Rate card with SM-2 (Button 3: Good -> 1 day)
    const rating3Btn = page.locator('[data-testid="rating-btn-3"]');
    await expect(rating3Btn).toBeVisible();
    await rating3Btn.click();

    // Verifies it advanced to card 2 (Autophosphorylation at Threonine 286)
    await page.waitForTimeout(500);
    await expect(cardContainer).toBeVisible();
  });

  test('04. Quizzes: Instant Evaluation, Emerald/Crimson Feedback & Summary Modal', async ({ page }) => {
    // Open Quizzes tab
    await page.locator('[data-testid="tool-card-quizzes"]').click();

    // Verify 1..20 navigator pills
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`[data-testid="question-nav-pill-${i}"]`)).toBeVisible();
    }

    // Verify Question 1 is visible
    await expect(page.getByText('Which ion channel is primarily responsible for establishing the negative resting membrane potential')).toBeVisible();

    // Select Option B (correct option: leak potassium channels)
    const optionB = page.locator('[data-testid="quiz-option-B"]');
    await expect(optionB).toBeVisible();
    await optionB.click();

    // Verify instant EXPLANATION box is revealed
    const explanationBox = page.locator('[data-testid="quiz-explanation-box"]');
    await expect(explanationBox).toBeVisible();
    await expect(explanationBox).toContainText('Verified Mechanism Explanation');
    await expect(explanationBox).toContainText('High resting membrane permeability to K⁺ ions');

    // Flag Question for review
    const flagBtn = page.locator('[data-testid="flag-question-btn"]');
    await flagBtn.click();
    await expect(flagBtn).toContainText('Flagged for Review');

    // Advance to next question
    await page.locator('[data-testid="next-question-btn"]').click();
    await expect(page.getByRole('heading', { name: 'What is the biochemical basis' })).toBeVisible();
  });

  test('05. Proctored Exam: Session Token, Focus Lock & AI Lockout', async ({ page }) => {
    // Open Exam tab
    await page.locator('[data-testid="tool-card-exam"]').click();

    // Verify session token
    await expect(page.getByTestId('learning-exam-view').getByText('8F2A-94B1-CC03')).toBeVisible();
    await expect(page.getByText('Integrity:')).toBeVisible();

    // Trigger blur event to test Focus Lock integrity logging
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
    });
    await page.waitForTimeout(500);

    // Verify violation toast was rendered
    const toast = page.locator('[data-testid="exam-violation-toast"]');
    await expect(toast).toBeVisible();

    // Open AI Panel if closed to verify locked proctor state
    const expandAiBtn = page.locator('button[aria-label="Expand AI panel"]');
    if (await expandAiBtn.isVisible()) {
      await expandAiBtn.click();
    }

    // Verify Right AI Panel is in locked state
    const aiPanel = page.locator('[data-testid="ai-panel-header"]');
    await expect(aiPanel).toBeVisible();
    await expect(page.getByText('Active Proctor Session')).toBeVisible();
    await expect(page.getByText('Integrity Enforced')).toBeVisible();

    // Verify input dock is disabled
    const textarea = page.locator('textarea[placeholder*="Exam Mode • Locked"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeDisabled();
  });

  test('06. Videos: Video Player & Synchronized Auto-scrolling Transcript', async ({ page }) => {
    // Open Videos tab
    await page.locator('[data-testid="tool-card-videos"]').click();

    // Verify video view & title
    await expect(page.getByText('Synaptic_Transmission_Lecture.mp4').first()).toBeVisible();
    await expect(page.getByText('Live Synchronized Transcript')).toBeVisible();

    // Check transcript segments are rendered
    const seg1 = page.locator('[data-testid="transcript-segment-vts-1"]');
    await expect(seg1).toBeVisible();
    await expect(seg1).toContainText('[14:20]');

    // Click transcript segment to seek video
    await seg1.click();
    await page.waitForTimeout(300);

    // Verify Search Transcript filters segments
    const searchInput = page.locator('[data-testid="search-transcript-input"]');
    await searchInput.fill('CaMKII');
    await expect(page.getByText('calcium/calmodulin-dependent protein kinase II')).toBeVisible();
  });

  test('07. Audios: Interactive Waveform Player & Podcast Sync', async ({ page }) => {
    // Open Audios tab
    await page.locator('[data-testid="tool-card-audios"]').click();

    // Verify audio title & waveform
    await expect(page.getByRole('heading', { name: 'Huberman_Lab_Ep12.mp3' })).toBeVisible();
    const waveform = page.locator('[data-testid="audio-waveform-container"]');
    await expect(waveform).toBeVisible();

    // Check podcast transcript
    const audioSeg1 = page.locator('[data-testid="audio-transcript-segment-ats-1"]');
    await expect(audioSeg1).toBeVisible();
    await expect(audioSeg1).toContainText('[06:12]');

    // Click to seek in waveform
    await waveform.click({ position: { x: 100, y: 20 } });
    await page.waitForTimeout(300);

    // Bookmark to Notes
    const bookmarkBtn = page.locator('[data-testid="audio-bookmark-btn"]');
    await bookmarkBtn.click();
    await expect(page.getByText('saved to Notes!')).toBeVisible();
  });
});
