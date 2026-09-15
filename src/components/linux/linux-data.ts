export type { LinuxPillar, LinuxView, ViewKind, Actor, FailureState, WalkthroughStep, ComparisonItem, RecipeStep, DecisionNode } from './linux-types';
export { actorKinds } from './linux-types';

import { identityPillar } from './pillars/identity';
import { storagePillar } from './pillars/storage';
import { processesPillar } from './pillars/processes';
import { networkingPillar } from './pillars/networking';
import { packagesPillar } from './pillars/packages';
import { shellPillar } from './pillars/shell';
import { securityPillar } from './pillars/security';
import { troubleshootingPillar } from './pillars/troubleshooting';
import type { LinuxPillar } from './linux-types';

export const linuxPillars: LinuxPillar[] = [
  identityPillar,
  storagePillar,
  processesPillar,
  networkingPillar,
  packagesPillar,
  shellPillar,
  securityPillar,
  troubleshootingPillar,
];

export const linuxPillarIds = linuxPillars.map((pillar) => pillar.id);
export function getLinuxPillar(id: string) { return linuxPillars.find((pillar) => pillar.id === id); }
