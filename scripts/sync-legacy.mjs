import { copyFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const legacyPages = [
  'docker-multiarch.html',
  'github-actions-cheatsheet.html',
  'k8s-networking.html',
  'oauth2-explainer.html',
  'opentelemetry.html',
  'secopspipeline.html',
  'vpc-flow.html',
];

const migratedPages = ['rds-backup-retention.html'];

const root = process.cwd();
const publicDirectory = join(root, 'public');

await mkdir(publicDirectory, { recursive: true });
await Promise.all(
  migratedPages.map((page) => rm(join(publicDirectory, page), { force: true })),
);
await Promise.all(
  legacyPages.map((page) => copyFile(join(root, page), join(publicDirectory, page))),
);

console.log(`Synced ${legacyPages.length} legacy visualizations into public/.`);
