# IAM Visual Rebuild Plan

## Status and scope

This plan covers the paired rebuild of:

- AWS IAM Authorization Decision Explorer
- AWS Identity and Credential Flows

The Authorization Decision Explorer should be the flagship rebuild. Identity and Credential Flows should follow using the same visual language and shared components. The topics should remain separate and keep their existing public slugs.

`SITE-REBUILD-BRIEF.md` remains the confirmed source of truth. This document records the implementation plan for bringing the IAM topics up to the standard established by the Kubernetes Networking and EC2 Auto Scaling rebuilds.

## Problem statement

The current IAM pages contain useful technical material, but their presentation is shallower than the newer explainers:

- Generic four-box flows appear before a concrete mental model.
- Explorers replace one completed scenario with another instead of revealing causality step by step.
- Policy types read as a list; grant sources, limiters, account boundaries, and explicit denies are not spatially clear.
- Tables carry too much of the teaching.
- Edge cases appear as isolated diagrams rather than variations of the main model.
- IAM CSS relies on viewport breakpoints, creating the same article-column layout risk previously found on Kubernetes Networking.

## Phase 1: establish the IAM visual model

Use one recognizable request throughout the authorization topic:

```text
AppReader/alex -> s3:GetObject -> reports/q3.pdf
```

Build the request progressively:

1. Identify the principal and credential or session.
2. Add the action, resource, and condition context.
3. Find statements that match the request.
4. Separate grant-producing policies from limiting policies.
5. Apply explicit denies.
6. Cross an account boundary when the scenario requires it.
7. Produce the final decision and identify the supporting evidence.

Use a consistent visual grammar:

- Cyan: the request and direct service interactions.
- Purple: identity, policy, trust, and control-plane activity.
- Green: a sufficient allow.
- Red: an explicit or final deny.
- Amber: conditions, boundaries, transformations, and cautions.
- Solid connectors: direct evaluation relationships.
- Dashed connectors: conceptual, optional, or scenario-dependent relationships.

## Phase 2: rebuild Authorization Decision Explorer

Restructure `src/content/topics/aws-authorization-decision-explorer.mdx` around this sequence:

| Section | Primary teaching visual |
| --- | --- |
| Start with one failed request | Progressive PARC request model |
| Does this statement match? | Interactive policy JSON with Principal, Action, Resource, and Condition gates |
| Where can an allow come from? | Grant sources versus limiting-policy plane |
| Why was this denied? | Cumulative decision trace |
| Same account versus cross-account | Two-sided authorization handshake |
| Principal edge cases | Role ARN versus session ARN comparison |
| Diagnose AccessDenied | Evidence-first troubleshooting workflow |

Replace the current scenario switcher with an `IamAuthorizationLabs` experience modeled after the Auto Scaling labs:

- Provide back, next, replay, reset, and direct scenario selection.
- Keep earlier decision steps visible as the trace advances.
- Update the request, matching statements, policy layers, and outcome together.
- Explain what changed at each step and what evidence would prove it.
- Keep every scenario readable when JavaScript is unavailable.

Initial lab scenarios:

1. An identity policy supplies a same-account allow.
2. A resource policy supplies the allow.
3. A bucket-policy explicit deny overrides an administrator allow.
4. A permissions boundary clips an identity-policy grant.
5. A session policy narrows a role session.
6. An SCP or RCP blocks an otherwise allowed request.
7. A cross-account request requires authorization on both sides.
8. A direct role-session grant demonstrates the documented exception.

Present the explorer as a teaching model, not an IAM simulator. State that boundary once in the lab caption rather than repeating defensive disclaimers throughout the page.

## Phase 3: rebuild Identity and Credential Flows

Restructure `src/content/topics/aws-identity-credential-flows.mdx` around one complete credential journey:

```text
Human -> Identity Center login -> account assignment
      -> temporary role credentials -> SigV4 request -> authorization
```

Add a persistent artifact map that distinguishes:

- Human or browser authentication session
- Identity Center access token
- IAM role configuration
- STS role session
- Temporary AWS credential set
- SigV4-signed service request

Upgrade the existing journeys into cumulative labs:

- An IAM principal calls `AssumeRole`.
- A role session chains into another role.
- The AWS CLI obtains credentials through IAM Identity Center.
- A vendor uses `ExternalId` to bind access to the correct customer.

Keep the AssumeRole versus PassRole comparison, but show ownership and credential movement side by side instead of presenting two generic stacks. End the credential journey by connecting the signed request to the authorization topic's mental model.

## Phase 4: components and reuse

Create focused components instead of a universal IAM diagram system:

- `src/components/iam/IamProgressiveDecision.astro`
- `src/components/iam/IamAuthorizationLabs.astro`
- `src/components/iam/iam-authorization-labs.ts`
- `src/components/iam/PolicyPlaneMap.astro`
- `src/components/iam/CrossAccountHandshake.astro`
- `src/components/iam/CredentialArtifactMap.astro`
- `src/components/iam/CredentialJourneyLabs.astro`
- `src/components/iam/iam-credential-labs.ts`
- `src/components/iam/IamDiagnostics.astro`

Extract the expandable `NetworkDepth` pattern into a shared topic-depth component instead of copying it into IAM. Continue using `ReferenceTable` and `WorkflowDiagram` only where a table or sequence is genuinely the clearest form.

Refactor `src/styles/iam.css` around container queries so each component responds to the 790px article column rather than only the browser viewport.

## Phase 5: editorial and technical revalidation

- Revalidate IAM, STS, IAM Identity Center, SCP, RCP, role-session, resource-policy, trust-policy, and PassRole claims against current AWS documentation.
- Distinguish documented policy behavior from conceptual evaluation ordering.
- Avoid implying that the visual reproduces AWS's private implementation.
- Preserve important service-specific exceptions without allowing them to obscure the primary mental model.
- Use prose to frame visuals, explain caveats, and connect mechanisms rather than repeating every node and connector.
- Update reviewed dates only after the technical review is complete.

## Phase 6: accessibility and verification

Before publication:

- Ensure keyboard operation and visible focus for every lab control.
- Respect reduced-motion preferences.
- Preserve readable core content when optional JavaScript does not run.
- Check desktop, the 790px article column, tablet, and 390px mobile layouts.
- Confirm that diagrams do not overflow, compress labels, or rely on hover alone.
- Provide textual explanations for every important visual.
- Run `npm run verify`.
- Smoke-test every lab scenario, replay control, section anchor, and cross-topic link.

## Delivery order

1. Revalidate the technical model and settle the running scenarios.
2. Extract or establish shared disclosure and responsive-layout primitives.
3. Build the progressive authorization mental model.
4. Build and integrate the Authorization Decision labs.
5. Restructure and polish the authorization MDX page.
6. Build the credential artifact map and journey labs.
7. Restructure and polish the credential-flow MDX page.
8. Add cross-topic transitions, responsive refinements, and accessibility behavior.
9. Complete editorial, technical, desktop, mobile, and interaction verification.

## Completion criteria

The rebuild is complete when:

- Each page begins with a concrete scenario and develops it progressively.
- Every major mechanism has a diagram, comparison, cumulative trace, or compact reference where visualization materially improves understanding.
- Grant sources, limiters, explicit denies, trust, account boundaries, sessions, and credential artifacts are visually distinguishable.
- Interactive scenarios reveal cause and effect instead of merely swapping static outcomes.
- The two pages share a coherent visual language without duplicating an encyclopedic IAM overview.
- Both pages remain technically rigorous, accessible, mobile-readable, and useful without JavaScript.
- All repository verification and representative browser checks pass.
