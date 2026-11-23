import type { FastifyPluginAsync } from 'fastify';
import { getSqlClient } from '../db.js';
import type {
  UserSettings,
  AccountSettings,
  UsageSettings,
  GeneralSettings,
  MemorySettings,
  LearnedMemoryItem,
  SkillItem
} from '@sos/domain';

const DEFAULT_SKILLS: SkillItem[] = [
  {
    id: 'skill-summarize',
    command: '/summarize',
    description: 'Create structured academic summaries from the active page',
    enabled: true,
    systemPrompt: 'Synthesize the main thesis, key arguments, and foundational evidence from the current context into a structured, executive summary.',
    isBuiltIn: true
  },
  {
    id: 'skill-flashcards',
    command: '/flashcards',
    description: 'Generate spaced-repetition cards from highlighted concepts',
    enabled: true,
    systemPrompt: 'Extract atomic, testable propositions from the active text and convert them into high-yield Question and Answer flashcards using spaced repetition principles.',
    isBuiltIn: true
  },
  {
    id: 'skill-socratic',
    command: '/socratic',
    description: 'Test your understanding through guided questioning',
    enabled: true,
    systemPrompt: 'Adopt the Socratic teaching persona. Rather than providing direct answers, challenge assumptions, probe reasoning, and ask progressive diagnostic questions.',
    isBuiltIn: true
  },
  {
    id: 'skill-quiz',
    command: '/quiz',
    description: 'Build a quick practice drill from your current material',
    enabled: true,
    systemPrompt: 'Generate a 5-question multi-choice diagnostic drill with distractor rationales based strictly on the current study context.',
    isBuiltIn: true
  },
  {
    id: 'skill-feynman',
    command: '/feynman',
    description: 'Explain complex topics simply and spot gaps in my reasoning',
    enabled: true,
    systemPrompt: '1. Ask me to explain the concept from the active page in simple, jargon-free language.\n2. Identify any logical leaps, hidden assumptions, or missing causal links in my explanation.\n3. Guide me back to the exact source passage to refine my mental model before moving on.',
    isBuiltIn: false
  },
  {
    id: 'skill-first-principles',
    command: '/first-principles',
    description: 'Break down arguments and models to their core assumptions',
    enabled: true,
    systemPrompt: '1. Deconstruct the active theory or claim down to its fundamental, undeniable axioms.\n2. Question each layer of reasoning that builds upon those axioms.\n3. Reconstruct the problem from the ground up to verify logical consistency.',
    isBuiltIn: false
  }
];

const DEFAULT_LEARNED_MEMORIES: LearnedMemoryItem[] = [
  {
    id: 'mem-1',
    text: 'Prefers active recall and Feynman technique over passive reading',
    category: 'Preference',
    createdAt: '2026-11-15T10:00:00.000Z'
  },
  {
    id: 'mem-2',
    text: 'Struggles with distributed consensus protocols and Raft log compaction',
    category: 'CS 161',
    createdAt: '2026-11-16T14:30:00.000Z'
  },
  {
    id: 'mem-3',
    text: 'Optimal focus interval is 50m deep work with 10m recovery break',
    category: 'ECON 102',
    createdAt: '2026-11-17T09:15:00.000Z'
  },
  {
    id: 'mem-4',
    text: 'Prefers mathematical derivations in LaTeX format with minimal prose filler',
    category: 'Fixed Income',
    createdAt: '2026-11-18T08:00:00.000Z'
  }
];

let currentSettings: UserSettings = {
  account: {
    name: 'Abdalla Husin',
    username: '@abdalla7usin',
    email: 'Plato428@Athens.com',
    learningFocus: 'Computer Science & Economics',
    plan: 'Free',
    avatarUrl: '/avatars/user-portrait.jpg'
  },
  usage: {
    planName: 'SOS Free',
    planPrice: '$0 / month',
    planDescription: 'Unlimited local notes & offline study cards',
    aiCreditsUsed: 0,
    aiCreditsLimit: 500,
    aiCreditsResetDays: 14,
    aiCreditsResetHours: 6,
    storageBytesUsed: 0,
    storageBytesLimit: 5 * 1024 * 1024 * 1024,
    availableResets: 0
  },
  general: {
    appLanguage: 'English',
    horizonBar: {
      milestoneName: 'Fall Semester 2026',
      startDate: '2026-09-26',
      endDate: '2027-01-01',
      preset: 'custom'
    },
    focusTracking: {
      automaticStudyTracking: false,
      defaultPomodoroInterval: '50m / 10m',
      focusMinutes: 50,
      breakMinutes: 10
    },
    soundMotion: {
      sessionCompletionChimes: false,
      reducedMotion: 'os_default'
    }
  },
  memory: {
    enabled: false,
    whoIAm: '',
    whatIAmLearning: '',
    howIPreferToLearn: '',
    learnedMemories: [...DEFAULT_LEARNED_MEMORIES]
  },
  skills: [...DEFAULT_SKILLS]
};

export const settingsRoutes: FastifyPluginAsync = async (server) => {
  const sql = getSqlClient();

  // Helper to sync account from Postgres
  const syncAccountFromDb = async () => {
    try {
      const rows = await sql`SELECT * FROM user_profiles WHERE id = 'default-user' LIMIT 1`;
      if (rows.length > 0) {
        const p = rows[0];
        currentSettings.account = {
          name: p.name,
          username: p.username,
          email: p.email,
          learningFocus: p.learning_focus,
          plan: p.plan,
          avatarUrl: p.avatar_url,
          bio: p.bio,
          location: p.location,
          education: p.education,
          coverImage: p.cover_image,
          joinedDate: p.joined_date
        };
      }
    } catch (e) {
      server.log.warn(e, 'Failed to sync account from user_profiles');
    }
  };

  // GET /api/settings - retrieve full settings
  server.get<{ Reply: UserSettings }>('/api/settings', async (_req, reply) => {
    await syncAccountFromDb();
    return reply.status(200).send(currentSettings);
  });

  // PUT /api/settings/account - update account details
  server.put<{ Body: Partial<AccountSettings>; Reply: AccountSettings }>(
    '/api/settings/account',
    async (req, reply) => {
      const b = req.body;
      try {
        const updated = await sql`
          UPDATE user_profiles
          SET
            name = COALESCE(${b.name ?? null}, name),
            username = COALESCE(${b.username ?? null}, username),
            email = COALESCE(${b.email ?? null}, email),
            learning_focus = COALESCE(${b.learningFocus ?? null}, learning_focus),
            plan = COALESCE(${b.plan ?? null}, plan),
            avatar_url = COALESCE(${b.avatarUrl ?? null}, avatar_url),
            bio = COALESCE(${b.bio ?? null}, bio),
            location = COALESCE(${b.location ?? null}, location),
            education = COALESCE(${b.education ?? null}, education),
            cover_image = COALESCE(${b.coverImage ?? null}, cover_image),
            joined_date = COALESCE(${b.joinedDate ?? null}, joined_date),
            updated_at = NOW()
          WHERE id = 'default-user'
          RETURNING *
        `;
        if (updated.length > 0) {
          const p = updated[0];
          currentSettings.account = {
            name: p.name,
            username: p.username,
            email: p.email,
            learningFocus: p.learning_focus,
            plan: p.plan,
            avatarUrl: p.avatar_url,
            bio: p.bio,
            location: p.location,
            education: p.education,
            coverImage: p.cover_image,
            joinedDate: p.joined_date
          };
        }
      } catch (e) {
        server.log.warn(e, 'Failed to update user_profiles in DB, falling back to memory');
        currentSettings.account = {
          ...currentSettings.account,
          ...b
        };
      }
      return reply.status(200).send(currentSettings.account);
    }
  );

  // PATCH /api/settings/account - partial update account details
  server.patch<{ Body: Partial<AccountSettings>; Reply: AccountSettings }>(
    '/api/settings/account',
    async (req, reply) => {
      const b = req.body;
      try {
        const updated = await sql`
          UPDATE user_profiles
          SET
            name = COALESCE(${b.name ?? null}, name),
            username = COALESCE(${b.username ?? null}, username),
            email = COALESCE(${b.email ?? null}, email),
            learning_focus = COALESCE(${b.learningFocus ?? null}, learning_focus),
            plan = COALESCE(${b.plan ?? null}, plan),
            avatar_url = COALESCE(${b.avatarUrl ?? null}, avatar_url),
            bio = COALESCE(${b.bio ?? null}, bio),
            location = COALESCE(${b.location ?? null}, location),
            education = COALESCE(${b.education ?? null}, education),
            cover_image = COALESCE(${b.coverImage ?? null}, cover_image),
            joined_date = COALESCE(${b.joinedDate ?? null}, joined_date),
            updated_at = NOW()
          WHERE id = 'default-user'
          RETURNING *
        `;
        if (updated.length > 0) {
          const p = updated[0];
          currentSettings.account = {
            name: p.name,
            username: p.username,
            email: p.email,
            learningFocus: p.learning_focus,
            plan: p.plan,
            avatarUrl: p.avatar_url,
            bio: p.bio,
            location: p.location,
            education: p.education,
            coverImage: p.cover_image,
            joinedDate: p.joined_date
          };
        }
      } catch (e) {
        server.log.warn(e, 'Failed to update user_profiles in DB, falling back to memory');
        currentSettings.account = {
          ...currentSettings.account,
          ...b
        };
      }
      return reply.status(200).send(currentSettings.account);
    }
  );

  // GET /api/settings/usage - calculate real-time usage metrics
  server.get<{ Reply: UsageSettings }>('/api/settings/usage', async (_req, reply) => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(0, daysInMonth - now.getDate());
    const hoursLeft = Math.max(0, 24 - now.getHours());

    const usage: UsageSettings = {
      ...currentSettings.usage,
      aiCreditsResetDays: daysLeft,
      aiCreditsResetHours: hoursLeft
    };
    return reply.status(200).send(usage);
  });

  // PUT /api/settings/general - update general app preferences
  server.put<{ Body: Partial<GeneralSettings>; Reply: GeneralSettings }>(
    '/api/settings/general',
    async (req, reply) => {
      currentSettings.general = {
        ...currentSettings.general,
        ...req.body,
        horizonBar: {
          ...currentSettings.general.horizonBar,
          ...(req.body.horizonBar || {})
        },
        focusTracking: {
          ...currentSettings.general.focusTracking,
          ...(req.body.focusTracking || {}),
          ...(req.body.focusTracking?.focusMinutes !== undefined || req.body.focusTracking?.breakMinutes !== undefined
            ? {
                focusMinutes: req.body.focusTracking?.focusMinutes ?? currentSettings.general.focusTracking.focusMinutes,
                breakMinutes: req.body.focusTracking?.breakMinutes ?? currentSettings.general.focusTracking.breakMinutes,
                defaultPomodoroInterval: `${req.body.focusTracking?.focusMinutes ?? currentSettings.general.focusTracking.focusMinutes}m / ${req.body.focusTracking?.breakMinutes ?? currentSettings.general.focusTracking.breakMinutes}m`
              }
            : {})
        },
        soundMotion: {
          ...currentSettings.general.soundMotion,
          ...(req.body.soundMotion || {})
        }
      };
      return reply.status(200).send(currentSettings.general);
    }
  );

  // GET /api/settings/memory - get AI memory personalization
  server.get<{ Reply: MemorySettings }>('/api/settings/memory', async (_req, reply) => {
    return reply.status(200).send(currentSettings.memory);
  });

  // PUT /api/settings/memory - update AI memory personalization
  server.put<{ Body: Partial<MemorySettings>; Reply: MemorySettings }>(
    '/api/settings/memory',
    async (req, reply) => {
      currentSettings.memory = {
        ...currentSettings.memory,
        ...req.body
      };
      return reply.status(200).send(currentSettings.memory);
    }
  );

  // GET /api/settings/skills - list all skills
  server.get<{ Reply: SkillItem[] }>('/api/settings/skills', async (_req, reply) => {
    return reply.status(200).send(currentSettings.skills);
  });

  // POST /api/settings/skills - create new custom skill
  server.post<{
    Body: { command: string; description: string; systemPrompt: string };
    Reply: SkillItem | { error: string };
  }>('/api/settings/skills', async (req, reply) => {
    const { command, description, systemPrompt } = req.body;
    if (!command || !description || !systemPrompt) {
      return reply.status(400).send({ error: 'Missing required skill fields' });
    }

    const formattedCommand = command.startsWith('/') ? command : `/${command}`;
    const newSkill: SkillItem = {
      id: `custom-skill-${Date.now()}`,
      command: formattedCommand,
      description,
      systemPrompt,
      enabled: true,
      isBuiltIn: false
    };

    currentSettings.skills = [...currentSettings.skills, newSkill];
    return reply.status(201).send(newSkill);
  });

  // PUT /api/settings/skills/:id - update or toggle existing skill
  server.put<{
    Params: { id: string };
    Body: Partial<SkillItem>;
    Reply: SkillItem | { error: string };
  }>('/api/settings/skills/:id', async (req, reply) => {
    const { id } = req.params;
    const index = currentSettings.skills.findIndex((s) => s.id === id);
    if (index === -1) {
      return reply.status(404).send({ error: 'Skill not found' });
    }

    const existing = currentSettings.skills[index];
    const updated: SkillItem = {
      ...existing,
      ...req.body,
      command: req.body.command
        ? req.body.command.startsWith('/')
          ? req.body.command
          : `/${req.body.command}`
        : existing.command,
      isBuiltIn: existing.isBuiltIn // built-in status cannot be changed
    };

    currentSettings.skills[index] = updated;
    return reply.status(200).send(updated);
  });

  // DELETE /api/settings/skills/:id - delete a custom skill
  server.delete<{
    Params: { id: string };
    Reply: { success: boolean } | { error: string };
  }>('/api/settings/skills/:id', async (req, reply) => {
    const { id } = req.params;
    const skill = currentSettings.skills.find((s) => s.id === id);
    if (!skill) {
      return reply.status(404).send({ error: 'Skill not found' });
    }
    if (skill.isBuiltIn) {
      return reply.status(400).send({ error: 'Cannot delete built-in skill' });
    }

    currentSettings.skills = currentSettings.skills.filter((s) => s.id !== id);
    return reply.status(200).send({ success: true });
  });

  // POST /api/settings/delete-account - purge account data safely
  server.post<{ Reply: { success: boolean; message: string } }>(
    '/api/settings/delete-account',
    async (_req, reply) => {
      // Reset settings to fresh state
      currentSettings.skills = [...DEFAULT_SKILLS];
      currentSettings.memory = {
        enabled: false,
        whoIAm: '',
        whatIAmLearning: '',
        howIPreferToLearn: ''
      };
      currentSettings.usage.aiCreditsUsed = 0;
      currentSettings.usage.storageBytesUsed = 0;
      return reply.status(200).send({
        success: true,
        message: 'Account data purged successfully'
      });
    }
  );
};
