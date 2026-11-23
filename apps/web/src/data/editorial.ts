export interface EditorialQuote {
  id: string;
  quote: string;
  author: string;
}

export interface EditorialArticle {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string[];
}

export const DAILY_QUOTES: EditorialQuote[] = [
  {
    id: 'quote-aristotle',
    quote: '“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”',
    author: 'Aristotle'
  },
  {
    id: 'quote-feynman',
    quote: '“I would rather have questions that can’t be answered than answers that can’t be questioned.”',
    author: 'Richard Feynman'
  },
  {
    id: 'quote-seneca',
    quote: '“Time discovers truth. Time heals what reason cannot.”',
    author: 'Seneca'
  },
  {
    id: 'quote-marcus-aurelius',
    quote: '“The soul becomes dyed with the color of its thoughts.”',
    author: 'Marcus Aurelius'
  },
  {
    id: 'quote-william-james',
    quote: '“The art of being wise is the art of knowing what to overlook.”',
    author: 'William James'
  },
  {
    id: 'quote-da-vinci',
    quote: '“Learning never exhausts the mind.”',
    author: 'Leonardo da Vinci'
  },
  {
    id: 'quote-epictetus',
    quote: '“No man is free who is not master of himself.”',
    author: 'Epictetus'
  }
];

export const DAILY_ARTICLES: EditorialArticle[] = [
  {
    id: 'article-deep-memory',
    title: 'On the Architecture of Deep Memory & Forgetting',
    summary: 'Why deliberate retrieval beats passive re-reading in building durable mental models.',
    author: 'Dr. Elena Rostova',
    date: '17 November 2026',
    readTime: '3 MIN READ',
    tags: ['Cognitive Science', 'Neuroplasticity', 'Active Recall'],
    content: [
      'In traditional learning environments, students repeatedly highlight text and reread notes under the cognitive illusion that familiarity equals mastery. However, neurobiological evidence demonstrates that passive re-exposure merely activates recognition circuits rather than generative memory pathways.',
      'When an individual engages in active retrieval—struggling to reconstruct an answer from memory without looking at notes—the brain undergoes synaptic potentiation. This retrieval effort signals to hippocampal networks that the information is functionally critical, triggering structural dendritic remodeling.',
      'Bjork’s concept of "desirable difficulties" underscores that learning is most durable when it demands cognitive friction. Forgetting is not an enemy to be avoided, but an essential filtering mechanism: by spacing retrieval intervals just as memory begins to decay, we force the reconstruction of synaptic traces, making future recall orders of magnitude faster and more resilient.'
    ]
  },
  {
    id: 'article-synaptic-plasticity',
    title: 'Synaptic Potentiation and the Hebbian Rule',
    summary: 'How persistent synchronous firing transforms transient experiences into permanent neural pathways.',
    author: 'Prof. Julian Vance',
    date: '16 November 2026',
    readTime: '4 MIN READ',
    tags: ['Neurobiology', 'LTP', 'Synaptic Density'],
    content: [
      'Donald Hebb formulated his foundational postulate in 1949: neurons that fire together wire together. Decades later, the discovery of Long-Term Potentiation (LTP) in the hippocampus provided the molecular confirmation of this rule.',
      'Upon high-frequency stimulation, presynaptic glutamate release depolarizes the postsynaptic membrane sufficiently to expel the magnesium block from NMDA receptors. Calcium ion influx then cascades through calcium/calmodulin-dependent protein kinase II (CaMKII), inserting additional AMPA receptors into the postsynaptic density.',
      'The macroscopic consequence of this microscopic cascade is profound: repeated, deliberate conceptual retrieval literally thickens synaptic pathways, converting abstract logical models into instinctive cognitive reflexes.'
    ]
  },
  {
    id: 'article-cognitive-load',
    title: 'Cognitive Load Theory in Modern Knowledge Systems',
    summary: 'Designing learning workflows that respect working memory constraints and maximize germane load.',
    author: 'Marcus Sterling',
    date: '15 November 2026',
    readTime: '3 MIN READ',
    tags: ['Information Architecture', 'Working Memory', 'System Design'],
    content: [
      'Human working memory is severely bottlenecked, typically constrained to holding roughly four chunks of novel information simultaneously. John Sweller’s Cognitive Load Theory categorizes cognitive demand into three distinct dimensions: intrinsic, extraneous, and germane.',
      'Extraneous cognitive load—caused by cluttered interfaces, disjointed tools, and constant context-switching—steals precious working memory capacity that should be allocated toward schema acquisition.',
      'By designing monochrome, calm, local-first environments with minimal visual noise and immediate keyboard shortcuts, we eliminate extraneous friction. This frees the student’s working memory to focus entirely on germane cognitive load: the deep synthesis and schema construction required for true expertise.'
    ]
  }
];

export function getDailyEditorial(currentDate = new Date()): {
  quote: EditorialQuote;
  article: EditorialArticle;
} {
  const startOfYear = new Date(currentDate.getFullYear(), 0, 0);
  const diff = currentDate.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.max(0, Math.floor(diff / oneDay));

  const quote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  const article = DAILY_ARTICLES[dayOfYear % DAILY_ARTICLES.length];

  return { quote, article };
}
