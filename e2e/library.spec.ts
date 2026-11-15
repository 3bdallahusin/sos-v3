import { test, expect } from '@playwright/test';

test.describe('SOS V3 Phase 03: Library (Tiptap Center Panel Editor)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library');
    await expect(page.locator('[data-testid="library-page"]')).toBeVisible();
  });

  test('renders Tiptap editor directly inside the SOS Center Panel', async ({ page }) => {
    // 1. Library Sidebar
    await expect(page.locator('[data-testid="library-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-document-btn"]')).toBeVisible();

    // 2. Center Panel Editor View
    await expect(page.locator('[data-testid="library-editor-view"]')).toBeVisible();
    const titleInput = page.locator('[data-testid="active-document-title"]');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue('Synaptic Plasticity & Memory Synthesis');

    // 3. Save status indicator
    const saveStatus = page.locator('[data-testid="save-status-indicator"]');
    await expect(saveStatus).toBeVisible();
    await expect(saveStatus).toContainText('Saved');

    // 4. Editor Toolbar
    const toolbar = page.locator('[data-testid="editor-toolbar"]');
    await expect(toolbar).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-bold"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-italic"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-h1"]')).toBeVisible();

    // 5. Native Tiptap Content Editable
    const contentEditable = page.locator('[data-testid="tiptap-content-editable"]');
    await expect(contentEditable).toBeVisible();
    await expect(contentEditable).toContainText('Synaptic Plasticity & Memory Synthesis');
    await expect(contentEditable).toContainText('Induction Mechanisms (NMDA-Dependent LTP)');
  });

  test('supports interactive typing and formatting inside Tiptap', async ({ page }) => {
    const contentEditable = page.locator('[data-testid="tiptap-content-editable"]');
    await expect(contentEditable).toBeVisible();

    // Focus editor and append text
    await contentEditable.click();
    await page.keyboard.press('End');
    await page.keyboard.type('\nCo-agonist glycine binding is also obligate.');

    await expect(contentEditable).toContainText('Co-agonist glycine binding is also obligate.');

    // Save status indicator shows Saved after debounce
    const saveStatus = page.locator('[data-testid="save-status-indicator"]');
    await expect(saveStatus).toContainText('Saved');
  });

  test('toggles library sidebar for full-width distraction-free editing', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-library-sidebar"]');
    await expect(toggleBtn).toBeVisible();

    // Collapse sidebar
    await toggleBtn.click();
    await expect(page.locator('[data-testid="library-sidebar"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="library-editor-view"]')).toBeVisible();

    // Re-expand sidebar
    await toggleBtn.click();
    await expect(page.locator('[data-testid="library-sidebar"]')).toBeVisible();
  });

  test('creates a new document, edits title, and persists across navigation', async ({ page }) => {
    // 1. Create new document
    await page.locator('[data-testid="create-document-btn"]').click();

    // 2. Edit document title
    const titleInput = page.locator('[data-testid="active-document-title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Action Potential Ionic Mechanisms');
    await page.waitForTimeout(400); // allow debounce save

    // 3. Type inside editor
    const contentEditable = page.locator('[data-testid="tiptap-content-editable"]');
    await contentEditable.click();
    await page.keyboard.type('Voltage-gated sodium channels open rapidly upon threshold depolarization.');
    await page.waitForTimeout(500); // allow debounce save

    // 4. Navigate away to Home and return to Library
    await page.goto('/');
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();

    await page.goto('/library');
    await expect(page.locator('[data-testid="library-page"]')).toBeVisible();

    // 5. Verify the created document is still active and preserved
    await expect(page.locator('[data-testid="active-document-title"]')).toHaveValue('Action Potential Ionic Mechanisms');
    await expect(page.locator('[data-testid="tiptap-content-editable"]')).toContainText(
      'Voltage-gated sodium channels open rapidly upon threshold depolarization.'
    );
  });

  test('deletes a document and switches cleanly', async ({ page }) => {
    // Create temporary document
    await page.locator('[data-testid="create-document-btn"]').click();
    const titleInput = page.locator('[data-testid="active-document-title"]');
    await titleInput.fill('Temporary Scratch Notes');
    await page.waitForTimeout(400);

    // Delete document
    const deleteBtn = page.locator('[data-testid="delete-active-doc"]');
    await deleteBtn.click();

    // Verify it was removed
    await expect(page.getByText('Temporary Scratch Notes')).toHaveCount(0);
  });
});
