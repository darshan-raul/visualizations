import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const legacyPages = [
  'docker-multiarch.html',
  'github-actions-cheatsheet.html',
  'k8s-networking.html',
  'oauth2-explainer.html',
  'opentelemetry.html',
  'rds-backup-retention.html',
  'secopspipeline.html',
  'vpc-flow.html',
];

const root = process.cwd();
const publicDirectory = join(root, 'public');

await mkdir(publicDirectory, { recursive: true });
await Promise.all(
  legacyPages.map((page) => copyFile(join(root, page), join(publicDirectory, page))),
);

console.log(`Synced ${legacyPages.length} legacy visualizations into public/.`);
