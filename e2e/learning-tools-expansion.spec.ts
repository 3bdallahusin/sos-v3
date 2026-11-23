import { test, expect } from '@playwright/test';

test.describe('SOS — Learning Tools Expansion E2E Test Suite', () => {
  test.beforeEach(async ({ page, request }) => {
    // Reset test & learning state before each run
    try {
      await request.post('http://127.0.0.1:3001/api/learning/reset');
    } catch (e) {
      console.warn('Reset endpoint call warning:', e);
    }

    await page.goto('http://localhost:5173/learning');
    await page.waitForLoadState('networkidle');
  });

  // ----------------------------------------------------
  // TEST 01: PDF VIEWER, TEXT LAYER, SEARCH & ANNOTATED EXPORT
  // ----------------------------------------------------
  test('01. PDF Viewer: Multi-page rendering, filmstrip, text layer, in-document search & annotated export', async ({ page, request }) => {
    // 1. Launch PDF Reader from launcher
    await page.locator('[data-testid="tool-card-pdf"]').click();

    // 2. Verify SharedPdfViewer is mounted
    const pdfViewer = page.locator('[data-testid="shared-pdf-viewer"]');
    await expect(pdfViewer).toBeVisible({ timeout: 8000 });

    // 3. Verify Canvas bitmap rendering
    const pdfCanvas = page.locator('[data-testid="pdf-render-canvas"]');
    await expect(pdfCanvas).toBeVisible({ timeout: 8000 });

    // 4. Verify Document title and Page Counter (01 / 05)
    await expect(pdfViewer).toContainText('Kandel_Principles_Ch12.pdf');
    await expect(pdfViewer).toContainText('01 / 05');

    // 5. Verify PDF.js Native TextLayer is mounted directly over canvas
    const textLayer = page.locator('[data-testid="pdf-text-layer"]');
    await expect(textLayer).toBeVisible({ timeout: 8000 });

    // 6. Verify Bottom Filmstrip with 5 page thumbnails
    const filmstrip = page.locator('[data-testid="bottom-filmstrip"]');
    await expect(filmstrip).toBeVisible();
    await expect(page.locator('[data-testid="filmstrip-thumb-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="filmstrip-thumb-5"]')).toBeVisible();

    // 7. Test In-Document Multi-Page Search
    const searchToggle = page.locator('[data-testid="btn-toggle-search"]');
    await expect(searchToggle).toBeVisible();
    await searchToggle.click({ force: true });

    const searchBar = page.locator('[data-testid="in-document-search-bar"]');
    await expect(searchBar).toBeVisible();

    const searchInput = page.locator('[data-testid="input-pdf-search"]');
    await searchInput.fill('synaptic');
    await page.waitForTimeout(1000);

    const searchCounter = page.locator('[data-testid="search-results-counter"]');
    await expect(searchCounter).toBeVisible();
    await expect(searchCounter).toContainText('of');

    // 8. Test Next Page navigation
    await page.locator('[data-testid="btn-next-page"]').click();
    await expect(pdfViewer).toContainText('02 / 05');

    // Jump back to page 1 via filmstrip
    await page.locator('[data-testid="filmstrip-thumb-1"]').click();
    await expect(pdfViewer).toContainText('01 / 05');

    // 9. Verify Deck drawing overlay is mounted
    const drawingCanvas = page.locator('[data-testid="drawing-canvas"]');
    await expect(drawingCanvas).toBeVisible();

    // 10. Verify Export Annotated PDF Button
    const exportAnnotatedBtn = page.locator('[data-testid="btn-export-annotated"]');
    await expect(exportAnnotatedBtn).toBeVisible();
    await expect(exportAnnotatedBtn).toHaveAttribute(
      'href',
      '/api/learning/files/file-kandel-pdf/export-annotated'
    );

    // 11. Verify Original file download link
    const downloadBtn = page.locator('[data-testid="btn-download-original"]');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toHaveAttribute('href', '/api/learning/files/file-kandel-pdf/original');
  });

  // ----------------------------------------------------
  // TEST 02: DOCUMENTS VIEWER (DOCX)
  // ----------------------------------------------------
  test('02. Documents Viewer (DOCX): Status banner, dynamic sections navigation & original download', async ({ page }) => {
    // 1. Launch DOCX from launcher
    await page.locator('[data-testid="tool-card-docx"]').click();

    // 2. Verify LearningDocxView is mounted
    const docxView = page.locator('[data-testid="learning-docx-view"]');
    await expect(docxView).toBeVisible({ timeout: 8000 });

    // 3. Verify DOCX Conversion Status Banner
    const banner = page.locator('[data-testid="docx-status-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Converted from DOCX');

    // 4. Verify Section Sub-tabs dynamically loaded from OpenXML
    await expect(docxView).toContainText('Abstract & Foundational Premises');

    // 5. Verify Download Original DOCX button
    const downloadDocx = page.locator('[data-testid="btn-download-docx"]');
    await expect(downloadDocx).toBeVisible();
    await expect(downloadDocx).toHaveAttribute('href', '/api/learning/files/file-plasticity-docx/original');
  });

  // ----------------------------------------------------
  // TEST 03: SLIDES VIEWER (PPTX)
  // ----------------------------------------------------
  test('03. Slides Viewer: 16:9 presentation canvas, slide meta, dynamic speaker notes drawer', async ({ page }) => {
    // 1. Launch Slides from launcher
    await page.locator('[data-testid="tool-card-slides"]').click();

    // 2. Verify LearningSlidesView is mounted
    const slidesView = page.locator('[data-testid="learning-slides-view"]');
    await expect(slidesView).toBeVisible({ timeout: 8000 });

    // 3. Verify Slide Meta Header
    const metaHeader = page.locator('[data-testid="slides-meta-header"]');
    await expect(metaHeader).toBeVisible();
    await expect(metaHeader).toContainText('SLIDE 01 / 06');
    await expect(metaHeader).toContainText('Neurobiology_Lecture_04.pptx');

    // 4. Toggle Speaker Notes Drawer
    const notesToggle = page.locator('[data-testid="btn-speaker-notes-toggle"]');
    await expect(notesToggle).toBeVisible();
    await notesToggle.click();

    const notesDrawer = page.locator('[data-testid="speaker-notes-drawer"]');
    await expect(notesDrawer).toBeVisible();
    await expect(notesDrawer).toContainText('Emphasize the sub-millisecond kinetics');

    // 5. Advance to Slide 2
    await page.locator('[data-testid="btn-next-page"]').click();
    await expect(metaHeader).toContainText('SLIDE 02 / 06');
    await expect(notesDrawer).toContainText('omega-agatoxin selectively blocks P/Q');

    // 6. Verify 6 Slide Thumbnails in filmstrip
    const filmstrip = page.locator('[data-testid="bottom-filmstrip"]');
    await expect(filmstrip).toBeVisible();
    await expect(page.locator('[data-testid="filmstrip-thumb-6"]')).toBeVisible();
  });

  // ----------------------------------------------------
  // TEST 04: BOARD (INFINITE VISUAL WORKSPACE)
  // ----------------------------------------------------
  test('04. Board: Standalone infinite Deck, title editing, export menu, board creation', async ({ page }) => {
    // 1. Launch Board from launcher
    await page.locator('[data-testid="tool-card-board"]').click();

    // 2. Verify LearningBoardView is mounted
    const boardView = page.locator('[data-testid="learning-board-view"]');
    await expect(boardView).toBeVisible({ timeout: 8000 });

    // 3. Verify Board Title and Autosave status
    await expect(boardView).toContainText('Neuroscience Architecture & Synaptic Transmission');
    await expect(boardView).toContainText('Saved to Cloud');

    // 4. Verify Excalidraw drawing canvas is mounted without document underneath
    const drawingCanvas = page.locator('[data-testid="drawing-canvas"]');
    await expect(drawingCanvas).toBeVisible();

    // 5. Open Export Dropdown Menu & Verify Options
    const exportBtn = page.locator('[data-testid="btn-export-board"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    const exportMenu = page.locator('[data-testid="export-dropdown-menu"]');
    await expect(exportMenu).toBeVisible();
    await expect(page.locator('[data-testid="export-png"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-svg"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-json"]')).toBeVisible();

    // Close export menu
    await exportBtn.click();

    // 6. Test Board Selector & Create New Board
    const boardSelector = page.locator('[data-testid="btn-board-selector"]');
    await boardSelector.click();

    const boardDropdown = page.locator('[data-testid="board-selector-dropdown"]');
    await expect(boardDropdown).toBeVisible();

    // Click "Create New Board"
    await page.locator('[data-testid="btn-create-new-board"]').click();
    await page.waitForTimeout(1000);

    // Verify new board was created
    await expect(boardView).toContainText('Untitled Board');
  });

  // ----------------------------------------------------
  // TEST 05: MULTI-USER DATA ISOLATION & AUTHORIZATION
  // ----------------------------------------------------
  test('05. Multi-User Isolation: Cross-user access control on boards, files & annotations', async ({ request }) => {
    // 1. User Alice creates a private board
    const aliceRes = await request.post('http://127.0.0.1:3001/api/learning/boards', {
      headers: { 'x-user-id': 'scholar_test_alice' },
      data: {
        title: "Alice's Secret Computational Neuroscience Board",
        elementsJson: [{ id: 'elem-1', type: 'rectangle' }]
      }
    });
    expect(aliceRes.status()).toBe(201);
    const aliceBoard = await aliceRes.json();
    const aliceBoardId = aliceBoard.id;

    // 2. User Bob attempts to access Alice's board directly -> MUST be rejected with 404
    const bobAccessRes = await request.get(`http://127.0.0.1:3001/api/learning/boards/${aliceBoardId}`, {
      headers: { 'x-user-id': 'scholar_test_bob' }
    });
    expect(bobAccessRes.status()).toBe(404);

    // 3. User Bob lists his boards -> Alice's board MUST NOT appear in the list
    const bobListRes = await request.get('http://127.0.0.1:3001/api/learning/boards', {
      headers: { 'x-user-id': 'scholar_test_bob' }
    });
    expect(bobListRes.status()).toBe(200);
    const bobBoards = await bobListRes.json();
    const foundAliceBoard = bobBoards.some((b: any) => b.id === aliceBoardId);
    expect(foundAliceBoard).toBe(false);

    // 4. User Bob attempts to fetch files belonging to canonical user -> MUST be isolated
    const bobFilesRes = await request.get('http://127.0.0.1:3001/api/learning/files/file-kandel-pdf', {
      headers: { 'x-user-id': 'scholar_test_bob' }
    });
    expect(bobFilesRes.status()).toBe(404);

    // 5. User Bob attempts to modify annotations on Alice's or canonical files -> MUST be rejected
    const bobAnnotRes = await request.patch('http://127.0.0.1:3001/api/learning/files/file-kandel-pdf/annotations/1', {
      headers: { 'x-user-id': 'scholar_test_bob' },
      data: { elementsJson: [] }
    });
    expect(bobAnnotRes.status()).toBe(404);
  });

  // ----------------------------------------------------
  // TEST 06: GOTENBERG OFFLINE TRUTHFUL STATE & RECOVERY
  // ----------------------------------------------------
  test('06. Gotenberg Offline: Truthful failure status, no fake file copying & original download', async ({ request }) => {
    // 1. Upload a DOCX document when Gotenberg container runtime is unavailable
    const uploadRes = await request.post('http://127.0.0.1:3001/api/learning/files/upload', {
      multipart: {
        file: {
          name: 'synthetic_paper.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: Buffer.from('PK\x03\x04DUMMY_BINARY_DATA')
        }
      }
    });
    expect(uploadRes.status()).toBe(201);
    const uploadedData = await uploadRes.json();

    // 2. Verify status is truthfully 'failed' with error message and NO fake converted PDF
    expect(uploadedData.status).toBe('failed');
    expect(uploadedData.convertedPdfPath).toBeNull();
    expect(uploadedData.pageCount).toBe(0);
    expect(uploadedData.errorMessage).toBeTruthy();

    // 3. Requesting view-pdf for a failed file MUST return HTTP 422 with conversion error
    const viewRes = await request.get(`http://127.0.0.1:3001/api/learning/files/${uploadedData.id}/view-pdf`);
    expect(viewRes.status()).toBe(422);

    // 4. Requesting original download MUST succeed and stream the original file
    const origRes = await request.get(`http://127.0.0.1:3001/api/learning/files/${uploadedData.id}/original`);
    expect(origRes.status()).toBe(200);
    const origBytes = await origRes.body();
    expect(origBytes.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------
  // TEST 07: ANNOTATED PDF EXPORT (SERVER-SIDE FLATTENING)
  // ----------------------------------------------------
  test('07. Export: Server-side annotated PDF flattening streams valid multi-page PDF', async ({ request }) => {
    const exportRes = await request.get('http://127.0.0.1:3001/api/learning/files/file-kandel-pdf/export-annotated');
    expect(exportRes.status()).toBe(200);
    expect(exportRes.headers()['content-type']).toBe('application/pdf');

    const pdfBytes = await exportRes.body();
    expect(pdfBytes.length).toBeGreaterThan(1000);
    // Verify standard PDF header %PDF-
    const header = pdfBytes.subarray(0, 5).toString('utf8');
    expect(header).toBe('%PDF-');
  });
});
