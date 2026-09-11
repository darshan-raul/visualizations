import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/visualizations/index.html', import.meta.url), 'utf8');
const match = html.match(/<script[^>]*data-topic-graph[^>]*>([\s\S]*?)<\/script>/);
if (!match) throw new Error('Generated catalogue does not contain topic graph data.');

const graph = JSON.parse(match[1]);
const nodeIds = new Set(graph.nodes.map((node) => node.id));
const edgeIds = new Set();
const failures = [];

if (nodeIds.size !== graph.nodes.length) failures.push('Topic graph contains duplicate node IDs.');
for (const node of graph.nodes) {
  if (!node.id || !node.title || !node.href) failures.push(`Topic node is missing required fields: ${JSON.stringify(node)}`);
}
for (const edge of graph.edges) {
  if (edgeIds.has(edge.id)) failures.push(`Duplicate edge ID: ${edge.id}`);
  edgeIds.add(edge.id);
  if (edge.source === edge.target) failures.push(`Self edge: ${edge.id}`);
  if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) failures.push(`Edge has an unknown endpoint: ${edge.id}`);
  if (!edge.editorialSources.length && !edge.sharedTags.length && !edge.sharedTechnologies.length) failures.push(`Edge has no relationship reason: ${edge.id}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${graph.nodes.length} topic nodes and ${graph.edges.length} explained relationships.`);
}
