import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import AdmZip from 'adm-zip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Sanitize text to fit safely in PDF standard font encoding (WinAnsi).
 * Replaces non-printable or unsupported codepoints with clean spaces.
 */
function sanitizeForPdfStandardFont(text: string): string {
  if (!text) return '';
  return text
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Basic word-wrapping helper for pdf-lib text drawing.
 */
function wrapLines(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    try {
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    } catch {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Dynamically extract headings from an OpenXML Word document (.docx)
 * Reads `word/document.xml` from the ZIP package and identifies Heading elements.
 */
export function extractDocxHeadings(fileBuffer: Buffer): string[] {
  try {
    const zip = new AdmZip(fileBuffer);
    const docEntry = zip.getEntry('word/document.xml');
    if (!docEntry) return [];

    const xml = docEntry.getData().toString('utf8');
    const headings: string[] = [];
    const pRegex = /<w:p[\s>].*?<\/w:p>/gs;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = pRegex.exec(xml)) !== null) {
      const pXml = pMatch[0];
      const isHeading =
        /<w:pStyle\s+w:val="Heading\d+"/i.test(pXml) ||
        /<w:pStyle\s+w:val="Title"/i.test(pXml) ||
        /<w:pStyle\s+w:val="Subtitle"/i.test(pXml);

      if (isHeading) {
        const tMatches = pXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (tMatches) {
          const text = tMatches
            .map((t) => t.replace(/<[^>]+>/g, ''))
            .join('')
            .trim();
          if (text && !headings.includes(text)) {
            headings.push(text);
          }
        }
      }
    }

    return headings;
  } catch (err) {
    console.warn('[extractDocxHeadings] Document parsing failed:', err);
    return [];
  }
}

/**
 * Dynamically extract slide speaker notes from an OpenXML PowerPoint presentation (.pptx)
 * Reads `ppt/notesSlides/notesSlide*.xml` from the ZIP package.
 */
export function extractPptxSpeakerNotes(fileBuffer: Buffer): Record<number, string> {
  try {
    const zip = new AdmZip(fileBuffer);
    const entries = zip.getEntries();
    const notesMap: Record<number, string> = {};

    for (const entry of entries) {
      const match = entry.entryName.match(/ppt\/notesSlides\/notesSlide(\d+)\.xml$/i);
      if (match) {
        const slideIndex = parseInt(match[1], 10);
        const xml = entry.getData().toString('utf8');
        const tMatches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
        if (tMatches) {
          const text = tMatches
            .map((t) => t.replace(/<[^>]+>/g, ''))
            .filter((t) => !/^\d+$/.test(t.trim()))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (text) {
            notesMap[slideIndex] = text;
          }
        }
      }
    }

    return notesMap;
  } catch (err) {
    console.warn('[extractPptxSpeakerNotes] Slide parsing failed:', err);
    return {};
  }
}

/**
 * Convert DOCX or PPTX document via Gotenberg LibreOffice conversion service.
 * Makes a real multipart/form-data HTTP POST request to Gotenberg.
 * Throws if Gotenberg is offline, unreachable, or returns an error.
 */
export async function convertWithGotenberg(
  fileBuffer: Buffer,
  filename: string,
  gotenbergUrl: string = process.env.GOTENBERG_URL || 'http://127.0.0.1:3002',
  timeoutMs: number = 30000
): Promise<{ pdfBuffer: Buffer; pageCount: number; converter: string }> {
  const formData = new FormData();
  formData.append('files', new Blob([new Uint8Array(fileBuffer)]), filename);

  const endpoint = `${gotenbergUrl}/forms/libreoffice/convert`;
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gotenberg conversion failed with HTTP ${response.status} (${response.statusText}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();

  return {
    pdfBuffer,
    pageCount,
    converter: 'Gotenberg v8 (Headless LibreOffice Engine)'
  };
}

/**
 * Tier 2: Convert using locally installed LibreOffice CLI (soffice) if available on the host.
 */
export async function convertWithLocalLibreOffice(
  fileBuffer: Buffer,
  filename: string
): Promise<{ pdfBuffer: Buffer; pageCount: number; converter: string }> {
  const possiblePaths = [
    'soffice',
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/usr/bin/soffice',
    '/usr/local/bin/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice'
  ];

  let binaryPath: string | null = null;
  for (const p of possiblePaths) {
    if (p === 'soffice') continue;
    if (fs.existsSync(p)) {
      binaryPath = p;
      break;
    }
  }

  const candidate = binaryPath || 'soffice';
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sos-conv-'));
  const safeBase = filename.replace(/[^\w.-]/g, '_') || 'document';
  const tempInput = path.join(tempDir, safeBase);
  fs.writeFileSync(tempInput, fileBuffer);

  return new Promise((resolve, reject) => {
    execFile(
      candidate,
      ['--headless', '--convert-to', 'pdf', tempInput, '--outdir', tempDir],
      { timeout: 15000 },
      async (error) => {
        try {
          if (error) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            return reject(error);
          }
          const expectedPdf = path.join(tempDir, `${path.parse(safeBase).name}.pdf`);
          if (!fs.existsSync(expectedPdf)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            return reject(new Error('LibreOffice CLI exited without producing output PDF'));
          }
          const pdfBuffer = fs.readFileSync(expectedPdf);
          fs.rmSync(tempDir, { recursive: true, force: true });
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          resolve({
            pdfBuffer,
            pageCount: pdfDoc.getPageCount(),
            converter: 'Local LibreOffice CLI (Headless)'
          });
        } catch (e) {
          fs.rmSync(tempDir, { recursive: true, force: true });
          reject(e);
        }
      }
    );
  });
}

/**
 * Tier 3: Built-in pure-Node fallback converter using AdmZip and pdf-lib.
 * Guarantees that PPTX slides and DOCX documents always produce a clean, readable PDF
 * even without Docker, Gotenberg, or LibreOffice installed.
 */
export async function convertWithPureNodeParser(
  fileBuffer: Buffer,
  filename: string,
  fileType: 'docx' | 'slides'
): Promise<{ pdfBuffer: Buffer; pageCount: number; converter: string }> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  if (fileType === 'slides') {
    // PPTX Pure Node conversion (16:9 widescreen: 960x540)
    let slideEntries: any[] = [];
    let speakerNotes: Record<number, string> = {};
    try {
      const zip = new AdmZip(fileBuffer);
      slideEntries = zip.getEntries().filter((e) => /ppt\/slides\/slide\d+\.xml$/i.test(e.entryName));
      slideEntries.sort((a, b) => {
        const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
        const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
        return numA - numB;
      });
      speakerNotes = extractPptxSpeakerNotes(fileBuffer);
    } catch (e) {
      console.warn('[PureNode PPTX] AdmZip read error:', e);
    }

    if (slideEntries.length === 0) {
      const page = pdfDoc.addPage([960, 540]);
      page.drawRectangle({ x: 0, y: 0, width: 960, height: 540, color: rgb(0.043, 0.043, 0.055) });
      page.drawText(sanitizeForPdfStandardFont(filename) || 'Presentation', {
        x: 60,
        y: 340,
        size: 26,
        font: fontBold,
        color: rgb(0.96, 0.96, 0.97)
      });
      page.drawText('Presentation Slides (Converted via SOS Pure-Node Engine)', {
        x: 60,
        y: 300,
        size: 14,
        font: fontRegular,
        color: rgb(0.6, 0.6, 0.65)
      });
    } else {
      for (let i = 0; i < slideEntries.length; i++) {
        const entry = slideEntries[i];
        const slideNum = i + 1;
        const xml = entry.getData().toString('utf8');
        const textRuns: string[] = [];
        const tMatches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
        for (const t of tMatches) {
          const raw = t.replace(/<[^>]+>/g, '').trim();
          if (raw) textRuns.push(sanitizeForPdfStandardFont(raw));
        }

        const page = pdfDoc.addPage([960, 540]);
        // Dark background #0B0B0E
        page.drawRectangle({ x: 0, y: 0, width: 960, height: 540, color: rgb(0.043, 0.043, 0.055) });
        // Header accent line
        page.drawRectangle({ x: 60, y: 490, width: 840, height: 2, color: rgb(0.23, 0.51, 0.96) });

        // Slide title
        const slideTitle = textRuns[0] || `Slide ${slideNum}`;
        page.drawText(slideTitle.slice(0, 70), {
          x: 60,
          y: 450,
          size: 22,
          font: fontBold,
          color: rgb(0.96, 0.96, 0.98)
        });

        // Slide body bullet items
        let y = 390;
        const bodyItems = textRuns.slice(1);
        for (const item of bodyItems) {
          if (y < 80) break;
          const wrapped = wrapLines(item, 820, fontRegular, 13);
          for (let j = 0; j < wrapped.length; j++) {
            if (y < 80) break;
            const prefix = j === 0 ? '• ' : '   ';
            page.drawText(`${prefix}${wrapped[j]}`, {
              x: 60,
              y,
              size: 13,
              font: fontRegular,
              color: rgb(0.82, 0.82, 0.86)
            });
            y -= 20;
          }
          y -= 8;
        }

        // Speaker note indication if present
        if (speakerNotes[slideNum]) {
          page.drawText(`Speaker Note: ${sanitizeForPdfStandardFont(speakerNotes[slideNum]).slice(0, 90)}...`, {
            x: 60,
            y: 35,
            size: 9.5,
            font: fontRegular,
            color: rgb(0.55, 0.55, 0.6)
          });
        }

        // Footer
        page.drawText(`Slide ${slideNum} of ${slideEntries.length} • SOS Slide Engine`, {
          x: 680,
          y: 35,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.45, 0.45, 0.5)
        });
      }
    }

    const pdfBuffer = Buffer.from(await pdfDoc.save());
    return {
      pdfBuffer,
      pageCount: pdfDoc.getPageCount(),
      converter: 'Built-in Pure-Node Slide Parser (Offline Engine)'
    };
  } else {
    // DOCX Pure Node conversion (A4: 595.28x841.89)
    let paragraphs: Array<{ type: 'title' | 'heading' | 'body'; text: string }> = [];
    try {
      const zip = new AdmZip(fileBuffer);
      const docEntry = zip.getEntry('word/document.xml');
      if (docEntry) {
        const xml = docEntry.getData().toString('utf8');
        const pRegex = /<w:p[\s>].*?<\/w:p>/gs;
        let pMatch: RegExpExecArray | null;
        while ((pMatch = pRegex.exec(xml)) !== null) {
          const pXml = pMatch[0];
          const isTitle = /<w:pStyle\s+w:val="Title"/i.test(pXml);
          const isHeading = /<w:pStyle\s+w:val="Heading\d+"/i.test(pXml) || /<w:pStyle\s+w:val="Subtitle"/i.test(pXml);
          const tMatches = pXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
          const text = tMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('').trim();
          if (text) {
            paragraphs.push({
              type: isTitle ? 'title' : isHeading ? 'heading' : 'body',
              text: sanitizeForPdfStandardFont(text)
            });
          }
        }
      }
    } catch (e) {
      console.warn('[PureNode DOCX] AdmZip read error:', e);
    }

    if (paragraphs.length === 0) {
      paragraphs = [
        { type: 'title', text: sanitizeForPdfStandardFont(filename) || 'Document' },
        { type: 'body', text: 'Document contents converted via SOS offline parser.' }
      ];
    }

    let page = pdfDoc.addPage([595.28, 841.89]);
    let currentY = 780;

    const drawPageBackground = (p: any) => {
      p.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: rgb(0.045, 0.045, 0.055) });
      p.drawRectangle({ x: 50, y: 810, width: 495.28, height: 2, color: rgb(0.23, 0.51, 0.96) });
    };

    drawPageBackground(page);

    for (const p of paragraphs) {
      if (p.type === 'title') {
        const wrapped = wrapLines(p.text, 490, fontBold, 18);
        for (const line of wrapped) {
          if (currentY < 70) {
            page = pdfDoc.addPage([595.28, 841.89]);
            drawPageBackground(page);
            currentY = 780;
          }
          page.drawText(line, { x: 50, y: currentY, size: 18, font: fontBold, color: rgb(0.96, 0.96, 0.98) });
          currentY -= 26;
        }
        currentY -= 10;
      } else if (p.type === 'heading') {
        if (currentY < 100) {
          page = pdfDoc.addPage([595.28, 841.89]);
          drawPageBackground(page);
          currentY = 780;
        }
        const wrapped = wrapLines(p.text, 490, fontBold, 13);
        for (const line of wrapped) {
          page.drawText(line, { x: 50, y: currentY, size: 13, font: fontBold, color: rgb(0.38, 0.65, 0.98) });
          currentY -= 18;
        }
        currentY -= 6;
      } else {
        const wrapped = wrapLines(p.text, 490, fontRegular, 10.5);
        for (const line of wrapped) {
          if (currentY < 70) {
            page = pdfDoc.addPage([595.28, 841.89]);
            drawPageBackground(page);
            currentY = 780;
          }
          page.drawText(line, { x: 50, y: currentY, size: 10.5, font: fontRegular, color: rgb(0.82, 0.82, 0.86) });
          currentY -= 15;
        }
        currentY -= 8;
      }
    }

    const total = pdfDoc.getPageCount();
    for (let i = 0; i < total; i++) {
      const p = pdfDoc.getPage(i);
      p.drawText(`Page ${i + 1} of ${total} • SOS Document Engine`, {
        x: 380,
        y: 35,
        size: 9,
        font: fontRegular,
        color: rgb(0.45, 0.45, 0.5)
      });
    }

    const pdfBuffer = Buffer.from(await pdfDoc.save());
    return {
      pdfBuffer,
      pageCount: total,
      converter: 'Built-in Pure-Node Document Parser (Offline Engine)'
    };
  }
}

/**
 * Helper to decode XML entities
 */
function decodeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * Helper to escape HTML special characters
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Tier 3: High-Fidelity Headless Chromium Slide & Document Renderer
 * Parses OpenXML PPTX/DOCX with full Arabic text, tables, images, and styles,
 * rendering to PDF using Playwright's headless Chromium.
 */
export async function convertWithChromiumParser(
  fileBuffer: Buffer,
  filename: string,
  fileType: 'docx' | 'slides'
): Promise<{ pdfBuffer: Buffer; pageCount: number; converter: string }> {
  const { chromium } = await import('@playwright/test');
  const zip = new AdmZip(fileBuffer);

  if (fileType === 'slides') {
    const slideEntries = zip.getEntries().filter((e) => /ppt\/slides\/slide\d+\.xml$/i.test(e.entryName));
    slideEntries.sort((a, b) => {
      const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

    const mediaMap = new Map<string, string>();
    for (const entry of zip.getEntries()) {
      if (entry.entryName.startsWith('ppt/media/')) {
        const ext = path.extname(entry.entryName).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
        const base64 = entry.getData().toString('base64');
        mediaMap.set(entry.entryName, `data:${mime};base64,${base64}`);
      }
    }

    const speakerNotes = extractPptxSpeakerNotes(fileBuffer);
    let slidesHtml = '';

    for (let i = 0; i < slideEntries.length; i++) {
      const entry = slideEntries[i];
      const slideNum = i + 1;
      const xml = entry.getData().toString('utf8');

      // Parse relationships
      const relsEntry = zip.getEntry(`ppt/slides/_rels/slide${slideNum}.xml.rels`);
      const relsMap = new Map<string, string>();
      if (relsEntry) {
        const relsXml = relsEntry.getData().toString('utf8');
        const relMatches = relsXml.matchAll(/<Relationship\s+Id="([^"]+)"\s+Target="([^"]+)"/g);
        for (const m of relMatches) {
          const id = m[1];
          let target = m[2];
          if (target.startsWith('../')) target = 'ppt/' + target.slice(3);
          relsMap.set(id, target);
        }
      }

      // Slide background color
      let bgColor = '#0B0B0E';
      const bgClrMatch = xml.match(/<p:bg>.*?<a:srgbClr\s+val="([0-9a-fA-F]{6})"/s);
      if (bgClrMatch) {
        bgColor = `#${bgClrMatch[1]}`;
      }

      // Parse tables (<a:tbl>)
      let tableHtml = '';
      const tblMatch = xml.match(/<a:tbl>.*?<\/a:tbl>/s);
      if (tblMatch) {
        const trMatches = tblMatch[0].match(/<a:tr\b.*?>.*?<\/a:tr>/gs) || [];
        const rowsHtml = trMatches.map((trXml, rIdx) => {
          const tcMatches = trXml.match(/<a:tc\b.*?>.*?<\/a:tc>/gs) || [];
          const cellsHtml = tcMatches.map((tcXml) => {
            const tMatches = tcXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
            const text = tMatches.map((t) => decodeXml(t.replace(/<[^>]+>/g, ''))).join(' ').trim();
            const isHeader = rIdx === 0;
            const Tag = isHeader ? 'th' : 'td';
            const bg = isHeader ? 'background:rgba(255,255,255,0.08);color:#60A5FA;font-weight:600;' : 'background:rgba(255,255,255,0.02);color:#E4E4E7;';
            return `<${Tag} style="padding:10px 14px;border:1px solid rgba(255,255,255,0.12);text-align:left;${bg}" dir="auto">${escapeHtml(text)}</${Tag}>`;
          }).join('');
          return `<tr>${cellsHtml}</tr>`;
        }).join('');

        tableHtml = `<table style="border-collapse:collapse;width:100%;margin:16px 0;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:15px;" dir="auto">${rowsHtml}</table>`;
      }

      // Parse embedded images (<p:pic>)
      let imagesHtml = '';
      const picMatches = xml.match(/<p:pic\b.*?>.*?<\/p:pic>/gs) || [];
      for (const picXml of picMatches) {
        const blipMatch = picXml.match(/<a:blip\s+[^>]*r:embed="([^"]+)"/);
        if (blipMatch) {
          const rId = blipMatch[1];
          const targetPath = relsMap.get(rId);
          if (targetPath && mediaMap.has(targetPath)) {
            const dataUri = mediaMap.get(targetPath);
            imagesHtml += `<img src="${dataUri}" style="max-height:220px;max-width:380px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);object-fit:contain;margin:10px 12px 10px 0;display:inline-block;vertical-align:middle;box-shadow:0 4px 16px rgba(0,0,0,0.4);" />`;
          }
        }
      }

      // Parse text runs and shapes
      const paragraphs: string[] = [];
      const spMatches = xml.match(/<p:sp\b.*?>.*?<\/p:sp>/gs) || [];
      for (const spXml of spMatches) {
        if (spXml.includes('<a:tbl>')) continue;
        const pElements = spXml.match(/<a:p\b.*?>.*?<\/a:p>/gs) || [];
        for (const pXml of pElements) {
          const tMatches = pXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
          const rawText = tMatches.map((t) => decodeXml(t.replace(/<[^>]+>/g, ''))).join('').trim();
          if (rawText) {
            paragraphs.push(rawText);
          }
        }
      }

      const title = paragraphs[0] || `Slide ${slideNum}`;
      const bodyItems = paragraphs.slice(1);

      const bodyHtml = bodyItems.length > 0
        ? `<div style="display:flex;flex-direction:column;gap:12px;margin:16px 0;">
            ${bodyItems.map((item) => `
              <div style="display:flex;align-items:flex-start;gap:10px;font-size:18px;line-height:1.5;color:#E4E4E7;" dir="auto">
                <span style="color:#60A5FA;font-size:20px;line-height:1.2;">•</span>
                <span dir="auto">${escapeHtml(item)}</span>
              </div>
            `).join('')}
          </div>`
        : '';

      const noteText = speakerNotes[slideNum];

      slidesHtml += `
        <div class="slide-page" style="background:${bgColor};">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #3B82F6;padding-bottom:14px;margin-bottom:24px;">
            <h1 style="font-size:32px;font-weight:700;margin:0;color:#FFFFFF;letter-spacing:-0.02em;" dir="auto">${escapeHtml(title)}</h1>
            <span style="font-family:monospace;font-size:13px;color:#71717A;padding:4px 10px;background:rgba(255,255,255,0.06);border-radius:6px;">${slideNum < 10 ? '0' + slideNum : slideNum} / ${slideEntries.length < 10 ? '0' + slideEntries.length : slideEntries.length}</span>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;overflow:hidden;">
            ${imagesHtml ? `<div style="margin:8px 0;display:flex;flex-wrap:wrap;align-items:center;">${imagesHtml}</div>` : ''}
            ${tableHtml}
            ${bodyHtml}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#71717A;">
            <span dir="auto">${noteText ? `Note: ${escapeHtml(noteText.slice(0, 90))}...` : 'SOS High-Fidelity Presentation'}</span>
            <span>Slide ${slideNum} of ${slideEntries.length}</span>
          </div>
        </div>
      `;
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="auto">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(filename)}</title>
        <style>
          @page {
            size: 1280px 720px;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background: #0B0B0E;
            font-family: 'Segoe UI', 'Cairo', 'Amiri', 'Noto Sans Arabic', Tahoma, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          .slide-page {
            width: 1280px;
            height: 720px;
            page-break-after: always;
            padding: 48px 64px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        ${slidesHtml}
      </body>
      </html>
    `;

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'load' });
      const pdfBytes = await page.pdf({
        width: '1280px',
        height: '720px',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' }
      });
      return {
        pdfBuffer: Buffer.from(pdfBytes),
        pageCount: Math.max(1, slideEntries.length),
        converter: 'High-Fidelity Headless Chromium Engine (SOS v3)'
      };
    } finally {
      await browser.close();
    }
  } else {
    // DOCX rendering
    const docEntry = zip.getEntry('word/document.xml');
    let docHtml = '';
    if (docEntry) {
      const xml = docEntry.getData().toString('utf8');
      const pRegex = /<w:p[\s>].*?<\/w:p>/gs;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = pRegex.exec(xml)) !== null) {
        const pXml = pMatch[0];
        const isTitle = /<w:pStyle\s+w:val="Title"/i.test(pXml);
        const isHeading = /<w:pStyle\s+w:val="Heading\d+"/i.test(pXml) || /<w:pStyle\s+w:val="Subtitle"/i.test(pXml);
        const tMatches = pXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
        const rawText = tMatches.map((t) => decodeXml(t.replace(/<[^>]+>/g, ''))).join('').trim();
        if (rawText) {
          if (isTitle) {
            docHtml += `<h1 dir="auto" style="font-size:28px;font-weight:700;color:#FFFFFF;margin:24px 0 12px 0;border-bottom:2px solid #3B82F6;padding-bottom:8px;">${escapeHtml(rawText)}</h1>`;
          } else if (isHeading) {
            docHtml += `<h2 dir="auto" style="font-size:20px;font-weight:600;color:#60A5FA;margin:20px 0 8px 0;">${escapeHtml(rawText)}</h2>`;
          } else {
            docHtml += `<p dir="auto" style="font-size:14px;line-height:1.6;color:#D4D4D8;margin:8px 0;">${escapeHtml(rawText)}</p>`;
          }
        }
      }
    }

    if (!docHtml) {
      docHtml = `<h1 dir="auto">${escapeHtml(filename)}</h1><p dir="auto">Document contents converted via SOS High-Fidelity Engine.</p>`;
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="auto">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(filename)}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: #0B0B0E;
            color: #FAFAFA;
            font-family: 'Segoe UI', 'Cairo', 'Amiri', 'Noto Sans Arabic', Tahoma, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
        </style>
      </head>
      <body>
        ${docHtml}
      </body>
      </html>
    `;

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'load' });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
      });
      const pdfBuffer = Buffer.from(pdfBytes);
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      return {
        pdfBuffer,
        pageCount: pdfDoc.getPageCount(),
        converter: 'High-Fidelity Headless Chromium Engine (SOS v3)'
      };
    } finally {
      await browser.close();
    }
  }
}

/**
 * Resilient 3-Tier Conversion Chain:
 * Tier 1: Gotenberg (2.5s connection timeout)
 * Tier 2: Local LibreOffice CLI
 * Tier 3: High-Fidelity Headless Chromium Parser (with Pure-Node Fallback)
 */
export async function convertDocumentToPdf(
  fileBuffer: Buffer,
  filename: string,
  fileType: 'docx' | 'slides',
  gotenbergUrl: string = process.env.GOTENBERG_URL || 'http://127.0.0.1:3002'
): Promise<{ pdfBuffer: Buffer; pageCount: number; converter: string }> {
  // Tier 1: Gotenberg with fast connection timeout
  try {
    return await convertWithGotenberg(fileBuffer, filename, gotenbergUrl, 2500);
  } catch (gErr: any) {
    console.info(`[convertDocumentToPdf] Tier 1 Gotenberg unavailable. Attempting Tier 2 (Local LibreOffice)...`);
  }

  // Tier 2: Local LibreOffice CLI
  try {
    return await convertWithLocalLibreOffice(fileBuffer, filename);
  } catch (cliErr: any) {
    console.info(`[convertDocumentToPdf] Tier 2 LibreOffice CLI unavailable. Attempting Tier 3 (High-Fidelity Chromium)...`);
  }

  // Tier 3: High-Fidelity Headless Chromium Slide & Document Parser
  try {
    return await convertWithChromiumParser(fileBuffer, filename, fileType);
  } catch (chromErr: any) {
    console.warn(`[convertDocumentToPdf] Tier 3 Chromium parser error: ${chromErr?.message}. Falling back to Pure-Node...`);
    return await convertWithPureNodeParser(fileBuffer, filename, fileType);
  }
}

/**
 * Generate a valid, genuine OpenXML DOCX archive for seeding and tests
 */
export function buildValidDocxZip(title: string, sections: string[]): Buffer {
  const zip = new AdmZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  let paragraphsXml = `
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>${title}</w:t></w:r>
    </w:p>
  `;

  for (const s of sections) {
    paragraphsXml += `
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:t>${s}</w:t></w:r>
      </w:p>
      <w:p>
        <w:r><w:t>Comprehensive molecular overview and experimental analysis for ${s}.</w:t></w:r>
      </w:p>
    `;
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`;

  zip.addFile('[Content_Types].xml', Buffer.from(contentTypesXml, 'utf8'));
  zip.addFile('_rels/.rels', Buffer.from(rootRelsXml, 'utf8'));
  zip.addFile('word/document.xml', Buffer.from(documentXml, 'utf8'));

  return zip.toBuffer();
}

/**
 * Generate a valid, genuine OpenXML PPTX archive for seeding and tests
 */
export function buildValidPptxZip(
  title: string,
  slidesWithNotes: Array<{ title: string; note: string }>
): Buffer {
  const zip = new AdmZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  <p:sldIdLst/>
</p:presentation>`;

  zip.addFile('[Content_Types].xml', Buffer.from(contentTypesXml, 'utf8'));
  zip.addFile('_rels/.rels', Buffer.from(rootRelsXml, 'utf8'));
  zip.addFile('ppt/presentation.xml', Buffer.from(presentationXml, 'utf8'));

  slidesWithNotes.forEach((s, idx) => {
    const slideNum = idx + 1;
    const notesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:bodyPr/>
          <a:p>
            <a:r>
              <a:t>${s.note}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:notes>`;
    zip.addFile(`ppt/notesSlides/notesSlide${slideNum}.xml`, Buffer.from(notesXml, 'utf8'));
  });

  return zip.toBuffer();
}
