import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Sql } from 'postgres';
import {
  buildValidDocxZip,
  buildValidPptxZip
} from './document-parser.js';

const ROOT_DIR = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
export const UPLOADS_LEARNING_DIR = path.join(ROOT_DIR, 'uploads', 'learning');
export const FILES_DIR = path.join(UPLOADS_LEARNING_DIR, 'files');
export const CONVERTED_DIR = path.join(UPLOADS_LEARNING_DIR, 'converted');

// Ensure storage directories exist
fs.mkdirSync(FILES_DIR, { recursive: true });
fs.mkdirSync(CONVERTED_DIR, { recursive: true });

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function initLearningDocsTables(sql: Sql) {
  // 1. Files metadata table
  await sql`
    CREATE TABLE IF NOT EXISTS learning_files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'scholar_abdalla_01',
      filename TEXT NOT NULL,
      original_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      converted_pdf_path TEXT,
      checksum TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ready',
      error_message TEXT,
      page_count INTEGER NOT NULL DEFAULT 1,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  // Ensure user_id column exists if table was previously created
  await sql`ALTER TABLE learning_files ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'scholar_abdalla_01';`;
  await sql`CREATE INDEX IF NOT EXISTS idx_learning_files_checksum ON learning_files(checksum);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_learning_files_type ON learning_files(file_type);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_learning_files_user ON learning_files(user_id);`;

  // 2. Conversion cache table (Gotenberg / LibreOffice cache)
  await sql`
    CREATE TABLE IF NOT EXISTS learning_document_conversions (
      id TEXT PRIMARY KEY,
      source_checksum TEXT NOT NULL UNIQUE,
      source_filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      converted_pdf_path TEXT NOT NULL,
      page_count INTEGER NOT NULL DEFAULT 1,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 3. Document annotations per page
  await sql`
    CREATE TABLE IF NOT EXISTS learning_document_annotations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'scholar_abdalla_01',
      file_id TEXT NOT NULL REFERENCES learning_files(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      elements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      app_state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(file_id, page_number)
    );
  `;
  await sql`ALTER TABLE learning_document_annotations ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'scholar_abdalla_01';`;
  await sql`CREATE INDEX IF NOT EXISTS idx_doc_annotations_file_page ON learning_document_annotations(file_id, page_number);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_doc_annotations_user ON learning_document_annotations(user_id);`;

  // 4. Standalone Boards table (Infinite visual workspaces)
  await sql`
    CREATE TABLE IF NOT EXISTS learning_boards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'scholar_abdalla_01',
      title TEXT NOT NULL,
      elements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      app_state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      files_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      thumbnail_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE learning_boards ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'scholar_abdalla_01';`;
  await sql`ALTER TABLE learning_boards ADD COLUMN IF NOT EXISTS files_json JSONB NOT NULL DEFAULT '{}'::jsonb;`;
  await sql`CREATE INDEX IF NOT EXISTS idx_learning_boards_user ON learning_boards(user_id);`;
}

// Helper to generate a genuine academic PDF with multi-page text and headers
async function createAcademicPdfFile(
  filePath: string,
  title: string,
  pagesData: Array<{ heading: string; paragraphs: string[]; pageNum: number }>
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  for (const p of pagesData) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4: 595 x 842 pt
    const { width, height } = page.getSize();

    // Top rule & header
    page.drawLine({
      start: { x: 50, y: height - 50 },
      end: { x: width - 50, y: height - 50 },
      thickness: 0.75,
      color: rgb(0.2, 0.2, 0.22)
    });

    page.drawText('SOS ACADEMIC REPOSITORY • NEUROSCIENCE RESEARCH ARCHIVE', {
      x: 50,
      y: height - 42,
      size: 8,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.45)
    });

    page.drawText(title, {
      x: 50,
      y: height - 85,
      size: 15,
      font: fontBold,
      color: rgb(0.08, 0.08, 0.1)
    });

    page.drawText(p.heading, {
      x: 50,
      y: height - 115,
      size: 12,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.18)
    });

    let currentY = height - 145;
    for (const paragraph of p.paragraphs) {
      // Simple word wrapping for PDF drawing
      const words = paragraph.split(' ');
      let currentLine = '';
      const maxWidth = width - 100;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = fontRegular.widthOfTextAtSize(testLine, 10);
        if (textWidth > maxWidth && currentLine) {
          page.drawText(currentLine, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontRegular,
            color: rgb(0.12, 0.12, 0.14)
          });
          currentY -= 15;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        page.drawText(currentLine, {
          x: 50,
          y: currentY,
          size: 10,
          font: fontRegular,
          color: rgb(0.12, 0.12, 0.14)
        });
        currentY -= 22;
      }
    }

    // Footnote & Page Number
    page.drawLine({
      start: { x: 50, y: 50 },
      end: { x: width - 50, y: 50 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.72)
    });

    page.drawText(`Page ${p.pageNum} of ${pagesData.length} — Columbia University Neuroscience Curriculum`, {
      x: 50,
      y: 36,
      size: 8,
      font: fontOblique,
      color: rgb(0.45, 0.45, 0.5)
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));
  return Buffer.from(pdfBytes);
}

// Helper to generate a 16:9 widescreen presentation PDF for slides
async function createPresentationPdfFile(
  filePath: string,
  slidesData: Array<{ slideNum: number; title: string; subtitle: string; bullets: string[] }>
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const s of slidesData) {
    // 16:9 widescreen presentation dimensions: 960 x 540 pt
    const page = pdfDoc.addPage([960, 540]);
    const { width, height } = page.getSize();

    // Dark sleek presentation background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.04, 0.04, 0.05)
    });

    // Top banner strip
    page.drawRectangle({
      x: 0,
      y: height - 4,
      width,
      height: 4,
      color: rgb(0.3, 0.5, 0.9)
    });

    // Slide category / tracker
    page.drawText(`NEUROBIOLOGY LECTURE SERIES • SLIDE ${s.slideNum < 10 ? '0' + s.slideNum : s.slideNum} / 06`, {
      x: 60,
      y: height - 50,
      size: 10,
      font: fontBold,
      color: rgb(0.5, 0.55, 0.65)
    });

    // Slide Title
    page.drawText(s.title, {
      x: 60,
      y: height - 95,
      size: 26,
      font: fontBold,
      color: rgb(0.96, 0.96, 0.98)
    });

    // Slide Subtitle
    page.drawText(s.subtitle, {
      x: 60,
      y: height - 125,
      size: 14,
      font: fontRegular,
      color: rgb(0.65, 0.7, 0.8)
    });

    // Content Box
    let currentY = height - 180;
    for (const bullet of s.bullets) {
      // Bullet dot
      page.drawCircle({
        x: 68,
        y: currentY + 4,
        size: 3,
        color: rgb(0.3, 0.55, 0.95)
      });

      page.drawText(bullet, {
        x: 82,
        y: currentY,
        size: 14,
        font: fontRegular,
        color: rgb(0.85, 0.86, 0.88)
      });
      currentY -= 36;
    }

    // Bottom footer meta
    page.drawText('SOS Academic OS • Stanford School of Medicine • Dept of Neurobiology', {
      x: 60,
      y: 35,
      size: 9,
      font: fontRegular,
      color: rgb(0.4, 0.42, 0.48)
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));
  return Buffer.from(pdfBytes);
}

export async function seedLearningDocsData(sql: Sql) {
  // 1. Generate Physical Files on Disk
  const kandelPdfPath = path.join(FILES_DIR, 'Kandel_Principles_Ch12.pdf');
  const kandelBytes = await createAcademicPdfFile(
    kandelPdfPath,
    'Kandel: Principles of Neural Science — Ch. 12: Synaptic Transmission',
    [
      {
        pageNum: 1,
        heading: '12.1 Synaptic Transmission & Vesicular Exocytosis',
        paragraphs: [
          'Chemical synapses mediate directional communication across the synaptic cleft via rapid exocytosis of neurotransmitter-filled vesicles. Action potentials depolarize the presynaptic bouton, prompting calcium influx through P/Q and N-type voltage-gated calcium channels.',
          'The core molecular engine executing membrane fusion consists of the SNARE protein complex: Syntaxin-1 and SNAP-25 on the plasma membrane (t-SNAREs) and Synaptobrevin-2 (VAMP2) on the vesicular membrane (v-SNARE). Together they assemble into an extraordinarily stable 4-helix bundle.',
          'Synaptotagmin-1 acts as the primary low-affinity calcium sensor. Binding of multiple Ca2+ ions to its C2A and C2B domains releases the inhibitory clamp exerted by Complexin, catalyzing lipid bilayer merger within 200 microseconds.'
        ]
      },
      {
        pageNum: 2,
        heading: '12.2 The Quantal Hypothesis & Katz Formulation',
        paragraphs: [
          'Following seminal work by Katz and Del Castillo, neurotransmitter release occurs in discrete multimolecular packages termed quanta. Spontaneous miniature endplate potentials (mEPSPs) reflect unprovoked exocytosis of individual vesicles.',
          'The mean amplitude of the evoked response E is defined by the quantal equation: E = m * q, where m is quantal content and q is quantal size. Quantal content is further decomposed as m = n * p, where n represents the number of functional release sites and p denotes the release probability at each site.',
          'High-frequency stimulation leads to short-term synaptic facilitation when residual presynaptic calcium accumulates, or short-term depression when the readily releasable pool (RRP) is depleted.'
        ]
      },
      {
        pageNum: 3,
        heading: '12.3 Postsynaptic Receptors & Ion Flux Dynamics',
        paragraphs: [
          'Fast excitatory neurotransmission in the central nervous system is predominantly mediated by ionotropic glutamate receptors: AMPA and NMDA receptor subclasses. AMPA receptors permit rapid sodium influx producing fast EPSPs with sub-millisecond rise times.',
          'NMDA receptors exhibit voltage-dependent magnesium blockade at negative resting potentials (-70 mV). Depolarization electrostatically relieves Mg2+ blockade, allowing substantial calcium entry that triggers downstream calcium/calmodulin-dependent protein kinase II (CaMKII).',
          'Autophosphorylation of CaMKII at Threonine 286 maintains persistent kinase activity, inserting additional AMPA receptors into the postsynaptic density and strengthening synaptic efficacy.'
        ]
      },
      {
        pageNum: 4,
        heading: '12.4 Retrograde Messengers & Presynaptic Plasticity',
        paragraphs: [
          'Postsynaptic calcium signals can trigger retrograde signaling molecules that cross back over the cleft to modify presynaptic release probability. Two classical retrograde pathways include endocannabinoids and nitric oxide (NO).',
          'Endocannabinoids (anandamide and 2-arachidonoylglycerol) act on presynaptic CB1 receptors to suppress further neurotransmitter release (depolarization-induced suppression of inhibition or excitation).',
          'Nitric oxide, synthesized by neuronal nitric oxide synthase (nNOS), diffuses across membranes to activate presynaptic soluble guanylyl cyclase, increasing cGMP and protein kinase G activity.'
        ]
      },
      {
        pageNum: 5,
        heading: '12.5 Clinical Pathologies & Synaptopathies',
        paragraphs: [
          'Perturbations of synaptic vesicle machinery underlie numerous severe neurological disorders. Tetanus and botulinum neurotoxins act as zinc-dependent endopeptidases that selectively cleave SNARE proteins: Botulinum neurotoxins A and E cleave SNAP-25, while tetanus toxin cleaves synaptobrevin.',
          'Lambert-Eaton myasthenic syndrome involves autoimmune destruction of presynaptic P/Q-type voltage-gated calcium channels, causing profound muscle weakness that characteristically improves with repeated exertion.',
          'Autoimmune encephalitis targeting NMDA receptor GluN1 subunits leads to prominent neuropsychiatric symptoms, catatonia, and hypoventilation requiring immunotherapy.'
        ]
      }
    ]
  );
  const kandelChecksum = computeSha256(kandelBytes);

  // Generate Review DOCX and its derived PDF
  const docxPhysicalPath = path.join(FILES_DIR, 'Synaptic_Plasticity_Review.docx');
  const validDocxBytes = buildValidDocxZip(
    'Synaptic Plasticity: Molecular Cascades and Structural Remodeling',
    [
      'Abstract & Foundational Premises',
      'Molecular Cascade: CaMKII, Calcineurin & Phosphatases',
      'Structural Plasticity & Actin Cytoskeletal Dynamics',
      'Late-Phase LTP & Transcriptional Regulation'
    ]
  );
  fs.writeFileSync(docxPhysicalPath, validDocxBytes);

  const docxDerivedPdfPath = path.join(CONVERTED_DIR, 'Synaptic_Plasticity_Review.pdf');
  const docxPdfBytes = await createAcademicPdfFile(
    docxDerivedPdfPath,
    'Synaptic Plasticity: Molecular Cascades and Structural Remodeling',
    [
      {
        pageNum: 1,
        heading: 'Abstract & Foundational Premises',
        paragraphs: [
          'Synaptic plasticity is the biological process by which specific patterns of synaptic activity result in changes in synaptic strength, serving as the neurochemical basis of learning and memory consolidation.',
          'This review synthesizes the molecular machinery governing Long-Term Potentiation (LTP) and Long-Term Depression (LTD) in the mammalian hippocampus, focusing on CA3-CA1 Schaffer collateral synapses.',
          'We evaluate presynaptic release machinery, postsynaptic density reorganization, spine actin dynamics, and dendritic protein synthesis cascades initiated during the late phase of LTP.'
        ]
      },
      {
        pageNum: 2,
        heading: 'Molecular Cascade: CaMKII, Calcineurin & Phosphatases',
        paragraphs: [
          'High-frequency tetanus generates large, sharp calcium spikes through NMDA receptors, preferentially activating CaMKII over protein phosphatases. CaMKII holoenzymes autophosphorylate at Thr286, locking subunits into autonomous activity.',
          'In contrast, prolonged low-frequency stimulation (1 Hz for 15 minutes) produces modest, prolonged calcium elevations that preferentially engage high-affinity Calcineurin (PP2B), initiating protein dephosphorylation and AMPA receptor endocytosis typical of LTD.'
        ]
      },
      {
        pageNum: 3,
        heading: 'Structural Plasticity & Actin Cytoskeletal Dynamics',
        paragraphs: [
          'Dendritic spines undergo pronounced morphological enlargement during LTP induction. Rho-family GTPases (Rac1, Cdc42, and RhoA) coordinate the polymerization and branching of F-actin networks within the spine head.',
          'PAK and LIM kinase phosphorylate cofilin to inhibit actin severing, stabilizing the newly expanded postsynaptic scaffold. PSD-95 clustering increases proportionately, providing additional docking slots for GluA1-containing AMPA receptors.'
        ]
      },
      {
        pageNum: 4,
        heading: 'Late-Phase LTP & Transcriptional Regulation',
        paragraphs: [
          'Maintenance of LTP beyond 3-4 hours requires de novo RNA and protein synthesis. Calcium signals propagate to the nucleus via MAP kinase / ERK cascades, activating the transcription factor CREB (cAMP response element-binding protein).',
          'CREB-dependent genes include BDNF, immediate early genes (c-Fos, Arc/Arg3.1), and PKMzeta. Arc protein localizes specifically to active dendritic segments, functioning as an inverse synaptic tag to maintain input specificity.'
        ]
      }
    ]
  );
  const docxFileBytes = fs.readFileSync(docxPhysicalPath);
  const docxChecksum = computeSha256(docxFileBytes);

  // Generate Lecture PPTX and its derived 16:9 Presentation PDF
  const pptxPhysicalPath = path.join(FILES_DIR, 'Neurobiology_Lecture_04.pptx');
  const validPptxBytes = buildValidPptxZip(
    'Neurobiology Lecture 04: Synaptic Transmission',
    [
      {
        title: 'Presynaptic Bouton & Active Zone Architecture',
        note: 'Emphasize the sub-millisecond kinetics of vesicular release at the active zone.'
      },
      {
        title: 'Voltage-Gated Calcium Channels (VGCCs)',
        note: 'Remind students that omega-agatoxin selectively blocks P/Q Cav2.1 channels.'
      },
      {
        title: 'The SNARE Core Machinery & Complexin Clamp',
        note: 'Focus heavily on the 4-helix coiled-coil bundle of the core SNARE complex.'
      },
      {
        title: 'Quantal Hypothesis & Mathematical Model',
        note: 'Walk through the quantal math: E = m * q = (n * p) * q. Very high yield on the midterm.'
      },
      {
        title: 'Retrograde Messengers & Modulatory Loops',
        note: 'Contrast 2-AG lipid retrograde diffusion with gaseous NO activation of sGC.'
      },
      {
        title: 'Summary & Core Exam Takeaways',
        note: 'Final recap: ensure students can draw the full vesicular cycle from memory.'
      }
    ]
  );
  fs.writeFileSync(pptxPhysicalPath, validPptxBytes);
  const pptxDerivedPdfPath = path.join(CONVERTED_DIR, 'Neurobiology_Lecture_04.pdf');
  const pptxPdfBytes = await createPresentationPdfFile(
    pptxDerivedPdfPath,
    [
      {
        slideNum: 1,
        title: 'Presynaptic Bouton & Active Zone Architecture',
        subtitle: 'Cellular Neuroscience • Lecture 04: Synaptic Transmission',
        bullets: [
          'Sub-millisecond coupling between action potential arrival and vesicle fusion',
          'Electron-dense active zone scaffolds: Bassoon, Piccolo, RIM, and Munc13',
          'Vesicle pools: Readily Releasable Pool (RRP) vs Reserve Pool (RP)',
          'Synaptic cleft width: ~20 nanometers across the central junction'
        ]
      },
      {
        slideNum: 2,
        title: 'Voltage-Gated Calcium Channels (VGCCs)',
        subtitle: 'Biophysical Properties & Channel Microdomains',
        bullets: [
          'P/Q (Cav2.1) and N-type (Cav2.2) channels cluster within 50 nm of docked vesicles',
          'Local calcium nanodomains reach 10-100 micromolar during action potential',
          'Specific pharmacological blockers: omega-Agatoxin IVA and omega-Conotoxin GVIA',
          'Nanodomain vs microdomain coupling dictates release synchrony'
        ]
      },
      {
        slideNum: 3,
        title: 'The SNARE Core Machinery & Complexin Clamp',
        subtitle: 'Molecular Assembly & Fusion Pore Opening',
        bullets: [
          'Syntaxin-1 and SNAP-25 on plasma membrane form t-SNARE receptor',
          'Synaptobrevin-2 (VAMP2) on vesicle membrane forms v-SNARE',
          'Assembly into parallel 4-helix bundle drives zippering against electrostatic repulsion',
          'Complexin stabilizes the metastable primed intermediate until calcium arrives'
        ]
      },
      {
        slideNum: 4,
        title: 'Quantal Hypothesis & Mathematical Model',
        subtitle: 'Katz Formulation & Statistical Analysis',
        bullets: [
          'Quantal equation: Evoked Response E = m * q = (n * p) * q',
          'n = number of active release sites; p = release probability; q = quantal size',
          'Miniature EPSPs (mEPSPs) provide direct empirical measurement of q',
          'Binomial distribution fits observed multi-vesicular release variations'
        ]
      },
      {
        slideNum: 5,
        title: 'Retrograde Messengers & Modulatory Loops',
        subtitle: 'Endocannabinoids, Nitric Oxide, and Feedback Control',
        bullets: [
          'Postsynaptic calcium stimulates 2-Arachidonoylglycerol (2-AG) synthesis',
          'Retrograde diffusion activates presynaptic CB1 receptors (Gi/o coupled)',
          'Depolarization-induced suppression of inhibition (DSI) and excitation (DSE)',
          'Nitric Oxide gas activates soluble guanylyl cyclase to increase vesicle replenishment'
        ]
      },
      {
        slideNum: 6,
        title: 'Summary & Core Exam Takeaways',
        subtitle: 'Critical Review Points for Midterm Examination',
        bullets: [
          'SNARE bundle: 4 coiled-coil alpha helices; Synaptotagmin-1 is the Ca2+ trigger',
          'Tetanus and Botulinum neurotoxins cleave specific SNARE peptide bonds',
          'NMDAR voltage-dependent Mg2+ block acts as molecular coincidence detector',
          'CaMKII Thr286 autophosphorylation locks autonomous enzymatic activity'
        ]
      }
    ]
  );
  const pptxFileBytes = fs.readFileSync(pptxPhysicalPath);
  const pptxChecksum = computeSha256(pptxFileBytes);

  // 2. Insert records into `learning_files`
  await sql`
    INSERT INTO learning_files (
      id, user_id, filename, original_path, mime_type, file_size, file_type, converted_pdf_path, checksum, status, page_count, metadata
    ) VALUES
      (
        'file-kandel-pdf',
        'scholar_abdalla_01',
        'Kandel_Principles_Ch12.pdf',
        ${kandelPdfPath},
        'application/pdf',
        ${kandelBytes.length},
        'pdf',
        '/uploads/learning/files/Kandel_Principles_Ch12.pdf',
        ${kandelChecksum},
        'ready',
        5,
        '{"chapters":["12.1 Vesicular Fusion","12.2 Quantal Hypothesis","12.3 Postsynaptic Receptors","12.4 Retrograde Messengers","12.5 Synaptopathies"]}'::jsonb
      ),
      (
        'file-plasticity-docx',
        'scholar_abdalla_01',
        'Synaptic_Plasticity_Review.docx',
        ${docxPhysicalPath},
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ${docxFileBytes.length},
        'docx',
        '/uploads/learning/converted/Synaptic_Plasticity_Review.pdf',
        ${docxChecksum},
        'ready',
        4,
        '{"sections":["Abstract & Foundational Premises","Molecular Cascade: CaMKII, Calcineurin & Phosphatases","Structural Plasticity & Actin Cytoskeletal Dynamics","Late-Phase LTP & Transcriptional Regulation"]}'::jsonb
      ),
      (
        'file-neuro-slides-pptx',
        'scholar_abdalla_01',
        'Neurobiology_Lecture_04.pptx',
        ${pptxPhysicalPath},
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ${pptxFileBytes.length},
        'slides',
        '/uploads/learning/converted/Neurobiology_Lecture_04.pdf',
        ${pptxChecksum},
        'ready',
        6,
        ${JSON.stringify({
          slideCount: 6,
          speakerNotes: {
            1: "Emphasize the sub-millisecond kinetics of vesicular release at the active zone.",
            2: "Remind students that omega-agatoxin selectively blocks P/Q Cav2.1 channels.",
            3: "Focus heavily on the 4-helix coiled-coil bundle of the core SNARE complex.",
            4: "Walk through the quantal math: E = m * q = (n * p) * q. Very high yield on the midterm.",
            5: "Contrast 2-AG lipid retrograde diffusion with gaseous NO activation of sGC.",
            6: "Final recap: ensure students can draw the full vesicular cycle from memory."
          }
        })}::jsonb
      )
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      converted_pdf_path = EXCLUDED.converted_pdf_path,
      page_count = EXCLUDED.page_count,
      status = EXCLUDED.status,
      metadata = EXCLUDED.metadata;
  `;

  // 3. Insert records into `learning_document_conversions`
  await sql`
    INSERT INTO learning_document_conversions (
      id, source_checksum, source_filename, file_type, converted_pdf_path, page_count, metadata
    ) VALUES
      (
        'conv-docx-plasticity',
        ${docxChecksum},
        'Synaptic_Plasticity_Review.docx',
        'docx',
        '/uploads/learning/converted/Synaptic_Plasticity_Review.pdf',
        4,
        '{"converter":"LibreOffice / Gotenberg Engine","cached":true}'::jsonb
      ),
      (
        'conv-pptx-neuro',
        ${pptxChecksum},
        'Neurobiology_Lecture_04.pptx',
        'slides',
        '/uploads/learning/converted/Neurobiology_Lecture_04.pdf',
        6,
        '{"converter":"LibreOffice / Gotenberg Engine","cached":true,"aspectRatio":"16:9"}'::jsonb
      )
    ON CONFLICT (source_checksum) DO UPDATE SET
      converted_pdf_path = EXCLUDED.converted_pdf_path,
      page_count = EXCLUDED.page_count;
  `;

  // 4. Seed Document Annotations for Kandel PDF (Page 1)
  const kandelPage1Annotations = [
    {
      id: 'kandel-note-1',
      type: 'stickyCard',
      category: 'HIGH YIELD',
      subCategory: 'SNARE Complex',
      title: 'Core 4-Helix Bundle',
      text: 'Syntaxin-1 (1 helix) + SNAP-25 (2 helices) + Synaptobrevin-2 (1 helix). Complexin clamps before Ca²⁺ arrives!',
      top: 180,
      left: 450,
      width: 240,
      accentColor: '#3B82F6',
      snapZone: 'right-margin'
    }
  ];

  await sql`
    INSERT INTO learning_document_annotations (
      id, user_id, file_id, page_number, elements_json, app_state_json
    ) VALUES
      (
        'annot-kandel-p1',
        'scholar_abdalla_01',
        'file-kandel-pdf',
        1,
        ${JSON.stringify(kandelPage1Annotations)}::jsonb,
        '{"scrollY":0,"zoom":1}'::jsonb
      )
    ON CONFLICT (file_id, page_number) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      elements_json = EXCLUDED.elements_json;
  `;

  // 5. Seed Slide Annotations for Lecture PPTX (Slide 1 & Slide 3)
  const slide1Annotations = [
    {
      id: 'slide-note-1',
      type: 'stickyCard',
      category: 'EXAM TIP',
      subCategory: 'Active Zone',
      title: 'Scaffold Proteins',
      text: 'Bassoon and Piccolo anchor the presynaptic dense projections. Don’t confuse with postsynaptic PSD-95!',
      top: 140,
      left: 720,
      width: 220,
      accentColor: '#10B981',
      snapZone: 'right-margin'
    }
  ];

  await sql`
    INSERT INTO learning_document_annotations (
      id, user_id, file_id, page_number, elements_json, app_state_json
    ) VALUES
      (
        'annot-slide-1',
        'scholar_abdalla_01',
        'file-neuro-slides-pptx',
        1,
        ${JSON.stringify(slide1Annotations)}::jsonb,
        '{"zoom":1}'::jsonb
      )
    ON CONFLICT (file_id, page_number) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      elements_json = EXCLUDED.elements_json;
  `;

  // 6. Seed Standalone Boards (Infinite Visual Workspaces)
  const neuroBoardElements = [
    {
      id: 'node-presynaptic',
      type: 'rectangle',
      x: 100,
      y: 120,
      width: 280,
      height: 140,
      strokeColor: '#3B82F6',
      backgroundColor: '#1E3A8A',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
      groupIds: [],
      strokeSharpness: 'round'
    },
    {
      id: 'text-presynaptic-title',
      type: 'text',
      x: 120,
      y: 135,
      text: 'PRESYNAPTIC TERMINAL',
      fontSize: 16,
      strokeColor: '#60A5FA',
      fontFamily: 1,
      textAlign: 'left'
    },
    {
      id: 'text-presynaptic-body',
      type: 'text',
      x: 120,
      y: 165,
      text: '• P/Q & N-Type Ca²⁺ Influx\n• Readily Releasable Pool (RRP)\n• Synaptotagmin-1 Sensor',
      fontSize: 13,
      strokeColor: '#F4F4F5',
      fontFamily: 1,
      textAlign: 'left'
    },
    {
      id: 'arrow-fusion',
      type: 'arrow',
      x: 380,
      y: 190,
      width: 120,
      height: 0,
      points: [[0, 0], [120, 0]],
      strokeColor: '#10B981',
      strokeWidth: 2
    },
    {
      id: 'node-snare',
      type: 'rectangle',
      x: 500,
      y: 120,
      width: 280,
      height: 140,
      strokeColor: '#10B981',
      backgroundColor: '#064E3B',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
      groupIds: [],
      strokeSharpness: 'round'
    },
    {
      id: 'text-snare-title',
      type: 'text',
      x: 520,
      y: 135,
      text: 'SNARE COMPLEX (4-HELIX)',
      fontSize: 16,
      strokeColor: '#34D399',
      fontFamily: 1,
      textAlign: 'left'
    },
    {
      id: 'text-snare-body',
      type: 'text',
      x: 520,
      y: 165,
      text: '• Syntaxin-1 (t-SNARE)\n• SNAP-25 (2 helices)\n• Synaptobrevin-2 (v-SNARE)',
      fontSize: 13,
      strokeColor: '#F4F4F5',
      fontFamily: 1,
      textAlign: 'left'
    },
    {
      id: 'arrow-postsynaptic',
      type: 'arrow',
      x: 780,
      y: 190,
      width: 120,
      height: 0,
      points: [[0, 0], [120, 0]],
      strokeColor: '#EC4899',
      strokeWidth: 2
    },
    {
      id: 'node-postsynaptic',
      type: 'rectangle',
      x: 900,
      y: 120,
      width: 300,
      height: 140,
      strokeColor: '#EC4899',
      backgroundColor: '#831843',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
      groupIds: [],
      strokeSharpness: 'round'
    },
    {
      id: 'text-postsynaptic-title',
      type: 'text',
      x: 920,
      y: 135,
      text: 'POSTSYNAPTIC DENSITY (PSD)',
      fontSize: 16,
      strokeColor: '#F472B6',
      fontFamily: 1,
      textAlign: 'left'
    },
    {
      id: 'text-postsynaptic-body',
      type: 'text',
      x: 920,
      y: 165,
      text: '• AMPA Receptors (Na⁺ Influx)\n• NMDA Receptors (Mg²⁺ Relieved)\n• CaMKII Thr286 Autophosphorylation',
      fontSize: 13,
      strokeColor: '#F4F4F5',
      fontFamily: 1,
      textAlign: 'left'
    },
    {
      id: 'decision-ca-gating',
      type: 'diamond',
      x: 420,
      y: 320,
      width: 140,
      height: 100,
      strokeColor: '#F59E0B',
      backgroundColor: '#FEF3C720',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
      groupIds: []
    },
    {
      id: 'text-decision-title',
      type: 'text',
      x: 435,
      y: 360,
      text: 'Ca²⁺ Threshold Met?',
      fontSize: 12,
      strokeColor: '#F59E0B',
      fontFamily: 1,
      textAlign: 'center'
    },
    {
      id: 'sticky-card-1',
      type: 'rectangle',
      x: 100,
      y: 320,
      width: 240,
      height: 160,
      strokeColor: '#27272A',
      backgroundColor: '#FEF08A',
      fillStyle: 'solid',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
      roundness: { type: 3 },
      customData: { isStickyNote: true },
      groupIds: ['sticky-group-demo']
    },
    {
      id: 'sticky-text-1',
      type: 'text',
      x: 116,
      y: 336,
      text: 'Clinical Pearl:\n• Botulinum toxin cleaves SNAP-25\n• Prevents vesicular fusion\n• High yield for Step 1',
      fontSize: 14,
      strokeColor: '#18181B',
      containerId: 'sticky-card-1',
      customData: { isStickyNote: true },
      groupIds: ['sticky-group-demo']
    }
  ];

  await sql`
    INSERT INTO learning_boards (
      id, user_id, title, elements_json, app_state_json, thumbnail_url
    ) VALUES
      (
        'board-neuro-mindmap',
        'scholar_abdalla_01',
        'Neuroscience Architecture & Synaptic Transmission',
        ${JSON.stringify(neuroBoardElements)}::jsonb,
        '{"viewBackgroundColor":"#0A0A0A","scrollX":0,"scrollY":0,"zoom":{"value":1}}'::jsonb,
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80'
      ),
      (
        'board-snare-cycle',
        'scholar_abdalla_01',
        'SNARE Assembly & Disassembly Cycle',
        '[]'::jsonb,
        '{"viewBackgroundColor":"#0A0A0A","scrollX":0,"scrollY":0,"zoom":{"value":1}}'::jsonb,
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80'
      )
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      title = EXCLUDED.title,
      elements_json = EXCLUDED.elements_json;
  `;

  // 7. Insert Learning Tabs for quick access to PDF, DOCX, Slides, and Board
  await sql`
    INSERT INTO learning_tabs (id, tool_type, title, resource_id, active)
    VALUES
      ('tab-pdf-kandel', 'pdf', 'Kandel_Principles_Ch12.pdf', 'file-kandel-pdf', false),
      ('tab-docx-plasticity', 'docx', 'Synaptic_Plasticity_Review.docx', 'file-plasticity-docx', false),
      ('tab-slides-neuro', 'slides', 'Neurobiology_Lecture_04.pptx', 'file-neuro-slides-pptx', false),
      ('tab-board-mindmap', 'board', 'Neuroscience Architecture (Board)', 'board-neuro-mindmap', false)
    ON CONFLICT (id) DO NOTHING;
  `;

  // 8. Update study_materials to include these high-yield resources
  await sql`
    INSERT INTO study_materials (id, title, type, meta_text, last_opened, resource_id, target_tool_name, order_index)
    VALUES
      ('mat-1', 'Kandel_Principles_Ch12.pdf', 'pdf', 'Read Page 1 • 5 Pages Total', '12 mins ago', 'file-kandel-pdf', 'PDF Reader', 1),
      ('mat-docx-plasticity', 'Synaptic_Plasticity_Review.docx', 'docx', 'Word Manuscript • Converted PDF', '35 mins ago', 'file-plasticity-docx', 'DOCX', 2),
      ('mat-slides-neuro', 'Neurobiology_Lecture_04.pptx', 'slides', 'Lecture Slides • 6 Slides Total', '1 hour ago', 'file-neuro-slides-pptx', 'Slides', 3),
      ('mat-board-mindmap', 'Neuroscience Architecture', 'board', 'Infinite Visual Board • 3 Hubs', '3 hours ago', 'board-neuro-mindmap', 'Board', 4)
    ON CONFLICT (id) DO UPDATE SET
      meta_text = EXCLUDED.meta_text,
      last_opened = EXCLUDED.last_opened;
  `;
}
