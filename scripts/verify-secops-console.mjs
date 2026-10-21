import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const htmlPath = join(process.cwd(), 'dist', 'secopspipeline', 'index.html');
const html = readFileSync(htmlPath, 'utf8');

console.log('Verifying /secopspipeline generated output...');

// 1. Verify all 10 views exist
const expectedViews = [
  'dep-review',
  'code-quality',
  'build-once',
  'attest-sign',
  'deploy-staging',
  'dast-staging',
  'promote-gate',
  'deploy-prod',
  'rollback-prod',
  'security-matrix',
];

for (const viewId of expectedViews) {
  if (!html.includes(`id="${viewId}"`)) {
    throw new Error(`Missing view container id="${viewId}"`);
  }
}
console.log('✓ All 10 views present in static HTML');

// 2. Check no-JS fallback
if (!html.includes('secops-nojs-point')) {
  throw new Error('Missing no-JS takeaway point fallback class');
}
console.log('✓ No-JS fallback elements present');

// 3. Check interactive components rendered
const expectedComponents = [
  'secops-rail',
  'secops-attest-board',
  'secops-canary-sim',
  'secops-data-table',
  'secops-code-viewer',
];

for (const comp of expectedComponents) {
  if (!html.includes(comp)) {
    throw new Error(`Missing expected component marker: ${comp}`);
  }
}
console.log('✓ All interactive component structures verified in output');

// 4. Check critical technical security concepts
const requiredTerms = [
  'cosign verify',
  '--certificate-oidc-issuer',
  '--certificate-identity',
  'sha256:',
  'Gitleaks',
  'CodeQL',
  'Trivy',
  'Argo Rollouts',
  'OWASP ZAP',
  'sts:AssumeRoleWithWebIdentity',
];

for (const term of requiredTerms) {
  if (!html.includes(term)) {
    throw new Error(`Missing critical security concept or tool reference: "${term}"`);
  }
}
console.log('✓ All critical security tools and commands verified');

// 5. Check sources list rendered
if (!html.includes('secopspipeline-sources')) {
  throw new Error('Missing sources container #secopspipeline-sources');
}
console.log('✓ Authoritative sources section rendered');

console.log('\nAll 5 automated checks for /secopspipeline passed successfully!');
