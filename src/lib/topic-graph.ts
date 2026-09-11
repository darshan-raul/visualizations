import { topicHref } from './topic-url';

export type TopicNode = {
  id: string;
  title: string;
  summary: string;
  href: string;
  collection: 'aws' | 'kubernetes' | 'devops-sre' | 'foundations';
  tags: string[];
  technologies: string[];
  format: string;
  difficulty: string;
  state: string;
};

export type TopicEdge = {
  id: string;
  source: string;
  target: string;
  editorialSources: string[];
  sharedTags: string[];
  sharedTechnologies: string[];
  score: number;
  overview: boolean;
};

type TopicEntry = {
  data: Omit<TopicNode, 'id' | 'href'> & {
    slug: string;
    legacyPath?: string;
    related?: string[];
  };
};

const edgeId = (a: string, b: string) => [a, b].sort().join('::');

export function buildTopicGraph(topics: TopicEntry[]) {
  const ids = new Set<string>();
  const errors: string[] = [];

  for (const topic of topics) {
    if (ids.has(topic.data.slug)) errors.push(`Duplicate topic slug: ${topic.data.slug}`);
    ids.add(topic.data.slug);
    const related = topic.data.related || [];
    if (new Set(related).size !== related.length) errors.push(`Duplicate related topic in ${topic.data.slug}`);
    for (const target of related) {
      if (target === topic.data.slug) errors.push(`Self-reference in ${topic.data.slug}`);
    }
  }

  for (const topic of topics) {
    for (const target of topic.data.related || []) {
      if (!ids.has(target)) errors.push(`Unknown related topic ${target} in ${topic.data.slug}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));

  const nodes: TopicNode[] = topics.map(({ data }) => ({
    id: data.slug,
    title: data.title,
    summary: data.summary,
    href: topicHref(data),
    collection: data.collection,
    tags: data.tags,
    technologies: data.technologies,
    format: data.format,
    difficulty: data.difficulty,
    state: data.state,
  }));
  const tagFrequency = new Map<string, number>();
  for (const node of nodes) for (const tag of node.tags) tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);

  const edges = new Map<string, TopicEdge>();
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex];
      const right = nodes[rightIndex];
      const sharedTags = left.tags.filter((tag) => right.tags.includes(tag)).sort();
      const sharedTechnologies = left.technologies.filter((technology) => right.technologies.includes(technology)).sort();
      const editorialSources = topics
        .filter(({ data }) =>
          (data.slug === left.id && data.related?.includes(right.id)) ||
          (data.slug === right.id && data.related?.includes(left.id)))
        .map(({ data }) => data.slug)
        .sort();
      if (!editorialSources.length && !sharedTags.length && !sharedTechnologies.length) continue;
      const score = sharedTechnologies.length * 3 + sharedTags.reduce((sum, tag) => sum + 1 / (tagFrequency.get(tag) || 1), 0);
      const id = edgeId(left.id, right.id);
      edges.set(id, { id, source: left.id, target: right.id, editorialSources, sharedTags, sharedTechnologies, score, overview: editorialSources.length > 0 });
    }
  }

  for (const node of nodes) {
    [...edges.values()]
      .filter((edge) => edge.source === node.id || edge.target === node.id)
      .filter((edge) => edge.editorialSources.length === 0)
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, 3)
      .forEach((edge) => { edge.overview = true; });
  }

  return {
    nodes,
    edges: [...edges.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function relationshipReason(edge: TopicEdge) {
  const parts: string[] = [];
  if (edge.editorialSources.length) parts.push('Editorially related');
  if (edge.sharedTechnologies.length) parts.push(`Shared technology: ${edge.sharedTechnologies.join(', ')}`);
  if (edge.sharedTags.length) parts.push(`Shared tags: ${edge.sharedTags.join(', ')}`);
  return parts.join(' · ');
}
