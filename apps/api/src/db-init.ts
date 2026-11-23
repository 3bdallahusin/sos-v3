import { getSqlClient } from './db.js';
import { initLearningDocsTables, seedLearningDocsData } from './learning-docs.js';
import { seedRealisticData } from './seed-realistic.js';

export async function initializeDatabase() {
  const sql = getSqlClient();

  // 1. Create Tables
  await sql`
    CREATE TABLE IF NOT EXISTS learning_tabs (
      id TEXT PRIMARY KEY,
      tool_type TEXT NOT NULL,
      title TEXT NOT NULL,
      resource_id TEXT,
      active BOOLEAN NOT NULL DEFAULT false,
      saved_state JSONB,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE learning_tabs ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;`;

  await sql`
    CREATE TABLE IF NOT EXISTS flashcard_decks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      total_cards INTEGER NOT NULL DEFAULT 0,
      learning_count INTEGER NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      mastered_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
      topic_tag TEXT NOT NULL,
      sub_topic TEXT NOT NULL,
      question TEXT NOT NULL,
      answer_title TEXT NOT NULL,
      answer TEXT NOT NULL,
      mechanism_snippet TEXT,
      source_reference TEXT,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval REAL NOT NULL DEFAULT 1.0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'learning',
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      module TEXT NOT NULL,
      total_questions INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      question_number INTEGER NOT NULL,
      question TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_option TEXT NOT NULL,
      explanation TEXT NOT NULL,
      distractor_rationales JSONB,
      is_flagged BOOLEAN NOT NULL DEFAULT false,
      user_selected_option TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      module TEXT NOT NULL,
      session_token TEXT NOT NULL,
      total_questions INTEGER NOT NULL DEFAULT 20,
      current_question_number INTEGER NOT NULL DEFAULT 1,
      time_remaining_seconds INTEGER NOT NULL DEFAULT 2535,
      total_seconds INTEGER NOT NULL DEFAULT 2700,
      status TEXT NOT NULL DEFAULT 'active',
      score INTEGER NOT NULL DEFAULT 0,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      flagged JSONB NOT NULL DEFAULT '{}'::jsonb,
      integrity_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      instructor TEXT,
      media_url TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      current_timestamp_seconds INTEGER NOT NULL DEFAULT 0,
      chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      banner_url TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transcript_segments (
      id TEXT PRIMARY KEY,
      media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
      start_time REAL NOT NULL,
      end_time REAL NOT NULL,
      formatted_time TEXT NOT NULL,
      text TEXT NOT NULL,
      speaker TEXT,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS study_materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      meta_text TEXT NOT NULL,
      last_opened TEXT NOT NULL,
      resource_id TEXT,
      target_tool_name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      source_context TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS learning_blocks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      domain TEXT NOT NULL,
      topic TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_learning_blocks_date ON learning_blocks(date);
  `;

  // --- UNIFIED USER DOMAINS, USER TOPICS, & STUDY SESSIONS TABLES ---
  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY DEFAULT 'default-user',
      name TEXT NOT NULL DEFAULT 'Abdalla Husin',
      username TEXT NOT NULL DEFAULT '@abdalla7usin',
      email TEXT NOT NULL DEFAULT 'Plato428@Athens.com',
      bio TEXT NOT NULL DEFAULT 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.',
      location TEXT NOT NULL DEFAULT 'Mansoura, Egypt',
      education TEXT NOT NULL DEFAULT 'Mansoura University',
      cover_image TEXT DEFAULT 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
      avatar_url TEXT DEFAULT 'https://lh3.googleusercontent.com/aida/ALJJyrBE6EhsHOqBp174KlEE0XrgpcMjQmblnn2X7vXwDJVOKYPKb7yDZ06Vw_NqRcsrxOTsrvWRxDQX_0hgDLbZ2XZM7agGIy8rbv8bYGWpaF2d30oXkxqAisUNXabuoiebdVqFtSLIzj8vaZjVK-aSHuO3rGxN6TKHDCpJKjXzUfwMEsiIP42arHCi1DVwgFwpbkHrHihNRxcMxFhP6g71n-Ej2xAqvNVjJ8X9dDARkQt3DmGe0NVBhLB-3fYriiCAu3BiIg',
      learning_focus TEXT NOT NULL DEFAULT 'Computer Science & Cognitive Systems',
      plan TEXT NOT NULL DEFAULT 'Free',
      joined_date TEXT NOT NULL DEFAULT 'November 2026',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    INSERT INTO user_profiles (id, name, username, email, bio, location, education, cover_image, avatar_url, learning_focus, plan, joined_date)
    VALUES (
      'default-user',
      'Abdalla Husin',
      '@abdalla7usin',
      'Plato428@Athens.com',
      'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.',
      'Mansoura, Egypt',
      'Mansoura University',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
      'https://lh3.googleusercontent.com/aida/ALJJyrBE6EhsHOqBp174KlEE0XrgpcMjQmblnn2X7vXwDJVOKYPKb7yDZ06Vw_NqRcsrxOTsrvWRxDQX_0hgDLbZ2XZM7agGIy8rbv8bYGWpaF2d30oXkxqAisUNXabuoiebdVqFtSLIzj8vaZjVK-aSHuO3rGxN6TKHDCpJKjXzUfwMEsiIP42arHCi1DVwgFwpbkHrHihNRxcMxFhP6g71n-Ej2xAqvNVjJ8X9dDARkQt3DmGe0NVBhLB-3fYriiCAu3BiIg',
      'Computer Science & Cognitive Systems',
      'Free',
      'November 2026'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.';`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Mansoura, Egypt';`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS education TEXT NOT NULL DEFAULT 'Mansoura University';`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS joined_date TEXT NOT NULL DEFAULT 'November 2026';`;

  await sql`
    CREATE TABLE IF NOT EXISTS user_domains (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default-user',
      name TEXT NOT NULL,
      color_token TEXT NOT NULL DEFAULT 'accent-100',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, name)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_topics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default-user',
      domain_id TEXT NOT NULL REFERENCES user_domains(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, domain_id, name)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default-user',
      title TEXT NOT NULL,
      domain_id TEXT REFERENCES user_domains(id) ON DELETE SET NULL,
      domain_name TEXT NOT NULL,
      topic_id TEXT REFERENCES user_topics(id) ON DELETE SET NULL,
      topic_name TEXT,
      status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'missed', 'cancelled')),
      source TEXT NOT NULL CHECK (source IN ('calendar', 'timer_adhoc', 'historical_manual')),
      date TEXT NOT NULL, -- YYYY-MM-DD
      planned_start_time TEXT, -- HH:mm (24h)
      planned_end_time TEXT,   -- HH:mm (24h)
      planned_duration_minutes INTEGER NOT NULL,
      actual_start_timestamp BIGINT, -- epoch ms
      actual_end_timestamp BIGINT,   -- epoch ms
      actual_focus_seconds INTEGER NOT NULL DEFAULT 0,
      actual_break_seconds INTEGER NOT NULL DEFAULT 0,
      timer_mode TEXT NOT NULL DEFAULT 'countdown' CHECK (timer_mode IN ('countdown', 'stopwatch')),
      pause_intervals JSONB NOT NULL DEFAULT '[]'::jsonb,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      series_id TEXT,
      recurrence_rule JSONB,
      is_series_exception BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, date);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status ON study_sessions(user_id, status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_study_sessions_series ON study_sessions(user_id, series_id);`;

  // --- DUAL-LAYER NOTES & UNIVERSAL CANVAS HOST TABLES ---
  await sql`
    CREATE TABLE IF NOT EXISTS learning_documents (
      id TEXT PRIMARY KEY,
      tab_id TEXT,
      title TEXT NOT NULL,
      subtitle TEXT,
      cover_url TEXT,
      icon_emoji TEXT NOT NULL DEFAULT '🧠',
      blocks_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS learning_canvas_scenes (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      resource_type TEXT NOT NULL DEFAULT 'note',
      elements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      app_state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS learning_spatial_anchors (
      id TEXT PRIMARY KEY,
      canvas_scene_id TEXT NOT NULL REFERENCES learning_canvas_scenes(id) ON DELETE CASCADE,
      canvas_element_id TEXT NOT NULL,
      linked_block_id TEXT NOT NULL,
      snap_zone TEXT NOT NULL,
      offset_y REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS learning_resources (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES learning_documents(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      thumbnail_url TEXT,
      content_payload JSONB,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS learning_ai_notes_messages (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      executed_actions JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 2. Check if seed data exists
  const existingDecks = await sql`SELECT count(*)::int as count FROM flashcard_decks`;
  if (existingDecks[0].count === 0) {
    await seedAcademicData();
  }

  const existingDocs = await sql`SELECT count(*)::int as count FROM learning_documents`;
  if (existingDocs[0].count === 0) {
    await seedNotesData();
  }

  const existingBlocks = await sql`SELECT count(*)::int as count FROM learning_blocks`;
  if (existingBlocks[0].count === 0) {
    await seedCalendarData();
  }

  // 2b. Initialize & Seed Study Sessions, Domains & Topics
  await seedStudySessionsData(sql);

  // 3. Initialize Learning Documents Expansion Tables (PDF, DOCX, Slides, Board)
  await initLearningDocsTables(sql);

  // Purge legacy seeded mock files, mock tabs, and mock study materials
  try {
    await sql`
      DELETE FROM learning_files 
      WHERE id IN ('file-kandel-pdf', 'file-plasticity-docx', 'file-neuro-slides-pptx');
    `;
    await sql`
      DELETE FROM learning_document_conversions
      WHERE id IN ('conv-docx-plasticity', 'conv-pptx-neuro');
    `;
    await sql`
      DELETE FROM learning_boards
      WHERE id IN ('board-neuro-mindmap', 'board-snare-cycle');
    `;
    await sql`
      DELETE FROM learning_tabs
      WHERE id IN ('tab-pdf-kandel', 'tab-docx-plasticity', 'tab-slides-neuro', 'tab-board-mindmap')
         OR resource_id IN ('file-kandel-pdf', 'file-plasticity-docx', 'file-neuro-slides-pptx', 'board-neuro-mindmap');
    `;
    await sql`
      DELETE FROM study_materials
      WHERE id IN ('mat-1', 'mat-docx-plasticity', 'mat-slides-neuro', 'mat-board-mindmap');
    `;
    // Ensure at least one clean New Tab exists
    const [existingTab] = await sql`SELECT id FROM learning_tabs LIMIT 1`;
    if (!existingTab) {
      await sql`
        INSERT INTO learning_tabs (id, tool_type, title, active, position)
        VALUES ('tab-new-tab', 'new_tab', 'New Tab', true, 0)
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  } catch (purgeErr) {
    console.warn('[db-init] Mock purge note:', purgeErr);
  }
}

async function seedAcademicData() {
  const sql = getSqlClient();

  // --- Seed Initial Workspace Tabs ---
  await sql`
    INSERT INTO learning_tabs (id, tool_type, title, active)
    VALUES
      ('tab-new-tab', 'new-tab', 'New Tab', true)
    ON CONFLICT (id) DO NOTHING;
  `;

  // --- Seed Study Materials (Recent Resources shown on New Tab) ---
  await sql`
    INSERT INTO study_materials (id, title, type, meta_text, last_opened, resource_id, target_tool_name, order_index)
    VALUES
      ('mat-1', 'Kandel_Principles_Ch12.pdf', 'pdf', 'Opened 18 mins ago • Page 42', '18 mins ago', 'file-kandel-ch12', 'PDF Reader', 1),
      ('mat-2', 'SNARE Proteins Deck', 'flashcards', '34 Cards • 86% Mastered', '2 hours ago', 'deck-snare', 'Flashcards', 2),
      ('mat-3', 'LTP & Synaptic Plasticity Notes', 'notes', 'Edited yesterday • 1,420 words', 'Yesterday', 'note-ltp-plasticity', 'Notes', 3),
      ('mat-4', 'Neurobiology Lecture 08 — Vesicle Fusion', 'videos', 'Watched 42:15 / 58:00', '3 days ago', 'media-stanford-neuro-vid', 'Videos', 4)
    ON CONFLICT (id) DO NOTHING;
  `;

  // --- Seed Flashcard Decks & 30+ High-Yield Cards ---
  // Deck 1: CaMKII Receptor Kinetics & Synaptic Plasticity (Neuroscience)
  await sql`
    INSERT INTO flashcard_decks (id, title, topic, total_cards, learning_count, review_count, mastered_count)
    VALUES
      ('deck-camkii', 'CaMKII_Receptor_Kinetics', 'Neuroscience • Ch. 12', 16, 3, 5, 8),
      ('deck-snare', 'SNARE Machinery & Fusion Kinetics', 'Neurobiology • Cellular Biophysics', 15, 2, 4, 9),
      ('deck-raft', 'Raft Consensus & Distributed Log Replication', 'Computer Science • CS 244B', 15, 4, 4, 7)
    ON CONFLICT (id) DO NOTHING;
  `;

  // Cards for Deck 1
  const deck1Cards = [
    {
      id: 'card-1',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • MOLECULAR BIOLOGY',
      subTopic: 'Long-Term Potentiation (LTP)',
      question: 'Which receptor acts as the primary molecular coincidence detector for glutamate release and post-synaptic depolarization during induction of LTP in hippocampal CA1 neurons?',
      answerTitle: 'The NMDA Receptor (NMDAR)',
      answer: 'At resting potential, the pore of the NMDA receptor is blocked by extracellular Mg²⁺ ions. When the postsynaptic membrane is sufficiently depolarized (via AMPA receptors), the Mg²⁺ is expelled electrostatically, allowing Ca²⁺ influx only when glutamate binding and depolarization happen simultaneously.',
      mechanismSnippet: 'Ca²⁺ activates CaMKII & PKC → retrogradely triggers NO & BDNF.',
      sourceReference: 'Verified by Kandel Ch. 12 • Ref: Neuroanatomy Atlas § 14.3',
      easeFactor: 2.5,
      interval: 1.0,
      repetitions: 2,
      status: 'review',
      orderIndex: 1
    },
    {
      id: 'card-2',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • BIOCHEMISTRY',
      subTopic: 'Autonomous Kinase Activation',
      question: 'What is the critical molecular event that converts CaMKII from a transiently activated enzyme to a persistently autonomous kinase in LTP?',
      answerTitle: 'Autophosphorylation at Threonine 286 (Thr286)',
      answer: 'Inter-subunit autophosphorylation at Thr286 within the regulatory domain prevents re-binding of the autoinhibitory domain to the catalytic core, locking the subunit in an active state even after intracellular Ca²⁺/Calmodulin dissociates.',
      mechanismSnippet: 'Permits autonomous phosphorylation of AMPA receptor Ser831.',
      sourceReference: 'Kandel Principles Ch. 12, p. 289',
      easeFactor: 2.6,
      interval: 4.0,
      repetitions: 4,
      status: 'mastered',
      orderIndex: 2
    },
    {
      id: 'card-3',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • ELECTROPHYSIOLOGY',
      subTopic: 'AMPA Receptor Trafficking',
      question: 'How does activated CaMKII enhance the single-channel conductance of existing postsynaptic AMPA receptors?',
      answerTitle: 'Phosphorylation of GluA1 Subunits at Serine 831',
      answer: 'CaMKII directly phosphorylates the GluA1 subunit at Ser831, inducing a conformational change that increases the open-probability and converts the channel into a high-conductance substate (~28 pS).',
      mechanismSnippet: 'Also triggers exocytosis of extrasynaptic AMPAR reserves into the PSD.',
      sourceReference: 'Bear, Connors & Paradiso § 25.2',
      easeFactor: 2.4,
      interval: 1.0,
      repetitions: 1,
      status: 'learning',
      orderIndex: 3
    },
    {
      id: 'card-4',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • SYNAPTIC TRANSMISSION',
      subTopic: 'Retrograde Messengers',
      question: 'Which retrograde gas messenger is synthesized in the postsynaptic spine and diffuses presynaptically to increase neurotransmitter release probability?',
      answerTitle: 'Nitric Oxide (NO)',
      answer: 'Postsynaptic Ca²⁺-calmodulin activates neuronal nitric oxide synthase (nNOS), generating NO gas that rapidly permeates presynaptic boutons and stimulates soluble guanylyl cyclase (sGC) to elevate cGMP.',
      mechanismSnippet: 'Elevated presynaptic cGMP promotes vesicle mobilization and priming.',
      sourceReference: 'Snyder & Dawson Neurochem Rev 2024',
      easeFactor: 2.5,
      interval: 6.0,
      repetitions: 3,
      status: 'mastered',
      orderIndex: 4
    },
    {
      id: 'card-5',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • PHARMACOLOGY',
      subTopic: 'Receptor Antagonism',
      question: 'What is the effect of applying the competitive antagonist D-APV (AP5) prior to a 100 Hz high-frequency tetanus?',
      answerTitle: 'Complete Blockade of LTP Induction with Intact Baseline Transmission',
      answer: 'D-APV selectively blocks the glutamate-binding site on NMDA receptors. Low-frequency baseline synaptic transmission (mediated by AMPA receptors) remains intact, but LTP cannot be induced.',
      mechanismSnippet: 'D-APV applied after tetanus fails to reverse established LTP.',
      sourceReference: 'Kandel Principles Ch. 12, Fig 12-4',
      easeFactor: 2.5,
      interval: 1.0,
      repetitions: 2,
      status: 'review',
      orderIndex: 5
    },
    {
      id: 'card-6',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • CELLULAR NEUROSCIENCE',
      subTopic: 'Synaptic Tagging & Capture',
      question: 'What hypothesis explains how cell-wide transcription products are selectively routed only to potentiated synapses during late-LTP?',
      answerTitle: 'The Frey-Morris Synaptic Tagging and Capture Hypothesis',
      answer: 'Strong synaptic stimulation sets a local, transient molecular "tag" (involving PKA, MAPK, and actin rearrangement). Newly synthesized PRPs (plasticity-related proteins) from the soma are captured exclusively at tagged synapses.',
      mechanismSnippet: 'Tags decay within 1-2 hours if PRPs are not captured in time.',
      sourceReference: 'Frey & Morris, Nature 1997',
      easeFactor: 2.7,
      interval: 4.0,
      repetitions: 4,
      status: 'mastered',
      orderIndex: 6
    },
    {
      id: 'card-7',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • MOLECULAR BIOLOGY',
      subTopic: 'Transcriptional Regulators',
      question: 'Which transcription factor is phosphorylated at Ser133 to initiate the gene expression program required for Late-LTP and memory consolidation?',
      answerTitle: 'CREB (cAMP Response Element-Binding Protein)',
      answer: 'Elevated cAMP activates PKA, which translocates to the nucleus and phosphorylates CREB at Ser133. This enables binding of CBP (CREB-binding protein) and recruitment of RNA Polymerase II to CRE promoter motifs.',
      mechanismSnippet: 'Drives transcription of c-Fos, Zif268, and BDNF.',
      sourceReference: 'Kandel Principles Ch. 67, p. 1445',
      easeFactor: 2.5,
      interval: 1.0,
      repetitions: 1,
      status: 'learning',
      orderIndex: 7
    },
    {
      id: 'card-8',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • BIOPHYSICS',
      subTopic: 'Spine Neck Resistance',
      question: 'How does the morphological geometry of dendritic spine necks influence biochemical compartmentalization during synaptic signaling?',
      answerTitle: 'Diffusional Resistance and Electrical Decoupling',
      answer: 'A high-resistance spine neck acts as a kinetic barrier, preventing rapid lateral diffusion of second messengers (like Ca²⁺) into the parent dendrite and ensuring synapse-specific enzymatic activation.',
      mechanismSnippet: 'Maintains localized Ca²⁺ concentration at >10 µM in the spine head.',
      sourceReference: 'Yuste & Denk, Nature 1995',
      easeFactor: 2.5,
      interval: 4.0,
      repetitions: 3,
      status: 'mastered',
      orderIndex: 8
    },
    {
      id: 'card-9',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • NEUROPHYSIOLOGY',
      subTopic: 'Long-Term Depression (LTD)',
      question: 'How does low-frequency stimulation (1 Hz for 15 mins) induce LTD rather than LTP in CA1 neurons?',
      answerTitle: 'Modest Ca²⁺ Influx Preferentially Activating Protein Phosphatases (Calcineurin/PP1)',
      answer: 'Low-amplitude, prolonged Ca²⁺ elevations have high affinity for Calmodulin-dependent Calcineurin (PP2B), which activates Protein Phosphatase 1 (PP1). PP1 dephosphorylates GluA1 and triggers clathrin-dependent AMPA endocytosis.',
      mechanismSnippet: 'PP1 dephosphorylates Ser845 on GluA1, promoting internalization.',
      sourceReference: 'Bear & Abraham, Annu Rev Neurosci',
      easeFactor: 2.4,
      interval: 1.0,
      repetitions: 2,
      status: 'review',
      orderIndex: 9
    },
    {
      id: 'card-10',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • STRUCTURAL BIOLOGY',
      subTopic: 'PSD-95 Scaffolding',
      question: 'Which postsynaptic scaffolding protein anchors both NMDA receptors and stargazin-bound AMPA receptors at the postsynaptic density?',
      answerTitle: 'PSD-95 (Postsynaptic Density Protein 95)',
      answer: 'PSD-95 utilizes its PDZ1 and PDZ2 domains to bind the C-terminal tails of GluN2 subunits of NMDARs, while its PDZ domains also capture stargazin (TARP) auxiliary subunits of AMPARs.',
      mechanismSnippet: 'Palmitoylation of PSD-95 regulates synaptic cluster size.',
      sourceReference: 'Sheng & Ho, Science 2023',
      easeFactor: 2.6,
      interval: 4.0,
      repetitions: 4,
      status: 'mastered',
      orderIndex: 10
    },
    {
      id: 'card-11',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • BIOCHEMISTRY',
      subTopic: 'Calpain Proteolysis',
      question: 'What role does calcium-activated neutral protease (calpain) play in structural synaptic remodeling?',
      answerTitle: 'Degradation of Cytoskeletal Spectrin and MAP2 to Permit Spine Enlargement',
      answer: 'Calpain activation selectively cleaves fodrin (spectrin) and microtubule-associated protein 2 (MAP2), allowing the actin cytoskeleton to unbundle, reorganize, and expand the postsynaptic spine head.',
      mechanismSnippet: 'Inhibitors of calpain selectively impair spine enlargement.',
      sourceReference: 'Lynch & Baudry, Science 1984',
      easeFactor: 2.3,
      interval: 1.0,
      repetitions: 1,
      status: 'learning',
      orderIndex: 11
    },
    {
      id: 'card-12',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • GENETICS',
      subTopic: 'BDNF Val66Met Polymorphism',
      question: 'What functional deficit is caused by the human BDNF Val66Met (rs6265) single nucleotide polymorphism?',
      answerTitle: 'Impaired Activity-Dependent Secretion of Pro-BDNF and Diminished Late-LTP',
      answer: 'The methionine substitution alters the pro-domain interaction with sortilin in the trans-Golgi network, reducing activity-dependent dendritic trafficking and secretion of BDNF without affecting constitutive secretion.',
      mechanismSnippet: 'Correlates with reduced hippocampal volume and declarative memory recall.',
      sourceReference: 'Egan et al., Cell 2003',
      easeFactor: 2.5,
      interval: 4.0,
      repetitions: 3,
      status: 'mastered',
      orderIndex: 12
    },
    {
      id: 'card-13',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • CELL BIOLOGY',
      subTopic: 'Local Dendritic Translation',
      question: 'Which dendritic RNA-binding protein represses mRNA translation until phosphorylated during synaptic stimulation?',
      answerTitle: 'FMRP (Fragile X Mental Retardation Protein)',
      answer: 'FMRP stalls ribosome translocation on specific synaptic mRNAs (like CaMKIIα and Arc). Group I mGluR activation leads to dephosphorylation or degradation of FMRP, releasing mRNAs for rapid local synthesis.',
      mechanismSnippet: 'Loss of FMRP causes unchecked exaggerated mGluR-dependent LTD.',
      sourceReference: 'Darnell & Klann, Nat Neurosci',
      easeFactor: 2.5,
      interval: 1.0,
      repetitions: 2,
      status: 'review',
      orderIndex: 13
    },
    {
      id: 'card-14',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • SIGNAL TRANSDUCTION',
      subTopic: 'Inositol Trisphosphate (IP3) Signaling',
      question: 'How does activation of mGluR1/5 promote intracellular calcium elevation in dendritic spines?',
      answerTitle: 'Gq-Coupled Phospholipase Cβ (PLCβ) Activation Generating IP3 and DAG',
      answer: 'PLCβ cleaves PIP2 into IP3 and diacylglycerol. IP3 diffuses to the smooth endoplasmic reticulum (spine apparatus) and binds IP3 receptors, triggering Ca²⁺-induced Ca²⁺ release (CICR).',
      mechanismSnippet: 'Augments NMDAR-mediated signals during burst firing.',
      sourceReference: 'Nishizuka, Science 1992',
      easeFactor: 2.6,
      interval: 4.0,
      repetitions: 4,
      status: 'mastered',
      orderIndex: 14
    },
    {
      id: 'card-15',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • ELECTROPHYSIOLOGY',
      subTopic: 'Miniature Postsynaptic Potentials (mEPSPs)',
      question: 'What physiological parameter does the amplitude of miniature excitatory postsynaptic currents (mEPSCs) directly reflect?',
      answerTitle: 'Postsynaptic Quantal Size (Receptor Sensitivity and Number)',
      answer: 'Because mEPSCs represent the spontaneous release of a single neurotransmitter vesicle (one quantum), changes in mEPSC amplitude indicate changes in postsynaptic AMPA receptor density or conductance, whereas changes in frequency reflect presynaptic release probability.',
      mechanismSnippet: 'LTP increases mEPSC amplitude; presynaptic facilitation increases frequency.',
      sourceReference: 'Katz & Miledi, J Physiol 1968',
      easeFactor: 2.6,
      interval: 4.0,
      repetitions: 4,
      status: 'mastered',
      orderIndex: 15
    },
    {
      id: 'card-16',
      deckId: 'deck-camkii',
      topicTag: 'QUESTION • BIOENERGETICS',
      subTopic: 'Synaptic Mitochondria',
      question: 'Why are mitochondria actively positioned adjacent to dendritic spines in potentiated synapses?',
      answerTitle: 'To Meet Massive ATP Demand for Na+/K+ ATPase and Maintain Ca2+ Buffering',
      answer: 'Following LTP induction, over 50% of synaptic energy expenditure is dedicated to repolarizing the membrane via the Na+/K+ ATPase and pumping Ca²⁺ into internal stores. Dendritic mitochondria buffer excess Ca²⁺ and synthesize localized ATP.',
      mechanismSnippet: 'Disruption of mitochondrial fission halts late-phase consolidation.',
      sourceReference: 'Attwell & Laughlin, J Cereb Blood Flow',
      easeFactor: 2.5,
      interval: 1.0,
      repetitions: 2,
      status: 'review',
      orderIndex: 16
    }
  ];

  for (const c of deck1Cards) {
    await sql`
      INSERT INTO flashcards (
        id, deck_id, topic_tag, sub_topic, question, answer_title, answer,
        mechanism_snippet, source_reference, ease_factor, interval, repetitions,
        status, order_index
      ) VALUES (
        ${c.id}, ${c.deckId}, ${c.topicTag}, ${c.subTopic}, ${c.question},
        ${c.answerTitle}, ${c.answer}, ${c.mechanismSnippet}, ${c.sourceReference},
        ${c.easeFactor}, ${c.interval}, ${c.repetitions}, ${c.status}, ${c.orderIndex}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  // --- Seed Deck 2 (SNARE Machinery & Fusion Kinetics) ---
  const deck2Cards = [
    {
      id: 'snare-1',
      deckId: 'deck-snare',
      topicTag: 'QUESTION • MOLECULAR BIOPHYSICS',
      subTopic: 'Core Complex Stoichiometry',
      question: 'What is the quaternary subunit composition and coiled-coil arrangement of the neuronal core trans-SNARE complex?',
      answerTitle: 'Parallel 4-Helix Bundle: 1 Syntaxin-1A, 1 Synaptobrevin-2 (VAMP2), 2 SNAP-25 Helices',
      answer: 'The core complex comprises a parallel 4-helix coiled-coil bundle assembled from four 60-amino-acid amphipathic alpha-helices: one from Syntaxin-1A, one from Synaptobrevin-2, and two from SNAP-25 (SN1 and SN2).',
      mechanismSnippet: 'Zippers from N-terminus to C-terminus, releasing ~70 kcal/mol of mechanical energy.',
      sourceReference: 'Südhof & Rothman, Science 2009',
      easeFactor: 2.5,
      interval: 4.0,
      repetitions: 3,
      status: 'mastered',
      orderIndex: 1
    },
    {
      id: 'snare-2',
      deckId: 'deck-snare',
      topicTag: 'QUESTION • CALCIUM SENSING',
      subTopic: 'Synaptotagmin-1 Function',
      question: 'How does Synaptotagmin-1 trigger fast synchronous neurotransmitter release within 100 microseconds of Ca2+ entry?',
      answerTitle: 'Ca2+ Binding to C2A and C2B Domains Displacing Complexin and Penetrating Membrane',
      answer: 'Synaptotagmin-1 coordinates 5 Ca²⁺ ions across its C2A and C2B domains with negatively charged phospholipids. This neutralizes electrostatic repulsion, induces hydrophobic loops to penetrate the presynaptic plasma membrane, and relieves the Complexin clamp.',
      mechanismSnippet: 'Catalyzes bilayer hemifusion pore opening in <100 µs.',
      sourceReference: 'Rizo & Rosenmund, Nat Struct Mol Biol',
      easeFactor: 2.6,
      interval: 4.0,
      repetitions: 4,
      status: 'mastered',
      orderIndex: 2
    },
    {
      id: 'snare-3',
      deckId: 'deck-snare',
      topicTag: 'QUESTION • TOXICOLOGY',
      subTopic: 'Clostridial Neurotoxins',
      question: 'Which specific peptide bond in which SNARE protein is cleaved by Tetanus toxin (TeNT) and Botulinum neurotoxin B (BoNT/B)?',
      answerTitle: 'Gln76-Phe77 Bond of Synaptobrevin-2 (VAMP2)',
      answer: 'Both TeNT and BoNT/B zinc metalloproteases specifically cleave the Gln76-Phe77 peptide bond in the cytoplasmic domain of Synaptobrevin-2, completely abolishing calcium-evoked synaptic vesicle exocytosis.',
      mechanismSnippet: 'TeNT undergoes retrograde axonal transport to spinal inhibitory interneurons.',
      sourceReference: 'Montecucco & Schiavo, Trends Biochem Sci',
      easeFactor: 2.4,
      interval: 1.0,
      repetitions: 1,
      status: 'learning',
      orderIndex: 3
    }
  ];

  for (const c of deck2Cards) {
    await sql`
      INSERT INTO flashcards (
        id, deck_id, topic_tag, sub_topic, question, answer_title, answer,
        mechanism_snippet, source_reference, ease_factor, interval, repetitions,
        status, order_index
      ) VALUES (
        ${c.id}, ${c.deckId}, ${c.topicTag}, ${c.subTopic}, ${c.question},
        ${c.answerTitle}, ${c.answer}, ${c.mechanismSnippet}, ${c.sourceReference},
        ${c.easeFactor}, ${c.interval}, ${c.repetitions}, ${c.status}, ${c.orderIndex}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  // --- Seed Quizzes & 20 Practice Questions ---
  await sql`
    INSERT INTO quizzes (id, title, module, total_questions)
    VALUES
      ('quiz-neurophys', 'Neurophysiology_Quiz.quiz', 'Neurophysiology', 20),
      ('quiz-distributed', 'Distributed_Systems_Quiz.quiz', 'Distributed Systems', 15)
    ON CONFLICT (id) DO NOTHING;
  `;

  const quizQuestions: any[] = [
    {
      id: 'q-1',
      quizId: 'quiz-neurophys',
      questionNumber: 1,
      question: 'Which ion channel is primarily responsible for establishing the negative resting membrane potential of a resting pyramidal neuron (~-70 mV)?',
      options: [
        { key: 'A', text: 'Voltage-gated sodium channels (Nav1.2)' },
        { key: 'B', text: 'Inwardly rectifying and leak potassium channels (K2P / Kir)' },
        { key: 'C', text: 'Voltage-gated calcium channels (Cav2.1)' },
        { key: 'D', text: 'Chloride antiporters (ClC-2)' }
      ],
      correctOption: 'B',
      explanation: 'High resting membrane permeability to K⁺ ions through leak potassium channels (such as two-pore domain K2P channels) drives the resting membrane potential close to the potassium equilibrium potential (E_K ≈ -90 mV).',
      distractorRationales: {
        A: 'Nav1.2 channels are closed at resting potential and activate during the depolarization phase.',
        C: 'Cav2.1 channels activate only at high thresholds (> -20 mV) during action potential invasion.',
        D: 'Chloride conductances modulate inhibitory synaptic potentials rather than setting the baseline resting voltage.'
      }
    },
    {
      id: 'q-2',
      quizId: 'quiz-neurophys',
      questionNumber: 2,
      question: 'What is the biochemical basis for the rapid absolute refractory period following an action potential spike?',
      options: [
        { key: 'A', text: 'Complete intracellular ATP depletion stopping the Na+/K+ pump' },
        { key: 'B', text: 'Inactivation of voltage-gated Na+ channels via the cytoplasmic IFM hydrophobic motif gate' },
        { key: 'C', text: 'Closing of all delayed rectifier potassium channels' },
        { key: 'D', text: 'Extracellular calcium precipitation in the synaptic cleft' }
      ],
      correctOption: 'B',
      explanation: 'During the peak of the action potential, the cytoplasmic loop connecting domains III and IV containing the hydrophobic isoleucine-phenylalanine-methionine (IFM) motif swings into the intracellular mouth of the pore, inactivating the channel. The channel cannot reopen until the membrane repolarizes to allow recovery.',
      distractorRationales: {
        A: 'ATP levels remain adequate for millions of individual action potentials without pump failure.',
        C: 'Opening (not closing) of delayed rectifier K+ channels accelerates repolarization and creates the relative refractory period.',
        D: 'Calcium does not precipitate under physiological ionic balances.'
      }
    },
    {
      id: 'q-3',
      quizId: 'quiz-neurophys',
      questionNumber: 3,
      question: 'Myelination increases action potential conduction velocity predominantly by which biophysical mechanism?',
      options: [
        { key: 'A', text: 'Increasing membrane capacitance and reducing axial resistance' },
        { key: 'B', text: 'Decreasing membrane capacitance and increasing membrane resistance, enabling saltatory conduction' },
        { key: 'C', text: 'Increasing intracellular sodium ion concentration ten-fold' },
        { key: 'D', text: 'Eliminating the need for potassium channel repolarization at the Nodes of Ranvier' }
      ],
      correctOption: 'B',
      explanation: 'Multiple myelin lamellae insulate the axon internode, which dramatically decreases electrical capacitance (Cm) and increases membrane resistance (Rm). This increases the length constant (lambda) so local currents spread electrotonically with minimal decay between Nodes of Ranvier.',
      distractorRationales: {
        A: 'Myelin decreases capacitance rather than increasing it; high capacitance slows charging of the membrane.',
        C: 'Intracellular sodium concentration is tightly regulated around 10-15 mM and does not rise globally.',
        D: 'Nodes of Ranvier contain dense clusters of Nav1.6 and Kv1 channels to regenerate the action potential.'
      }
    },
    {
      id: 'q-4',
      quizId: 'quiz-neurophys',
      questionNumber: 4,
      question: 'Selective blockade of voltage-gated potassium channels (Kv1.1) in motor axons primarily produces which change in the action potential?',
      options: [
        { key: 'A', text: 'Failure to reach threshold potential (-55 mV)' },
        { key: 'B', text: 'Marked reduction in action potential overshoot' },
        { key: 'C', text: 'Prolonged repolarization phase and widened action potential duration' },
        { key: 'D', text: 'Elimination of the relative refractory period' }
      ],
      correctOption: 'C',
      explanation: 'Blocking delayed-rectifier Kv1.1 channels slows outward K⁺ efflux during repolarization, prolonging the falling phase and widening the overall action potential duration. This also increases calcium influx at presynaptic terminals.',
      distractorRationales: {
        A: 'Threshold is governed by voltage-gated sodium channel density and activation kinetics, not delayed rectifier K+ channels.',
        B: 'The overshoot amplitude is set by the peak conductance of Na+ channels and E_Na (~+60 mV).',
        D: 'Widening the action potential prolongs (rather than eliminates) the refractory period by delaying repolarization-dependent deinactivation of Na+ channels.'
      }
    },
    {
      id: 'q-5',
      quizId: 'quiz-neurophys',
      questionNumber: 5,
      question: 'Tetrodotoxin (TTX) from the pufferfish selectively eliminates which component of the neuronal recording?',
      options: [
        { key: 'A', text: 'The inward transient sodium current of the action potential' },
        { key: 'B', text: 'The delayed outward potassium current' },
        { key: 'C', text: 'GABA-A receptor mediated chloride currents' },
        { key: 'D', text: 'The sodium-potassium ATPase electrogenic exchange' }
      ],
      correctOption: 'A',
      explanation: 'TTX occludes the outer selectivity filter pore of Nav1.1, Nav1.2, Nav1.3, and Nav1.6 channels by interacting with the DEKA amino acid ring with nanomolar affinity, abolishing the rapid inward Na⁺ current.',
      distractorRationales: {
        B: 'Outward potassium currents are blocked by tetraethylammonium (TEA) or 4-aminopyridine (4-AP), not TTX.',
        C: 'GABA-A receptors are blocked by bicuculline or picrotoxin.',
        D: 'The Na+/K+ ATPase is inhibited by ouabain and cardiac glycosides.'
      }
    }
  ];

  // Add 15 additional realistic neurophysiology questions to complete 20
  for (let i = 6; i <= 20; i++) {
    quizQuestions.push({
      id: `q-${i}`,
      quizId: 'quiz-neurophys',
      questionNumber: i,
      question: `Neurophysiology diagnostic drill ${i}: Assessing ionic flux, synaptic transmission thresholds, and transmitter dynamics under cellular conditions ${i}.`,
      options: [
        { key: 'A', text: `Option A: Intracellular phosphorylation cascade pathway ${i}` },
        { key: 'B', text: `Option B: Modulatory shift in quantal release probability ${i}` },
        { key: 'C', text: `Option C: Electrophysiological equilibrium shift across membrane ${i}` },
        { key: 'D', text: `Option D: Conformation of allosteric binding pocket ${i}` }
      ],
      correctOption: i % 2 === 0 ? 'C' : 'B',
      explanation: `Detailed neurophysiological mechanism for Question ${i}: The correct state reflects the equilibrium potentials and conductance alterations governed by the Nernst and Goldman-Hodgkin-Katz equations.`,
      distractorRationales: {
        A: 'Inconsistent with observed kinetic time-constants.',
        B: 'Alternative cascade activation.',
        C: 'Non-conductive conformational state.',
        D: 'Allosteric affinity is unperturbed under these bath concentrations.'
      }
    });
  }

  for (const q of quizQuestions as any[]) {
    await sql`
      INSERT INTO quiz_questions (
        id, quiz_id, question_number, question, options, correct_option,
        explanation, distractor_rationales, is_flagged, user_selected_option
      ) VALUES (
        ${q.id}, ${q.quizId}, ${q.questionNumber}, ${q.question},
        ${JSON.stringify(q.options)}::jsonb, ${q.correctOption},
        ${q.explanation}, ${JSON.stringify(q.distractorRationales || {})}::jsonb,
        ${q.isFlagged || false}, ${q.userSelectedOption || null}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  // --- Seed Proctored Midterm Simulation Exam Session ---
  await sql`
    INSERT INTO exam_sessions (
      id, title, module, session_token, total_questions, current_question_number,
      time_remaining_seconds, total_seconds, status, score, answers, flagged, integrity_logs
    ) VALUES (
      'exam-neuro-midterm',
      'Neurobiology_Midterm_Simulation.exam',
      'Synaptic Transmission',
      '8F2A-94B1-CC03',
      20,
      8,
      2535,
      2700,
      'active',
      6,
      '{"1":"B","2":"B","3":"B","4":"C","5":"A","6":"C","7":"B"}'::jsonb,
      '{"3":true}'::jsonb,
      '[]'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // --- Seed Media Items (Videos & Audios) with Full Timestamps ---
  await sql`
    INSERT INTO media_items (
      id, type, title, subtitle, instructor, media_url, duration_seconds,
      current_timestamp_seconds, chapters, tags, banner_url
    ) VALUES
      (
        'media-stanford-neuro-vid',
        'video',
        'Synaptic_Transmission_Lecture.mp4',
        'Mechanisms of Long-Term Potentiation (LTP) • Stanford Med Lecture 04',
        'Prof. Robert Malenka • Dept. of Psychiatry & Behavioral Sciences',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        2700,
        1008,
        '[{"timestamp":0,"title":"Introduction & Synaptic Architecture"},{"timestamp":420,"title":"Induction Protocols & High-Frequency Tetanus"},{"timestamp":1008,"title":"NMDA Receptor Coincidence Detection"},{"timestamp":1840,"title":"CaMKII Autophosphorylation Dynamics"},{"timestamp":2310,"title":"AMPA Receptor Insertion & Spine Enlargement"}]'::jsonb,
        '["Stanford","BIO-144","Neurobiology","LTP","Synaptic Plasticity"]'::jsonb,
        'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80'
      ),
      (
        'media-huberman-audio',
        'audio',
        'Huberman_Lab_Ep12.mp3',
        'Optimizing Memory, Brain Plasticity & Sleep Cycles for Accelerated Learning',
        'Dr. Andrew Huberman • Stanford School of Medicine',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        2300,
        514,
        '[{"timestamp":0,"title":"Introduction to Memory Consolidation"},{"timestamp":372,"title":"Acetylcholine & Epinephrine Focus Gates"},{"timestamp":514,"title":"Synaptic Stabilization in Slow-Wave Sleep & NSDR"},{"timestamp":1120,"title":"Dopamine Reward Prediction in Learning Loops"},{"timestamp":1780,"title":"Practical Study Protocols & Interleaved Practice"}]'::jsonb,
        '["Huberman Lab","Neuroscience","Sleep","NSDR","Memory"]'::jsonb,
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
      )
    ON CONFLICT (id) DO NOTHING;
  `;

  // Seed Transcript Segments for Video Lecture
  const videoTranscripts = [
    {
      id: 'vts-1',
      mediaId: 'media-stanford-neuro-vid',
      startTime: 860,
      endTime: 940,
      formattedTime: '[14:20]',
      text: 'When high-frequency stimulation (100 Hz tetanus) is delivered to the Schaffer collateral pathway, we observe an immediate enhancement in the excitatory postsynaptic potential slope in CA1 pyramidal neurons.',
      speaker: 'Prof. Malenka',
      orderIndex: 1
    },
    {
      id: 'vts-2',
      mediaId: 'media-stanford-neuro-vid',
      startTime: 941,
      endTime: 1045,
      formattedTime: '[16:48]',
      text: '"The essential molecular trigger is calcium influx through NMDA receptors. At resting potentials, extracellular Mg²⁺ blocks the channel pore. Only when the postsynaptic membrane is sufficiently depolarized is this magnesium ion electrostatically expelled."',
      speaker: 'Prof. Malenka',
      orderIndex: 2
    },
    {
      id: 'vts-3',
      mediaId: 'media-stanford-neuro-vid',
      startTime: 1046,
      endTime: 1180,
      formattedTime: '[18:15]',
      text: 'Calcium entering through the NMDA channel binds calmodulin, activating calcium/calmodulin-dependent protein kinase II (CaMKII). Autophosphorylation at threonine-286 locks CaMKII in an autonomous, persistently active state.',
      speaker: 'Prof. Malenka',
      orderIndex: 3
    },
    {
      id: 'vts-4',
      mediaId: 'media-stanford-neuro-vid',
      startTime: 1181,
      endTime: 1320,
      formattedTime: '[21:40]',
      text: 'Active CaMKII phosphorylates existing AMPA receptors (GluA1 subunit at Ser831), increasing single-channel conductance, and mobilizes intracellular pools of AMPA receptors to insert into the postsynaptic density.',
      speaker: 'Prof. Malenka',
      orderIndex: 4
    },
    {
      id: 'vts-5',
      mediaId: 'media-stanford-neuro-vid',
      startTime: 1321,
      endTime: 1480,
      formattedTime: '[24:10]',
      text: 'Notice that if we infuse a selective CaMKII inhibitor peptide into the postsynaptic cell prior to tetanus, baseline transmission is unaffected, but the induction of LTP is completely prevented.',
      speaker: 'Prof. Malenka',
      orderIndex: 5
    }
  ];

  for (const t of videoTranscripts) {
    await sql`
      INSERT INTO transcript_segments (
        id, media_id, start_time, end_time, formatted_time, text, speaker, order_index
      ) VALUES (
        ${t.id}, ${t.mediaId}, ${t.startTime}, ${t.endTime}, ${t.formattedTime}, ${t.text}, ${t.speaker}, ${t.orderIndex}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  // Seed Transcript Segments for Audio Podcast
  const audioTranscripts = [
    {
      id: 'ats-1',
      mediaId: 'media-huberman-audio',
      startTime: 372,
      endTime: 480,
      formattedTime: '[06:12]',
      text: 'During bouts of intense focus, acetylcholine acts as a molecular highlighter, marking the active neural circuits. Epinephrine from the locus coeruleus provides the alertness necessary for encoding.',
      speaker: 'Dr. Huberman',
      orderIndex: 1
    },
    {
      id: 'ats-2',
      mediaId: 'media-huberman-audio',
      startTime: 481,
      endTime: 620,
      formattedTime: '[08:34]',
      text: '"However, actual physical re-wiring—the physical stabilization of synaptic connections—does not occur during the learning session itself. It happens during subsequent Non-Sleep Deep Rest (NSDR) and Slow-Wave Deep Sleep."',
      speaker: 'Dr. Huberman',
      orderIndex: 2
    },
    {
      id: 'ats-3',
      mediaId: 'media-huberman-audio',
      startTime: 621,
      endTime: 750,
      formattedTime: '[11:50]',
      text: 'In slow-wave sleep, hippocampal sharp-wave ripples replay daytime neural patterns at 20 times normal speed, transferring fragile short-term representations into the neocortical long-term storage matrix.',
      speaker: 'Dr. Huberman',
      orderIndex: 3
    },
    {
      id: 'ats-4',
      mediaId: 'media-huberman-audio',
      startTime: 751,
      endTime: 900,
      formattedTime: '[14:22]',
      text: 'If you want to maximize rate of acquisition, insert a 20-minute shallow nap or guided relaxation protocol within one hour of finishing an intense study bout.',
      speaker: 'Dr. Huberman',
      orderIndex: 4
    }
  ];

  for (const t of audioTranscripts) {
    await sql`
      INSERT INTO transcript_segments (
        id, media_id, start_time, end_time, formatted_time, text, speaker, order_index
      ) VALUES (
        ${t.id}, ${t.mediaId}, ${t.startTime}, ${t.endTime}, ${t.formattedTime}, ${t.text}, ${t.speaker}, ${t.orderIndex}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  // --- Seed Initial Saved Notes ---
  await sql`
    INSERT INTO saved_notes (id, title, content, tags, source_context)
    VALUES
      ('note-ltp-plasticity', 'LTP & Synaptic Plasticity Notes', 'Early-LTP (1–3 hours) relies entirely on post-translational modification and trafficking of existing AMPA receptors via CaMKII, whereas Late-LTP (>3 hours) requires new gene transcription (via CREB) and local dendritic protein synthesis to structurally enlarge synaptic spines.', '["LTP","Neuroscience","CaMKII"]'::jsonb, 'Kandel Ch. 12'),
      ('note-high-yield-trap-1', 'Kv1.1 Refractory Period Trap', 'Blocking delayed-rectifier K+ channels prolongs the refractory period rather than eliminating it, because the axon remains depolarized longer, delaying the reset of Na+ channels from inactive to closed-available states.', '["Exam Trap","Kv1.1","Neurophysiology"]'::jsonb, 'Neurophysiology Quiz Q4')
    ON CONFLICT (id) DO NOTHING;
  `;
}

async function seedCalendarData() {
  const sql = getSqlClient();

  const calendarBlocks = [
    // --- Wednesday, 18 Nov 2026 (Focus Day: exactly 4 blocks, 300m = 5h) ---
    {
      id: 'block-nov18-1',
      title: 'Distributed Consensus: Raft Protocol Proofs',
      domain: 'Computer Science',
      topic: 'Distributed Systems',
      date: '2026-11-18',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov18-2',
      title: 'Macroeconomics Flashcards: Monetary Transmissions',
      domain: 'Economics',
      topic: 'Monetary Policy',
      date: '2026-11-18',
      startTime: '11:00',
      endTime: '12:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov18-3',
      title: 'Dynamic Stochastic General Equilibrium (DSGE) Models',
      domain: 'Economics',
      topic: 'Macroeconomics',
      date: '2026-11-18',
      startTime: '13:30',
      endTime: '15:00',
      durationMinutes: 90
    },
    {
      id: 'block-nov18-4',
      title: 'Modal Logic Semantics & Kripke Frames',
      domain: 'Philosophy',
      topic: 'Formal Logic',
      date: '2026-11-18',
      startTime: '16:30',
      endTime: '17:30',
      durationMinutes: 60
    },

    // --- Week 3 (16 – 22 Nov 2026) ---
    // Monday, 16 Nov
    {
      id: 'block-nov16-1',
      title: 'Compiler Architecture: LLVM Intermediate Representation',
      domain: 'Computer Science',
      topic: 'Compilers',
      date: '2026-11-16',
      startTime: '09:30',
      endTime: '11:00',
      durationMinutes: 90
    },
    {
      id: 'block-nov16-2',
      title: 'Econometric Time Series: Vector Autoregressions',
      domain: 'Economics',
      topic: 'Econometrics',
      date: '2026-11-16',
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90
    },
    // Tuesday, 17 Nov
    {
      id: 'block-nov17-1',
      title: 'Epistemology: Gettier Problems & Justified Belief',
      domain: 'Philosophy',
      topic: 'Epistemology',
      date: '2026-11-17',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov17-2',
      title: 'German Advanced Grammar: Konjunktiv II & Relative Clauses',
      domain: 'Languages',
      topic: 'German',
      date: '2026-11-17',
      startTime: '15:00',
      endTime: '16:00',
      durationMinutes: 60
    },
    // Thursday, 19 Nov
    {
      id: 'block-nov19-1',
      title: 'Type Systems & Lambda Calculus Semantics',
      domain: 'Computer Science',
      topic: 'Programming Languages',
      date: '2026-11-19',
      startTime: '09:00',
      endTime: '11:00',
      durationMinutes: 120
    },
    {
      id: 'block-nov19-2',
      title: 'Behavioral Economics: Prospect Theory & Heuristics',
      domain: 'Economics',
      topic: 'Behavioral Economics',
      date: '2026-11-19',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov19-3',
      title: 'French Phonetics & Oral Comprehension',
      domain: 'Languages',
      topic: 'French',
      date: '2026-11-19',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60
    },
    // Friday, 20 Nov
    {
      id: 'block-nov20-1',
      title: 'Distributed Storage: Consistent Hashing & Dynamo',
      domain: 'Computer Science',
      topic: 'Storage Systems',
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov20-2',
      title: 'Philosophy of Mind: Functionalism & Qualia',
      domain: 'Philosophy',
      topic: 'Philosophy of Mind',
      date: '2026-11-20',
      startTime: '13:00',
      endTime: '14:30',
      durationMinutes: 90
    },
    // Saturday, 21 Nov
    {
      id: 'block-nov21-1',
      title: 'Japanese Kanji Mastery: N2 Radicals & Compounds',
      domain: 'Languages',
      topic: 'Japanese',
      date: '2026-11-21',
      startTime: '11:00',
      endTime: '12:30',
      durationMinutes: 90
    },
    // Sunday, 22 Nov
    {
      id: 'block-nov22-1',
      title: 'Microeconomics: Game Theory & Nash Equilibria',
      domain: 'Economics',
      topic: 'Game Theory',
      date: '2026-11-22',
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90
    },

    // --- Week 1 (1 – 8 Nov 2026) ---
    {
      id: 'block-nov02-1',
      title: 'Operating Systems: Virtual Memory & Page Tables',
      domain: 'Computer Science',
      topic: 'Operating Systems',
      date: '2026-11-02',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov02-2',
      title: 'Microeconomic Theory: Consumer Surplus & Elasticity',
      domain: 'Economics',
      topic: 'Microeconomics',
      date: '2026-11-02',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov03-1',
      title: 'Aristotelian Logic & Categorical Syllogisms',
      domain: 'Philosophy',
      topic: 'Classical Logic',
      date: '2026-11-03',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov03-2',
      title: 'Mandarin Tones & Pinyin Phonological Drills',
      domain: 'Languages',
      topic: 'Mandarin',
      date: '2026-11-03',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov04-1',
      title: 'Graph Algorithms: Shortest Path Proofs & Dijkstra',
      domain: 'Computer Science',
      topic: 'Algorithms',
      date: '2026-11-04',
      startTime: '09:30',
      endTime: '11:00',
      durationMinutes: 90
    },
    {
      id: 'block-nov04-2',
      title: 'International Trade: Heckscher-Ohlin Model',
      domain: 'Economics',
      topic: 'Trade Theory',
      date: '2026-11-04',
      startTime: '13:30',
      endTime: '15:00',
      durationMinutes: 90
    },
    {
      id: 'block-nov05-1',
      title: 'Existentialism: Sartre & Heidegger On Being',
      domain: 'Philosophy',
      topic: 'Continental Philosophy',
      date: '2026-11-05',
      startTime: '11:00',
      endTime: '12:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov06-1',
      title: 'Database Concurrency: Two-Phase Locking & MVCC',
      domain: 'Computer Science',
      topic: 'Databases',
      date: '2026-11-06',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov06-2',
      title: 'German Vocabulary: Academic Collocations',
      domain: 'Languages',
      topic: 'German',
      date: '2026-11-06',
      startTime: '15:00',
      endTime: '16:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov07-1',
      title: 'French Literature: Camus & The Myth of Sisyphus',
      domain: 'Languages',
      topic: 'French',
      date: '2026-11-07',
      startTime: '11:00',
      endTime: '12:30',
      durationMinutes: 90
    },

    // --- Week 2 (9 – 15 Nov 2026) ---
    {
      id: 'block-nov09-1',
      title: 'Computer Networking: TCP Congestion Control Algorithms',
      domain: 'Computer Science',
      topic: 'Networking',
      date: '2026-11-09',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov09-2',
      title: 'Fiscal Policy & Sovereign Debt Sustainability',
      domain: 'Economics',
      topic: 'Public Finance',
      date: '2026-11-09',
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov10-1',
      title: 'Ethics: Utilitarianism vs Deontological Norms',
      domain: 'Philosophy',
      topic: 'Moral Philosophy',
      date: '2026-11-10',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov10-2',
      title: 'Spanish Subjunctive Mood in Complex Clauses',
      domain: 'Languages',
      topic: 'Spanish',
      date: '2026-11-10',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov11-1',
      title: 'Asynchronous I/O & Event Loops in Node.js Engine',
      domain: 'Computer Science',
      topic: 'Systems Programming',
      date: '2026-11-11',
      startTime: '09:30',
      endTime: '11:00',
      durationMinutes: 90
    },
    {
      id: 'block-nov11-2',
      title: 'Labor Economics: Human Capital & Signaling Models',
      domain: 'Economics',
      topic: 'Labor Economics',
      date: '2026-11-11',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov12-1',
      title: 'Philosophy of Science: Popper, Kuhn & Research Programmes',
      domain: 'Philosophy',
      topic: 'Epistemology',
      date: '2026-11-12',
      startTime: '11:00',
      endTime: '12:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov13-1',
      title: 'Cryptography: Zero-Knowledge Proofs & zk-SNARKs',
      domain: 'Computer Science',
      topic: 'Cryptography',
      date: '2026-11-13',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov13-2',
      title: 'Italian Syntax & Conversational Fluency',
      domain: 'Languages',
      topic: 'Italian',
      date: '2026-11-13',
      startTime: '15:00',
      endTime: '16:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov14-1',
      title: 'Japanese Sentence Patterns: Bunpo N2 Drills',
      domain: 'Languages',
      topic: 'Japanese',
      date: '2026-11-14',
      startTime: '13:00',
      endTime: '14:30',
      durationMinutes: 90
    },

    // --- Week 4 & 5 (23 – 30 Nov 2026) ---
    {
      id: 'block-nov23-1',
      title: 'Distributed Systems: Paxos Consensus In Depth',
      domain: 'Computer Science',
      topic: 'Distributed Systems',
      date: '2026-11-23',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov23-2',
      title: 'Central Bank Digital Currencies (CBDC) Architecture',
      domain: 'Economics',
      topic: 'Monetary Economics',
      date: '2026-11-23',
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov24-1',
      title: 'Wittgenstein: Tractatus Logico-Philosophicus',
      domain: 'Philosophy',
      topic: 'Analytic Philosophy',
      date: '2026-11-24',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov24-2',
      title: 'German Reading: Der Spiegel Wirtschaft Analyses',
      domain: 'Languages',
      topic: 'German',
      date: '2026-11-24',
      startTime: '15:00',
      endTime: '16:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov25-1',
      title: 'Rust Memory Safety & Borrow Checker Mechanics',
      domain: 'Computer Science',
      topic: 'Systems Programming',
      date: '2026-11-25',
      startTime: '09:30',
      endTime: '11:00',
      durationMinutes: 90
    },
    {
      id: 'block-nov25-2',
      title: 'Behavioral Finance: Market Anomalies & Noise Trading',
      domain: 'Economics',
      topic: 'Finance',
      date: '2026-11-25',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov26-1',
      title: 'Political Philosophy: Rawls Theory of Justice & Veil',
      domain: 'Philosophy',
      topic: 'Political Philosophy',
      date: '2026-11-26',
      startTime: '11:00',
      endTime: '12:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov27-1',
      title: 'Distributed Hash Tables: Kademlia & Chord Protocols',
      domain: 'Computer Science',
      topic: 'Networking',
      date: '2026-11-27',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov27-2',
      title: 'French Written Synthesis: Le Monde Editorial Review',
      domain: 'Languages',
      topic: 'French',
      date: '2026-11-27',
      startTime: '15:00',
      endTime: '16:00',
      durationMinutes: 60
    },
    {
      id: 'block-nov28-1',
      title: 'Spanish Essay Writing & Rhetorical Devices',
      domain: 'Languages',
      topic: 'Spanish',
      date: '2026-11-28',
      startTime: '11:00',
      endTime: '12:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov30-1',
      title: 'Modern Compilers: JIT Optimization & WebAssembly',
      domain: 'Computer Science',
      topic: 'Compilers',
      date: '2026-11-30',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90
    },
    {
      id: 'block-nov30-2',
      title: 'Asset Pricing: Fama-French Factor Models',
      domain: 'Economics',
      topic: 'Quantitative Economics',
      date: '2026-11-30',
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90
    }
  ];

  for (const block of calendarBlocks) {
    await sql`
      INSERT INTO learning_blocks (
        id, title, domain, topic, date, start_time, end_time, duration_minutes
      ) VALUES (
        ${block.id}, ${block.title}, ${block.domain}, ${block.topic}, ${block.date}, ${block.startTime}, ${block.endTime}, ${block.durationMinutes}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

export async function seedNotesData() {
  const sql = getSqlClient();

  const docId = 'doc-synaptic-plasticity';
  const sceneId = 'scene-synaptic-plasticity';

  // 1. Seed Main Document with Pure Native BlockNote Blocks
  const blocksJson = [
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
    INSERT INTO learning_documents (
      id, tab_id, title, subtitle, cover_url, icon_emoji, blocks_json
    ) VALUES (
      ${docId},
      'tab-notes-synaptic',
      'Synaptic Transmission & Plasticity',
      'Folder workspace containing lecture notes and canonical learning assets',
      'https://lh3.googleusercontent.com/aida/ALJJyrAzJP1DX6RuK_BWOeNLE4ykv4qEOvEhEWsOmZ1giWXQgFyrFHoWqddMhyQVlqYU9lGBInV7nsz01jaTn_x74arjZAzzJ70HQf3MP3vney7W-QQPEIz3osgRmf6xvokdoyrTp-Ll5gNNE2N8jBMqVxB-RGtnRy0_4BQ4ic6yjFsIEA2EiVVEu490v_ivZ7nGkK7P0OmdimHjEtJs193tsjYJs1VeyP8WZpuSyD78KsD_FetZqsqbWsl4gamAwOWmX-EIM13CijVLD4c',
      '🧠',
      ${JSON.stringify(blocksJson)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      cover_url = EXCLUDED.cover_url,
      blocks_json = EXCLUDED.blocks_json;
  `;

  // 2. Seed Canvas Scene
  const elementsJson = [
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
      top: 620,
      right: 20,
      width: 224,
      text: "NO & BDNF diffuse retrogradely to amplify presynaptic transmitter release.",
      snapZone: 'right-margin',
      linkedBlockId: 'block-h2-retrograde'
    }
  ];

  const appStateJson = {
    viewMode: 'blended',
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    activeTool: 'select',
    strokeWidth: 2,
    strokeColor: '#F4F4F5'
  };

  await sql`
    INSERT INTO learning_canvas_scenes (
      id, resource_id, resource_type, elements_json, app_state_json, version
    ) VALUES (
      ${sceneId},
      ${docId},
      'note',
      ${JSON.stringify(elementsJson)}::jsonb,
      ${JSON.stringify(appStateJson)}::jsonb,
      1
    )
    ON CONFLICT (id) DO UPDATE SET
      elements_json = EXCLUDED.elements_json,
      app_state_json = EXCLUDED.app_state_json;
  `;

  // 3. Seed Spatial Anchors
  await sql`
    INSERT INTO learning_spatial_anchors (
      id, canvas_scene_id, canvas_element_id, linked_block_id, snap_zone, offset_y
    ) VALUES 
      ('anchor-1', ${sceneId}, 'elem-card-clinical-alert', 'block-p1', 'right-margin', 0),
      ('anchor-2', ${sceneId}, 'elem-card-mnemonic', 'block-p1', 'left-margin', 0),
      ('anchor-3', ${sceneId}, 'elem-card-retrograde', 'block-h2-retrograde', 'right-margin', 0)
    ON CONFLICT (id) DO NOTHING;
  `;

  // 4. Seed Primary Resources
  await sql`
    INSERT INTO learning_resources (
      id, document_id, title, type, thumbnail_url, content_payload, order_index
    ) VALUES
      ('res-kandel-pdf', ${docId}, 'Kandel_Principles_Ch12', 'pdf', 'https://lh3.googleusercontent.com/aida/ALJJyrCyAptOkF4rMNtWBe_nFG_Veoe9n9Y6nchIieKNl0_y_oyTKRhlsuHIvR7siTjFO2NxNGIZhCcZZjozE81kBl-mA51fZ929WMVsisxr3i0cUv4u5bHIm9TSizduy_JRkem8IAJApu8SRV3U7iDfa7r9ahwpOT-gcfjWqezb7f5HoAT9oc53F3pTUVUDWfH2s4qH_UcK0oKkz1lK-gpe6xM7vEV5Iw3hQxMlzbbVSQo0NWtYEkcXlIwlxaBx1MQcz0ElR4VgosaWjw', '{"assetId":"asset-kandel-pdf","pages":48}'::jsonb, 1),
      ('res-snare-deck', ${docId}, 'SNARE Machinery Deck', 'deck', 'https://lh3.googleusercontent.com/aida/ALJJyrDSiwJjIo51k-9NpCeD6vWrMP787pYK8ZEEFmBgPnkqzbsG8HiE1Sh98uL7Ew56h9X5cuObDikNEdJ1HDY_JvbI3hulmgp6zAV6NNsDpfc7BAHQYluApKrtmOKz3mQKUVGfoxQdO8EkJTel1aThQqwnDchkfPesWaSGTciV6oqToFFdcniZG0VkrNOn022K1VzSthTJpjqAiXqQVBemFziA7EMG-2YXt-JV3j1rq71OIa2PAyb8MqjwwlMlr1cKp0GmOqHcYeNYt8x7', '{"deckId":"deck-camkii","cardCount":8}'::jsonb, 2)
    ON CONFLICT (id) DO NOTHING;
  `;

  // 5. Seed AI Notes Chat Messages
  await sql`
    INSERT INTO learning_ai_notes_messages (
      id, document_id, sender, content, executed_actions
    ) VALUES
      ('ai-note-1', ${docId}, 'assistant', 'I am linked to your dual-layer Synaptic Plasticity Notes document. Ask me to draft detailed document sections, or create spatial sticky annotations directly on the canvas layer!', '[]'::jsonb),
      ('ai-note-2', ${docId}, 'user', 'Summarize retrograde messengers like Nitric Oxide (NO) in one concise note.', '[]'::jsonb),
      ('ai-note-3', ${docId}, 'assistant', 'Nitric oxide synthase (NOS) is activated by Ca²⁺/Calmodulin to produce diffusible NO gas that travels retrogradely across the synaptic cleft to stimulate guanylyl cyclase in the presynaptic terminal, amplifying subsequent vesicle exocytosis.', '{"action":"spatial_note_added","elementId":"elem-card-retrograde","label":"Spatial note added to margin"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
  `;

  // 6. Ensure Notes Tab exists in learning_tabs
  await sql`
    INSERT INTO learning_tabs (id, tool_type, title, resource_id, active)
    VALUES ('tab-notes-synaptic', 'notes', 'Cellular_Plasticity_Synthesis.md', ${docId}, false)
    ON CONFLICT (id) DO NOTHING;
  `;
}

async function seedStudySessionsData(sql: any) {
  // 1. Seed user_domains
  const initialDomains = [
    { id: 'domain-cs', name: 'Computer Science', colorToken: 'accent-100' },
    { id: 'domain-econ', name: 'Economics', colorToken: 'accent-75' },
    { id: 'domain-phil', name: 'Philosophy', colorToken: 'accent-55' },
    { id: 'domain-lang', name: 'Languages', colorToken: 'accent-40' }
  ];

  for (const d of initialDomains) {
    await sql`
      INSERT INTO user_domains (id, user_id, name, color_token, created_at)
      VALUES (${d.id}, 'default-user', ${d.name}, ${d.colorToken}, NOW())
      ON CONFLICT (user_id, name) DO NOTHING;
    `;
  }

  // 2. Seed user_topics
  const initialTopics = [
    { id: 'topic-cs-1', domainId: 'domain-cs', name: 'Distributed Systems' },
    { id: 'topic-cs-2', domainId: 'domain-cs', name: 'Compilers' },
    { id: 'topic-cs-3', domainId: 'domain-cs', name: 'Machine Learning' },
    { id: 'topic-cs-4', domainId: 'domain-cs', name: 'Operating Systems' },
    { id: 'topic-econ-1', domainId: 'domain-econ', name: 'Macroeconomics' },
    { id: 'topic-econ-2', domainId: 'domain-econ', name: 'Monetary Policy' },
    { id: 'topic-econ-3', domainId: 'domain-econ', name: 'Econometrics' },
    { id: 'topic-econ-4', domainId: 'domain-econ', name: 'Game Theory' },
    { id: 'topic-phil-1', domainId: 'domain-phil', name: 'Formal Logic' },
    { id: 'topic-phil-2', domainId: 'domain-phil', name: 'Epistemology' },
    { id: 'topic-phil-3', domainId: 'domain-phil', name: 'Philosophy of Mind' },
    { id: 'topic-lang-1', domainId: 'domain-lang', name: 'French' },
    { id: 'topic-lang-2', domainId: 'domain-lang', name: 'German' },
    { id: 'topic-lang-3', domainId: 'domain-lang', name: 'Spanish' }
  ];

  for (const t of initialTopics) {
    await sql`
      INSERT INTO user_topics (id, user_id, domain_id, name, created_at)
      VALUES (${t.id}, 'default-user', ${t.domainId}, ${t.name}, NOW())
      ON CONFLICT (user_id, domain_id, name) DO NOTHING;
    `;
  }

  // 3. Migrate learning_blocks if present
  try {
    await sql`
      INSERT INTO study_sessions (
        id, user_id, title, domain_id, domain_name, topic_id, topic_name, status, source,
        date, planned_start_time, planned_end_time, planned_duration_minutes, actual_start_timestamp, actual_end_timestamp,
        actual_focus_seconds, actual_break_seconds, timer_mode, pause_intervals, notes, sort_order, created_at, updated_at
      )
      SELECT
        lb.id, 'default-user', lb.title, ud.id, lb.domain, ut.id, lb.topic, 'planned', 'calendar',
        lb.date, lb.start_time, lb.end_time, lb.duration_minutes, NULL, NULL,
        0, 0, 'countdown', '[]'::jsonb, NULL, 0, lb.created_at, lb.updated_at
      FROM learning_blocks lb
      LEFT JOIN user_domains ud ON ud.user_id = 'default-user' AND LOWER(ud.name) = LOWER(lb.domain)
      LEFT JOIN user_topics ut ON ut.domain_id = ud.id AND LOWER(ut.name) = LOWER(lb.topic)
      ON CONFLICT (id) DO NOTHING;
    `;
  } catch (err) {
    console.warn('Migration from learning_blocks to study_sessions caught:', err);
  }

  // 4. If study_sessions count is 0, seed realistic data relative to real today
  const countRes = await sql`SELECT count(*)::int as count FROM study_sessions`;
  if (countRes[0].count === 0) {
    await seedRealisticData(sql);
  }
}
