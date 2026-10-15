export const collections = {
  aws: {
    label: 'AWS',
    eyebrow: 'Cloud platform',
    description: 'Trace how AWS services move requests, apply policy, store state, and fail at their boundaries.',
  },
  kubernetes: {
    label: 'Kubernetes',
    eyebrow: 'Container orchestration',
    description: 'See what happens across pods, nodes, clusters, controllers, and the network between them.',
  },
  'devops-sre': {
    label: 'DevOps & SRE',
    eyebrow: 'Operating systems well',
    description: 'See how delivery, observability, and reliability practices change the systems you operate.',
  },
  foundations: {
    label: 'Foundations',
    eyebrow: 'The layers underneath',
    description: 'Build the networking, identity, container, and distributed-systems models that infrastructure relies on.',
  },
  ai: {
    label: 'AI',
    eyebrow: 'Models, tools, and agents',
    description: 'See what an LLM application sends, what the model sends back, and which code runs the tools in between.',
  },
} as const;

export type CollectionSlug = keyof typeof collections;

export type CollectionGroup = { id: string; label: string; means: string };

/** Reading-order sections inside a collection page. A collection listed here needs `group` and `order` on every topic. */
export const collectionGroups: Partial<Record<CollectionSlug, CollectionGroup[]>> = {
  foundations: [
    { id: 'machine', label: 'The machine', means: 'What runs on one computer' },
    { id: 'network', label: 'The network', means: 'How computers find and reach each other' },
    { id: 'web', label: 'The web', means: 'What a browser and a server say to each other' },
  ],
};

export const formatLabels = {
  'visual-brief': 'Visual Brief',
  'deep-dive': 'Deep Dive',
  'flow-explorer': 'Flow Explorer',
  'operational-reference': 'Operational Reference',
} as const;

export const formatDescriptions = {
  'visual-brief': 'One mechanism, made visible',
  'deep-dive': 'A system explored layer by layer',
  'flow-explorer': 'Step through a changing system',
  'operational-reference': 'Practical detail at a glance',
} as const;
