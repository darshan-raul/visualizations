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
} as const;

export type CollectionSlug = keyof typeof collections;

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
