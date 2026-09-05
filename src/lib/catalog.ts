export const collections = {
  aws: {
    label: 'AWS',
    eyebrow: 'Cloud platform',
    description: 'Visual models for the AWS services, boundaries, and data flows that matter in production.',
  },
  kubernetes: {
    label: 'Kubernetes',
    eyebrow: 'Container orchestration',
    description: 'See what happens across pods, nodes, clusters, controllers, and the network between them.',
  },
  'devops-sre': {
    label: 'DevOps & SRE',
    eyebrow: 'Operating systems well',
    description: 'Delivery, observability, reliability, and the operational mechanics behind dependable software.',
  },
  foundations: {
    label: 'Foundations',
    eyebrow: 'The layers underneath',
    description: 'Networking, identity, containers, and distributed-system concepts that make the rest click.',
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
