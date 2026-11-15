import { test, expect } from '@playwright/test';

test.describe('SOS V3 Phase 03: Library & Multi-View Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library');
    await expect(page.locator('[data-testid="library-page"]')).toBeVisible();
  });

  test('renders full Library layout matching Stitch canonical design', async ({ page }) => {
    // 1. Header controls
    await expect(page.locator('[data-testid="library-folder-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-view-options-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-backup-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-new-page-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-new-folder-button"]')).toBeVisible();

    // 2. Cover Banner & Document Header
    await expect(page.locator('[data-testid="folder-emoji-badge"]')).toContainText('🧠');
    await expect(page.locator('[data-testid="folder-title"]')).toContainText('Synaptic Transmission & Plasticity');
    await expect(page.getByText('Folder workspace containing lecture notes')).toBeVisible();
    await expect(page.getByText('Exam Key Point')).toBeVisible();
    await expect(page.getByText('Core Mechanism')).toBeVisible();

    // 3. Primary Resources section
    await expect(page.getByText('[ PRIMARY RESOURCES ]')).toBeVisible();
    await expect(page.locator('[data-testid="library-gallery-grid"]')).toBeVisible();

    // 4. Initial canonical cards
    await expect(page.getByText('Kandel_Principles_Ch12.pdf')).toBeVisible();
    await expect(page.getByText('SNARE_Machinery_Deck')).toBeVisible();
    await expect(page.getByText('Cellular_Plasticity_Synthesis.md')).toBeVisible();
    await expect(page.getByText('Stanford_Neuro_Lecture_04.mp4')).toBeVisible();

    // 5. "+ New page" slot
    await expect(page.locator('[data-testid="gallery-add-new-slot"]')).toBeVisible();
  });

  test('switches dynamically between Gallery, List, and Table presentation views', async ({ page }) => {
    // Open View Options
    const viewOptionsBtn = page.locator('[data-testid="library-view-options-button"]');
    await viewOptionsBtn.click();

    // 1. Switch to List View
    await page.locator('[data-testid="view-mode-list"]').click();
    await expect(page.locator('[data-testid="library-list-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-gallery-grid"]')).toHaveCount(0);
    await expect(page.getByText('Kandel_Principles_Ch12.pdf')).toBeVisible();

    // 2. Switch to Table View
    await viewOptionsBtn.click();
    await page.locator('[data-testid="view-mode-table"]').click();
    await expect(page.locator('[data-testid="library-table-view"]')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Size")')).toBeVisible();
    await expect(page.locator('th:has-text("Duration")')).toBeVisible();
    await expect(page.getByText('Kandel_Principles_Ch12.pdf')).toBeVisible();

    // 3. Switch back to Gallery View
    await viewOptionsBtn.click();
    await page.locator('[data-testid="view-mode-gallery"]').click();
    await expect(page.locator('[data-testid="library-gallery-grid"]')).toBeVisible();
  });

  test('supports creating a new folder and adding pages', async ({ page }) => {
    // 1. Open New Folder modal
    await page.locator('[data-testid="library-new-folder-button"]').click();
    const folderModal = page.locator('[data-testid="folder-modal"]');
    await expect(folderModal).toBeVisible();

    // Fill folder form
    const folderInput = page.locator('[data-testid="folder-name-input"]');
    await folderInput.fill('Molecular Genetics');
    await page.locator('[data-testid="save-folder-submit"]').click();

    // Verify modal closes and active folder switches
    await expect(folderModal).toHaveCount(0);
    await expect(page.locator('[data-testid="folder-title"]')).toContainText('Molecular Genetics');

    // 2. Open New Page modal inside this folder
    await page.locator('[data-testid="library-new-page-button"]').click();
    const pageModal = page.locator('[data-testid="page-editor-modal"]');
    await expect(pageModal).toBeVisible();

    // Fill page form
    await page.locator('[data-testid="page-title-input"]').fill('Polymerase_Chain_Reaction.md');
    await page.locator('[data-testid="page-content-input"]').fill('# PCR Protocol\n\nThermus aquaticus DNA polymerase...');
    await page.locator('[data-testid="save-page-submit"]').click();

    // Verify page is saved and visible in the gallery
    await expect(pageModal).toHaveCount(0);
    await expect(page.getByText('Polymerase_Chain_Reaction.md')).toBeVisible();
  });

  test('filters resources in real-time using search input', async ({ page }) => {
    // Filter by Kandel
    const searchInput = page.locator('[data-testid="library-search-input"]');
    await searchInput.fill('Kandel');

    await expect(page.getByText('Kandel_Principles_Ch12.pdf')).toBeVisible();
    await expect(page.getByText('SNARE_Machinery_Deck')).toHaveCount(0);

    // Clear search
    await searchInput.fill('');
    await expect(page.getByText('Kandel_Principles_Ch12.pdf')).toBeVisible();
    await expect(page.getByText('SNARE_Machinery_Deck')).toBeVisible();
  });

  test('opens the Data Portability (.sos backup) modal', async ({ page }) => {
    await page.locator('[data-testid="library-backup-button"]').click();
    const backupModal = page.locator('[data-testid="backup-modal"]');
    await expect(backupModal).toBeVisible();
    await expect(backupModal).toContainText('Data Portability & Disaster Recovery');
    await expect(backupModal).toContainText('SHA-256');
    await expect(page.locator('[data-testid="export-backup-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="restore-file-input"]')).toBeAttached();

    // Close modal
    await backupModal.locator('button:has-text("Done")').click();
    await expect(backupModal).toHaveCount(0);
  });
});
