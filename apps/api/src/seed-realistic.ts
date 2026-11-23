import type { Sql } from 'postgres';
import { randomUUID } from 'node:crypto';

export async function seedRealisticData(sql: Sql): Promise<{ success: boolean; sessionCount: number }> {
  // 1. Purge previous study sessions, user topics, and user domains
  await sql`DELETE FROM study_sessions WHERE user_id = 'default-user'`;
  await sql`DELETE FROM user_topics WHERE user_id = 'default-user'`;
  await sql`DELETE FROM user_domains WHERE user_id = 'default-user'`;

  // 2. Insert 5 Rich Academic Domains
  const domains = [
    { id: 'domain-cs', name: 'Computer Science', colorToken: '#60A5FA' },
    { id: 'domain-econ', name: 'Economics & Finance', colorToken: '#38BDF8' },
    { id: 'domain-phil', name: 'Philosophy', colorToken: '#E4E4E7' },
    { id: 'domain-cogsci', name: 'Cognitive Science', colorToken: '#A78BFA' },
    { id: 'domain-lang', name: 'Languages', colorToken: '#FBBF24' }
  ];

  for (const d of domains) {
    await sql`
      INSERT INTO user_domains (id, user_id, name, color_token, created_at)
      VALUES (${d.id}, 'default-user', ${d.name}, ${d.colorToken}, NOW())
      ON CONFLICT (user_id, name) DO NOTHING
    `;
  }

  // 3. Insert Topics for Each Domain
  const topicsByDomain: Record<string, string[]> = {
    'domain-cs': [
      'Distributed Systems',
      'Compilers & Runtimes',
      'Operating Systems',
      'Algorithms',
      'Machine Learning'
    ],
    'domain-econ': [
      'Macroeconomics',
      'Asset Pricing',
      'Monetary Policy',
      'Econometrics',
      'Game Theory'
    ],
    'domain-phil': [
      'Formal Logic',
      'Epistemology',
      'Philosophy of Mind',
      'Moral Philosophy',
      'Philosophy of Science'
    ],
    'domain-cogsci': [
      'Neural Networks',
      'Attention & Memory',
      'Visual Perception',
      'Linguistics',
      'Decision Theory'
    ],
    'domain-lang': [
      'German Reading & Grammar',
      'French Syntax',
      'Spanish Literature',
      'Mandarin Phonetics'
    ]
  };

  const topicIdMap = new Map<string, string>(); // key: `${domainId}:${topicName}` -> topicId

  for (const [domainId, topics] of Object.entries(topicsByDomain)) {
    for (let idx = 0; idx < topics.length; idx++) {
      const topicName = topics[idx];
      const topicId = `topic-${domainId.replace('domain-', '')}-${idx + 1}`;
      topicIdMap.set(`${domainId}:${topicName}`, topicId);

      await sql`
        INSERT INTO user_topics (id, user_id, domain_id, name, created_at)
        VALUES (${topicId}, 'default-user', ${domainId}, ${topicName}, NOW())
        ON CONFLICT (user_id, domain_id, name) DO NOTHING
      `;
    }
  }

  // 4. Generate Realistic Study Sessions
  const now = new Date();
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = formatDate(now);

  const sessionsToInsert: any[] = [];

  // -------------------------------------------------------------
  // A. TODAY'S SESSIONS (3 Completed Earlier + 2 Upcoming Planned)
  // -------------------------------------------------------------
  // 1. Completed morning session 08:30 - 09:45 (75m, focus 4500s)
  const todayMorningStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30, 0).getTime();
  const todayMorningEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 45, 0).getTime();
  sessionsToInsert.push({
    id: 'session-today-completed-1',
    userId: 'default-user',
    title: 'Distributed Consensus: Raft Protocol Proofs',
    domainId: 'domain-cs',
    domainName: 'Computer Science',
    topicId: topicIdMap.get('domain-cs:Distributed Systems') || null,
    topicName: 'Distributed Systems',
    status: 'completed',
    source: 'calendar',
    date: todayStr,
    plannedStartTime: '08:30',
    plannedEndTime: '09:45',
    plannedDurationMinutes: 75,
    actualStartTimestamp: todayMorningStart,
    actualEndTimestamp: todayMorningEnd,
    actualFocusSeconds: 4500,
    actualBreakSeconds: 600,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Leader election safety invariants and log matching proofs fully verified.',
    sortOrder: 0
  });

  // 2. Completed late-morning session 10:30 - 11:30 (60m, focus 3600s)
  const todayMidStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0).getTime();
  const todayMidEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30, 0).getTime();
  sessionsToInsert.push({
    id: 'session-today-completed-2',
    userId: 'default-user',
    title: 'Monetary Transmission Mechanisms & Yield Curves',
    domainId: 'domain-econ',
    domainName: 'Economics & Finance',
    topicId: topicIdMap.get('domain-econ:Monetary Policy') || null,
    topicName: 'Monetary Policy',
    status: 'completed',
    source: 'calendar',
    date: todayStr,
    plannedStartTime: '10:30',
    plannedEndTime: '11:30',
    plannedDurationMinutes: 60,
    actualStartTimestamp: todayMidStart,
    actualEndTimestamp: todayMidEnd,
    actualFocusSeconds: 3600,
    actualBreakSeconds: 300,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Term premium decomposition and central bank balance sheet transmission.',
    sortOrder: 1
  });

  // 3. Completed early-afternoon session 13:00 - 14:15 (75m, focus 4500s)
  const todayAftStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0).getTime();
  const todayAftEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 15, 0).getTime();
  sessionsToInsert.push({
    id: 'session-today-completed-3',
    userId: 'default-user',
    title: 'Modal Logic & Kripke Semantics',
    domainId: 'domain-phil',
    domainName: 'Philosophy',
    topicId: topicIdMap.get('domain-phil:Formal Logic') || null,
    topicName: 'Formal Logic',
    status: 'completed',
    source: 'calendar',
    date: todayStr,
    plannedStartTime: '13:00',
    plannedEndTime: '14:15',
    plannedDurationMinutes: 75,
    actualStartTimestamp: todayAftStart,
    actualEndTimestamp: todayAftEnd,
    actualFocusSeconds: 4500,
    actualBreakSeconds: 450,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Accessibility relations across possible worlds in S4 and S5 frameworks.',
    sortOrder: 2
  });

  // 4. Upcoming planned session 15:30 - 17:00 (90m)
  sessionsToInsert.push({
    id: 'session-today-planned-1',
    userId: 'default-user',
    title: 'Transformer Architecture & Self-Attention Proofs',
    domainId: 'domain-cogsci',
    domainName: 'Cognitive Science',
    topicId: topicIdMap.get('domain-cogsci:Neural Networks') || null,
    topicName: 'Neural Networks',
    status: 'planned',
    source: 'calendar',
    date: todayStr,
    plannedStartTime: '15:30',
    plannedEndTime: '17:00',
    plannedDurationMinutes: 90,
    actualStartTimestamp: null,
    actualEndTimestamp: null,
    actualFocusSeconds: 0,
    actualBreakSeconds: 0,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Scaled dot-product attention computational complexity and token routing.',
    sortOrder: 3
  });

  // 5. Upcoming planned session 18:00 - 19:00 (60m)
  sessionsToInsert.push({
    id: 'session-today-planned-2',
    userId: 'default-user',
    title: 'German Reading: Der Spiegel Editorial Analysis',
    domainId: 'domain-lang',
    domainName: 'Languages',
    topicId: topicIdMap.get('domain-lang:German Reading & Grammar') || null,
    topicName: 'German Reading & Grammar',
    status: 'planned',
    source: 'calendar',
    date: todayStr,
    plannedStartTime: '18:00',
    plannedEndTime: '19:00',
    plannedDurationMinutes: 60,
    actualStartTimestamp: null,
    actualEndTimestamp: null,
    actualFocusSeconds: 0,
    actualBreakSeconds: 0,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Passive voice with modal verbs and complex relative clause structures.',
    sortOrder: 4
  });

  // -------------------------------------------------------------
  // B. YESTERDAY'S SESSIONS (2 Completed + 1 Missed)
  // -------------------------------------------------------------
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  sessionsToInsert.push({
    id: 'session-yesterday-completed-1',
    userId: 'default-user',
    title: 'Compilers: SSA Form & Phi-Node Elimination',
    domainId: 'domain-cs',
    domainName: 'Computer Science',
    topicId: topicIdMap.get('domain-cs:Compilers & Runtimes') || null,
    topicName: 'Compilers & Runtimes',
    status: 'completed',
    source: 'calendar',
    date: yesterdayStr,
    plannedStartTime: '09:00',
    plannedEndTime: '10:30',
    plannedDurationMinutes: 90,
    actualStartTimestamp: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 9, 0, 0).getTime(),
    actualEndTimestamp: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 30, 0).getTime(),
    actualFocusSeconds: 5400,
    actualBreakSeconds: 600,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Dominance frontiers and Cytron algorithm implementation in LLVM.',
    sortOrder: 0
  });

  sessionsToInsert.push({
    id: 'session-yesterday-completed-2',
    userId: 'default-user',
    title: 'Game Theory: Perfect Bayesian Equilibrium',
    domainId: 'domain-econ',
    domainName: 'Economics & Finance',
    topicId: topicIdMap.get('domain-econ:Game Theory') || null,
    topicName: 'Game Theory',
    status: 'completed',
    source: 'calendar',
    date: yesterdayStr,
    plannedStartTime: '13:00',
    plannedEndTime: '14:30',
    plannedDurationMinutes: 90,
    actualStartTimestamp: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 13, 0, 0).getTime(),
    actualEndTimestamp: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 14, 30, 0).getTime(),
    actualFocusSeconds: 5400,
    actualBreakSeconds: 600,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Signaling games with belief updates using Bayes rule on off-equilibrium paths.',
    sortOrder: 1
  });

  // 1 Intentional Missed Session yesterday to demonstrate rose alert styling on calendar
  sessionsToInsert.push({
    id: 'session-yesterday-missed',
    userId: 'default-user',
    title: 'French Syntax: Subjunctive in Dependent Clauses',
    domainId: 'domain-lang',
    domainName: 'Languages',
    topicId: topicIdMap.get('domain-lang:French Syntax') || null,
    topicName: 'French Syntax',
    status: 'missed',
    source: 'calendar',
    date: yesterdayStr,
    plannedStartTime: '16:00',
    plannedEndTime: '17:00',
    plannedDurationMinutes: 60,
    actualStartTimestamp: null,
    actualEndTimestamp: null,
    actualFocusSeconds: 0,
    actualBreakSeconds: 0,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Missed scheduled session due to research seminar.',
    sortOrder: 2
  });

  // -------------------------------------------------------------
  // C. TRAILING 16 CONSECUTIVE DAYS (Guarantees Active 16-Day Streak)
  // -------------------------------------------------------------
  const streakTopics = [
    { domainId: 'domain-cs', domainName: 'Computer Science', topic: 'Algorithms', title: 'Graph Algorithms: Strongly Connected Components' },
    { domainId: 'domain-econ', domainName: 'Economics & Finance', topic: 'Asset Pricing', title: 'Stochastic Discount Factors & Equity Premium' },
    { domainId: 'domain-phil', domainName: 'Philosophy', topic: 'Epistemology', title: 'Gettier Problems & Defeasibility Analysis' },
    { domainId: 'domain-cogsci', domainName: 'Cognitive Science', topic: 'Visual Perception', title: 'Dorsal vs. Ventral Stream Processing' },
    { domainId: 'domain-lang', domainName: 'Languages', topic: 'Spanish Literature', title: 'Borges: Ficciones Hermeneutics & Narrative Time' }
  ];

  for (let offset = 2; offset <= 16; offset++) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    const dateStr = formatDate(d);
    const chosen = streakTopics[offset % streakTopics.length];
    const durationMins = 60 + ((offset * 15) % 45); // 60m, 75m, 90m
    const focusSec = durationMins * 60;
    const startMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0, 0).getTime();
    const endMs = startMs + focusSec * 1000;

    sessionsToInsert.push({
      id: `session-streak-${offset}`,
      userId: 'default-user',
      title: chosen.title,
      domainId: chosen.domainId,
      domainName: chosen.domainName,
      topicId: topicIdMap.get(`${chosen.domainId}:${chosen.topic}`) || null,
      topicName: chosen.topic,
      status: 'completed',
      source: 'calendar',
      date: dateStr,
      plannedStartTime: '10:00',
      plannedEndTime: `${Math.floor((10 * 60 + durationMins) / 60)}:${String((10 * 60 + durationMins) % 60).padStart(2, '0')}`,
      plannedDurationMinutes: durationMins,
      actualStartTimestamp: startMs,
      actualEndTimestamp: endMs,
      actualFocusSeconds: focusSec,
      actualBreakSeconds: 600,
      timerMode: 'countdown',
      pauseIntervals: '[]',
      notes: `Streak continuity session day -${offset}.`,
      sortOrder: 0
    });
  }

  // -------------------------------------------------------------
  // D. TRAILING 5 MONTHS HISTORICAL DATA (Days 17 to 150)
  // -------------------------------------------------------------
  // 3 to 5 study days per week, 1.5h to 4.5h per day
  for (let offset = 17; offset <= 150; offset++) {
    const dayOfWeek = (now.getDay() - (offset % 7) + 7) % 7;
    // Study on days 1, 2, 4, 5, 6 (skip ~2 days a week for realistic cadence)
    if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) {
      const d = new Date(now);
      d.setDate(now.getDate() - offset);
      const dateStr = formatDate(d);
      const chosen = streakTopics[(offset * 3) % streakTopics.length];

      const durationMins = 90 + ((offset % 3) * 30); // 90m, 120m, 150m
      const focusSec = durationMins * 60;
      const startMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 0, 0).getTime();
      const endMs = startMs + focusSec * 1000;

      sessionsToInsert.push({
        id: `session-hist-${offset}`,
        userId: 'default-user',
        title: chosen.title,
        domainId: chosen.domainId,
        domainName: chosen.domainName,
        topicId: topicIdMap.get(`${chosen.domainId}:${chosen.topic}`) || null,
        topicName: chosen.topic,
        status: 'completed',
        source: offset % 4 === 0 ? 'historical_manual' : 'calendar',
        date: dateStr,
        plannedStartTime: '14:00',
        plannedEndTime: `${Math.floor((14 * 60 + durationMins) / 60)}:${String((14 * 60 + durationMins) % 60).padStart(2, '0')}`,
        plannedDurationMinutes: durationMins,
        actualStartTimestamp: startMs,
        actualEndTimestamp: endMs,
        actualFocusSeconds: focusSec,
        actualBreakSeconds: 600,
        timerMode: 'countdown',
        pauseIntervals: '[]',
        notes: `Academic study record for ${dateStr}.`,
        sortOrder: 0
      });
    }
  }

  // -------------------------------------------------------------
  // E. CALENDAR SCHEDULE BLOCKS (Current Week & Next Week)
  // -------------------------------------------------------------
  // Include 1 intentional clean 2-block overlap on Wednesday
  const wednesday = new Date(now);
  const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
  const daysUntilWed = (3 - currentDayOfWeek + 7) % 7 || 7;
  wednesday.setDate(now.getDate() + daysUntilWed);
  const wedStr = formatDate(wednesday);

  // Overlapping Block A on Wednesday 10:00 - 11:30
  sessionsToInsert.push({
    id: 'calendar-block-wed-overlap-1',
    userId: 'default-user',
    title: 'Distributed Hash Tables: Kademlia Protocol',
    domainId: 'domain-cs',
    domainName: 'Computer Science',
    topicId: topicIdMap.get('domain-cs:Distributed Systems') || null,
    topicName: 'Distributed Systems',
    status: 'planned',
    source: 'calendar',
    date: wedStr,
    plannedStartTime: '10:00',
    plannedEndTime: '11:30',
    plannedDurationMinutes: 90,
    actualStartTimestamp: null,
    actualEndTimestamp: null,
    actualFocusSeconds: 0,
    actualBreakSeconds: 0,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Concurrent research block demonstrating column division.',
    sortOrder: 0
  });

  // Overlapping Block B on Wednesday 10:30 - 12:00
  sessionsToInsert.push({
    id: 'calendar-block-wed-overlap-2',
    userId: 'default-user',
    title: 'Behavioral Economics: Prospect Theory & Risk',
    domainId: 'domain-econ',
    domainName: 'Economics & Finance',
    topicId: topicIdMap.get('domain-econ:Game Theory') || null,
    topicName: 'Game Theory',
    status: 'planned',
    source: 'calendar',
    date: wedStr,
    plannedStartTime: '10:30',
    plannedEndTime: '12:00',
    plannedDurationMinutes: 90,
    actualStartTimestamp: null,
    actualEndTimestamp: null,
    actualFocusSeconds: 0,
    actualBreakSeconds: 0,
    timerMode: 'countdown',
    pauseIntervals: '[]',
    notes: 'Concurrent research block demonstrating column division.',
    sortOrder: 1
  });

  // Schedule blocks for Thursday, Friday, Saturday
  const scheduleDays = [1, 2, 3, 4, 5];
  for (const dayOffset of scheduleDays) {
    if (dayOffset !== daysUntilWed) {
      const d = new Date(now);
      d.setDate(now.getDate() + dayOffset);
      const dStr = formatDate(d);

      sessionsToInsert.push({
        id: `calendar-block-future-${dayOffset}`,
        userId: 'default-user',
        title: streakTopics[dayOffset % streakTopics.length].title,
        domainId: streakTopics[dayOffset % streakTopics.length].domainId,
        domainName: streakTopics[dayOffset % streakTopics.length].domainName,
        topicId: topicIdMap.get(`${streakTopics[dayOffset % streakTopics.length].domainId}:${streakTopics[dayOffset % streakTopics.length].topic}`) || null,
        topicName: streakTopics[dayOffset % streakTopics.length].topic,
        status: 'planned',
        source: 'calendar',
        date: dStr,
        plannedStartTime: '11:00',
        plannedEndTime: '12:30',
        plannedDurationMinutes: 90,
        actualStartTimestamp: null,
        actualEndTimestamp: null,
        actualFocusSeconds: 0,
        actualBreakSeconds: 0,
        timerMode: 'countdown',
        pauseIntervals: '[]',
        notes: 'Scheduled academic deep-work block.',
        sortOrder: 0
      });
    }
  }

  // 5. Batch Insert All Sessions
  for (const s of sessionsToInsert) {
    await sql`
      INSERT INTO study_sessions (
        id, user_id, title, domain_id, domain_name, topic_id, topic_name, status, source,
        date, planned_start_time, planned_end_time, planned_duration_minutes, actual_start_timestamp, actual_end_timestamp,
        actual_focus_seconds, actual_break_seconds, timer_mode, pause_intervals, notes, sort_order, created_at, updated_at
      ) VALUES (
        ${s.id}, ${s.userId}, ${s.title}, ${s.domainId}, ${s.domainName}, ${s.topicId}, ${s.topicName},
        ${s.status}, ${s.source}, ${s.date}, ${s.plannedStartTime}, ${s.plannedEndTime}, ${s.plannedDurationMinutes},
        ${s.actualStartTimestamp}, ${s.actualEndTimestamp}, ${s.actualFocusSeconds}, ${s.actualBreakSeconds},
        ${s.timerMode}, ${s.pauseIntervals}::jsonb, ${s.notes}, ${s.sortOrder}, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        domain_id = EXCLUDED.domain_id,
        domain_name = EXCLUDED.domain_name,
        topic_id = EXCLUDED.topic_id,
        topic_name = EXCLUDED.topic_name,
        status = EXCLUDED.status,
        source = EXCLUDED.source,
        date = EXCLUDED.date,
        planned_start_time = EXCLUDED.planned_start_time,
        planned_end_time = EXCLUDED.planned_end_time,
        planned_duration_minutes = EXCLUDED.planned_duration_minutes,
        actual_start_timestamp = EXCLUDED.actual_start_timestamp,
        actual_end_timestamp = EXCLUDED.actual_end_timestamp,
        actual_focus_seconds = EXCLUDED.actual_focus_seconds,
        actual_break_seconds = EXCLUDED.actual_break_seconds,
        timer_mode = EXCLUDED.timer_mode,
        pause_intervals = EXCLUDED.pause_intervals,
        notes = EXCLUDED.notes,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `;
  }

  return { success: true, sessionCount: sessionsToInsert.length };
}
