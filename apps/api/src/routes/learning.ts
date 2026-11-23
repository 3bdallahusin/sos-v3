import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { getSqlClient } from '../db.js';
import { computeSha256, FILES_DIR, CONVERTED_DIR, seedLearningDocsData } from '../learning-docs.js';
import {
  extractDocxHeadings,
  extractPptxSpeakerNotes,
  convertWithGotenberg,
  convertDocumentToPdf,
  buildValidDocxZip,
  buildValidPptxZip
} from '../document-parser.js';
import { syncArtifactToLibrary } from './library.js';

const ROOT_DIR = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();

function makeContentDisposition(disposition: 'inline' | 'attachment', filename: string): string {
  const asciiName = (filename || 'document').replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');
  const encodedName = encodeURIComponent(filename || 'document');
  return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
}

async function extractPdfPageText(filePath: string, pageNumber: number): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) return '';
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = (pdfjsLib as any).getDocument({ data, useSystemFonts: true });
    const doc = await loadingTask.promise;
    let targetPage = pageNumber;
    if (targetPage > doc.numPages || targetPage < 1) targetPage = 1;
    const page = await doc.getPage(targetPage);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => item.str || '')
      .filter(Boolean);
    return strings.join(' ');
  } catch (err) {
    return '';
  }
}

function getAuthUserId(req: any): string {
  const custom = req.headers['x-user-id'];
  if (typeof custom === 'string' && custom.trim()) {
    return custom.trim();
  }
  return 'scholar_abdalla_01';
}

export const learningRoutes: FastifyPluginAsync = async (server) => {
  const sql = getSqlClient();

  // ----------------------------------------------------
  // TEST & WORKSPACE STATE RESET
  // ----------------------------------------------------
  server.post('/api/learning/reset', async (_req, reply) => {
    try {
      // 1. Reset tabs & non-canonical learning assets
      await sql`DELETE FROM learning_tabs`;
      await sql`
        INSERT INTO learning_tabs (id, tool_type, title, resource_id, active, position)
        VALUES ('tab-new-tab', 'new_tab', 'New Tab', NULL, true, 0)
      `;

      // 2. Reset quiz questions: unflag & clear user answers
      await sql`UPDATE quiz_questions SET is_flagged = false, user_selected_option = NULL`;

      // 3. Reset exam session
      await sql`
        UPDATE exam_sessions
        SET 
          status = 'active',
          answers = '{}'::jsonb,
          flagged = '{}'::jsonb,
          integrity_logs = '[]'::jsonb,
          score = 0,
          time_remaining_seconds = 2535
        WHERE id = 'exam-neuro-midterm'
      `;

      // 4. Reset Notes & Canvas Scene to Canonical Mockup State
      await sql`
        DELETE FROM learning_ai_notes_messages WHERE id NOT IN ('ai-note-1', 'ai-note-2', 'ai-note-3')
      `;
      await sql`
        DELETE FROM learning_canvas_scenes WHERE id != 'scene-synaptic-plasticity'
      `;
      const defaultNotesBlocks = [
        {
          id: 'block-h1-fundamentals',
          type: 'heading',
          props: { level: 1 },
          content: '1. Fundamentals of Vesicular Exocytosis'
        },
        {
          id: 'block-p1',
          type: 'paragraph',
          content: 'Chemical synapses mediate unidirectional information transfer across the synaptic cleft via vesicular exocytosis. Action potentials arriving at the presynaptic terminal stimulate calcium influx through P/Q and N-type voltage-gated channels, triggering rapid SNARE complex assembly.'
        },
        {
          id: 'block-bullet-1',
          type: 'bulletListItem',
          content: 'Synaptotagmin-1 acts as the primary low-affinity calcium sensor (Kd ≈ 10-20 µM).'
        },
        {
          id: 'block-bullet-2',
          type: 'bulletListItem',
          content: 'SNARE core bundle: Syntaxin-1, SNAP-25, and Synaptobrevin-2 (VAMP2) assemble into a 4-helix bundle.'
        },
        {
          id: 'block-bullet-3',
          type: 'bulletListItem',
          content: 'Complexin clamps the trans-SNARE bundle in a primed, metastable intermediate state awaiting Ca²⁺.'
        },
        {
          id: 'block-h2-quantal',
          type: 'heading',
          props: { level: 2 },
          content: '2. Quantal Hypothesis & Release Probability'
        },
        {
          id: 'block-p2',
          type: 'paragraph',
          content: 'According to Katz and Del Castillo, neurotransmitter release occurs in discrete multimolecular packages (quanta). The mean amplitude of the postsynaptic potential E is governed by the quantal equation: E = m · q, where m = n · p.'
        },
        {
          id: 'block-check-1',
          type: 'checkListItem',
          props: { checked: true },
          content: 'Calculate quantal content: m = n · p (n = release sites, p = release probability)'
        },
        {
          id: 'block-check-2',
          type: 'checkListItem',
          props: { checked: true },
          content: 'Measure miniature excitatory postsynaptic potentials (mEPSPs) under low extracellular Ca²⁺'
        },
        {
          id: 'block-check-3',
          type: 'checkListItem',
          props: { checked: false },
          content: 'Review freeze-fracture electron microscopy of active zone dense projections (Bassoon/Piccolo)'
        },
        {
          id: 'block-h2-retrograde',
          type: 'heading',
          props: { level: 2 },
          content: '3. Retrograde Messengers & Long-Term Plasticity'
        },
        {
          id: 'block-p3',
          type: 'paragraph',
          content: 'Activity-dependent structural remodeling of active zones entails recruitment of scaffold proteins such as Bassoon and Piccolo, anchoring presynaptic calcium channels closer to docked vesicles. Postsynaptic calcium surges further trigger retrograde messengers including Nitric Oxide (NO) and Endocannabinoids (2-AG) to modulate presynaptic release probability.'
        }
      ];

      await sql`
        UPDATE learning_documents
        SET blocks_json = ${JSON.stringify(defaultNotesBlocks)}::jsonb,
            title = 'Synaptic Transmission & Plasticity',
            subtitle = 'Folder workspace containing lecture notes and canonical learning assets',
            icon_emoji = '🧠',
            cover_url = 'https://lh3.googleusercontent.com/aida/ALJJyrAzJP1DX6RuK_BWOeNLE4ykv4qEOvEhEWsOmZ1giWXQgFyrFHoWqddMhyQVlqYU9lGBInV7nsz01jaTn_x74arjZAzzJ70HQf3MP3vney7W-QQPEIz3osgRmf6xvokdoyrTp-Ll5gNNE2N8jBMqVxB-RGtnRy0_4BQ4ic6yjFsIEA2EiVVEu490v_ivZ7nGkK7P0OmdimHjEtJs193tsjYJs1VeyP8WZpuSyD78KsD_FetZqsqbWsl4gamAwOWmX-EIM13CijVLD4c'
        WHERE id = 'doc-synaptic-plasticity'
      `;
      const defaultCanvasElements = [
        {
          id: 'elem-card-clinical-alert',
          type: 'stickyCard',
          category: 'CLINICAL ALERT',
          subCategory: 'Memantine',
          icon: 'sticky-note',
          accentColor: '#FBBF24',
          top: 176,
          right: 20,
          width: 208,
          text: "Uncompetitive low-affinity NMDA antagonist for Alzheimer's — preserves normal physiological signaling while preventing excitotoxicity.",
          snapZone: 'right-margin',
          linkedBlockId: 'block-p1'
        },
        {
          id: 'elem-card-mnemonic',
          type: 'stickyCard',
          category: 'Mnemonic',
          subCategory: 'CA1',
          icon: 'tag',
          accentColor: '#60A5FA',
          top: 256,
          left: 16,
          width: 160,
          text: "AMPA = Fast spike\nNMDA = Memory gate\nMg²⁺ unblocks with voltage!",
          snapZone: 'left-margin',
          linkedBlockId: 'block-p1'
        },
        {
          id: 'elem-card-retrograde',
          type: 'calloutNode',
          title: 'Retrograde Loop',
          accentColor: '#34D399',
          top: 580,
          right: 20,
          width: 224,
          text: "NO & BDNF diffuse retrogradely to amplify presynaptic transmitter release.",
          snapZone: 'right-margin',
          linkedBlockId: 'block-h2-retrograde'
        }
      ];

      await sql`
        UPDATE learning_canvas_scenes
        SET 
          elements_json = ${JSON.stringify(defaultCanvasElements)}::jsonb,
          app_state_json = '{"viewMode":"blended","zoom":1,"scrollX":0,"scrollY":0,"activeTool":"select","strokeWidth":2,"strokeColor":"#F4F4F5"}'::jsonb
        WHERE id = 'scene-synaptic-plasticity'
      `;

      return reply.send({ success: true, message: 'Learning state reset successfully' });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to reset learning state', details: err?.message || String(err) });
    }
  });

  // ----------------------------------------------------
  // REALISTIC DEMO WORKSPACE SEEDING
  // ----------------------------------------------------
  server.post('/api/learning/seed-demo', async (_req, reply) => {
    try {
      await seedLearningDocsData(sql);

      // Populate open tabs for realistic multi-tab study workflow
      await sql`DELETE FROM learning_tabs`;
      await sql`
        INSERT INTO learning_tabs (id, tool_type, title, resource_id, active, position)
        VALUES
          ('tab-demo-board', 'board', 'Neuroscience Map', 'board-neuro-mindmap', true, 0),
          ('tab-demo-pdf', 'pdf', 'Plasticity Guide (PDF)', 'file-kandel-pdf', false, 1),
          ('tab-demo-docx', 'docx', 'Signaling Review (DOCX)', 'file-plasticity-docx', false, 2),
          ('tab-demo-slides', 'slides', 'Lecture 04 (Slides)', 'file-stanford-neuro-pptx', false, 3)
      `;

      return reply.send({
        success: true,
        message: 'Sample workspace seeded successfully with real multi-tab study materials',
        activeTabId: 'tab-demo-board'
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to seed sample workspace: ' + (err?.message || String(err)) });
    }
  });

  // ----------------------------------------------------
  // TABS MANAGEMENT (PERSISTENT ORDER & BROWSER MORPHING)
  // ----------------------------------------------------
  server.get('/api/learning/tabs', async (_req, reply) => {
    try {
      const tabs = await sql`
        SELECT 
          id, tool_type as "toolType", title, resource_id as "resourceId", 
          active, saved_state as "savedState", position, created_at as "createdAt"
        FROM learning_tabs
        ORDER BY position ASC, created_at ASC
      `;
      return reply.send({ tabs });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch tabs' });
    }
  });

  server.post<{
    Body: { id?: string; toolType: string; title: string; resourceId?: string | null; active?: boolean; savedState?: any; position?: number };
  }>('/api/learning/tabs', async (req, reply) => {
    try {
      const { toolType, title, resourceId, active = true, savedState, position } = req.body;
      const tabId = req.body.id || `tab-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      let tabPosition = 0;
      if (typeof position === 'number') {
        tabPosition = position;
      } else {
        const [maxPos] = await sql`SELECT COALESCE(MAX(position), -1) + 1 as pos FROM learning_tabs`;
        tabPosition = maxPos?.pos ? Number(maxPos.pos) : 0;
      }

      if (active) {
        await sql`UPDATE learning_tabs SET active = false`;
      }

      const [tab] = await sql`
        INSERT INTO learning_tabs (id, tool_type, title, resource_id, active, saved_state, position)
        VALUES (${tabId}, ${toolType}, ${title}, ${resourceId || null}, ${active}, ${savedState ? JSON.stringify(savedState) : null}, ${tabPosition})
        ON CONFLICT (id) DO UPDATE SET
          tool_type = EXCLUDED.tool_type,
          title = EXCLUDED.title,
          resource_id = EXCLUDED.resource_id,
          active = EXCLUDED.active,
          saved_state = EXCLUDED.saved_state,
          position = EXCLUDED.position,
          updated_at = NOW()
        RETURNING id, tool_type as "toolType", title, resource_id as "resourceId", active, saved_state as "savedState", position
      `;

      return reply.status(201).send({ tab });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to create tab' });
    }
  });

  server.put<{
    Body: { tabIds: string[] };
  }>('/api/learning/tabs/reorder', async (req, reply) => {
    try {
      const { tabIds } = req.body;
      if (!Array.isArray(tabIds)) {
        return reply.status(400).send({ error: 'tabIds must be an array' });
      }

      for (let i = 0; i < tabIds.length; i++) {
        await sql`
          UPDATE learning_tabs
          SET position = ${i}, updated_at = NOW()
          WHERE id = ${tabIds[i]}
        `;
      }

      return reply.send({ success: true, count: tabIds.length });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to reorder tabs' });
    }
  });

  server.put<{
    Params: { id: string };
    Body: { active?: boolean; title?: string; toolType?: string; resourceId?: string | null; savedState?: any; position?: number };
  }>('/api/learning/tabs/:id', async (req, reply) => {
    try {
      const { id } = req.params;
      const { active, title, toolType, resourceId, savedState, position } = req.body;

      if (active) {
        await sql`UPDATE learning_tabs SET active = false`;
      }

      const hasResourceId = Object.prototype.hasOwnProperty.call(req.body, 'resourceId');

      const [tab] = await sql`
        UPDATE learning_tabs
        SET
          active = COALESCE(${active ?? null}, active),
          title = COALESCE(${title ?? null}, title),
          tool_type = COALESCE(${toolType ?? null}, tool_type),
          resource_id = CASE WHEN ${hasResourceId} THEN ${resourceId ?? null} ELSE resource_id END,
          saved_state = COALESCE(${savedState ? JSON.stringify(savedState) : null}, saved_state),
          position = COALESCE(${position ?? null}, position),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, tool_type as "toolType", title, resource_id as "resourceId", active, saved_state as "savedState", position
      `;

      if (!tab) {
        return reply.status(404).send({ error: 'Tab not found' });
      }

      return reply.send({ tab });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to update tab' });
    }
  });

  server.delete<{
    Params: { id: string };
  }>('/api/learning/tabs/:id', async (req, reply) => {
    try {
      const { id } = req.params;
      const [deleted] = await sql`
        DELETE FROM learning_tabs WHERE id = ${id} RETURNING id, active
      `;

      if (!deleted) {
        return reply.status(404).send({ error: 'Tab not found' });
      }

      if (deleted.active) {
        const remaining = await sql`
          SELECT id FROM learning_tabs ORDER BY position ASC, updated_at DESC LIMIT 1
        `;
        if (remaining.length > 0) {
          await sql`UPDATE learning_tabs SET active = true WHERE id = ${remaining[0].id}`;
        }
      }

      return reply.send({ success: true, id });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to delete tab' });
    }
  });

  // ----------------------------------------------------
  // RECENT STUDY MATERIALS (GENUINE USER RECORDS ONLY)
  // ----------------------------------------------------
  server.get('/api/learning/recent', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);

      // Real user files
      const files = await sql`
        SELECT 
          id, filename as title, file_type as "toolType",
          CONCAT('Document • ', page_count, ' page', CASE WHEN page_count > 1 THEN 's' ELSE '' END) as "metaText",
          to_char(updated_at, 'Mon DD, YYYY') as "lastOpened",
          id as "resourceId",
          filename as "targetToolName",
          updated_at
        FROM learning_files
        WHERE user_id = ${userId} AND status = 'ready'
        ORDER BY updated_at DESC
        LIMIT 6
      `;

      // Real user boards
      const boards = await sql`
        SELECT 
          id, title, 'board' as "toolType",
          'Infinite Spatial Canvas' as "metaText",
          to_char(updated_at, 'Mon DD, YYYY') as "lastOpened",
          id as "resourceId",
          'Board' as "targetToolName",
          updated_at
        FROM learning_boards
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT 4
      `;

      // Real user notes
      const notes = await sql`
        SELECT 
          id, title, 'notes' as "toolType",
          'Dual-Layer Notes' as "metaText",
          to_char(created_at, 'Mon DD, YYYY') as "lastOpened",
          id as "resourceId",
          'Notes' as "targetToolName",
          created_at as updated_at
        FROM learning_documents
        ORDER BY created_at DESC
        LIMIT 4
      `;

      const recent = [...files, ...boards, ...notes]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 8);

      return reply.send({ recent });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch recent study materials' });
    }
  });

  server.get('/api/learning/recommendations', async (_req, reply) => {
    try {
      const decks = await sql`
        SELECT id, title, topic, total_cards as "totalCards", 
               learning_count as "learningCount", review_count as "reviewCount", 
               mastered_count as "masteredCount"
        FROM flashcard_decks
        ORDER BY mastered_count ASC
        LIMIT 2
      `;

      const recommendations = [
        {
          id: 'rec-1',
          type: 'deck_review',
          title: 'Neurobiology: High-Yield Synaptic Deficit',
          description: `${decks[0]?.learningCount ?? 14} cards require immediate spaced review to retain CaMKII and SNARE complex mechanisms.`,
          toolType: 'flashcards',
          resourceId: decks[0]?.id || 'deck-camkii',
          urgency: 'high',
          badgeText: 'Retention Alert • Due Today'
        },
        {
          id: 'rec-2',
          type: 'quiz_prep',
          title: 'Cellular Neurophysiology Diagnostic Quiz',
          description: '20 high-yield board-style questions on LTP, action potentials, and synaptic vesicle release.',
          toolType: 'quizzes',
          resourceId: 'quiz-neurophys',
          urgency: 'medium',
          badgeText: 'Exam Preparation'
        },
        {
          id: 'rec-3',
          type: 'lecture_continuation',
          title: 'Resume Lecture: Synaptic Transmission & LTP',
          description: 'Jump directly to [16:48] on NMDA Receptor Coincidence Detection with synchronized transcript.',
          toolType: 'videos',
          resourceId: 'media-stanford-neuro-vid',
          urgency: 'low',
          badgeText: 'Continue Watching'
        }
      ];

      return reply.send({ recommendations });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch recommendations' });
    }
  });

  // ----------------------------------------------------
  // FLASHCARDS & SM-2 ENGINE
  // ----------------------------------------------------
  server.get('/api/learning/flashcards/decks', async (_req, reply) => {
    try {
      const decks = await sql`
        SELECT 
          d.id, d.title, d.topic,
          COALESCE(COUNT(f.id), 0)::int as "totalCards",
          COALESCE(COUNT(f.id) FILTER (WHERE f.status = 'learning'), 0)::int as "learningCount",
          COALESCE(COUNT(f.id) FILTER (WHERE f.status = 'review'), 0)::int as "reviewCount",
          COALESCE(COUNT(f.id) FILTER (WHERE f.status = 'mastered'), 0)::int as "masteredCount"
        FROM flashcard_decks d
        LEFT JOIN flashcards f ON f.deck_id = d.id
        GROUP BY d.id
        ORDER BY d.created_at ASC
      `;
      return reply.send({ decks });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch flashcard decks' });
    }
  });

  server.post('/api/learning/flashcards/decks', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const body = req.body as { title?: string; topic?: string; parentId?: string | null };
      const deckId = `deck-${Date.now()}`;
      const title = (body.title || 'Untitled Flashcard Deck').trim();
      const topic = (body.topic || 'General').trim();

      await sql`
        INSERT INTO flashcard_decks (id, title, topic, total_cards, learning_count, review_count, mastered_count, created_at)
        VALUES (${deckId}, ${title}, ${topic}, 0, 0, 0, 0, NOW())
      `;

      await syncArtifactToLibrary(sql, {
        action: 'upsert',
        userId,
        artifactId: deckId,
        name: `${title}.cards`,
        fileType: 'flashcards',
        parentId: body.parentId ?? null,
        icon: '🎴',
        metrics: { totalCards: 0 }
      });

      return reply.status(201).send({
        id: deckId,
        title,
        topic,
        totalCards: 0,
        learningCount: 0,
        reviewCount: 0,
        masteredCount: 0
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to create flashcard deck' });
    }
  });

  server.get<{
    Params: { id: string };

  }>('/api/learning/flashcards/decks/:id', async (req, reply) => {
    try {
      const { id } = req.params;
      const [deck] = await sql`
        SELECT id, title, topic, total_cards as "totalCards", 
               learning_count as "learningCount", review_count as "reviewCount", 
               mastered_count as "masteredCount"
        FROM flashcard_decks WHERE id = ${id}
      `;

      if (!deck) {
        return reply.status(404).send({ error: 'Deck not found' });
      }

      const cards = await sql`
        SELECT 
          id, deck_id as "deckId", topic_tag as "topicTag", sub_topic as "subTopic",
          question, answer_title as "answerTitle", answer, 
          mechanism_snippet as "mechanismSnippet", source_reference as "sourceReference",
          ease_factor as "easeFactor", interval, repetitions, 
          next_review_date as "nextReviewDate", status, order_index as "orderIndex"
        FROM flashcards
        WHERE deck_id = ${id}
        ORDER BY order_index ASC
      `;

      const stats = {
        total: cards.length,
        learning: cards.filter(c => c.status === 'learning').length,
        review: cards.filter(c => c.status === 'review').length,
        mastered: cards.filter(c => c.status === 'mastered').length
      };


      return reply.send({ deck: { ...deck, ...stats }, cards });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch deck' });
    }
  });

  server.post<{
    Body: { cardId: string; rating: 1 | 2 | 3 | 4 };

  }>('/api/learning/flashcards/review', async (req, reply) => {
    try {
      const { cardId, rating } = req.body;
      const [card] = await sql`
        SELECT id, deck_id, ease_factor, interval, repetitions, status
        FROM flashcards
        WHERE id = ${cardId}
      `;

      if (!card) {
        return reply.status(404).send({ error: 'Card not found' });
      }

      let { ease_factor: easeFactor, interval, repetitions, status } = card;

      let nextIntervalDays = 1.0;
      let intervalLabel = '< 1 min';

      if (rating === 1) {
        // Again: fail
        repetitions = 0;
        nextIntervalDays = 0.0007; // ~1 minute
        intervalLabel = '< 1 min';
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        status = 'learning';
      } else if (rating === 2) {
        // Hard
        repetitions = Math.max(1, repetitions);
        nextIntervalDays = repetitions === 1 ? 0.004 : interval * 1.2;
        intervalLabel = repetitions === 1 ? '6 mins' : `${Math.round(nextIntervalDays)}d`;
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        status = 'review';
      } else if (rating === 3) {
        // Good
        if (repetitions === 0) {
          nextIntervalDays = 1.0;
        } else if (repetitions === 1) {
          nextIntervalDays = 3.0;
        } else {
          nextIntervalDays = Math.round(interval * easeFactor);
        }
        repetitions += 1;
        intervalLabel = nextIntervalDays <= 1 ? '1 day' : `${Math.round(nextIntervalDays)} days`;
        status = repetitions >= 3 ? 'mastered' : 'review';
      } else if (rating === 4) {
        // Easy
        if (repetitions === 0) {
          nextIntervalDays = 3.0;
        } else if (repetitions === 1) {
          nextIntervalDays = 6.0;
        } else {
          nextIntervalDays = Math.round(interval * easeFactor * 1.3);
        }
        repetitions += 1;
        easeFactor += 0.15;
        intervalLabel = `${Math.round(nextIntervalDays)} days`;
        status = 'mastered';
      }

      const nextReviewDate = new Date(Date.now() + nextIntervalDays * 86400000);

      const [updatedCard] = await sql`
        UPDATE flashcards
        SET
          ease_factor = ${easeFactor},
          interval = ${nextIntervalDays},
          repetitions = ${repetitions},
          next_review_date = ${nextReviewDate.toISOString()},
          status = ${status}
        WHERE id = ${cardId}
        RETURNING 
          id, deck_id as "deckId", topic_tag as "topicTag", sub_topic as "subTopic",
          question, answer_title as "answerTitle", answer, 
          mechanism_snippet as "mechanismSnippet", source_reference as "sourceReference",
          ease_factor as "easeFactor", interval, repetitions, 
          next_review_date as "nextReviewDate", status, order_index as "orderIndex"
      `;

      // Update deck stats
      const [deckCounts] = await sql`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'learning')::int as learning,
          COUNT(*) FILTER (WHERE status = 'review')::int as review,
          COUNT(*) FILTER (WHERE status = 'mastered')::int as mastered
        FROM flashcards
        WHERE deck_id = ${card.deck_id}
      `;

      await sql`
        UPDATE flashcard_decks
        SET 
          total_cards = ${deckCounts.total},
          learning_count = ${deckCounts.learning},
          review_count = ${deckCounts.review},
          mastered_count = ${deckCounts.mastered},
          updated_at = NOW()
        WHERE id = ${card.deck_id}
      `;

      return reply.send({
        success: true,
        card: updatedCard,
        intervalLabel,
        deckStats: deckCounts
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to process card review' });
    }
  });

  server.put<{
    Params: { id: string };

    Body: { question: string; answerTitle: string; answer: string; mechanismSnippet?: string; topicTag?: string; subTopic?: string };

  }>('/api/learning/flashcards/cards/:id', async (req, reply) => {
    try {
      const { id } = req.params;
      const { question, answerTitle, answer, mechanismSnippet, topicTag, subTopic } = req.body;

      const [updated] = await sql`
        UPDATE flashcards
        SET
          question = COALESCE(${question}, question),
          answer_title = COALESCE(${answerTitle}, answer_title),
          answer = COALESCE(${answer}, answer),
          mechanism_snippet = COALESCE(${mechanismSnippet || null}, mechanism_snippet),
          topic_tag = COALESCE(${topicTag || null}, topic_tag),
          sub_topic = COALESCE(${subTopic || null}, sub_topic)
        WHERE id = ${id}
        RETURNING 
          id, deck_id as "deckId", topic_tag as "topicTag", sub_topic as "subTopic",
          question, answer_title as "answerTitle", answer, 
          mechanism_snippet as "mechanismSnippet", source_reference as "sourceReference",
          ease_factor as "easeFactor", interval, repetitions, 
          next_review_date as "nextReviewDate", status, order_index as "orderIndex"
      `;

      if (!updated) {
        return reply.status(404).send({ error: 'Card not found' });
      }

      return reply.send({ card: updated });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to update flashcard' });
    }
  });

  server.post<{
    Params: { id: string };

    Body: { question: string; answerTitle: string; answer: string; mechanismSnippet?: string; topicTag?: string; subTopic?: string };

  }>('/api/learning/flashcards/decks/:id/cards', async (req, reply) => {
    try {
      const { id: deckId } = req.params;
      const { question, answerTitle, answer, mechanismSnippet, topicTag = 'QUESTION • BIOCHEMISTRY', subTopic = 'Key Concept' } = req.body;

      const cardId = `card-gen-${Date.now()}`;
      const [maxOrder] = await sql`
        SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM flashcards WHERE deck_id = ${deckId}
      `;

      const [newCard] = await sql`
        INSERT INTO flashcards (
          id, deck_id, topic_tag, sub_topic, question, answer_title, answer, mechanism_snippet, source_reference, order_index
        ) VALUES (
          ${cardId}, ${deckId}, ${topicTag}, ${subTopic}, ${question}, ${answerTitle}, ${answer}, ${mechanismSnippet || null}, 'AI Assistant Session', ${maxOrder.next_order}
        )
        RETURNING 
          id, deck_id as "deckId", topic_tag as "topicTag", sub_topic as "subTopic",
          question, answer_title as "answerTitle", answer, 
          mechanism_snippet as "mechanismSnippet", source_reference as "sourceReference",
          ease_factor as "easeFactor", interval, repetitions, 
          next_review_date as "nextReviewDate", status, order_index as "orderIndex"
      `;

      await sql`
        UPDATE flashcard_decks
        SET total_cards = total_cards + 1, learning_count = learning_count + 1, updated_at = NOW()
        WHERE id = ${deckId}
      `;

      return reply.status(201).send({ card: newCard });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to create flashcard' });
    }
  });

  // ----------------------------------------------------
  // QUIZZES & INSTANT EVALUATION ENGINE
  // ----------------------------------------------------
  server.get('/api/learning/quizzes', async (_req, reply) => {
    try {
      const quizzes = await sql`
        SELECT 
          q.id, q.title, q.module, q.total_questions as "totalQuestions",
          COUNT(qq.id)::int as "questionCount"
        FROM quizzes q
        LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
        GROUP BY q.id
        ORDER BY q.created_at ASC
      `;
      return reply.send({ quizzes });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch quizzes' });
    }
  });

  server.get<{
    Params: { id: string };

  }>('/api/learning/quizzes/:id', async (req, reply) => {
    try {
      const { id } = req.params;
      const [quiz] = await sql`
        SELECT id, title, module, total_questions as "totalQuestions"
        FROM quizzes WHERE id = ${id}
      `;

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      const questions = await sql`
        SELECT 
          id, quiz_id as "quizId", question_number as "questionNumber",
          question, options, correct_option as "correctOption",
          explanation, distractor_rationales as "distractorRationales",
          is_flagged as "isFlagged", user_selected_option as "userSelectedOption"
        FROM quiz_questions
        WHERE quiz_id = ${id}
        ORDER BY question_number ASC
      `;

      return reply.send({ quiz, questions });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch quiz' });
    }
  });

  server.post<{
    Params: { id: string };

    Body: { questionId: string; selectedOption: string };

  }>('/api/learning/quizzes/:id/answer', async (req, reply) => {
    try {
      const { questionId, selectedOption } = req.body;
      const [question] = await sql`
        SELECT correct_option, explanation, distractor_rationales
        FROM quiz_questions
        WHERE id = ${questionId}
      `;

      if (!question) {
        return reply.status(404).send({ error: 'Question not found' });
      }

      const isCorrect = selectedOption.toUpperCase() === question.correct_option.toUpperCase();

      // Persist selection
      await sql`
        UPDATE quiz_questions
        SET user_selected_option = ${selectedOption}
        WHERE id = ${questionId}
      `;

      return reply.send({
        correct: isCorrect,
        correctOption: question.correct_option,
        explanation: question.explanation,
        distractorRationales: question.distractor_rationales
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to validate answer' });
    }
  });

  server.post<{
    Params: { id: string };

    Body: { questionId: string; isFlagged: boolean };

  }>('/api/learning/quizzes/:id/flag', async (req, reply) => {
    try {
      const { questionId, isFlagged } = req.body;
      await sql`
        UPDATE quiz_questions
        SET is_flagged = ${isFlagged}
        WHERE id = ${questionId}
      `;
      return reply.send({ success: true, questionId, isFlagged });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to toggle flag' });
    }
  });

  // ----------------------------------------------------
  // PROCTORED EXAM ENGINE & FOCUS LOCK
  // ----------------------------------------------------
  server.get('/api/learning/exams/session', async (_req, reply) => {
    try {
      const [session] = await sql`
        SELECT 
          id, title, module, session_token as "sessionToken",
          total_questions as "totalQuestions", current_question_number as "currentQuestionNumber",
          time_remaining_seconds as "timeRemainingSeconds", total_seconds as "totalSeconds",
          status, score, answers, flagged, integrity_logs as "integrityLogs"
        FROM exam_sessions
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!session) {
        return reply.status(404).send({ error: 'No active exam session' });
      }

      const questions = await sql`
        SELECT 
          id, question_number as "questionNumber", question, options
        FROM quiz_questions
        WHERE quiz_id = 'quiz-neurophys'
        ORDER BY question_number ASC
        LIMIT 20
      `;

      return reply.send({ session, questions });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch exam session' });
    }
  });

  server.post<{
    Params: { id: string };

    Body: { eventType: string; details?: string };

  }>('/api/learning/exams/session/:id/integrity', async (req, reply) => {
    try {
      const { id } = req.params;
      const { eventType, details = 'Browser focus lost or tab switched' } = req.body;

      const logEntry = {
        id: `viol-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType,
        details
      };


      await sql`
        UPDATE exam_sessions
        SET 
          integrity_logs = integrity_logs || ${JSON.stringify([logEntry])}::jsonb,
          updated_at = NOW()
        WHERE id = ${id}
      `;

      const [updated] = await sql`
        SELECT jsonb_array_length(integrity_logs) as count FROM exam_sessions WHERE id = ${id}
      `;

      return reply.send({
        logged: true,
        violationsCount: updated?.count ?? 1,
        entry: logEntry
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to record integrity violation' });
    }
  });

  server.post<{
    Params: { id: string };

    Body: { answers: Record<string, string>; timeRemainingSeconds: number };

  }>('/api/learning/exams/session/:id/finish', async (req, reply) => {
    try {
      const { id } = req.params;
      const { answers, timeRemainingSeconds } = req.body;

      await sql`
        UPDATE exam_sessions
        SET 
          status = 'submitted', 
          answers = ${JSON.stringify(answers)}::jsonb,
          time_remaining_seconds = ${timeRemainingSeconds},
          updated_at = NOW()
        WHERE id = ${id}
      `;

      return reply.send({
        success: true,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        totalAnswered: Object.keys(answers).length
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to finalize exam' });
    }
  });

  // ----------------------------------------------------
  // MEDIA (VIDEOS & AUDIOS) + SYNCHRONIZED TRANSCRIPTS
  // ----------------------------------------------------
  server.get<{
    Querystring: { type?: 'video' | 'audio' };

  }>('/api/learning/media', async (req, reply) => {
    try {
      const { type } = req.query;
      const media = type
        ? await sql`
            SELECT 
              id, type, title, subtitle, instructor, media_url as "mediaUrl",
              duration_seconds as "durationSeconds", current_timestamp_seconds as "currentTimestampSeconds",
              chapters, tags, banner_url as "bannerUrl"
            FROM media_items
            WHERE type = ${type}
            ORDER BY id ASC
          `
        : await sql`
            SELECT 
              id, type, title, subtitle, instructor, media_url as "mediaUrl",
              duration_seconds as "durationSeconds", current_timestamp_seconds as "currentTimestampSeconds",
              chapters, tags, banner_url as "bannerUrl"
            FROM media_items
            ORDER BY id ASC
          `;
      return reply.send({ media });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch media' });
    }
  });

  server.get<{
    Params: { id: string };

  }>('/api/learning/media/:id', async (req, reply) => {
    try {
      const { id } = req.params;
      const [media] = await sql`
        SELECT 
          id, type, title, subtitle, instructor, media_url as "mediaUrl",
          duration_seconds as "durationSeconds", current_timestamp_seconds as "currentTimestampSeconds",
          chapters, tags, banner_url as "bannerUrl"
        FROM media_items
        WHERE id = ${id}
      `;

      if (!media) {
        const [libItem] = await sql`
          SELECT id, name, file_type, storage_url, cover_image, created_at
          FROM library_items
          WHERE id = ${id}
          LIMIT 1
        `;
        if (libItem) {
          const fallbackMedia = {
            id: libItem.id,
            type: libItem.file_type === 'video' ? 'video' : 'audio',
            title: libItem.name,
            subtitle: 'Library Media',
            instructor: '',
            mediaUrl: libItem.storage_url,
            durationSeconds: 0,
            currentTimestampSeconds: 0,
            chapters: [],
            tags: [],
            bannerUrl: libItem.cover_image
          };
          return reply.send({ media: fallbackMedia, transcript: [] });
        }
        return reply.status(404).send({ error: 'Media item not found' });
      }

      const transcript = await sql`
        SELECT 
          id, media_id as "mediaId", start_time as "startTime", end_time as "endTime",
          formatted_time as "formattedTime", text, speaker, order_index as "orderIndex"
        FROM transcript_segments
        WHERE media_id = ${id}
        ORDER BY order_index ASC
      `;

      return reply.send({ media, transcript });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch media details' });
    }
  });

  server.put<{
    Params: { id: string };

    Body: { currentTimestampSeconds: number };

  }>('/api/learning/media/:id/progress', async (req, reply) => {
    try {
      const { id } = req.params;
      const { currentTimestampSeconds } = req.body;

      const [updated] = await sql`
        UPDATE media_items
        SET current_timestamp_seconds = ${currentTimestampSeconds}
        WHERE id = ${id}
        RETURNING id, current_timestamp_seconds as "currentTimestampSeconds"
      `;

      return reply.send({ media: updated });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to update media progress' });
    }
  });

  // ----------------------------------------------------
  // SAVED NOTES PERSISTENCE
  // ----------------------------------------------------
  server.post<{
    Body: { title?: string; content?: string; tags?: string[]; sourceContext?: string; parentId?: string | null; isDocument?: boolean };
  }>('/api/learning/notes', async (req, reply) => {
    try {
      const { title: rawTitle, content, tags = [], sourceContext = 'Workspace', parentId, isDocument } = req.body || {};
      const title = (rawTitle || 'Untitled Study Note').trim();
      const userId = getAuthUserId(req);

      // If requested as a document or content is not provided, create in learning_documents
      const docId = `doc-${Date.now()}`;
      const tabId = `tab-doc-${Date.now()}`;

      await sql`
        INSERT INTO learning_documents (
          id, tab_id, title, subtitle, icon_emoji, blocks_json
        ) VALUES (
          ${docId},
          ${tabId},
          ${title},
          'Study notes document',
          '📝',
          '[]'::jsonb
        )
      `;

      const noteId = `note-${Date.now()}`;
      const [note] = await sql`
        INSERT INTO saved_notes (id, title, content, tags, source_context)
        VALUES (${noteId}, ${title}, ${content || ''}, ${JSON.stringify(tags)}::jsonb, ${sourceContext})
        RETURNING id, title, content, tags, source_context as "sourceContext", created_at as "createdAt"
      `;

      await syncArtifactToLibrary(sql, {
        action: 'upsert',
        userId,
        artifactId: docId,
        name: title.endsWith('.md') ? title : `${title}.md`,
        fileType: 'note',
        parentId: parentId ?? null,
        icon: '📝',
        metrics: { tagsCount: tags.length }
      });

      return reply.status(201).send({
        id: docId,
        title,
        tabId,
        note
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to save note' });
    }
  });

  server.get('/api/learning/notes', async (_req, reply) => {
    try {
      const notes = await sql`
        SELECT id, title, content, tags, source_context as "sourceContext", created_at as "createdAt"
        FROM saved_notes
        ORDER BY created_at DESC
      `;
      return reply.send({ notes });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch notes' });
    }
  });

  // ----------------------------------------------------
  // CONTEXT-AWARE AI CHAT ENGINE
  // ----------------------------------------------------
  server.post<{
    Body: { contextType: string; message: string; contextData?: any };
  }>('/api/learning/ai/chat', async (req, reply) => {
    try {
      const { contextType, message, contextData } = req.body;

      // HARD ENFORCED BACKEND EXAM LOCKOUT
      if (contextType === 'exam') {
        return reply.status(403).send({
          locked: true,
          error: 'Integrity Violation: AI assistance locked during active proctored exam session.',
          reply: 'AI assistance is strictly locked during an active proctored examination. All inputs and browser focus changes are logged.'
        });
      }

      let responseText = '';
      let actionPill: { label: string; action: string; payload?: any } | undefined;

      // Extract document & selection context
      const selectedExcerptText = contextData?.selectedExcerpt?.text || '';
      const pageNumber = Number(contextData?.selectedExcerpt?.pageNumber || contextData?.currentPage || 1);
      const fileId = contextData?.selectedExcerpt?.fileId || contextData?.resourceId || contextData?.fileId;
      const resourceTitle = contextData?.selectedExcerpt?.fileName || contextData?.resourceTitle || '';

      let extractedDocText = '';
      let extractedSpeakerNotes = '';

      if (fileId) {
        try {
          const [fileRow] = await sql`
            SELECT id, filename, original_path as "originalPath", converted_pdf_path as "convertedPdfPath", file_type as "fileType", metadata
            FROM learning_files
            WHERE id = ${fileId}
            LIMIT 1
          `;
          if (fileRow) {
            const relPdfPath = fileRow.convertedPdfPath || (fileRow.originalPath?.endsWith('.pdf') ? fileRow.originalPath : null);
            if (relPdfPath) {
              const fullPdfPath = path.isAbsolute(relPdfPath) ? relPdfPath : path.resolve(ROOT_DIR, relPdfPath);
              extractedDocText = await extractPdfPageText(fullPdfPath, pageNumber);
            }
            if (fileRow.metadata && typeof fileRow.metadata === 'object') {
              const notesObj = (fileRow.metadata as any).speaker_notes;
              if (notesObj && typeof notesObj === 'object') {
                extractedSpeakerNotes = notesObj[pageNumber] || notesObj[String(pageNumber)] || '';
              }
            }
          }
        } catch (dbErr) {
          server.log.warn({ err: dbErr }, 'Failed to look up document metadata for AI chat');
        }
      }

      // ----------------------------------------------------
      // REAL GEMINI AI INTEGRATION (NO MOCKS / NO FALLBACKS)
      // ----------------------------------------------------
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!geminiApiKey) {
        return reply.status(502).send({
          statusCode: 502,
          error: 'Gemini API Offline: GEMINI_API_KEY is not configured.',
          diagnostic: 'Configure GEMINI_API_KEY in your environment to enable real-time generative grounding.',
          reply: '⚠️ **Gemini API Key Required (HTTP 502)**\n\nTo enable live generative AI grounding on document excerpts and slide notes, please configure `GEMINI_API_KEY` in your environment.\n\nAll static fallbacks have been strictly disabled.'
        });
      }

      try {
        const systemInstruction = `You are the SOS Learning Assistant, a clinical neuroscientist, board exam tutor, and technical research assistant. Provide concise, rigorous, high-yield academic explanations. Ground your responses directly in the user's active document context, extracted page text, slide notes, or selected excerpt when provided. Use Markdown formatting with bold terms for high-yield mechanisms and bullet points. Never provide filler.`;
        const combinedPrompt = `Tool Type: ${contextType}\nResource Title: ${resourceTitle || 'Neuroscience Academic Resource'}\nPage/Slide Number: ${pageNumber}\nSelected Excerpt: ${selectedExcerptText || 'None'}\nExtracted Page Text:\n${extractedDocText ? extractedDocText.slice(0, 1500) : 'None'}\nSpeaker Notes:\n${extractedSpeakerNotes || 'None'}\n\nUser Question: ${message}`;

        const aiGen = await generateText({
          model: google('gemini-2.5-flash'),
          system: systemInstruction,
          prompt: combinedPrompt
        });

        responseText = (aiGen.text || '').trim();
        if (!responseText) {
          throw new Error('Gemini upstream returned an empty response.');
        }

        if (selectedExcerptText) {
          actionPill = {
            label: '+ Add Excerpt as High-Yield Card',
            action: 'create_card',
            payload: {
              question: `Key concept regarding: ${selectedExcerptText.slice(0, 60)}...`,
              answerTitle: resourceTitle || 'Document Insight',
              answer: responseText.slice(0, 300),
              mechanismSnippet: selectedExcerptText.slice(0, 120),
              topicTag: 'STUDY • EXTRACT',
              subTopic: `Page ${pageNumber}`
            }
          };
        }
      } catch (genErr: any) {
        server.log.error({ err: genErr }, 'Gemini API generation failed');
        return reply.status(502).send({
          statusCode: 502,
          error: `Gemini API Error: ${genErr?.message || 'Generation failed'}`,
          diagnostic: genErr?.stack || String(genErr),
          reply: `⚠️ **Gemini API Error (HTTP 502)**\n\nFailed to generate response: ${genErr?.message || 'Upstream provider error'}.`
        });
      }

      return reply.send({
        reply: responseText,
        actionPill,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to process AI chat' });
    }
  });
  // ----------------------------------------------------
  // DUAL-LAYER NOTES & UNIVERSAL CANVAS HOST ENDPOINTS
  // ----------------------------------------------------
  server.get<{
    Params: { documentId: string };
  }>('/api/learning/notes/:documentId', async (req, reply) => {
    try {
      const { documentId } = req.params;
      const targetDocId = documentId === 'default' ? 'doc-synaptic-plasticity' : documentId;

      let [document] = await sql`
        SELECT 
          id, tab_id as "tabId", title, subtitle, cover_url as "coverUrl",
          icon_emoji as "iconEmoji", blocks_json as "blocksJson",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM learning_documents
        WHERE id = ${targetDocId}
      `;

      if (!document) {
        // Fallback to primary document
        [document] = await sql`
          SELECT 
            id, tab_id as "tabId", title, subtitle, cover_url as "coverUrl",
            icon_emoji as "iconEmoji", blocks_json as "blocksJson",
            created_at as "createdAt", updated_at as "updatedAt"
          FROM learning_documents
          LIMIT 1
        `;
      }

      const [canvasScene] = await sql`
        SELECT 
          id, resource_id as "resourceId", resource_type as "resourceType",
          elements_json as "elementsJson", app_state_json as "appStateJson",
          version, created_at as "createdAt", updated_at as "updatedAt"
        FROM learning_canvas_scenes
        WHERE resource_id = ${document ? document.id : targetDocId}
        LIMIT 1
      `;

      const anchors = canvasScene
        ? await sql`
            SELECT 
              id, canvas_scene_id as "canvasSceneId", canvas_element_id as "canvasElementId",
              linked_block_id as "linkedBlockId", snap_zone as "snapZone", offset_y as "offsetY"
            FROM learning_spatial_anchors
            WHERE canvas_scene_id = ${canvasScene.id}
          `
        : [];

      const resources = document
        ? await sql`
            SELECT 
              id, document_id as "documentId", title, type,
              thumbnail_url as "thumbnailUrl", content_payload as "contentPayload",
              order_index as "orderIndex"
            FROM learning_resources
            WHERE document_id = ${document.id}
            ORDER BY order_index ASC
          `
        : [];

      const aiMessages = document
        ? await sql`
            SELECT 
              id, document_id as "documentId", sender, content,
              executed_actions as "executedActions", created_at as "createdAt"
            FROM learning_ai_notes_messages
            WHERE document_id = ${document.id}
            ORDER BY created_at ASC
          `
        : [];

      if (document && typeof document.blocksJson === 'string') {
        try {
          document.blocksJson = JSON.parse(document.blocksJson);
        } catch (e) {
          console.error('Failed to parse document.blocksJson:', e);
        }
      }

      if (canvasScene && typeof canvasScene.elementsJson === 'string') {
        try {
          canvasScene.elementsJson = JSON.parse(canvasScene.elementsJson);
        } catch (e) {
          console.error('Failed to parse canvasScene.elementsJson:', e);
        }
      }

      return reply.send({
        document,
        canvasScene,
        anchors,
        resources,
        aiMessages
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch notes workspace' });
    }
  });

  server.patch<{
    Params: { documentId: string };
    Body: {
      title?: string;
      subtitle?: string;
      iconEmoji?: string;
      coverUrl?: string;
      blocksJson?: any[];
    };
  }>('/api/learning/notes/:documentId', async (req, reply) => {
    try {
      const { documentId } = req.params;
      const { title, subtitle, iconEmoji, coverUrl, blocksJson } = req.body;

      let updated;
      if (blocksJson !== undefined) {
        [updated] = await sql`
          UPDATE learning_documents
          SET 
            title = COALESCE(${title ?? null}, title),
            subtitle = COALESCE(${subtitle ?? null}, subtitle),
            icon_emoji = COALESCE(${iconEmoji ?? null}, icon_emoji),
            cover_url = COALESCE(${coverUrl ?? null}, cover_url),
            blocks_json = ${JSON.stringify(blocksJson)}::jsonb,
            updated_at = NOW()
          WHERE id = ${documentId}
          RETURNING 
            id, tab_id as "tabId", title, subtitle, cover_url as "coverUrl",
            icon_emoji as "iconEmoji", blocks_json as "blocksJson", updated_at as "updatedAt"
        `;
      } else {
        [updated] = await sql`
          UPDATE learning_documents
          SET 
            title = COALESCE(${title ?? null}, title),
            subtitle = COALESCE(${subtitle ?? null}, subtitle),
            icon_emoji = COALESCE(${iconEmoji ?? null}, icon_emoji),
            cover_url = COALESCE(${coverUrl ?? null}, cover_url),
            updated_at = NOW()
          WHERE id = ${documentId}
          RETURNING 
            id, tab_id as "tabId", title, subtitle, cover_url as "coverUrl",
            icon_emoji as "iconEmoji", blocks_json as "blocksJson", updated_at as "updatedAt"
        `;
      }

      if (updated && typeof updated.blocksJson === 'string') {
        try {
          updated.blocksJson = JSON.parse(updated.blocksJson);
        } catch (e) {}
      }

      return reply.send({ success: true, document: updated });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to update document' });
    }
  });

  server.patch<{
    Params: { documentId: string };
    Body: { blocksJson: any[]; title?: string; subtitle?: string };
  }>('/api/learning/notes/:documentId/blocks', async (req, reply) => {
    try {
      const { documentId } = req.params;
      const { blocksJson, title, subtitle } = req.body;

      const [updated] = await sql`
        UPDATE learning_documents
        SET 
          blocks_json = ${JSON.stringify(blocksJson)}::jsonb,
          title = COALESCE(${title ?? null}, title),
          subtitle = COALESCE(${subtitle ?? null}, subtitle),
          updated_at = NOW()
        WHERE id = ${documentId}
        RETURNING 
          id, tab_id as "tabId", title, subtitle, cover_url as "coverUrl",
          icon_emoji as "iconEmoji", blocks_json as "blocksJson", updated_at as "updatedAt"
      `;

      return reply.send({ success: true, document: updated });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to update document blocks' });
    }
  });

  server.patch<{
    Params: { resourceId: string };
    Body: { elementsJson?: any[]; appStateJson?: any; version?: number };
  }>('/api/learning/canvas/:resourceId', async (req, reply) => {
    try {
      const { resourceId } = req.params;
      const { elementsJson, appStateJson, version } = req.body;

      const [existing] = await sql`SELECT id FROM learning_canvas_scenes WHERE resource_id = ${resourceId}`;

      let scene;
      if (existing) {
        [scene] = await sql`
          UPDATE learning_canvas_scenes
          SET 
            elements_json = COALESCE(${elementsJson ? JSON.stringify(elementsJson) : null}::jsonb, elements_json),
            app_state_json = COALESCE(${appStateJson ? JSON.stringify(appStateJson) : null}::jsonb, app_state_json),
            version = COALESCE(${version ?? null}, version + 1),
            updated_at = NOW()
          WHERE resource_id = ${resourceId}
          RETURNING 
            id, resource_id as "resourceId", resource_type as "resourceType",
            elements_json as "elementsJson", app_state_json as "appStateJson",
            version, updated_at as "updatedAt"
        `;
      } else {
        const newSceneId = `scene-${Date.now()}`;
        [scene] = await sql`
          INSERT INTO learning_canvas_scenes (
            id, resource_id, resource_type, elements_json, app_state_json, version
          ) VALUES (
            ${newSceneId},
            ${resourceId},
            'note',
            ${JSON.stringify(elementsJson || [])}::jsonb,
            ${JSON.stringify(appStateJson || {})}::jsonb,
            ${version || 1}
          )
          RETURNING 
            id, resource_id as "resourceId", resource_type as "resourceType",
            elements_json as "elementsJson", app_state_json as "appStateJson",
            version, updated_at as "updatedAt"
        `;
      }

      return reply.send({ success: true, canvasScene: scene });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to persist canvas scene' });
    }
  });

  server.post<{
    Body: { documentId: string; title: string; type: string; contentPayload?: any };
  }>('/api/learning/resources', async (req, reply) => {
    try {
      const { documentId, title, type, contentPayload } = req.body;
      const resId = `res-${Date.now()}`;

      const [res] = await sql`
        INSERT INTO learning_resources (
          id, document_id, title, type, thumbnail_url, content_payload, order_index
        ) VALUES (
          ${resId},
          ${documentId},
          ${title},
          ${type},
          null,
          ${JSON.stringify(contentPayload || {})}::jsonb,
          (SELECT COALESCE(MAX(order_index), 0) + 1 FROM learning_resources WHERE document_id = ${documentId})
        )
        RETURNING id, document_id as "documentId", title, type, content_payload as "contentPayload"
      `;

      // If creating a sub-page, create sub-document in learning_documents and tab in learning_tabs
      if (type === 'page') {
        const subDocId = `doc-${Date.now()}`;
        const subTabId = `tab-doc-${Date.now()}`;

        await sql`
          INSERT INTO learning_documents (
            id, tab_id, title, subtitle, icon_emoji, blocks_json
          ) VALUES (
            ${subDocId},
            ${subTabId},
            ${title},
            'Sub-page notes document',
            '📄',
            '[]'::jsonb
          )
        `;

        await sql`
          INSERT INTO learning_tabs (
            id, tool_type, title, resource_id, active
          ) VALUES (
            ${subTabId},
            'notes',
            ${title.endsWith('.md') ? title : `${title}.md`},
            ${subDocId},
            true
          )
        `;

        return reply.send({ success: true, resource: res, subDocId, subTabId });
      }

      return reply.send({ success: true, resource: res });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to create learning resource' });
    }
  });

  server.post<{
    Body: { documentId: string; prompt: string; actionType?: string };
  }>('/api/learning/ai/chat/notes', async (req, reply) => {
    try {
      const { documentId = 'doc-synaptic-plasticity', prompt, actionType } = req.body;
      const userMsgId = `ai-note-${Date.now()}-u`;
      const assistantMsgId = `ai-note-${Date.now()}-a`;

      // 1. Record user message
      await sql`
        INSERT INTO learning_ai_notes_messages (
          id, document_id, sender, content, executed_actions
        ) VALUES (
          ${userMsgId},
          ${documentId},
          'user',
          ${prompt},
          '[]'::jsonb
        )
      `;

      let responseText = '';
      let executedAction: any = null;

      const pLower = prompt.toLowerCase();
      if (pLower.includes('retrograde') || pLower.includes('nitric oxide') || pLower.includes('no') || actionType === 'create_spatial_margin_card') {
        responseText = 'Nitric oxide synthase (NOS) is activated by Ca²⁺/Calmodulin to produce diffusible NO gas that travels retrogradely across the synaptic cleft to stimulate guanylyl cyclase in the presynaptic terminal, amplifying subsequent vesicle exocytosis.';
        executedAction = {
          action: 'create_spatial_margin_card',
          elementId: `elem-card-retrograde-${Date.now()}`,
          category: 'LOOP',
          title: 'Retrograde Loop',
          text: 'NO & BDNF diffuse retrogradely to amplify presynaptic transmitter release.',
          snapZone: 'right-margin',
          accentColor: '#34D399',
          label: 'Spatial note added to margin'
        };

        // Physically append to canvas scene in DB
        const [scene] = await sql`SELECT id, elements_json as "elementsJson" FROM learning_canvas_scenes WHERE resource_id = ${documentId}`;
        if (scene) {
          const currentElements = Array.isArray(scene.elementsJson) ? scene.elementsJson : [];
          const newCard = {
            id: executedAction.elementId,
            type: 'calloutNode',
            title: executedAction.title,
            accentColor: executedAction.accentColor,
            bottom: 96,
            right: 20,
            width: 224,
            text: executedAction.text,
            snapZone: 'right-margin',
            linkedBlockId: 'block-h2-retrograde'
          };
          currentElements.push(newCard);

          await sql`
            UPDATE learning_canvas_scenes
            SET elements_json = ${JSON.stringify(currentElements)}::jsonb
            WHERE id = ${scene.id}
          `;
        }
      } else if (pLower.includes('quantal') || pLower.includes('formula') || pLower.includes('equation')) {
        responseText = 'Quantal analysis states that total EPSP amplitude is the product of available release sites (n), release probability (p), and quantal size (q): **E = m · q**, where mean quantal content **m = n · p**.';
        executedAction = {
          action: 'insert_document_block',
          blockType: 'examKeyPoint',
          label: 'Formula block updated'
        };
      } else {
        responseText = `Grounded in **Synaptic Transmission & Plasticity**. I can insert document sections, calculate quantal parameters, or spawn magnetically snapped spatial sticky notes in the canvas margins.`;
      }

      // Record assistant message
      await sql`
        INSERT INTO learning_ai_notes_messages (
          id, document_id, sender, content, executed_actions
        ) VALUES (
          ${assistantMsgId},
          ${documentId},
          'assistant',
          ${responseText},
          ${JSON.stringify(executedAction || {})}::jsonb
        )
      `;

      return reply.send({
        reply: responseText,
        executedAction,
        messages: await sql`
          SELECT 
            id, document_id as "documentId", sender, content,
            executed_actions as "executedActions", created_at as "createdAt"
          FROM learning_ai_notes_messages
          WHERE document_id = ${documentId}
          ORDER BY created_at ASC
        `
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to process AI notes chat' });
    }
  });

  // Alias for /api/learning/notes/ai/chat (handling route path differences)
  server.post<{
    Body: { documentId?: string; prompt?: string; message?: string; actionType?: string };
  }>('/api/learning/notes/ai/chat', async (req, reply) => {
    try {
      const { documentId = 'doc-synaptic-plasticity', prompt, message, actionType } = req.body;
      const actualPrompt = prompt || message || '';
      const userMsgId = `ai-note-${Date.now()}-u`;
      const assistantMsgId = `ai-note-${Date.now()}-a`;

      // 1. Record user message
      await sql`
        INSERT INTO learning_ai_notes_messages (
          id, document_id, sender, content, executed_actions
        ) VALUES (
          ${userMsgId},
          ${documentId},
          'user',
          ${actualPrompt},
          '[]'::jsonb
        )
      `;

      let responseText = '';
      let executedAction: any = null;

      const pLower = actualPrompt.toLowerCase();
      if (pLower.includes('retrograde') || pLower.includes('nitric oxide') || pLower.includes('no') || actionType === 'create_spatial_margin_card') {
        responseText = 'Nitric oxide synthase (NOS) is activated by Ca²⁺/Calmodulin to produce diffusible NO gas that travels retrogradely across the synaptic cleft to stimulate guanylyl cyclase in the presynaptic terminal, amplifying subsequent vesicle exocytosis.';
        executedAction = {
          action: 'create_spatial_margin_card',
          elementId: `elem-card-retrograde-${Date.now()}`,
          category: 'LOOP',
          title: 'Retrograde Loop',
          text: 'NO & BDNF diffuse retrogradely to amplify presynaptic transmitter release.',
          snapZone: 'right-margin',
          accentColor: '#34D399',
          label: 'Spatial note added to margin'
        };

        const [scene] = await sql`SELECT id, elements_json as "elementsJson" FROM learning_canvas_scenes WHERE resource_id = ${documentId}`;
        if (scene) {
          const currentElements = Array.isArray(scene.elementsJson) ? scene.elementsJson : [];
          const newCard = {
            id: executedAction.elementId,
            type: 'calloutNode',
            title: executedAction.title,
            accentColor: executedAction.accentColor,
            bottom: 96,
            right: 20,
            width: 224,
            text: executedAction.text,
            snapZone: 'right-margin',
            linkedBlockId: 'block-h2-retrograde'
          };
          currentElements.push(newCard);

          await sql`
            UPDATE learning_canvas_scenes
            SET elements_json = ${JSON.stringify(currentElements)}::jsonb
            WHERE id = ${scene.id}
          `;
        }
      } else if (pLower.includes('quantal') || pLower.includes('formula') || pLower.includes('equation')) {
        responseText = 'Quantal analysis states that total EPSP amplitude is the product of available release sites (n), release probability (p), and quantal size (q): **E = m · q**, where mean quantal content **m = n · p**.';
        executedAction = {
          action: 'insert_document_block',
          blockType: 'examKeyPoint',
          label: 'Formula block updated'
        };
      } else {
        responseText = `Grounded in **Synaptic Transmission & Plasticity**. I can insert document sections, calculate quantal parameters, or spawn magnetically snapped spatial sticky notes in the canvas margins.`;
      }

      await sql`
        INSERT INTO learning_ai_notes_messages (
          id, document_id, sender, content, executed_actions
        ) VALUES (
          ${assistantMsgId},
          ${documentId},
          'assistant',
          ${responseText},
          ${JSON.stringify(executedAction || {})}::jsonb
        )
      `;

      return reply.send({
        reply: responseText,
        executedAction,
        messages: await sql`
          SELECT 
            id, document_id as "documentId", sender, content,
            executed_actions as "executedActions", created_at as "createdAt"
          FROM learning_ai_notes_messages
          WHERE document_id = ${documentId}
          ORDER BY created_at ASC
        `
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to process AI notes chat' });
    }
  });

  // =========================================================================
  // LEARNING TOOLS EXPANSION: FILES, CONVERSIONS, ANNOTATIONS & BOARDS
  // =========================================================================

  // 1. GET /api/learning/files - List all learning files for current user
  server.get('/api/learning/files', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const rows = await sql`
        SELECT 
          id, user_id as "userId", filename, mime_type as "mimeType", file_size as "fileSize",
          file_type as "fileType", converted_pdf_path as "convertedPdfPath",
          checksum, status, error_message as "errorMessage", page_count as "pageCount",
          metadata, created_at as "createdAt", updated_at as "updatedAt"
        FROM learning_files
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      return reply.send(rows);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch learning files' });
    }
  });

  // 2. GET /api/learning/files/:id - Get single file details with user isolation
  server.get('/api/learning/files/:id', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params as { id: string };
      const rows = await sql`
        SELECT 
          id, user_id as "userId", filename, original_path as "originalPath", mime_type as "mimeType",
          file_size as "fileSize", file_type as "fileType",
          converted_pdf_path as "convertedPdfPath", checksum, status,
          error_message as "errorMessage", page_count as "pageCount",
          metadata, created_at as "createdAt", updated_at as "updatedAt"
        FROM learning_files
        WHERE id = ${id} AND user_id = ${userId}
        LIMIT 1
      `;
      if (!rows.length) {
        const [libItem] = await sql`
          SELECT id, user_id, name, file_type, storage, created_at, updated_at
          FROM library_items
          WHERE id = ${id} AND (user_id = ${userId} OR user_id = 'default-user' OR user_id = 'scholar_abdalla_01')
          LIMIT 1
        `;
        if (libItem) {
          const storage = typeof libItem.storage === 'string' ? JSON.parse(libItem.storage) : (libItem.storage || {});
          const ROOT_DIR = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
          let diskPath = storage.storagePath || (storage.url ? path.join(ROOT_DIR, storage.url) : '');
          return reply.send({
            id: libItem.id,
            userId: libItem.user_id,
            filename: libItem.name,
            originalPath: diskPath,
            mimeType: libItem.file_type === 'pdf' ? 'application/pdf' : 'application/octet-stream',
            fileSize: storage.sizeBytes || 0,
            fileType: libItem.file_type,
            convertedPdfPath: storage.url || (diskPath ? `/uploads/library/files/${path.basename(diskPath)}` : null),
            checksum: '',
            status: 'ready',
            errorMessage: null,
            pageCount: 1,
            metadata: {},
            createdAt: libItem.created_at,
            updatedAt: libItem.updated_at,
            storage
          });
        }
        return reply.status(404).send({ error: 'File not found or unauthorized' });
      }
      return reply.send(rows[0]);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch file details' });
    }
  });

  // 3. GET /api/learning/files/:id/original - Download original file (DOCX, PPTX, PDF)
  server.get('/api/learning/files/:id/original', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params as { id: string };
      const rows = await sql`SELECT filename, original_path, mime_type FROM learning_files WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
      if (!rows.length || !fs.existsSync(rows[0].original_path)) {
        return reply.status(404).send({ error: 'Original file not found or unauthorized' });
      }
      const file = rows[0];
      const buffer = fs.readFileSync(file.original_path);
      return reply
        .header('Content-Type', file.mime_type)
        .header('Content-Disposition', makeContentDisposition('attachment', file.filename))
        .send(buffer);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to download original file' });
    }
  });

  // 4. GET /api/learning/files/:id/view-pdf - Stream derived or native PDF for viewing
  server.get('/api/learning/files/:id/view-pdf', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params as { id: string };
      const rows = await sql`
        SELECT filename, converted_pdf_path, original_path, file_type, status, error_message
        FROM learning_files
        WHERE id = ${id} AND user_id = ${userId}
        LIMIT 1
      `;
      if (!rows.length) {
        const [libItem] = await sql`
          SELECT id, user_id, name, file_type, storage, created_at, updated_at
          FROM library_items
          WHERE id = ${id} AND (user_id = ${userId} OR user_id = 'default-user' OR user_id = 'scholar_abdalla_01')
          LIMIT 1
        `;
        if (libItem) {
          const storage = typeof libItem.storage === 'string' ? JSON.parse(libItem.storage) : (libItem.storage || {});
          const ROOT_DIR = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
          let pdfPath = storage.storagePath;
          if (!pdfPath && storage.url) {
            pdfPath = path.join(ROOT_DIR, storage.url);
          }
          if (!pdfPath || !fs.existsSync(pdfPath)) {
            return reply.status(404).send({ error: 'File not found on disk' });
          }
          const buffer = fs.readFileSync(pdfPath);
          return reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', makeContentDisposition('inline', libItem.name))
            .send(buffer);
        }
        return reply.status(404).send({ error: 'File record not found or unauthorized' });
      }
      const item = rows[0];
      if (item.status === 'failed') {
        return reply.status(422).send({
          error: item.error_message || 'Document conversion failed. Original file is available for download.'
        });
      }

      let pdfPath = item.converted_pdf_path;
      if (!pdfPath && item.file_type === 'pdf') {
        pdfPath = item.original_path;
      }
      if (pdfPath && pdfPath.startsWith('/uploads')) {
        const ROOT_DIR = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
        pdfPath = path.join(ROOT_DIR, pdfPath);
      }
      if (!pdfPath || !fs.existsSync(pdfPath)) {
        return reply.status(404).send({ error: 'Derived PDF not ready or not found on disk' });
      }
      const buffer = fs.readFileSync(pdfPath);
      const viewName = item.filename.endsWith('.pdf') ? item.filename : `${item.filename}.pdf`;
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', makeContentDisposition('inline', viewName))
        .send(buffer);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to stream viewable PDF' });
    }
  });

  // 5. POST /api/learning/files/upload - Upload new document file with real conversion & dynamic metadata
  server.post('/api/learning/files/upload', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const data = await req.file();
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const originalFilename = data.filename;
      const ext = path.extname(originalFilename).toLowerCase();
      let fileType = 'pdf';
      if (ext === '.docx' || ext === '.doc') fileType = 'docx';
      else if (ext === '.pptx' || ext === '.ppt') fileType = 'slides';
      else if (ext === '.pdf') fileType = 'pdf';

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const savedPath = path.join(FILES_DIR, `${fileId}${ext}`);

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);
      fs.writeFileSync(savedPath, fileBuffer);

      const checksum = computeSha256(fileBuffer);

      // Dynamic metadata extraction
      const metadata: Record<string, any> = {};
      if (fileType === 'docx') {
        const sections = extractDocxHeadings(fileBuffer);
        metadata.sections = sections;
      } else if (fileType === 'slides') {
        const speakerNotes = extractPptxSpeakerNotes(fileBuffer);
        metadata.speakerNotes = speakerNotes;
      }

      let convertedPdfPath: string | null = null;
      let pageCount = 1;
      let status = 'ready';
      let errorMessage: string | null = null;

      if (fileType === 'pdf') {
        try {
          const pdfDoc = await PDFDocument.load(fileBuffer);
          pageCount = pdfDoc.getPageCount();
        } catch {
          pageCount = 1;
        }
        convertedPdfPath = `/uploads/learning/files/${fileId}${ext}`;
        status = 'ready';
      } else {
        // Check conversion cache first
        const cached = await sql`
          SELECT converted_pdf_path, page_count FROM learning_document_conversions
          WHERE source_checksum = ${checksum}
          LIMIT 1
        `;
        if (cached.length && fs.existsSync(path.join(ROOT_DIR, cached[0].converted_pdf_path))) {
          convertedPdfPath = cached[0].converted_pdf_path;
          pageCount = cached[0].page_count;
          status = 'ready';
          metadata.cached = true;
        } else {
          // Attempt resilient 3-tier document conversion (Gotenberg -> Local LibreOffice -> Pure Node Fallback)
          try {
            const gotenbergUrl = process.env.GOTENBERG_URL || 'http://127.0.0.1:3002';
            server.log.info({ gotenbergUrl, originalFilename }, 'Dispatching conversion request across 3-tier pipeline');
            const conversion = await convertDocumentToPdf(
              fileBuffer,
              originalFilename,
              fileType as 'docx' | 'slides',
              gotenbergUrl
            );
            const derivedFilename = `${fileId}-converted.pdf`;
            const derivedLocalPath = path.join(CONVERTED_DIR, derivedFilename);
            fs.writeFileSync(derivedLocalPath, conversion.pdfBuffer);

            convertedPdfPath = `/uploads/learning/converted/${derivedFilename}`;
            pageCount = conversion.pageCount;
            status = 'ready';
            metadata.converter = conversion.converter;

            await sql`
              INSERT INTO learning_document_conversions (
                id, source_checksum, source_filename, file_type, converted_pdf_path, page_count, metadata
              ) VALUES (
                ${'conv-' + fileId},
                ${checksum},
                ${originalFilename},
                ${fileType},
                ${convertedPdfPath},
                ${pageCount},
                ${JSON.stringify({ converter: conversion.converter, timestamp: new Date().toISOString() })}::jsonb
              )
              ON CONFLICT (source_checksum) DO UPDATE SET
                converted_pdf_path = EXCLUDED.converted_pdf_path,
                page_count = EXCLUDED.page_count
            `;
          } catch (convErr: any) {
            server.log.error({ convErr: convErr?.message }, 'Document conversion failed across all tiers');
            status = 'failed';
            errorMessage = convErr?.message || 'Conversion failed across all 3 tiers';
            convertedPdfPath = null;
            pageCount = 0;
            metadata.conversionError = errorMessage;
          }
        }
      }

      await sql`
        INSERT INTO learning_files (
          id, user_id, filename, original_path, mime_type, file_size, file_type,
          converted_pdf_path, checksum, status, error_message, page_count, metadata
        ) VALUES (
          ${fileId},
          ${userId},
          ${originalFilename},
          ${savedPath},
          ${data.mimetype},
          ${fileBuffer.length},
          ${fileType},
          ${convertedPdfPath},
          ${checksum},
          ${status},
          ${errorMessage},
          ${pageCount},
          ${JSON.stringify(metadata)}::jsonb
        )
      `;

      return reply.status(201).send({
        id: fileId,
        userId,
        filename: originalFilename,
        fileType,
        convertedPdfPath,
        pageCount,
        status,
        errorMessage,
        metadata
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to process file upload' });
    }
  });

  // 5b. POST /api/learning/files/create-blank - Create real blank document (PDF / DOCX / Slides)
  server.post<{
    Body: { fileType: 'pdf' | 'docx' | 'slides'; title?: string; parentId?: string | null };
  }>('/api/learning/files/create-blank', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { fileType = 'pdf', title: inputTitle, parentId } = req.body || {};
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      let originalFilename = '';
      let savedPath = '';
      let convertedPdfPath = '';
      let pageCount = 1;
      let mimeType = 'application/pdf';
      let fileBuffer: Buffer;
      const metadata: Record<string, any> = {};

      if (fileType === 'pdf') {
        originalFilename = inputTitle ? (inputTitle.endsWith('.pdf') ? inputTitle : `${inputTitle}.pdf`) : 'Untitled_Document.pdf';
        savedPath = path.join(FILES_DIR, `${fileId}.pdf`);
        mimeType = 'application/pdf';

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText(originalFilename.replace(/\.pdf$/i, ''), {
          x: 50,
          y: page.getHeight() - 60,
          size: 14,
          font,
          color: rgb(0.2, 0.2, 0.25)
        });
        const pdfBytes = await pdfDoc.save();
        fileBuffer = Buffer.from(pdfBytes);
        fs.writeFileSync(savedPath, fileBuffer);

        convertedPdfPath = `/uploads/learning/files/${fileId}.pdf`;
        pageCount = 1;
      } else if (fileType === 'docx') {
        originalFilename = inputTitle ? (inputTitle.endsWith('.docx') ? inputTitle : `${inputTitle}.docx`) : 'Untitled_Document.docx';
        savedPath = path.join(FILES_DIR, `${fileId}.docx`);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        const docxTitle = originalFilename.replace(/\.docx$/i, '');
        const validDocxBytes = buildValidDocxZip(docxTitle, ['Initial Section']);
        fs.writeFileSync(savedPath, validDocxBytes);
        fileBuffer = validDocxBytes;

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText(docxTitle, {
          x: 50,
          y: page.getHeight() - 60,
          size: 14,
          font,
          color: rgb(0.2, 0.2, 0.25)
        });
        const derivedPdfBytes = await pdfDoc.save();
        const derivedFilename = `${fileId}-converted.pdf`;
        const derivedPath = path.join(CONVERTED_DIR, derivedFilename);
        fs.writeFileSync(derivedPath, Buffer.from(derivedPdfBytes));

        convertedPdfPath = `/uploads/learning/converted/${derivedFilename}`;
        pageCount = 1;
        metadata.sections = ['Initial Section'];
      } else if (fileType === 'slides') {
        originalFilename = inputTitle ? (inputTitle.endsWith('.pptx') ? inputTitle : `${inputTitle}.pptx`) : 'Untitled_Presentation.pptx';
        savedPath = path.join(FILES_DIR, `${fileId}.pptx`);
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

        const slidesTitle = originalFilename.replace(/\.pptx$/i, '');
        const validPptxBytes = buildValidPptxZip(slidesTitle, [{ title: 'Slide 1', note: 'Presenter notes for slide 1.' }]);
        fs.writeFileSync(savedPath, validPptxBytes);
        fileBuffer = validPptxBytes;

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([960, 540]);
        page.drawRectangle({
          x: 0,
          y: 0,
          width: 960,
          height: 540,
          color: rgb(0.04, 0.04, 0.05)
        });
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText(slidesTitle, {
          x: 60,
          y: 440,
          size: 24,
          font,
          color: rgb(0.95, 0.95, 0.98)
        });
        const derivedPdfBytes = await pdfDoc.save();
        const derivedFilename = `${fileId}-converted.pdf`;
        const derivedPath = path.join(CONVERTED_DIR, derivedFilename);
        fs.writeFileSync(derivedPath, Buffer.from(derivedPdfBytes));

        convertedPdfPath = `/uploads/learning/converted/${derivedFilename}`;
        pageCount = 1;
        metadata.slideCount = 1;
        metadata.speakerNotes = { 1: 'Presenter notes for slide 1.' };
      } else {
        return reply.status(400).send({ error: `Unsupported blank file type: ${fileType}` });
      }

      const checksum = computeSha256(fileBuffer!);

      await sql`
        INSERT INTO learning_files (
          id, user_id, filename, original_path, mime_type, file_size, file_type,
          converted_pdf_path, checksum, status, error_message, page_count, metadata
        ) VALUES (
          ${fileId},
          ${userId},
          ${originalFilename},
          ${savedPath},
          ${mimeType},
          ${fileBuffer!.length},
          ${fileType},
          ${convertedPdfPath},
          ${checksum},
          'ready',
          null,
          ${pageCount},
          ${JSON.stringify(metadata)}::jsonb
        )
      `;

      await syncArtifactToLibrary(sql, {
        action: 'upsert',
        userId,
        artifactId: fileId,
        name: originalFilename,
        fileType: fileType as any,
        parentId: parentId ?? null,
        externalUrl: convertedPdfPath,
        metrics: { pageCount, fileSize: fileBuffer!.length }
      });

      return reply.status(201).send({
        id: fileId,
        userId,
        filename: originalFilename,
        fileType,
        convertedPdfPath,
        pageCount,
        status: 'ready',
        metadata
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to create blank file' });
    }
  });

  // 6. GET /api/learning/files/:id/annotations - Get all page annotations with user isolation
  server.get('/api/learning/files/:id/annotations', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params as { id: string };

      // Verify file ownership
      const fileOwner = await sql`SELECT id FROM learning_files WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
      if (!fileOwner.length) {
        return reply.status(404).send({ error: 'File not found or unauthorized' });
      }

      const rows = await sql`
        SELECT 
          id, user_id as "userId", file_id as "fileId", page_number as "pageNumber",
          elements_json as "elementsJson", app_state_json as "appStateJson",
          updated_at as "updatedAt"
        FROM learning_document_annotations
        WHERE file_id = ${id} AND user_id = ${userId}
        ORDER BY page_number ASC
      `;
      return reply.send(rows);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch file annotations' });
    }
  });

  // 7. GET /api/learning/files/:id/annotations/:page - Get single page annotations
  server.get('/api/learning/files/:id/annotations/:page', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id, page } = req.params as { id: string; page: string };
      const pageNum = parseInt(page, 10);

      const fileOwner = await sql`SELECT id FROM learning_files WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
      if (!fileOwner.length) {
        return reply.status(404).send({ error: 'File not found or unauthorized' });
      }

      const rows = await sql`
        SELECT 
          id, user_id as "userId", file_id as "fileId", page_number as "pageNumber",
          elements_json as "elementsJson", app_state_json as "appStateJson",
          updated_at as "updatedAt"
        FROM learning_document_annotations
        WHERE file_id = ${id} AND page_number = ${pageNum} AND user_id = ${userId}
        LIMIT 1
      `;
      if (!rows.length) {
        return reply.send({
          fileId: id,
          pageNumber: pageNum,
          elementsJson: [],
          appStateJson: {}
        });
      }
      return reply.send(rows[0]);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch page annotations' });
    }
  });

  // 8. PATCH /api/learning/files/:id/annotations/:page - Upsert single page annotations
  server.patch('/api/learning/files/:id/annotations/:page', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id, page } = req.params as { id: string; page: string };
      const pageNum = parseInt(page, 10);
      const body = req.body as {
        elementsJson?: any[];
        appStateJson?: any;
      };

      const fileOwner = await sql`SELECT id FROM learning_files WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
      if (!fileOwner.length) {
        return reply.status(404).send({ error: 'File not found or unauthorized' });
      }

      const annotId = `annot-${id}-p${pageNum}`;
      const elements = body.elementsJson || [];
      const appState = body.appStateJson || {};

      await sql`
        INSERT INTO learning_document_annotations (
          id, user_id, file_id, page_number, elements_json, app_state_json, updated_at
        ) VALUES (
          ${annotId},
          ${userId},
          ${id},
          ${pageNum},
          ${JSON.stringify(elements)}::jsonb,
          ${JSON.stringify(appState)}::jsonb,
          NOW()
        )
        ON CONFLICT (file_id, page_number) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          elements_json = EXCLUDED.elements_json,
          app_state_json = EXCLUDED.app_state_json,
          updated_at = NOW();
      `;

      return reply.send({
        success: true,
        fileId: id,
        pageNumber: pageNum,
        elementsCount: elements.length
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to save page annotations' });
    }
  });

  // 9. GET /api/learning/files/:id/export-annotated - Merge Deck annotations onto base PDF and download
  server.get('/api/learning/files/:id/export-annotated', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params as { id: string };

      const rows = await sql`
        SELECT filename, converted_pdf_path, original_path, file_type
        FROM learning_files
        WHERE id = ${id} AND user_id = ${userId}
        LIMIT 1
      `;
      if (!rows.length) {
        const [libItem] = await sql`
          SELECT id, user_id, name, file_type, storage_url, storage_size_bytes, created_at, updated_at
          FROM library_items
          WHERE id = ${id} AND user_id = ${userId}
          LIMIT 1
        `;
        if (libItem) {
          const ROOT_DIR = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
          const diskPath = libItem.storage_url ? path.join(ROOT_DIR, libItem.storage_url) : '';
          return reply.send({
            id: libItem.id,
            userId: libItem.user_id,
            filename: libItem.name,
            originalPath: diskPath,
            mimeType: libItem.file_type === 'pdf' ? 'application/pdf' : 'application/octet-stream',
            fileSize: libItem.storage_size_bytes || 0,
            fileType: libItem.file_type,
            convertedPdfPath: libItem.storage_url,
            checksum: '',
            status: 'ready',
            errorMessage: null,
            pageCount: 1,
            metadata: {},
            createdAt: libItem.created_at,
            updatedAt: libItem.updated_at,
            storage: {
              url: libItem.storage_url,
              sizeBytes: libItem.storage_size_bytes
            }
          });
        }
        return reply.status(404).send({ error: 'File not found or unauthorized' });
      }

      const item = rows[0];
      let pdfPath = item.converted_pdf_path;
      if (!pdfPath && item.file_type === 'pdf') {
        pdfPath = item.original_path;
      }
      if (pdfPath && pdfPath.startsWith('/uploads')) {
        const ROOT_DIR = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
        pdfPath = path.join(ROOT_DIR, pdfPath);
      }
      if (!pdfPath || !fs.existsSync(pdfPath)) {
        return reply.status(404).send({ error: 'Base PDF not found for export' });
      }

      const basePdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await PDFDocument.load(basePdfBytes);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const annotations = await sql`
        SELECT page_number as "pageNumber", elements_json as "elementsJson"
        FROM learning_document_annotations
        WHERE file_id = ${id} AND user_id = ${userId}
      `;

      for (const ann of annotations) {
        const pageIndex = ann.pageNumber - 1;
        if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue;
        const page = pdfDoc.getPage(pageIndex);
        const { width: pWidth, height: pHeight } = page.getSize();
        const elements = Array.isArray(ann.elementsJson) ? ann.elementsJson : [];

        for (const el of elements) {
          if (el.type === 'stickyCard' || el.type === 'calloutNode') {
            const cardW = el.width || 180;
            const cardH = 80;
            const cardX =
              el.left !== undefined
                ? Math.min(el.left, pWidth - cardW - 20)
                : el.right !== undefined
                ? pWidth - el.right - cardW
                : 20;
            const cardY = pHeight - (el.top || 180) - cardH;

            page.drawRectangle({
              x: Math.max(10, cardX),
              y: Math.max(10, cardY),
              width: cardW,
              height: cardH,
              color: rgb(0.08, 0.08, 0.1),
              borderColor: rgb(0.25, 0.5, 0.95),
              borderWidth: 1.2
            });

            const header = `${el.category || 'NOTE'}: ${el.title || el.subCategory || ''}`.trim();
            page.drawText(header.substring(0, 32), {
              x: Math.max(15, cardX + 8),
              y: Math.max(15, cardY + cardH - 16),
              size: 8,
              font: fontBold,
              color: rgb(0.4, 0.7, 1.0)
            });

            const bodyText = (el.text || '').replace(/\n/g, ' ');
            page.drawText(bodyText.substring(0, 95), {
              x: Math.max(15, cardX + 8),
              y: Math.max(15, cardY + cardH - 32),
              size: 7,
              font: fontRegular,
              color: rgb(0.9, 0.9, 0.92)
            });
          } else if (el.type === 'rectangle') {
            const rx = el.x || 50;
            const ry = pHeight - (el.y || 50) - (el.height || 40);
            page.drawRectangle({
              x: Math.max(0, rx),
              y: Math.max(0, ry),
              width: el.width || 80,
              height: el.height || 40,
              borderColor: rgb(0.2, 0.6, 1.0),
              borderWidth: el.strokeWidth || 1.5
            });
          } else if (el.type === 'text' && el.text) {
            const tx = el.x || 50;
            const ty = pHeight - (el.y || 50) - (el.fontSize || 12);
            page.drawText(el.text, {
              x: Math.max(0, tx),
              y: Math.max(0, ty),
              size: Math.min(el.fontSize || 12, 16),
              font: fontRegular,
              color: rgb(0.92, 0.92, 0.95)
            });
          }
        }
      }

      const annotatedBytes = await pdfDoc.save();
      const outFilename = `${item.filename.replace(/\.[^/.]+$/, '')}_annotated.pdf`;
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', makeContentDisposition('attachment', outFilename))
        .send(Buffer.from(annotatedBytes));
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate annotated PDF export' });
    }
  });

  // 10. GET /api/learning/boards - List all standalone visual boards for current user
  server.get('/api/learning/boards', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const rows = await sql`
        SELECT 
          id, user_id as "userId", title, thumbnail_url as "thumbnailUrl",
          CASE WHEN jsonb_typeof(elements_json) = 'array' THEN jsonb_array_length(elements_json) ELSE 0 END as "elementsCount",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM learning_boards
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;
      return reply.send(rows);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch boards' });
    }
  });

  // 11. POST /api/learning/boards - Create a new standalone board for current user
  server.post('/api/learning/boards', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const body = req.body as { title?: string; elementsJson?: any[]; appStateJson?: any; parentId?: string | null };
      const boardId = `board-${Date.now()}`;
      const title = (body.title || 'Untitled Board').trim();
      const elements = body.elementsJson || [];
      const appState = body.appStateJson || { viewBackgroundColor: '#0A0A0A' };

      await sql`
        INSERT INTO learning_boards (
          id, user_id, title, elements_json, app_state_json
        ) VALUES (
          ${boardId},
          ${userId},
          ${title},
          ${JSON.stringify(elements)}::jsonb,
          ${JSON.stringify(appState)}::jsonb
        )
      `;

      await syncArtifactToLibrary(sql, {
        action: 'upsert',
        userId,
        artifactId: boardId,
        name: `${title}.board`,
        fileType: 'board',
        parentId: body.parentId ?? null,
        icon: '📋',
        metrics: { elementsCount: elements.length }
      });

      return reply.status(201).send({
        id: boardId,
        userId,
        title,
        elementsCount: elements.length
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to create board' });
    }
  });

  // 12. GET /api/learning/boards/:id - Get single board details with user isolation
  server.get('/api/learning/boards/:id', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params as { id: string };
      const rows = await sql`
        SELECT 
          id, user_id as "userId", title, elements_json as "elementsJson", app_state_json as "appStateJson",
          files_json as "filesJson",
          thumbnail_url as "thumbnailUrl", created_at as "createdAt", updated_at as "updatedAt"
        FROM learning_boards
        WHERE id = ${id} AND user_id = ${userId}
        LIMIT 1
      `;
      if (!rows.length) {
        return reply.status(404).send({ error: 'Board not found or unauthorized' });
      }
      return reply.send(rows[0]);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch board' });
    }
  });

  // 13. PATCH /api/learning/boards/:id - Update board title, elements, or app state with user isolation
  server.patch('/api/learning/boards/:id', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params as { id: string };
      const body = req.body as {
        title?: string;
        elementsJson?: any[];
        appStateJson?: any;
        filesJson?: Record<string, any>;
        thumbnailUrl?: string;
      };

      const existing = await sql`SELECT id, title FROM learning_boards WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
      if (!existing.length) {
        return reply.status(404).send({ error: 'Board not found or unauthorized' });
      }

      await sql`
        UPDATE learning_boards
        SET
          title = COALESCE(${body.title ?? null}, title),
          elements_json = CASE WHEN ${body.elementsJson !== undefined} THEN ${JSON.stringify(body.elementsJson || [])}::jsonb ELSE elements_json END,
          app_state_json = CASE WHEN ${body.appStateJson !== undefined} THEN ${JSON.stringify(body.appStateJson || {})}::jsonb ELSE app_state_json END,
          files_json = CASE WHEN ${body.filesJson !== undefined} THEN ${JSON.stringify(body.filesJson || {})}::jsonb ELSE files_json END,
          thumbnail_url = COALESCE(${body.thumbnailUrl ?? null}, thumbnail_url),
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (body.title || body.thumbnailUrl) {
        await syncArtifactToLibrary(sql, {
          action: 'upsert',
          userId,
          artifactId: id,
          name: body.title ? `${body.title}.board` : `${existing[0].title}.board`,
          fileType: 'board',
          coverImage: body.thumbnailUrl
        });
      }

      return reply.send({ success: true, id });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to update board' });
    }
  });

  // 14. DELETE /api/learning/boards/:id - Delete a board with user isolation
  server.delete('/api/learning/boards/:id', async (req, reply) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params as { id: string };
      const existing = await sql`SELECT id FROM learning_boards WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
      if (!existing.length) {
        return reply.status(404).send({ error: 'Board not found or unauthorized' });
      }

      await sql`DELETE FROM learning_boards WHERE id = ${id} AND user_id = ${userId}`;

      await syncArtifactToLibrary(sql, {
        action: 'delete',
        userId,
        artifactId: id,
        fileType: 'board'
      });

      return reply.send({ success: true, id });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to delete board' });
    }
  });
};
