# RDS Backup Retention — visual specification

Status: integrated RDS console pilot · v2.0 · 2026-09-15  
Topic: Amazon RDS DB instance backup retention  
Target audience: working developers and cloud engineers  
Page promise: predict how restore times age out, how PITR creates a new instance, what snapshots preserve, and what deletion leaves behind.  
Persistent scenario: fictional `orders-db` has seven-day retention; Day 2 is followed from Day 8 to Day 9.  
Scope and non-goals: RDS DB instances, EBS incrementality as an illustration, backup lifecycles and recovery practice. Aurora, Multi-AZ DB cluster behavior, engine-specific exceptions, live account state, exact billing, and undocumented RDS internals are excluded.  
Visual thesis: one console around one recovery question; all explanatory copy, sources, and related navigation remain at the right or bottom of its canvas.  
Semantic color and connector grammar: cyan = normal flow; green = available/healthy/surviving; amber = caution/transition; red = unavailable/removed. Purple remains reserved for identity/control-plane semantics and is not used to identify snapshot types. Solid arrows show direct sequence; dashed block borders show reference to older stored data. Pulses reveal flow or a changed state, never decoration. Words carry every state alongside color.

| # | Console view | Learner question | Visual form | Interaction | Takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Recovery window | Why did yesterday's restore time disappear? | Nine-day track | **Hero:** Day 8 ↔ Day 9 | Fixed retention moves with time. |
| 2 | Restore path | Does restore rewind the source? | Snapshot + logs → new instance | Carries Day 2 state | PITR creates another DB instance. |
| 3 | Snapshot blocks | How is an incremental snapshot complete? | EBS block lineage and eight-day history | **Hero:** Day 1–8 step-through and playback | Later points reuse earlier block versions. |
| 4 | Backup choices | Which form lives on which clock? | Four-branch map | Static comparison | Range, one state, final, and retained set differ. |
| 5 | Delete source | What survives instance deletion? | Three-result board | **Hero:** two checkboxes | Final and retained options are independent. |
| 6 | Boundaries | Which setting or state changes the answer? | Retention scale + signals | Static | Retention alone does not prove availability. |
| 7 | Storage & cost | Does seven days mean seven billed copies? | Driver-to-usage map | Static | Changed and retained data affect storage. |
| 8 | Operating loop | What should I verify before an incident? | Five-step path | Static | A listed point is not a tested restore. |

## Visual 1 — Recovery window

#### Purpose
Replace the fixed-window misconception with a Day 2 state change while retention stays at seven days.
#### Learner question
“Can a time I could restore today disappear tomorrow?”
#### Persistent scenario state
At Day 8, Day 2 is earliest in the teaching range. At Day 9 it is outside the range.
#### Concepts and actors
`orders-db`, configured retention, RDS-managed automated backups, Day 2, AWS-reported earliest/latest restorable times. Configuration is not a runtime restore timestamp.
#### Composition
Nine center-canvas cells say `Available`, `Aged out`, or `Not yet`. A boundary arrow sits below. The right inspector names the illustrated earliest day and points to RDS-reported bounds. Day 2 turns red and says `Aged out` when Day 9 enters.
#### Interaction
Native buttons advance/reverse Day 8 ↔ Day 9 deterministically; the selected state persists into restore and snapshot views. Loss briefly pulses, while reduced motion changes immediately.
#### Data or content states
Day 8: Days 2–8 available, Day 1 old, Day 9 future. Day 9: Days 3–9 available, Day 2 lost. The setting remains seven days.
#### Failure or edge state
The former Day 2 automated restore time is no longer in the illustrated range.
#### Required copy
“The recovery window moves.” Bottom: “The same seven-day setting can no longer recover the former Day 2 time.”
#### Accuracy caveats
Use actual `EarliestRestorableTime` and `LatestRestorableTime`; a colored day does not promise every minute is restorable. Do not calculate or randomize RDS times.
#### Mobile behavior
Cells become a three-column grid; boundary labels remain visible without horizontal page scroll.
#### Accessibility
Status words supplement color; track has a text summary; controls are native; right/bottom changes are polite live text; reduced motion removes pulses.
#### Source anchors
[RDS backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html), [PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html).
#### Acceptance checks
Day 2 changes state, seven-day setting does not, reversing is deterministic, and real bounds are never inferred from the cells.

## Visual 2 — Restore path

#### Purpose
Connect available time to the backup data needed for a new instance.
#### Learner question
“Does RDS rewind my existing database?”
#### Persistent scenario state
Day 2 remains selected; it is available at Day 8 and aged out at Day 9 in the teaching example.
#### Concepts and actors
System snapshot = baseline; transaction logs = continuation; restored DB instance = new runtime resource; source instance stays unchanged.
#### Composition
Three nodes read `System snapshot` + `Transaction logs` → `New DB instance`. Solid arrows and small progression pulses point to the result. A strip below names Day 2 and its current availability; inspector explains the source/result distinction.
#### Interaction
Stage navigation carries the day state. No fake live restore button is added; progression animation is optional and reduced motion keeps arrows.
#### Data or content states
`AVAILABLE IN THE DAY 8 EXAMPLE` or `AGED OUT AT DAY 9`.
#### Failure or edge state
At Day 9, automated Day 2 PITR is unavailable in the model; a manual snapshot can restore only its captured state.
#### Required copy
“A restore starts a new instance.” “Point-in-time restore does not rewind the source.”
#### Accuracy caveats
RDS uploads DB instance logs every five minutes, but latest restorable time can lag; RDS reports the range. Engine exceptions remain out of scope.
#### Mobile behavior
Nodes stack with connectors between them.
#### Accessibility
Numbered node text preserves order without motion; dynamic result has words; stage anchors work without JavaScript.
#### Source anchors
[PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html), [RDS backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html).
#### Acceptance checks
Result is always a new instance; Day 9 never offers Day 2 as available; source remains unchanged.

## Visual 3 — Snapshot block lineage

#### Purpose
Explain why incremental storage still represents a complete restorable volume.
#### Learner question
“If EBS stores only changes, where do unchanged blocks come from?”
#### Persistent scenario state
An illustrative EBS volume is inspected at every day from Day 1 through Day 8; this is not an exposed RDS dependency graph.
#### Concepts and actors
Block positions A–F, versions A1/C2 etc., full baseline, changed-block storage, references, later-snapshot preservation when an earlier snapshot expires.
#### Composition
Left source node → six current block positions. Solid cyan cells say `Stored now`; dashed cyan cells say `↑ Day N`. An eight-row history table underneath keeps every snapshot's six positions visible, with solid newly stored versions and dashed reused versions. A legend resolves connector meaning. At Day 8, a cleanup strip says C1/E1 can leave while A1/B1/D1/F1 remain because later points reference them.
#### Interaction
**Hero:** Day 1–8 native buttons, previous/next, and a pausable one-pass playback update six labels, fresh/reference state, cumulative history, inspector, and cleanup. Day 1 is default. Only newly stored cells pulse; reused cells remain visually stable. Manual selection stops playback, and reduced motion removes pulses.
#### Data or content states
Day 1: A1 B1 C1 D1 E1 F1, all stored. Day 2: C2/E2. Day 3: B3. Day 4: C4. Day 5: E5. Day 6: F6. Day 7: D7. Day 8: D8; current map A1 B3 C4 D8 E5 F6. Each row stores only its named changed versions and references the others.
#### Failure or edge state
Day 1 expires; only data with no surviving references can be removed, so later restore points remain intact.
#### Required copy
“Only changed blocks are newly stored.” “A later snapshot still represents the whole volume.”
#### Accuracy caveats
EBS documents incrementality and reference preservation. RDS owns its actual cleanup internally; the visual cannot claim precise deletion timing or an inspectable RDS graph.
#### Mobile behavior
Source and arrow stack above a two-row, three-column block grid. Day buttons scroll inside the console; the history table can scroll horizontally inside its own region from 320 px.
#### Accessibility
Each cell prints version and storage status; buttons expose `aria-pressed`; inspector/bottom summarize selection; pulse is nonessential.
#### Source anchors
[EBS snapshots](https://docs.aws.amazon.com/ebs/latest/userguide/how_snapshots_work.html), [incremental deletion](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-deleting-snapshot.html), [RDS backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html).
#### Acceptance checks
Each of the eight days shows six positions while storing only its changes; manual and playback controls reach all eight rows, playback stops at Day 8, and only fresh cells pulse. Day 8 never removes still-referenced versions; RDS simplification remains visible.

## Visual 4 — Backup lifecycles

#### Purpose
Show four related backup names as distinct lifecycles around Day 2.
#### Learner question
“Which form gives me a range and which preserves one state?”
#### Persistent scenario state
Day 2 may leave automated PITR while a fictional manually captured Day 2 state remains.
#### Concepts and actors
Automated backup, manual snapshot, final snapshot, retained automated set; RDS ownership versus reader-managed deletion.
#### Composition
A centered Day 2 node points down to four short branches: `Rolling range`, `Saved state`, `Manual at deletion`, `Temporary set`. Right/bottom copy carries the caveat.
#### Interaction
Static: all four branches must be visible together to compare; stage selection is enough.
#### Data or content states
Automated range ages out; manual/final snapshots persist until deleted; retained automated data expires because no new backup data is made after deletion.
#### Failure or edge state
Retained set eventually disappears; a manual snapshot is not a PITR range.
#### Required copy
“Four names, different clocks.” “Choose a range of times or one durable captured state.”
#### Accuracy caveats
The Day 2 manual snapshot is fictional and reader-created. Final snapshot depends on deletion choice and instance state.
#### Mobile behavior
Four branches become one column beneath the source node.
#### Accessibility
Each branch prints its lifecycle; arrows and color are supplemental.
#### Source anchors
[RDS backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html), [retained backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.Retaining.html), [deletion](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html).
#### Acceptance checks
No branch calls a manual snapshot a range or retained automated backup indefinite.

## Visual 5 — Deletion decisions

#### Purpose
Make the two deletion options independent and show an existing manual snapshot's separate fate.
#### Learner question
“What survives when I delete `orders-db`?”
#### Persistent scenario state
The source is being deleted; one existing manual snapshot is already present. Final and retain choices start checked.
#### Concepts and actors
Source instance, final snapshot checkbox, retain automated backups checkbox, same-Region automated set, existing manual snapshot.
#### Composition
Red source node above two native checkboxes. Three arrows point to final snapshot, automated set, and existing manual result nodes. The inspector states the selected combination.
#### Interaction
**Hero:** four combinations are reachable and reversible. Final result changes to `No final snapshot created`; automated result to `Same-Region set deleted`; existing manual always says `Unaffected`. No live delete action is performed.
#### Data or content states
Checked final persists until deleted; checked retain is temporary; unchecked alternatives name what is absent/deleted.
#### Failure or edge state
Both unchecked: no new final snapshot and same-Region automated set deleted, while existing manual snapshot remains.
#### Required copy
“Two choices, three survivors.” “Final snapshot and retained automated backups answer separate questions.”
#### Accuracy caveats
The board assumes a state that allows final snapshot creation; cross-Region replicated automated backups are outside this same-Region view.
#### Mobile behavior
Options/results stack; spatial arrows disappear when alignment would mislead.
#### Accessibility
Native checked state, text result nodes, and live inspector/bottom feedback; no hover or timing dependency.
#### Source anchors
[RDS deletion](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html), [retained backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.Retaining.html).
#### Acceptance checks
All four combinations are correct; manual remains unaffected; retained data is never indefinite.

## Visual 6 — Service boundaries

#### Purpose
Place version-sensitive conditions in the same console without a pretend calculation.
#### Learner question
“What else matters besides retention?”
#### Persistent scenario state
The same instance has configuration and a runtime status that may prevent backup creation.
#### Concepts and actors
`BackupRetentionPeriod`, 0 disablement, 1–35 day DB instance range, five-minute log upload, `available`/`storage_full`, stopped-time handling, new-instance result.
#### Composition
A 0 → 1–35 scale plus four short signal tiles for logs, status, stopped clock, and restore result. Inspector states the operational implication.
#### Interaction
Static: these are documented conditions, not values the model should simulate.
#### Data or content states
0 disables automated backups for DB instances; 1–35 is configurable; backups require `available`; stopped time is excluded from retention calculation.
#### Failure or edge state
`storage_full` prevents new automated backups; latest restorable time may lag now.
#### Required copy
“Retention is only one part of recoverability.”
#### Accuracy caveats
Multi-AZ DB clusters differ; crossing zero/nonzero retention can cause an outage; DB instance scope is explicit.
#### Mobile behavior
Scale/signals become one column.
#### Accessibility
Condition and consequence are written on every tile.
#### Source anchors
[Backup retention](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.BackupRetention.html), [RDS backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html), [PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html).
#### Acceptance checks
No specific timestamp is guaranteed by the configured value alone.

## Visual 7 — Storage and cost drivers

#### Purpose
Correct “seven days equals seven full billed copies.”
#### Learner question
“What changes backup storage?”
#### Persistent scenario state
`orders-db` changes data and may keep snapshots/backups in one Region.
#### Concepts and actors
Changed blocks, manual/final snapshots, retained automated backups, regional backup storage, running-instance allowance, current pricing.
#### Composition
Three input nodes feed one storage node with a solid arrow. Right/bottom copy says to measure usage and current pricing.
#### Interaction
Static: a cost slider would imply unsupported precision.
#### Data or content states
No numerical estimate; changed data and extra retained states can change storage usage.
#### Failure or edge state
Deleting the source can leave chargeable manual or retained storage.
#### Required copy
“Retention is not a copy count.” “Measure actual storage and current pricing.”
#### Accuracy caveats
The panel intentionally omits allowance/price arithmetic and is verified as of 2026-09-15.
#### Mobile behavior
Inputs stack, followed by downward arrow and output.
#### Accessibility
Labels preserve causality without motion/color.
#### Source anchors
[RDS backup storage](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html), [retention costs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.Retaining.html), [current pricing](https://aws.amazon.com/rds/pricing/).
#### Acceptance checks
No fixed copy count or invented bill appears.

## Visual 8 — Operating loop

#### Purpose
Turn the visual model into a recovery test loop within the console.
#### Learner question
“What proves this backup will help?”
#### Persistent scenario state
The operator configures, observes, preserves, decides, and restores `orders-db`.
#### Concepts and actors
Retention need, reported earliest/latest times, manual snapshot, deletion options, restored instance and application check.
#### Composition
Five numbered arrow-connected nodes: Choose → Observe → Preserve → Decide → Test. Inspector names the evidence of a usable restore.
#### Interaction
Static: a progress tracker would suggest saved state the site does not have.
#### Data or content states
The outcome is a new DB instance validated with the application, not a merely listed recovery point.
#### Failure or edge state
A visible backup can coexist with an untested procedure.
#### Required copy
“Prove the recovery path before you need it.”
#### Accuracy caveats
Restoring a new instance alone does not validate application recovery.
#### Mobile behavior
Ordered nodes stack; numbering preserves sequence when arrows disappear.
#### Accessibility
An ordered list remains meaningful without connector visuals.
#### Source anchors
[PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html), [RDS backup overview](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html).
#### Acceptance checks
The last step checks the new instance and application.

## Persistent page elements

The Infra Illustrated brand/navigation bar, compact title, breadcrumbs, metadata, fictional scenario, rail, toolbar, inspector, bottom conclusion, scope note, sources, related navigation, and footer share one bordered workbench. Major fragments are `#stage-window` through `#stage-practice`; legacy section anchors remain aliases inside the appropriate panels.

## Responsive and accessibility requirements

Desktop uses index/canvas/inspector columns. Mid-width moves the inspector below. At 320 px, migrate the flat horizontal rail to the grouped disclosure index, stack panels, and make the reference drawer one column. Use native anchors/buttons/checkboxes, `aria-current`, `aria-pressed`, focus, live summaries, text status labels, and reduced-motion rules. Without JavaScript all eight panels stay readable and anchor-linked in the same console. Inspect keyboard/touch, 200% zoom, reduced motion, representative desktop/mobile.

## Prototype implementation contract

The approval artifact is a standalone HTML snapshot of the complete console with inline CSS/JavaScript, no build step, all eight visuals, the three hero interactions, Day 2 loss, EBS cleanup, four deletion combinations, sources, and a useful no-JavaScript stacked reading order. It is not a second published implementation.

## Integration guidance and status

Canonical [MDX](../../../src/content/topics/rds-backup-retention.mdx) embeds [RdsWorkbench.astro](../../../src/components/rds/RdsWorkbench.astro) with [workbench CSS](../../../src/styles/rds-workbench.css). The [route](../../../src/pages/rds-backup-retention.astro) uses BaseLayout for document metadata and places brand, navigation, and footer inside the workbench. Public slug, metadata, and old anchors remain stable. The one-console design language is now confirmed for all topic visuals. RDS still needs the grouped disclosure index and neutral shared-shell extraction recorded in the [migration checklist](../../CONSOLE-MIGRATION-CHECKLIST.md).

## Deep-dive handoffs

No unpublished links are added. Engine-specific PITR, Aurora, Multi-AZ DB cluster retention, and detailed RDS billing warrant separate canonical topics only when targets are published.

## Page-level acceptance criteria

- All topic explanation, caveats, sources, and related navigation live within one console; prose belongs right or bottom of the canvas.
- The three hero interactions are window shift, block selector, and deletion choices; arrows/motion reveal only meaningful sequence or state.
- Day 2 loss, new-instance restore, EBS preservation, and independent deletion results are accurate and labeled.
- The full eight-panel explanation remains readable without JavaScript.
- `npm run check`, build, graph/link and HTML checks, plus representative visual/keyboard/reduced-motion checks pass before publication.

## Source index

Verified 2026-09-15 against [RDS backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html), [backup retention](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.BackupRetention.html), [PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html), [deletion](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html), [retained automated backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.Retaining.html), [EBS snapshots](https://docs.aws.amazon.com/ebs/latest/userguide/how_snapshots_work.html), [EBS deletion](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-deleting-snapshot.html), and [RDS pricing](https://aws.amazon.com/rds/pricing/).
