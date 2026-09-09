# EC2 Auto Scaling, Illustrated — interaction and content specification

Status: Specification draft; no site implementation or publication implied.

Research checked: 2026-09-09.

Primary collection: AWS. Format: Deep Dive. Difficulty: Advanced, with a progressive introduction.

Proposed slug: `/ec2-auto-scaling/`. Tags: EC2, Auto Scaling, Compute, Availability, Troubleshooting, Deployments.

Scope: Amazon EC2 Auto Scaling groups and the dependencies that determine their behavior.

This is the canonical implementation specification for this topic. It follows `SITE-REBUILD-BRIEF.md` and `WRITING-GUIDE.md`; it selects no technology stack. The future published topic should consolidate its explanatory content into one canonical content source. This specification does not change the site's migration order.

## 1. Product promise and coverage boundary

The learner should be able to look at an Auto Scaling group, predict its next action, explain why it is waiting, and identify which setting would change the outcome.

The opening example is a service with six instances across three Availability Zones. Traffic rises. Desired capacity increases immediately, but usable capacity arrives later. Meanwhile, one instance fails a health check, another is protected from scale in, and a replacement is waiting for its application to initialize. The page makes these overlapping decisions inspectable.

“Every setting” means the documented EC2 Auto Scaling configuration surface: group settings, nested mixed-instance policies, scaling policies, schedules, lifecycle hooks, warm pools, maintenance, refresh preferences, instance operations, process suspension, monitoring, notifications, and deletion. Include console-only presentation differences, API-only controls, deprecated fields, and incompatible combinations. EC2 launch-template and connected-service settings are included where they change ASG outcomes; this does not attempt to reproduce the complete EC2, CloudWatch, ELB, IAM, ECS, or EKS manuals.

“Every scenario and edge case” is an acceptance requirement against this bounded surface, rather than a claim that a finite simulator can enumerate every AWS outage or application behavior. The specification supplies named scenarios, boundary-case rules, and interaction coverage. Unknown provider internals must remain unknown. A field or combination cannot silently disappear because it is difficult to visualize.

The coverage register in section 6 and the scenario register in section 8 are mandatory. Before publication, reconcile them with the then-current [EC2 Auto Scaling API actions](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_Operations.html) and linked request shapes. An undocumented or conflicting behavior gets an explicit explanation and a constrained simulation, never an invented deterministic AWS rule.

### Learning outcomes

- Distinguish capacity requested, capacity present, capacity serving traffic, and capacity eligible for each decision.
- Trace an instance through ordinary launch, hooks, warm-pool preparation, service, standby, refresh, retention, and termination.
- Choose scaling signals and policies for a workload, then explain their timing and interaction.
- Diagnose unmet desired capacity, replacement loops, stuck scale-in, stalled refreshes, and asymmetric zones.
- Explain availability, startup latency, interruption exposure, and cost tradeoffs without treating one preset as universally correct.
- Inspect the exact setting, its owner, effective value, source of inheritance, applicable operations, and limitations.

## 2. Corrections to the sample

These corrections must be reflected in the diagrams and captions, rather than collected into a long warning at the top of the published page.

| Sample idea | Required treatment |
|---|---|
| EventBridge/SQS pauses instance boot | The ASG lifecycle hook holds the lifecycle transition. An event or queue message carries a notification; a worker performs preparation and completes the action. Instance boot and application work can continue during the wait. |
| Standby is manual ELB deregistration | `EnterStandby` changes ASG membership state and initiates deregistration. Direct deregistration alone does not put an instance in standby. |
| A termination hook provides an hour of ELB draining | Hook heartbeat timeout and target deregistration delay are separate clocks. In the documented ordinary flow, deregistration/draining precedes the termination hook. Neither overrides forced Spot reclamation. |
| Grace period defers health checks | ELB checks continue. Grace changes when ASG acts on startup health failures; leaving EC2 `running` can still trigger immediate replacement. |
| Warmup means no metrics exist | It changes eligibility for ASG scaling calculations. Do not erase raw CloudWatch measurements or equate warmup with traffic registration. |
| Simple scaling locks the entire ASG | Cooldown gates simple scaling. Other paths have their own behavior, including replacement, schedules, manual actions, target tracking, and step scaling. |
| Stopped warm instances instantly serve traffic | They must restart, finish any hooks and application preparation, and become traffic-ready. Warm pools reduce repeated initialization, not every delay. |
| Predictive scaling uses a 48-hour history | It can analyze up to 14 days of history, needs at least 24 hours, and forecasts the next 48 hours. |
| Minimum healthy percentage guarantees no outage | It constrains planned replacement progress. Failures, interruption, bad readiness signals, or absent launch capacity can still reduce usable capacity. |
| `AllocationStrategy` means AZ balancing | It aligns remaining purchase-option capacity with allocation preferences. Zonal placement is a separate decision and has reservation-specific exceptions. |
| Root-volume refresh is ordinary rolling refresh | It is a distinct strategy with prerequisites, its own lifecycle path, and potential fallback to full replacement on failure. Preserve instance identity while showing the reboot and readiness work. |

Sources: [lifecycle flow](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks-overview.html), [standby](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-enter-exit-standby.html), [grace period](https://docs.aws.amazon.com/autoscaling/ec2/userguide/health-check-grace-period.html), [cooldowns](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-scaling-cooldowns.html), [warm pools](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-warm-pools.html), [forecast behavior](https://docs.aws.amazon.com/autoscaling/ec2/userguide/predictive-scaling-policy-overview.html), [maintenance](https://docs.aws.amazon.com/autoscaling/ec2/userguide/instance-maintenance-policy-overview-and-considerations.html), [termination selection](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-termination-policies.html), [root-volume refresh](https://docs.aws.amazon.com/autoscaling/ec2/userguide/replace-root-volume.html).

## 3. Page experience

Use a scrolling document with a sticky section navigator. Every lab, reference family, scenario, and major trace has a stable deep link. The opening fleet map is followed by independently useful labs; learners can enter through a scenario or a setting name without completing earlier sections.

Suggested navigation labels: Fleet · Lifecycle · Timing · Health · Scaling · Scheduling · Forecasting · Warm pools · Placement · Mixed instances · Spot · Refresh · Termination · Operations · Troubleshooting · Settings · Sources.

Each lab contains a readable initial diagram, a short framing paragraph, one default worked example, controls that change the mechanism, an inspectable trace, and a compact related-settings reference. Alternate views may use tabs when they compare actual states. Chapter navigation does not use tabs.

### Shared interaction contract

| Control or surface | Required behavior |
|---|---|
| Play / pause / next event / previous event | Operate a simulated clock. Previous event restores a prior simulation snapshot; it must not imply an AWS API can reverse termination. |
| Speed / jump to next change | Compress waiting without dropping the event that explains why progress resumes. Display elapsed simulated time. |
| Restart scenario | Restore the same initial fleet, settings, workload, and failure sequence. |
| Compare one change | Run two copies of the same fixture with one changed setting and a shared time cursor. Explain all other intentional differences. |
| Instance inspector | Show identity, type, capacity units, AZ/subnet, purchase option, template version, AMI, ASG state, EC2 state, target health, hooks, timers, protection, and replacement reason. |
| Setting inspector | Show exact parameter path, owner, units, explicit/omitted/inherited state, applicable defaults, effective value, validation, change timing, scenario links, and source. |
| Event inspector | Show initiator, evidence, requested change, selected instances, reasons for exclusion, resulting state, blockers, and source. |
| Failure injection | Schedule named failures at a chosen event or time. A visible marker distinguishes injected conditions from AWS behavior. |
| Scenario selector | Preserve readable context, explain the initial conditions, and disclose incompatible settings before running. |
| Configuration comparison | Show requested versus effective configuration and changes that affect only future launches. |
| Search settings | Match AWS API name, console label, common shorthand, and teaching term. Examples: grace, cooldown, surge, drain, weights. |
| Share | Encode a named scenario and safe configuration in the URL if practical. No accounts, saved progress, or backend dependency. |

Never use an unlabeled green instance icon to mean all of “EC2 running,” “ASG healthy,” “target healthy,” and “warmup complete.” Each has its own label or badge. Green means a successful condition; amber means a wait or transition; red means failure or destructive consequence; purple means policy/control-plane activity; cyan means active infrastructure or normal flow. Solid connections mean direct interactions. Dashed connections need a legend explaining the asynchronous or conceptual relationship.

### Simulation fidelity

The simulator is a teaching model of documented behavior. Workload arrival rate, application throughput, startup time, request duration, metric publication delay, available inventory, and failure times are fixture inputs. Label these as illustrative values. Never imply that AWS exposes exact Spot-pool depth, forecasts with a published universal formula, or reconciles every group on a fixed public tick.

Use repeatable fixtures. When AWS allows a choice between equivalent instances, display the candidate set and the fixture's selected outcome. When event order is unspecified, offer two valid orderings rather than present a universal priority. Application throughput calculations must be identified as an assumed workload model.

## 4. Shared fleet and event model

This section defines observable teaching state, not a programming architecture.

### Fleet ledgers

| Ledger | Meaning and use |
|---|---|
| Requested capacity | Desired/minimum/maximum values and the units in which they are expressed. |
| Present capacity | Existing instances by lifecycle state, plus launch attempts that have not produced an instance. Count attempts separately. |
| In-service capacity | Instances in ASG `InService`, with a separate count and capacity-unit sum. |
| Serving capacity | Targets eligible to receive traffic and application workers able to do useful work under the fixture's routing model. |
| Scaling metric eligibility | Instances or metric series included in the selected policy's calculation. |
| Replacement readiness | Capacity that satisfies the maintenance/refresh health and warmup requirements. |
| Outside active capacity | Standby, warm-pool, retained, detached, and terminating resources shown separately. |
| Placement | Capacity by AZ, subnet, instance type, purchase option, and reservation. |
| Cost exposure | Running time, persistent storage, temporary overlap, retained resources, and unused reservation exposure. Use illustrative rates unless separately sourced. |

Ledger names are educational. Map actual CloudWatch metrics to them only where the service's definitions agree; for example, an `InService` count is not an application-readiness metric. [ASG metrics](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-metrics.html)

### Event record

Every meaningful event has: simulated timestamp; actor; trigger; input evidence and timestamp; action attempted; capacity before/after; affected resource IDs; prior/next lifecycle state; effective setting paths; result (`accepted`, `waiting`, `failed`, `skipped`, `complete`); explanation; recovery options; and a nearby source link.

A failed launch must preserve the unmet capacity request and the failure reason. A failed request is not a launched instance. A missing metric sample is not a zero. A healthy replacement is not automatically a completed rollout. Termination removes a capacity contribution according to the applicable operation, rather than decrementing every ledger at once.

### Decision explanation

The “Why this happened” panel answers four questions in sequence: who requested the action; what configuration applied; what evidence made the instance or pool eligible; and what allows the next step. Examples:

- “The schedule raised minimum capacity to 8. Desired capacity is now 8. Two launches are waiting for subnet addresses.”
- “Scale-in was requested, but every eligible instance is protected. Desired capacity fell; the fleet has not shrunk.”
- “The new target is healthy. Refresh is still waiting for its 180-second warmup.”
- “The application check is excluded from aggregation, so its failure does not change the overall application status.”

## 5. Required interactive diagram catalogue

These 20 labs are publication scope. The baseline, controls, observable outputs, and edge cases are part of each lab's acceptance contract. Detailed settings and scenario IDs follow in sections 6 and 8.

### V01 — Desired capacity and the fleet

**Visual:** Three AZ lanes, six instances, a capacity ruler, and aligned plots for requested, present, and serving capacity. Default: min 3, desired 6, max 12; homogeneous On-Demand instances.

**Controls:** Change each size; remove one instance; block launches; change capacity units; raise minimum above current size; lower maximum below current size. Invalid requests show the violated constraint without changing the fleet.

**Teaching sequence:** A manual increase changes the target, produces launch attempts, creates pending instances, then eventually adds serving capacity. Killing an instance while the target stays fixed causes replacement even with no scaling policy. Setting minimum equal to maximum fixes the target envelope, but does not prevent health replacement.

**Observable output:** Capacity gap, pending work, selected replacement reason, clamp/update explanation, and overshoot reason when a later lab enables weights or replacement surge. [Group creation](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CreateAutoScalingGroup.html), [group updates](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_UpdateAutoScalingGroup.html)

### V02 — Instance lifecycle and hook delivery

**Visual:** A state graph beside an instance/ASG/event-delivery/worker swimlane. Ordinary successful launch: `Pending → Pending:Wait → Pending:Proceed → InService`; wait/proceed hook gates are conditional. Scale-in shows deregistration and draining, then the termination wait and proceed path to `Terminated`.

**Controls:** Add launch/termination hooks; complete with `CONTINUE` or `ABANDON`; send heartbeat; delay/drop/duplicate a notification; fail the worker; remove permission; attach an ENI; perform domain join; finish log shipping. Show notification delivery and hook completion as separate events.

**Observable output:** Heartbeat deadline, absolute deadline, outstanding actions, registration eligibility, and which action token a completion addresses. Repeated delivery must not repeat a completed application-side action. A lifecycle notification is not an exactly-once transaction.

**Edges:** Default outcome on timeout; delayed completion after expiry; several hooks; failed launch hooks repeatedly limiting launch progress; operations that bypass hooks; retained termination branch. [Hooks](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html), [hook parameters](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutLifecycleHook.html)

### V03 — The clocks that people confuse

**Visual:** One instance's timeline with independently labeled bars for launch preparation, launch-hook wait, target checks, grace, warmup, policy cooldown, deregistration, termination-hook wait, checkpoint delay, and bake time. Dependent clocks begin at their actual trigger; parallel clocks overlap.

**Controls:** Set a timer to omitted, zero, short, or long; change policy type; override group warmup; stop the instance during grace. Use numeric inputs alongside sliders.

**Observable output:** Selecting a timer highlights only the decisions it gates. Highlight fallback values and show the original owner. Target tracking/step warmup fallback and refresh warmup fallback must be separate examples. [Default warmup](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-default-instance-warmup.html), [policy API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutScalingPolicy.html), [refresh preferences](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_RefreshPreferences.html)

### V04 — Health is several signals

**Visual:** EC2 instance/system status, EC2 application status, EBS, ELB, VPC Lattice, and custom health lanes feed an ASG health decision; target routing has a separate output.

**Controls:** Enable supported ASG health sources; fail the app while the VM runs; break one target group; fail storage; suppress/exclude an EC2 application check; manually set health; enable grace; suspend `HealthCheck` or `ReplaceUnhealthy`.

**Observable output:** Raw check result, aggregation state, whether ASG consumes that source, grace applicability, health marking, and replacement. Include stale/insufficient data, transient versus sustained failure, stopped instances, and a bad shared dependency that makes many targets fail.

**Important distinction:** EC2 application status checks are configured in EC2 and can affect ASG through aggregated application status without an additional ASG health-type switch. [Health sources](https://docs.aws.amazon.com/autoscaling/ec2/userguide/health-checks-overview.html), [application checks](https://docs.aws.amazon.com/autoscaling/ec2/userguide/use-application-status-checks-auto-scaling-group.html)

### V05 — Target tracking and competing policies

**Visual:** Demand, observed utilization, target, and capacity curves above fleet lanes. A policy panel shows each policy's proposed action and the final result.

**Controls:** CPU, per-target requests, network throughput, or custom utilization; target value; warmup; missing samples; metric period; two target-tracking policies; disable scale-in on one; enable an additional step policy.

**Observable output:** Any target-tracking policy can support scale-out; scale-in requires agreement among target-tracking policies with scale-in enabled. Show this rule independently from arbitration with other policy types. A simple proportional capacity sketch may explain direction, but must not claim to reproduce AWS's adaptive controller exactly.

**Edges:** Tiny fleets and integer rounding, metric lag, insufficient data, scale-in during warmup, repeated scale-out, maximum capacity reached, skewed load distribution, and a metric that does not decrease as capacity increases. [Target tracking](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html), [dynamic policy interaction](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html)

### V06 — Step scaling and simple scaling

**Visual:** A number line of alarm breach intervals, a capacity arithmetic panel, and a timeline comparing step and simple scaling against the same load.

**Controls:** Adjustment type, amount, interval bounds, aggregation, minimum magnitude, warmup/cooldown, metric alarm settings. Snap the cursor exactly onto each interval boundary.

**Observable output:** Show metric minus alarm threshold, matched interval, raw arithmetic, rounding, minimum magnitude, in-flight capacity, and resulting request. Repeated breaches while capacity warms must not blindly add the same batch again.

**Edges:** Negative adjustments, zero adjustment, no gaps/overlaps, null infinite bounds, weighted surplus, simple-policy cooldown override, and a replacement or scheduled action during cooldown. [Step scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-simple-step.html), [cooldowns](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-scaling-cooldowns.html)

### V07 — Queue workers and scaling from zero

**Visual:** Queue arrival, visible backlog, in-flight messages, busy workers, acknowledgments, and visibility-timeout return. A second panel shows backlog per usable worker.

**Controls:** Arrival rate, service time, acceptable queue delay, minimum zero/nonzero, independent wake-up signal, message visibility, job length, and worker protection.

**Worked model:** With an assumed 2-second average processing time and acceptable queue delay of 60 seconds, a starting backlog target is 30 messages per worker. Explain assumptions: comparable workers and service times; no exact latency guarantee.

**Edges:** Division by zero, no CPU samples at zero capacity, metrics absent rather than zero, poison messages, long jobs, retries, duplicate processing, shutdown before acknowledgment, protection not released, and downstream rate limits. The ASG scales EC2 capacity; the application owns message correctness. [SQS scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-using-sqs-queue.html)

### V08 — Schedules and forecast-driven capacity

**Visual:** Two distinct views: a calendar for explicit schedules, and history/forecast/actual capacity curves for predictive scaling. A shared timeline demonstrates their interaction with dynamic policies.

**Controls:** One-time/recurring schedule, IANA time zone, start/end, size fields, forecast-only/forecast-and-scale, prelaunch buffer, forecast miss, max-capacity behavior.

**Observable output:** Local versus UTC execution time, next occurrence, configuration remaining after schedule expiry, predicted demand versus actual demand, and requested prelaunch time. Forecasts are authored fixtures, not a fabricated AWS forecasting algorithm.

**Edges:** Daylight-saving transition, expired/past schedule, overlapping actions, suspended schedule, missing history, changing application efficiency, heterogeneous fleet, and a maximum raised by predictive scaling that stays raised. [Schedules](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-scheduled-scaling.html), [predictive settings](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PredictiveScalingConfiguration.html)

### V09 — Warm-pool preparation, reuse, and depletion

**Visual:** Cold-launch lane, warm-pool shelf, active fleet, and return-to-pool lane. Show initialization cost once and restart/readiness work separately.

**Controls:** Pool state, minimum pool size, prepared-capacity target, reuse, hibernation compatibility, long bootstrap, stale AMI, AZ capacity shortage, depletion.

**Observable output:** Active desired capacity and pool desired size are separate. Explain pool size with `max(pool minimum, prepared target − group desired, 0)` for the supported homogeneous teaching fixture, with prepared target defaulting to group maximum. Actual pool population can lag the target.

**Edges:** Launch hooks during preparation and entry into service; termination action during return to pool; user data interrupted by stop; unsuitable hibernation falling back to stopped on reuse; pool excess; cold fallback; rolling refresh updates active instances before pool instances. [Warm-pool API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutWarmPool.html), [warm-pool lifecycle](https://docs.aws.amazon.com/autoscaling/ec2/userguide/warm-pool-instance-lifecycle.html)

### V10 — Placement and Availability Zone recovery

**Visual:** AZ/subnet grid with counts, capacity units, free addresses, allowed types, reservations, and launch failures.

**Controls:** Add/remove a zone; exhaust addresses in one subnet; remove capacity in one zone; select `balanced-best-effort`, `balanced-only`, or `reservations-then-balanced`; suspend AZ rebalance; configure a cluster placement group.

**Observable output:** Why a destination is eligible, why an attempt failed, the next allowed attempt, and why healthy instances elsewhere may later be replaced to restore distribution. Instances never slide into another AZ while keeping their identity.

**Edges:** All zones constrained, reservation concentration, scale-out while rebalancing is suspended, nondivisible group sizes, and temporary capacity above maximum during rebalance. [AZ distribution](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-availability-zone-balanced.html), [rebalance behavior](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-instance-termination.html)

### V11 — Mixed instances, weights, and attribute selection

**Visual:** Instance-type cards flow through an eligibility filter into purchase-option and AZ buckets. Card area represents configured capacity units; card count remains visible.

**Controls:** Explicit types or attributes; template/AMI overrides; weights; desired units; On-Demand base and percentage; allocation strategy; allowed/excluded types; price protection.

**Observable output:** Type eligibility and allocation preference are separate stages. With desired 10 units and only weight-4 instances available, show three instances providing 12 units. For an unweighted desired 10, base 2, and 25% On-Demand above base, the requested split is 4 On-Demand and 6 Spot.

**Edges:** No matching type, architecture incompatibility, inconsistent weights, price filters eliminating all types, approximate ratios from indivisible instances, changing purchase ratio versus changing a future launch preference. AWS's exact pool scoring is not shown as exposed data. [Overrides](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_LaunchTemplateOverrides.html), [distribution](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstancesDistribution.html), [attributes](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstanceRequirements.html)

### V12 — Spot interruption and Capacity Rebalancing

**Visual:** At-risk instance, recommendation, replacement launch, health readiness, draining, lifecycle wait, and an independent forced-interruption deadline.

**Controls:** Recommendation lead time, interruption at the same time as recommendation, replacement capacity, replacement health, Capacity Rebalancing, hooks, and deregistration delay.

**Observable output:** A successful proactive replacement and a failed-capacity branch using the same initial fleet. Make clear when capacity cannot be restored before interruption. A protection badge never freezes the forced-interruption deadline.

**Edges:** No better replacement pool, repeated recommendations, correlated interruptions, replacement not ready in time, traffic spike during rebalancing, and max-size overlap. [Capacity Rebalancing](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-capacity-rebalancing.html)

### V13 — Reservations, Capacity Blocks, and distribution segments

**Visual:** Ordered reservation/capacity shelves with time-bounded availability, resource-group membership, consumption, fallback, and reverse scale-in preference.

**Controls:** Reservation target, preference, distribution segment order, optional On-Demand fallback, expired/unavailable capacity, and reservation-first AZ placement.

**Observable output:** Empty preferred capacity either falls through or causes unmet demand according to configuration. Show “reserved capacity available” separately from “instance eligible for that reservation.” Existing fleet behavior on migration is visible alongside future launch behavior.

**Edges:** One supported segment; On-Demand last; no Spot target type; warm-pool incompatibility; removed capacity types; reservation expiry; interruptible reservation reclamation. Do not reuse Spot's interruption timing for other capacity types. [Distribution segments](https://docs.aws.amazon.com/autoscaling/ec2/userguide/use-distribution-segments.html), [reservation preferences](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CapacityReservationSpecification.html)

### V14 — Maintenance policy and rolling refresh

**Visual:** Old/new cohorts under a healthy-capacity floor and an overlap ceiling; a progress timeline includes hooks, readiness, warmup, checkpoints, and bake time.

**Controls:** Desired capacity; maintenance min/max; per-refresh overrides; new template; skip matching; alarms; checkpoints; rollback; protected/standby treatment; launch failure; bad application behavior.

**Observable output:** Each batch has a reason for selection and a reason for waiting. A completed percentage does not declare success before bake time. Updating a template reference alone does not repaint existing instances as updated.

**Edges:** Single-instance groups, fractional batch boundaries, explicit versus omitted maximum, bad AMI, insufficient surge capacity, target healthy while requests fail, desired changes mid-refresh, all instances skipped, cancellation versus rollback, rollback failure, and only one active refresh. [Refresh flow](https://docs.aws.amazon.com/autoscaling/ec2/userguide/instance-refresh-overview.html), [start refresh](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_StartInstanceRefresh.html)

### V15 — Replace the root volume while preserving the instance

**Visual:** Persistent instance identity, interfaces/IPs, non-root disks, and changing root disk. The service-readiness lane pauses across deregistration, quiescing, replacement/reboot, and validation.

**Controls:** Rolling versus root-volume strategy, matching template, AMI overrides, pre/post hooks, compatible/incompatible AMI, replacement failure, and warm-pool presence.

**Observable output:** `ReplacingRootVolume → optional wait/proceed → RootVolumeReplaced → Pending → optional launch-hook wait/proceed → InService`. Failure can branch to full instance replacement. Clearly show which disk data is discarded and which identity persists.

**Edges:** Numeric template version requirement, every relevant override needs `ImageId`, multi-volume AMI rejection, an instance type missing from the desired mixed policy, warm-pool incompatibility. Do not promise uninterrupted application execution: the AWS page's introductory wording is broader than its own reboot/hook instructions. [Root-volume strategy](https://docs.aws.amazon.com/autoscaling/ec2/userguide/replace-root-volume.html), [root-volume lifecycle](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks-overview.html)

### V16 — Termination selection, protection, and retention

**Visual:** Candidate funnel: operation-specific eligibility, purchase option/reservation requirements, placement constraints, configured ordered policies, ties, selected instance, drain/hook, and termination or retention.

**Controls:** Policy order, instance ages/template versions, protection, AZ imbalance, purchase ratios, failed termination action, retention trigger, and direct/manual termination.

**Observable output:** Explain why an older instance survives and a newer one terminates. Show all-protected scale-in leaving actual capacity above desired. In retention mode, preserve the EC2 instance outside desired capacity until manual resolution.

**Edges:** Health replacement bypasses ordinary termination-policy selection; scale-in protection differs from EC2 termination protection and group deletion protection; retained resources still cost money and are ignored by refresh/lifetime replacement. [Termination policies](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-termination-policies.html), [instance protection](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-instance-protection.html), [retention](https://docs.aws.amazon.com/autoscaling/ec2/userguide/instance-lifecycle-policy.html)

### V17 — Standby, attach, detach, and explicit launch

**Visual:** Active membership, standby parking area, independently managed EC2 instances, and a capacity ledger before/after each operation.

**Controls:** Enter/exit standby, attach/detach, decrement desired toggle, explicit ASG termination, `LaunchInstances` destination/retry mode, and duplicate request token.

**Observable output:** Preserve identity for attach/detach/standby, apply each operation's capacity semantics, and show failed preconditions without partially inventing success. Explicit launch results can include both successes and errors.

**Edges:** Minimum/maximum boundaries, invalid VPC/AZ, another ASG's instance, stopped/terminated instance, protection inheritance on reattach, retry idempotency, and synchronous launch failure versus asynchronous retry. [Standby](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-enter-exit-standby.html), [explicit launch](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_LaunchInstances.html)

### V18 — Zonal shift and suspended processes

**Visual:** Control-plane switches connect to the operations they gate. A zonal-shift overlay changes placement and scale-in behavior while traffic routing remains separately visible.

**Controls:** Each of the nine suspendable processes; active zonal shift; impaired-zone health behavior; load-balancer cross-zone setting; expire/cancel the shift; resume processes.

**Observable output:** Suspension can preserve a pending request while blocking its execution. Resumption does not universally replay everything that happened during suspension. Explain why `AddToLoadBalancer` requires repair for instances missed while suspended, and why past scheduled actions are not replayed.

**Edges:** Launch suspended while unhealthy replacement remains active, termination suspended during rebalance, custom health while automatic checks are suspended, dynamic scale-in during zonal shift, and surviving zones without headroom. [Process types](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-suspend-resume-processes.html), [suspension interactions](https://docs.aws.amazon.com/autoscaling/ec2/userguide/understand-how-suspending-processes-affects-other-processes.html), [zonal shift](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-zonal-shift.html)

### V19 — Launch failures and operational evidence

**Visual:** A launch pipeline with configuration, authorization, placement/capacity, EC2 boot, bootstrap, hooks, registration, and readiness stages. Place a failure at its actual stage.

**Controls:** Missing AMI; architecture mismatch; unavailable type; exhausted quota/subnet; KMS denial; invalid profile; bootstrap egress failure; wrong target port; missing metric; repeated failures.

**Observable output:** Activity history, policy/alarm evidence, health reasons, configuration version, and application evidence side by side. The diagnosis panel follows the evidence rather than announcing that every failure is a scaling-policy issue.

**Edges:** Launch accepted but instance immediately terminates, group exists with no usable instances, administrative suspension after persistent failures, API contention, stale observations, and partial success. [Launch troubleshooting](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ts-as-instancelaunchfailure.html), [administrative suspension](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-suspend-resume-processes.html)

### V20 — Workload decisions and combined incident replay

**Visual:** A scenario workbench combining the fleet, workload, timeline, and setting inspectors. Presets: web/API service, queue workers, predictable business hours, slow bootstrap, interruption-tolerant batch, GPU reservations, and stateful workers.

**Controls:** Workload/SLO assumptions, failure injection, configuration changes, and comparison with the initial run. Presets expose a rationale and limitations; they are not universal best-practice configurations.

**Observable output:** Time below needed serving capacity, backlog/latency under the fixture assumptions, replacement progress, instance churn, temporary overlap, and cost exposure. There is no leaderboard or saved learner progress.

**Required compound incidents:** Traffic spike during refresh; AZ impairment during Spot replacement; queue backlog while every worker is protected; warm-pool depletion with a broken AMI; schedule lowering maximum during rollout; termination-hook failure retaining instances during scale-in; reservation expiry with unavailable fallback. These use the same rules as the individual labs.

## 6. Parameter and operation coverage register

Each row is a required reference entry, linked to its labs. A row containing several fields must expand into individual searchable entries in the published reference. Dot paths identify nested fields; `[]` means an array member. Shared names such as `MinSize` must retain their owner so group minimum and warm-pool minimum cannot be confused.

Each entry must carry: exact API path; readable label; owner; data type/unit; permitted values/range; required and mutually exclusive conditions; omitted/default/clear semantics; effective-value origin; when a change takes effect; one valid example; one boundary or failure example; lab/scenario links; source; and review date. A missing detail is a coverage gap, not a reason to invent a default. Numeric API limits and adjustable account quotas must be labeled separately.

### K01 — Group identity, capacity, placement, and creation

| Parameters | Required behavior/reference | Labs |
|---|---|---|
| `AutoScalingGroupName` | Account/Region identity, uniqueness, naming validation, and lookup scope. | V01, V19 |
| `MinSize`, `DesiredCapacity`, `MaxSize` | Nonnegative capacity envelope, explicit request validation, omitted desired at creation, and implicit desired changes when updating bounds. | V01 |
| `DesiredCapacityType` | `units`, `vcpu`, `memory-mib`; attribute-based selection applicability; keep all related size values dimensionally consistent. | V01, V11 |
| `AvailabilityZones[]`, `AvailabilityZoneIds[]` | Names versus stable zone IDs; mutually exclusive request forms; enabled destinations. | V10 |
| `VPCZoneIdentifier` | Group subnet list, VPC/AZ consistency, and precedence over launch-template subnet placement. | V10, V19 |
| `AvailabilityZoneDistribution.CapacityDistributionStrategy` | `balanced-best-effort` (API default), `balanced-only`, `reservations-then-balanced`. | V10, V13 |
| `PlacementGroup` | Placement constraints, especially cluster placement and its single-AZ requirement; capacity consequences. | V10, V19 |
| `LaunchTemplate`, `MixedInstancesPolicy`, `LaunchConfigurationName`, creation `InstanceId` | Alternative launch configuration sources; creation from an existing instance is not attaching that instance. Include legacy restrictions as reference material. | V11, V17, V19 |
| `Context` | Reserved API field. Reference-only; do not give it fabricated simulation behavior. | Settings |
| `Operator.Principal` | Required service-principal string within `Operator`; service/operator ownership and denied mutations by non-operator callers. | V19 |

Sources: [create group](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CreateAutoScalingGroup.html), [update group](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_UpdateAutoScalingGroup.html), [AZ strategy values](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_AvailabilityZoneDistribution.html), [operator shape](https://docs.aws.amazon.com/id_id/autoscaling/ec2/APIReference/API_Operator.html).

### K02 — Group behavior and integrations

| Parameters | Required behavior/reference | Labs |
|---|---|---|
| `DefaultCooldown` | Simple-scaling default cooldown; API default 300 seconds. | V03, V06 |
| `DefaultInstanceWarmup` | Omitted differs from zero; `-1` removes a configured value. Show policy and refresh consumers separately. | V03, V05, V14 |
| `HealthCheckType` | EC2 always enabled; optional `ELB`, `EBS`, `VPC_LATTICE`; multiple source string and clearing optional sources. | V04 |
| `HealthCheckGracePeriod` | API/CLI default 0; console creation default 300 seconds; startup, attach, and standby-return cases. | V03, V04, V17 |
| `LoadBalancerNames[]`, `TargetGroupARNs[]` | Classic ELB versus target groups; attachment, registration, and health consumption are separate. | V04, V19 |
| `TrafficSources[].Identifier`, `.Type` | Generic traffic-source identifiers/types, including VPC Lattice; attach/detach and attachment-state inspection. | V04, V17 |
| `CapacityRebalance` | Enable proactive response to Spot rebalance recommendations; distinct from AZ rebalance. | V12 |
| `NewInstancesProtectedFromScaleIn` | Group default for new active instances; changing it does not retroactively protect existing instances. | V16 |
| `TerminationPolicies[]` | Ordered values: `Default`, `AllocationStrategy`, `OldestLaunchTemplate`, `OldestLaunchConfiguration`, `OldestInstance`, `NewestInstance`, `ClosestToNextInstanceHour`, or custom Lambda ARN. | V16 |
| `MaxInstanceLifetime` | Unset/disabled versus enabled value at least 86,400 seconds; 0 clears. Applies to existing/future instances; honors scale-in protection. Show gradual replacement, not a precise deletion appointment. | V14, V16 |
| `ServiceLinkedRoleARN` | ASG's service identity, distinct from the EC2 instance profile and the hook notification role. | V19 |
| `Tags[].Key`, `.Value`, `.PropagateAtLaunch`; tag-operation `ResourceId`, `ResourceType` | Group versus instance tagging, duplicate-key precedence, and separate launch-template volume tagging. | V19 |
| `DeletionProtection` | `none`, `prevent-force-deletion`, `prevent-all-deletion`; applies to group deletion, not every capacity mutation. | V16, V19 |
| `AvailabilityZoneImpairmentPolicy.ZonalShiftEnabled` | Register/enable integration; enabling is distinct from starting a shift. | V18 |
| `.ImpairedZoneHealthCheckBehavior` | `ReplaceUnhealthy` or `IgnoreUnhealthy` for the impaired AZ during active shift. | V18 |
| `SkipZonalShiftValidation` | Validation override for the documented cross-zone-disabled load-balancer case, with the resulting imbalance implication. | V18 |
| `InstanceMaintenancePolicy` | Expanded in K10. | V14 |
| `InstanceLifecyclePolicy.RetentionTriggers.TerminateHookAbandon` | `retain` or `terminate`; scope is an abandoned termination action, including applicable timeout outcomes. | V02, V16 |
| `CapacityReservationSpecification` | Expanded in K05. | V13 |
| `LifecycleHookSpecificationList[]` | Hooks installed with group creation, before initial launches; expanded in K09. | V02 |

Sources: [warmup](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-default-instance-warmup.html), [grace](https://docs.aws.amazon.com/autoscaling/ec2/userguide/health-check-grace-period.html), [health](https://docs.aws.amazon.com/autoscaling/ec2/userguide/health-checks-overview.html), [protection](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-instance-protection.html), [impairment fields](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_AvailabilityZoneImpairmentPolicy.html), [retention trigger](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_RetentionTriggers.html), [deletion protection](https://docs.aws.amazon.com/autoscaling/ec2/userguide/resource-deletion-protection.html), [remaining group fields](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CreateAutoScalingGroup.html).

### K03 — Launch templates and mixed-instance overrides

| Parameters | Required behavior/reference | Labs |
|---|---|---|
| `LaunchTemplateSpecification.LaunchTemplateId`, `.LaunchTemplateName`, `.Version` | ID/name alternatives; numeric versions versus `$Default`/`$Latest`; record resolved launch version per instance. | V11, V14 |
| `MixedInstancesPolicy.LaunchTemplate.LaunchTemplateSpecification` | Base specification shared by overrides. | V11 |
| `.LaunchTemplate.Overrides[].InstanceType` | Explicit eligible types and priority ordering. | V11 |
| `.Overrides[].LaunchTemplateSpecification` | Per-override template/AMI compatibility; preserve template identity and resolved version. | V11, V15 |
| `.Overrides[].ImageId` | Per-type AMI override; root-volume strategy requirements. | V15 |
| `.Overrides[].WeightedCapacity` | Integer-valued string, 1–999; all explicit types need weights if weighting is configured. | V11 |
| `.Overrides[].InstanceRequirements` | Alternative to explicit `InstanceType`; full attribute register below. | V11 |

Source: [launch overrides](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_LaunchTemplateOverrides.html).

The following launch-template dependencies need their own setting entries and a launch-pipeline consequence. Expand nested fields applicable to the scenario rather than label the whole template “advanced settings.” They belong to EC2, not to the ASG API:

| Dependency family | Fields/concepts that must be inspectable | Required failure or tradeoff |
|---|---|---|
| Image and bootstrap | `ImageId`, AMI architecture/platform/boot compatibility, user data, referenced artifacts, template version resolution | An accepted template can still fail to launch; a launch can succeed while bootstrap fails. |
| Compute | `InstanceType`, CPU options, burstable credit mode, accelerator/network requirements, EBS optimization | A nominal capacity unit does not establish equal application performance. |
| Identity and access | Instance profile ARN/name, key pair, service-linked role, caller `iam:PassRole`, AMI/snapshot sharing, KMS key access | Distinguish launch authorization from application authorization and encrypted-volume access. |
| Interfaces and network | Security-group IDs, interface-level groups, device/card indexes, existing ENI, IPv4/IPv6 assignment, public-IP setting, interface deletion, EFA/ENA requirements | Existing ENI cannot be shared by a fleet; public IP does not create a route; wrong port/security rule defeats health checks. |
| Storage | `BlockDeviceMappings[]`: device name, snapshot, volume type/size, IOPS, throughput, encryption/key, delete-on-termination; instance-store presence | Retained EBS costs money; instance-store data cannot be treated as a durable fleet store. |
| Metadata | HTTP endpoint, IMDSv2 token requirement, hop limit, IPv6 endpoint, instance metadata tags | Bootstrap or container credential discovery fails when its assumptions conflict with metadata settings. |
| Hibernation | `HibernationOptions.Configured`, supported image/type, encrypted root and sufficient space | Memory persistence differs from stopped-state boot; invalid eligibility prevents the intended pool behavior. |
| Placement and purchasing | Placement/tenancy/host constraints, reservation preference/target, instance market options | Group placement and mixed purchasing must be compatible with template settings. |
| Monitoring and tags | `Monitoring.Enabled`, tag specifications by resource type | EC2 detailed monitoring differs from ASG group metrics; volume tags need their own resource target. |
| Shutdown and access paths | EC2 termination/stop protection, shutdown behavior, maintenance options, Systems Manager prerequisites | Do not confuse EC2 safeguards with ASG scale-in protection; remote access also needs identity and connectivity. |

Sources: [ASG launch-template guidance](https://docs.aws.amazon.com/autoscaling/ec2/userguide/create-launch-template.html), [launch failure reference](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ts-as-instancelaunchfailure.html). Connected EC2 leaf constraints require their own primary-source links in the final setting inspector; ASG documentation alone is not sufficient evidence for all EC2 limits.

### K04 — Attribute-based instance requirements

All fields below live under `InstanceRequirements`. Every range expands into separate `Min`/`Max` inputs with units. Show how each constraint changes the candidate set and explain zero matches. Multiple attributes combine as AND; allowed values within an attribute combine as OR.

| Attribute family | Exact fields |
|---|---|
| Required compute/memory | `VCpuCount.Min/Max`, `MemoryMiB.Min/Max` |
| Memory balance | `MemoryGiBPerVCpu.Min/Max` |
| CPU choice | `CpuManufacturers[]`, `InstanceGenerations[]`, `BurstablePerformance`, `BareMetal` |
| Baseline CPU performance | `BaselinePerformanceFactors.Cpu.References[].InstanceFamily` |
| Network | `NetworkBandwidthGbps.Min/Max`, `NetworkInterfaceCount.Min/Max` |
| EBS performance | `BaselineEbsBandwidthMbps.Min/Max` |
| Local storage | `LocalStorage`, `LocalStorageTypes[]`, `TotalLocalStorageGB.Min/Max` |
| Accelerators | `AcceleratorTypes[]`, `AcceleratorManufacturers[]`, `AcceleratorNames[]`, `AcceleratorCount.Min/Max`, `AcceleratorTotalMemoryMiB.Min/Max` |
| Hibernate eligibility | `RequireHibernateSupport` |
| Candidate lists | `AllowedInstanceTypes[]`, `ExcludedInstanceTypes[]`; alternatives, not simultaneous filters |
| On-Demand price filter | `OnDemandMaxPricePercentageOverLowestPrice` |
| Spot price filters | `SpotMaxPricePercentageOverLowestPrice`, `MaxSpotPriceAsPercentageOfOptimalOnDemandPrice`; mutually exclusive |

The inspector must distinguish defaults such as bare-metal/burstable exclusion from “no filter.” CPU manufacturer is not CPU architecture. AMI compatibility still matters. Price filters must display their reference price and whether the comparison is per instance, vCPU, or memory unit; they are not a total group budget. Keep accelerator enumerations and type availability in a dated reference, not in hard-coded prose claiming future completeness. [Instance requirements](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstanceRequirements.html), [baseline performance](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_BaselinePerformanceFactorsRequest.html)

### K05 — Purchase options, allocation, and reservations

Fields in the first six rows belong to `MixedInstancesPolicy.InstancesDistribution`.

| Parameters | Required behavior/reference |
|---|---|
| `OnDemandBaseCapacity` | Baseline in group capacity units; distinguish target below base from a guarantee of physically available capacity. |
| `OnDemandPercentageAboveBaseCapacity` | Percentage of the remainder; 0/100 endpoints, rounding, weighted indivisibility, and live ratio changes. |
| `OnDemandAllocationStrategy` | `prioritized` or `lowest-price`; defaults and attribute-selection restrictions must be visible. |
| `SpotAllocationStrategy` | `lowest-price`, `capacity-optimized`, `capacity-optimized-prioritized`, `price-capacity-optimized`; explain preference criteria without invented pool scores. |
| `SpotInstancePools` | Applies to `lowest-price`; 1–20, API default 2; not a universal diversification control. |
| `SpotMaxPrice` | Per-unit-hour ceiling; omitted, explicit, and empty-string clearing; low ceilings can leave demand unmet or increase interruptions. |
| `DistributionSegments[].TargetCapacityTypes[]` | Ordered capacity types: `on-demand-capacity-reservation`, `capacity-block`, `interruptible-capacity-reservation`, `on-demand`. |
| `CapacityReservationSpecification.CapacityReservationPreference` | `default`, `none`, `capacity-reservations-first`, `capacity-reservations-only`; fallback versus failure. |
| `.CapacityReservationTarget.CapacityReservationIds[]` | Explicit reservation destinations. |
| `.CapacityReservationTarget.CapacityReservationResourceGroupArns[]` | Reservation resource-group destinations. |

Distribution segments currently support one segment; On-Demand fallback must be last. They require the compatible `default` reservation preference and `prioritized` allocation, and do not support warm pools or Spot targets. Switching to segments clears the old base/percentage distribution; the reverse migration also needs an explicit effective-configuration comparison. Scale-in follows reverse capacity-type priority, with removed types handled first. [Distribution configuration](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstancesDistribution.html), [segments](https://docs.aws.amazon.com/autoscaling/ec2/userguide/use-distribution-segments.html), [reservation configuration](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CapacityReservationSpecification.html), [reservation targets](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CapacityReservationTarget.html)

### K06 — Scaling policy common fields and target tracking

| Parameters | Required behavior/reference |
|---|---|
| `AutoScalingGroupName`, `PolicyName`, `PolicyType`, `Enabled` | Policy identity, ownership, type, and disabled state. Types: `TargetTrackingScaling`, `StepScaling`, `SimpleScaling`, `PredictiveScaling`. |
| `EstimatedInstanceWarmup` | Policy override for target tracking/step; otherwise group warmup, then cooldown fallback when group warmup is unset. |
| `TargetTrackingConfiguration.TargetValue` | Target with its actual unit, not always a percentage. |
| `.DisableScaleIn` | Disables this policy's scale-in contribution, not all termination. |
| `.PredefinedMetricSpecification.PredefinedMetricType` | `ASGAverageCPUUtilization`, `ASGAverageNetworkIn`, `ASGAverageNetworkOut`, `ALBRequestCountPerTarget`. |
| `.PredefinedMetricSpecification.ResourceLabel` | Required ALB/target-group association for per-target requests; wrong resource yields wrong/missing signal. |
| `.CustomizedMetricSpecification` | Alternative to predefined metric; expand below. |

Sources: [policy fields](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutScalingPolicy.html), [target tracking fields](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_TargetTrackingConfiguration.html).

Custom metric reference entries: `MetricName`, `Namespace`, `Dimensions[].Name/Value`, `Statistic`, `Unit`, `Period`, and `Metrics[]`. Each query exposes `Id`, `Expression` or `MetricStat`, `Label`, `Period`, and `ReturnData`. `MetricStat` expands into `Metric.Namespace`, `.MetricName`, `.Dimensions[].Name/Value`, `Stat`, `Unit`, and `Period`. One final expression returns the policy time series; show dependencies and division-by-zero/missing-data behavior. [Target-tracking statistics shape](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_TargetTrackingMetricStat.html)

The currently documented target-tracking metric periods are 10, 30, and 60 seconds. A high-resolution period needs a suitably published metric; shortening a control does not create fresh observations. Show raw publication interval, aggregation period, and decision delay separately. [Custom metric fields](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CustomizedMetricSpecification.html), [metric queries](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_TargetTrackingMetricDataQuery.html), [high-resolution policy guidance](https://docs.aws.amazon.com/autoscaling/ec2/userguide/policy-creating-high-resolution-metrics.html)

Connected CloudWatch alarm entries for user-managed step/simple alarms: namespace/name/dimensions or metric expression, statistic/extended statistic, unit, period, threshold, comparison operator, evaluation periods, datapoints-to-alarm, missing-data treatment, action enabled state, and policy action ARN. Label these CloudWatch settings. Target-tracking alarms are AWS-managed; the lab does not teach editing them as the normal control surface. [CloudWatch alarm fields](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_PutMetricAlarm.html)

### K07 — Step and simple scaling

| Parameters | Required behavior/reference |
|---|---|
| `AdjustmentType` | `ChangeInCapacity`, `ExactCapacity`, `PercentChangeInCapacity`. |
| `ScalingAdjustment` | Simple policy's increment/decrement or exact target. |
| `StepAdjustments[].MetricIntervalLowerBound`, `.MetricIntervalUpperBound`, `.ScalingAdjustment` | Relative breach bounds in API requests; interval matching and open-ended bounds. |
| `MetricAggregationType` | `Average`, `Minimum`, `Maximum`; distinct from the upstream alarm's aggregation. |
| `MinAdjustmentMagnitude` | Minimum absolute adjustment for percent changes; units remain capacity units in weighted groups. |
| `Cooldown` | Per-simple-policy override of group cooldown. |
| `MinAdjustmentStep` | Deprecated predecessor; reference-only migration note. |
| `ExecutePolicy.PolicyName`, `.AutoScalingGroupName`, `.HonorCooldown`, `.MetricValue`, `.BreachThreshold` | Manual invocation and step-breach inputs; demonstrate applicable parameters by policy type. |

Percent adjustments round magnitudes greater than one toward zero, while nonzero magnitudes below one become one unit in the corresponding direction. Show the minimum adjustment after the raw calculation. Above-threshold step ranges include the lower boundary and exclude the upper; below-threshold ranges reverse those inclusivity rules. [Step behavior](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-simple-step.html), [policy execution](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_ExecutePolicy.html)

### K08 — Schedules and predictive scaling

| Parameters | Required behavior/reference |
|---|---|
| Schedule `AutoScalingGroupName`, `ScheduledActionName` | Action identity; create/update/delete and batch variants. |
| Schedule `StartTime`, `EndTime`, `Recurrence`, `TimeZone` | One-time versus five-field recurring cron; UTC timestamps versus local recurrence; defaults and start/end bounds. |
| Schedule `MinSize`, `MaxSize`, `DesiredCapacity` | At least one specified; values persist after execution; expiry does not undo a size change. |
| Schedule `Time` | No longer used; reference-only. |
| `PredictiveScalingConfiguration.Mode` | `ForecastOnly` default or `ForecastAndScale`. |
| `.SchedulingBufferTime` | Prelaunch lead in seconds; API documents default 300 and value less than 3,600. This differs from broad guide wording about hourly launch timing; explicitly use the API value in API fixtures. |
| `.MaxCapacityBreachBehavior` | `HonorMaxCapacity` or `IncreaseMaxCapacity`. |
| `.MaxCapacityBuffer` | Percentage relative to forecast capacity; 0–100; applicable with `IncreaseMaxCapacity`. |
| `.MetricSpecifications[]` | Currently one specification; expand target value and metric choices below. |

Predictive metric specification entries: `TargetValue`; `PredefinedMetricPairSpecification`; `PredefinedLoadMetricSpecification`; `PredefinedScalingMetricSpecification`; `CustomizedLoadMetricSpecification`; `CustomizedScalingMetricSpecification`; and `CustomizedCapacityMetricSpecification`. Predefined choices expand into `PredefinedMetricType` and `ResourceLabel`. Custom choices expand into `MetricDataQueries[].Id`, `.Label`, `.Expression` or `.MetricStat`, and `.ReturnData`. Predictive `MetricStat` contains `Metric.Namespace`, `.MetricName`, `.Dimensions[].Name/Value`, `Stat`, and `Unit`; do not copy target tracking's period field into that shape. Load, per-capacity utilization, and capacity series must remain visibly distinct. [Schedule API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutScheduledUpdateGroupAction.html), [predictive configuration](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PredictiveScalingConfiguration.html), [predictive metric choices](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PredictiveScalingMetricSpecification.html), [predictive queries](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_MetricDataQuery.html), [predictive statistics](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_MetricStat.html)

Predictive scaling adds capacity from forecasts; dynamic scaling handles reductions and unpredicted demand. Include insufficient history and misleading equal-capacity assumptions. The history window, forecast horizon, and refresh cadence are different controls/labels: up to 14 days, 48 hours, and six-hour forecast updates, respectively. [Forecast mechanism](https://docs.aws.amazon.com/autoscaling/ec2/userguide/predictive-scaling-policy-overview.html)

### K09 — Lifecycle hooks and warm pools

| Parameters | Required behavior/reference |
|---|---|
| Hook `AutoScalingGroupName`, `LifecycleHookName` | Hook identity and scope; same names can exist in different groups. |
| `LifecycleTransition` | `autoscaling:EC2_INSTANCE_LAUNCHING` or `autoscaling:EC2_INSTANCE_TERMINATING`; reused by warm and root-volume paths. |
| `HeartbeatTimeout` | 30–7,200 seconds; default 3,600. Heartbeats restart this timer, not the absolute maximum. |
| `DefaultResult` | `ABANDON` API default or `CONTINUE`; timeout applies the configured result. |
| `NotificationTargetARN`, `RoleARN`, `NotificationMetadata` | SNS/SQS publishing role or direct Lambda invocation permissions as applicable; separate from EventBridge routing and worker permissions. Handle test notifications. |
| Completion `LifecycleActionToken` or `InstanceId`, `LifecycleHookName`, `AutoScalingGroupName`, `LifecycleActionResult` | Address the current action; complete with `CONTINUE`/`ABANDON`. |
| Heartbeat action identifiers | Same scope/token matching; stale action must not receive a fresh deadline. |
| Pool `AutoScalingGroupName`, `MinSize`, `MaxGroupPreparedCapacity` | Separate pool minimum and prepared target; `-1` clears custom prepared capacity. |
| Pool `PoolState` | `Stopped` default, `Running`, `Hibernated`. |
| Pool `InstanceReusePolicy.ReuseOnScaleIn` | Reuse versus ordinary termination on scale-in. |
| Pool deletion `ForceDelete` | Ordinary drain/cleanup versus forced deletion; show applicable lifecycle consequences. |

The global hook limit is the smaller of 48 hours or 100 heartbeat periods. For a 30-second heartbeat timeout, that is 3,000 seconds, not 48 hours. Without retention, termination `ABANDON` permits termination and skips remaining actions; launch `ABANDON` fails that launch. A timeout with configured `CONTINUE` is not an abandoned action. [Hook API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutLifecycleHook.html), [hook limits](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html), [warm-pool API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutWarmPool.html)

Notification-path variants are mandatory: in-instance completion without an external target; EventBridge-to-Lambda; direct Lambda; SNS; and SQS. For direct Lambda, show permission for the group's service-linked role to invoke the function. For all paths, distinguish successful delivery from successful lifecycle completion. [Notification setup](https://docs.aws.amazon.com/autoscaling/ec2/userguide/prepare-for-lifecycle-notifications.html)

### K10 — Maintenance and instance refresh

| Parameters | Required behavior/reference |
|---|---|
| Group `InstanceMaintenancePolicy.MinHealthyPercentage`, `.MaxHealthyPercentage` | Min 0–100; max 100–200; both specified; gap no more than 100 points; documented `-1` clearing. |
| Refresh `AutoScalingGroupName`, `Strategy` | `Rolling` default or `ReplaceRootVolume`; one active refresh. |
| `DesiredConfiguration.LaunchTemplate`, `.MixedInstancesPolicy` | New configuration and nested fields from K03–K05. Distinguish from desired fleet capacity. |
| `Preferences.MinHealthyPercentage`, `.MaxHealthyPercentage` | Per-refresh values override group maintenance settings. Without those settings, API defaults are 90/100. |
| `.InstanceWarmup` | Per-refresh override; otherwise group warmup, otherwise health grace. |
| `.CheckpointPercentages[]`, `.CheckpointDelay` | Unique ascending percentages 1–100; timed pause, default delay 3,600 when checkpoints are set without a delay. Include partial refresh ending below 100. |
| `.BakeTime` | Final observation period, 0–172,800 seconds; not a checkpoint or per-instance warmup. |
| `.SkipMatching` | Configuration-based skip; cannot establish application filesystem equality. |
| `.AutoRollback` | Explicitly enabled recovery; eligibility restrictions and rollback failure. |
| `.AlarmSpecification.Alarms[]` | Existing CloudWatch alarm references; thresholds/metrics owned by CloudWatch. |
| `.ScaleInProtectedInstances` | `Refresh`, `Ignore`, `Wait`; API default `Wait`, with a one-hour intervention window. |
| `.StandbyInstances` | `Terminate`, `Ignore`, `Wait`; API default `Wait`, with a one-hour intervention window. |
| Cancel/rollback group identifier and cancel `WaitForTransitioningInstances` | Distinguish stopping further replacement from returning the fleet to the prior configuration. |

Explicit `MaxHealthyPercentage=100` is not equivalent to omission: the API documents different fallback ordering when both bounds cannot be satisfied. This requires its own fixture; a generic floor/ceiling calculation is insufficient. Rollback is unavailable in documented cases including no desired configuration, dynamic template versions, and an SSM parameter in the launch template's image field. [Maintenance shape](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstanceMaintenancePolicy.html), [refresh preferences](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_RefreshPreferences.html), [refresh operation](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_StartInstanceRefresh.html)

The creation-path comparison must show three additional default differences: API skip matching is off while console skip matching is on; API protected-instance treatment is `Wait` while console defaults to `Ignore`; API standby treatment is `Wait` while console defaults to `Ignore`. A learner recreating console behavior through an API should see the explicit equivalent configuration. [Refresh defaults](https://docs.aws.amazon.com/autoscaling/ec2/userguide/understand-instance-refresh-default-values.html)

### K11 — Instance actions, protection, and process controls

| Action and parameters | Required behavior/reference |
|---|---|
| `SetDesiredCapacity`: group, desired, `HonorCooldown` | Immediate requested-capacity change with optional cooldown handling for the applicable manual operation. |
| `EnterStandby`: group, `InstanceIds[]`, `ShouldDecrementDesiredCapacity` | Retain membership, stop ordinary service participation, optionally reduce requested capacity. |
| `ExitStandby`: group, `InstanceIds[]` | Increment desired on return; fail if resulting bounds are invalid. |
| `AttachInstances`: group, `InstanceIds[]` | Attachment increases desired; reject if the resulting desired exceeds maximum. Validate instance eligibility and registration. |
| `DetachInstances`: group, `InstanceIds[]`, `ShouldDecrementDesiredCapacity` | Remove management while EC2 continues; optional desired decrement determines replacement need. |
| `TerminateInstanceInAutoScalingGroup`: `InstanceId`, `ShouldDecrementDesiredCapacity` | Explicit instance selection; contrast retained/warm-pool/active cases with direct EC2 termination. |
| `SetInstanceHealth`: `InstanceId`, `HealthStatus`, `ShouldRespectGracePeriod` | Custom health signal and grace handling; ongoing checks can affect later health state. |
| `SetInstanceProtection`: group, `InstanceIds[]`, `ProtectedFromScaleIn` | Per-instance protection; distinguish supported lifecycle states and group default inheritance. |
| `SuspendProcesses` / `ResumeProcesses`: group, `ScalingProcesses[]` | `Launch`, `Terminate`, `AddToLoadBalancer`, `AlarmNotification`, `AZRebalance`, `HealthCheck`, `InstanceRefresh`, `ReplaceUnhealthy`, `ScheduledActions`. |
| `LaunchInstances`: group, `RequestedCapacity`, `ClientToken` | Explicit launch request, idempotency, successes/errors, and actual-instance batch limit. |
| `LaunchInstances.AvailabilityZones[]`, `.AvailabilityZoneIds[]`, `.SubnetIds[]` | Explicit destination within group configuration, with request compatibility checks. |
| `LaunchInstances.RetryStrategy` | `none` or `retry-with-group-configuration`; asynchronous recovery can use broader group configuration. |
| `DeleteAutoScalingGroup`: group, `ForceDelete` | Deletion protection and force-delete hook bypass; show resource consequences. |

Sources: [standby](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-enter-exit-standby.html), [explicit termination](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_TerminateInstanceInAutoScalingGroup.html), [explicit launch](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_LaunchInstances.html), [processes](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-suspend-resume-processes.html), [deletion](https://docs.aws.amazon.com/autoscaling/ec2/userguide/resource-deletion-protection.html). The final reference must resolve action-specific preconditions from each linked action, especially attach/detach and force-delete variants.

Attach and detach requests support up to 20 instance IDs in the reviewed API. Synchronous launch uses launch templates, supports fully On-Demand or fully Spot configurations rather than a combined purchasing split, and targets one AZ per call. A returned ID can still be pending and fail later. Include interference from active AZ rebalancing when successive explicit launches concentrate capacity. [Attach](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_AttachInstances.html), [detach](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_DetachInstances.html), [synchronous launch guide](https://docs.aws.amazon.com/autoscaling/ec2/userguide/launch-instances-synchronously)

### K12 — Traffic sources, observability, tags, and notifications

| Surface | Required coverage |
|---|---|
| Traffic-source operations | `AttachLoadBalancers`, `DetachLoadBalancers`; `AttachLoadBalancerTargetGroups`, `DetachLoadBalancerTargetGroups`; `AttachTrafficSources`, `DetachTrafficSources`. Group identifier plus names/ARNs or typed identifiers; include applicable `SkipZonalShiftValidation`. |
| Group metric collection | `EnableMetricsCollection`: group, `Granularity=1Minute`, selected `Metrics[]`; `DisableMetricsCollection`: group and selection. Omitted selection can mean all; do not confuse omitted with an explicit empty configuration. |
| Instance-count metrics | Min/max/desired and `GroupInServiceInstances`, `GroupPendingInstances`, `GroupStandbyInstances`, `GroupTerminatingInstances`, `GroupTerminatingRetainedInstances`, `GroupTotalInstances`. Explain which states each metric includes. |
| Capacity-unit metrics | `GroupInServiceCapacity`, `GroupPendingCapacity`, `GroupStandbyCapacity`, `GroupTerminatingCapacity`, `GroupTotalCapacity`, and supported retained-capacity counterparts. |
| Warm-pool metrics | `WarmPoolDesiredCapacity`, `WarmPoolWarmedCapacity`, `WarmPoolPendingCapacity`, `WarmPoolTerminatingCapacity`, `WarmPoolTotalCapacity`, combined group/pool desired and total, and supported retained-state metrics. |
| Predictive observations | Forecast load/capacity, forecast timestamps, forecast accuracy and capacity comparison where available; keep forecast retrieval separate from enabling scaling. |
| Notification configuration | Group, `TopicARN`, `NotificationTypes[]`; launch/termination success and error notification families plus test notification handling. Distinguish from lifecycle hooks. |
| EventBridge | Scaling, lifecycle, warm-pool, refresh, interruption-related and zonal events; routing, retries, duplicate/missing delivery and reconciliation. |
| Activity/health evidence | Activity cause/status/message, start/end, refresh status/reason/progress, instance state, target health and failure reason. |
| Tags | `CreateOrUpdateTags`, `DeleteTags`, group/instance propagation, ownership and cost tags. |
| API inspection | Pagination/filtering, observation timestamp, partial/stale results, account/Region selection, and denied inspection. These are reference controls, not fleet physics. |

Sources: [group metrics](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-metrics.html), [metric selection API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_EnableMetricsCollection.html), [API action index](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_Operations.html). AWS's metric guide and selection API currently differ in retained-state coverage; keep that discrepancy visible in the editorial register and verify supported names before building selectable controls.

### K13 — Complete API navigation mapping

All 66 actions listed in the reviewed API index have a home. This maps operations to explanations; it does not require an animated form for read-only discovery APIs.

| Purpose | Actions |
|---|---|
| Group lifecycle | `CreateAutoScalingGroup`, `UpdateAutoScalingGroup`, `DeleteAutoScalingGroup`, `DescribeAutoScalingGroups`, `DescribeAccountLimits` |
| Instance management | `AttachInstances`, `DetachInstances`, `EnterStandby`, `ExitStandby`, `LaunchInstances`, `SetDesiredCapacity`, `SetInstanceHealth`, `SetInstanceProtection`, `TerminateInstanceInAutoScalingGroup`, `DescribeAutoScalingInstances` |
| Policies | `PutScalingPolicy`, `DeletePolicy`, `ExecutePolicy`, `DescribePolicies`, `DescribeAdjustmentTypes`, `GetPredictiveScalingForecast` |
| Scheduling | `PutScheduledUpdateGroupAction`, `BatchPutScheduledUpdateGroupAction`, `DeleteScheduledAction`, `BatchDeleteScheduledAction`, `DescribeScheduledActions` |
| Hooks | `PutLifecycleHook`, `DeleteLifecycleHook`, `CompleteLifecycleAction`, `RecordLifecycleActionHeartbeat`, `DescribeLifecycleHooks`, `DescribeLifecycleHookTypes` |
| Warm pools | `PutWarmPool`, `DeleteWarmPool`, `DescribeWarmPool` |
| Refresh | `StartInstanceRefresh`, `CancelInstanceRefresh`, `RollbackInstanceRefresh`, `DescribeInstanceRefreshes` |
| Traffic sources | `AttachLoadBalancers`, `DetachLoadBalancers`, `DescribeLoadBalancers`, `AttachLoadBalancerTargetGroups`, `DetachLoadBalancerTargetGroups`, `DescribeLoadBalancerTargetGroups`, `AttachTrafficSources`, `DetachTrafficSources`, `DescribeTrafficSources` |
| Processes and termination discovery | `SuspendProcesses`, `ResumeProcesses`, `DescribeScalingProcessTypes`, `DescribeTerminationPolicyTypes` |
| Metrics and activity | `EnableMetricsCollection`, `DisableMetricsCollection`, `DescribeMetricCollectionTypes`, `DescribeScalingActivities` |
| Notifications | `PutNotificationConfiguration`, `DeleteNotificationConfiguration`, `DescribeNotificationConfigurations`, `DescribeAutoScalingNotificationTypes` |
| Tags | `CreateOrUpdateTags`, `DeleteTags`, `DescribeTags` |
| Legacy launch configurations | `CreateLaunchConfiguration`, `DeleteLaunchConfiguration`, `DescribeLaunchConfigurations` |

Legacy launch configurations receive a searchable field reference and migration comparison. They must not become the default configuration editor. Their EC2-related fields map to K03; compatibility and feature restrictions need dated primary references. Query transport fields such as signing credentials are not learner-adjustable scaling settings. [API index](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_Operations.html)

### K14 — Legacy fields and connected-service controls

Legacy launch-configuration fields: `LaunchConfigurationName`, `ImageId`, `InstanceId`, `InstanceType`, `KeyName`, `IamInstanceProfile`, `UserData`, `AssociatePublicIpAddress`, `SecurityGroups[]`, `EbsOptimized`, `PlacementTenancy`, `SpotPrice`, `InstanceMonitoring.Enabled`, `KernelId`, `RamdiskId`, `ClassicLinkVPCId`, and `ClassicLinkVPCSecurityGroups[]`. Mark ClassicLink entries as backward-compatibility vocabulary. `MetadataOptions` expands into `HttpEndpoint`, `HttpTokens`, and `HttpPutResponseHopLimit`. `BlockDeviceMappings[]` expands into `DeviceName`, `VirtualName`, `NoDevice`, and `Ebs` storage fields. Keep this legacy shape distinct from EC2 launch templates; one does not acquire the other's newer fields. [Legacy configuration API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CreateLaunchConfiguration.html), [legacy metadata shape](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstanceMetadataOptions.html)

| Owner | Controls relevant to this explainer | Required scenario extension |
|---|---|---|
| Traffic-source health | `HealthCheckProtocol`, `HealthCheckPort`, `HealthCheckPath`, `HealthCheckIntervalSeconds`, `HealthCheckTimeoutSeconds`, `HealthyThresholdCount`, `UnhealthyThresholdCount`, matcher, target type and enabled AZs | S021–S030: initial registration versus recovery thresholds; wrong path/port/code; target unused because no listener uses its group. |
| ALB target attributes | `deregistration_delay.timeout_seconds`, `slow_start.duration_seconds`, cross-zone behavior, routing algorithm, stickiness | S024/S086: traffic ramp differs from ASG warmup; skewed routing can invalidate average-load assumptions; no in-flight connections can finish draining earlier than displayed state implies. |
| Load-balancer failure behavior | Target-group health/routing failover thresholds and fail-open behavior appropriate to the selected load balancer | S030: an ALB with only unhealthy registered targets can route to them; unhealthy is not universally equivalent to receiving no traffic. |
| CloudWatch | Alarm evaluation, M-of-N datapoints, missing-data treatment, period and publisher resolution | S036/S038/S041: delayed versus missing evidence; a 10-second selector does not accelerate a five-minute publisher. |
| IAM/KMS | Caller permissions, service-linked role, instance role, key policy/grants, hook invocation permissions, endpoint policy | S111: distinguish the denied actor and action; access to an encrypted AMI requires more than an application role. |
| EC2/service quotas | ASG/policy/hook/refresh limits, EC2 On-Demand/Spot vCPU limits, instance availability, subnet addresses, EBS and API-rate constraints | S074/S111: quota increase differs from physical capacity availability or free addresses. |
| Application | Measured startup, graceful shutdown, readiness depth, in-flight work, durable state, per-instance throughput | S020/S040/S094: these are explicitly authored workload assumptions, not knobs exposed by the ASG service. |

Sources: [ALB health](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html), [target attributes](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-target-group-attributes.html), [alarm fields](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_PutMetricAlarm.html), [KMS requirements](https://docs.aws.amazon.com/autoscaling/ec2/userguide/key-policy-requirements-EBS-encryption.html), [service-linked role](https://docs.aws.amazon.com/autoscaling/ec2/userguide/autoscaling-service-linked-role.html), [ASG quotas](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-quotas.html).

Do not apply ALB protocol, health, slow-start, or drain defaults to NLB, Gateway Load Balancer, Classic ELB, or VPC Lattice. Their integration presets need their corresponding source-defined controls. Registration and ASG health consumption remain separate for every preset.

## 7. Lifecycle, timers, precedence, and incompatibility rules

### Complete lifecycle vocabulary

The reference must recognize the following ASG lifecycle values from the reviewed `Instance` shape. The state graph shows only documented reachable transitions for the selected operation; the presence of an enum value is not evidence for a transition.

| Family | States |
|---|---|
| Launch/service | `Pending`, `Pending:Wait`, `Pending:Proceed`, `InService` |
| Termination | `Terminating`, `Terminating:Wait`, `Terminating:Proceed`, `Terminating:Retained`, `Terminated` |
| Membership | `Detaching`, `Detached`, `EnteringStandby`, `Standby` |
| Root-volume refresh | `ReplacingRootVolume`, `ReplacingRootVolume:Wait`, `ReplacingRootVolume:Proceed`, `RootVolumeReplaced` |
| Warm preparation | `Warmed:Pending`, `Warmed:Pending:Wait`, `Warmed:Pending:Proceed`, `Warmed:Pending:Retained` |
| Warm residence | `Warmed:Stopped`, `Warmed:Running`, `Warmed:Hibernated` |
| Warm termination | `Warmed:Terminating`, `Warmed:Terminating:Wait`, `Warmed:Terminating:Proceed`, `Warmed:Terminating:Retained`, `Warmed:Terminated` |
| Unused vocabulary | `Quarantined` is documented as unused; reference-only, with no invented transition. |

Source: [instance state vocabulary](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_Instance.html). In particular, retain the warm retained-state vocabulary without inferring that any failed launch can be retained. The documented configurable trigger is termination-hook abandonment.

### Timer ownership and triggers

| Clock | Owner and start | Gates / does not establish |
|---|---|---|
| Bootstrap duration | Application/fixture, starting at the relevant boot | Readiness work; ASG does not inherently know a shell script finished. |
| Hook heartbeat | ASG action wait; refreshed by valid heartbeat | Action timeout; does not extend absolute maximum. |
| Hook absolute limit | ASG wait begins | Overall action residence; cannot be reset forever. |
| Health grace | ASG entry into service for applicable paths | Startup health replacement protection; not target traffic gating. |
| Instance warmup | InService for applicable scaling/replacement path | Metric/replacement readiness; not an ELB check configuration. |
| Simple cooldown | Applicable scaling activity completion rules | Further simple-policy action; not all ASG reconciliation. |
| Metric publication/period | Metric publisher and CloudWatch | What evidence exists and when; not instance boot readiness. |
| Target health interval/threshold | Traffic source | Routing/readiness evidence; configuration varies by target type. |
| Deregistration delay | Target removal/draining starts | Existing traffic drain; not arbitrary application cleanup. |
| Predictive buffer | Before forecast demand time | Launch lead; not a guaranteed ready-before-demand interval. |
| Checkpoint delay | Configured refresh progress checkpoint reached | Intermediate observation; not manual approval unless an external workflow is separately specified. |
| Bake time | End of replacement phase | Final refresh observation before success. |
| Lifetime | Instance age under configured replacement policy | Rotation eligibility; not an exact real-time termination deadline. |
| Spot interruption | EC2 interruption event | Reclamation deadline independent of lifecycle/protection settings. |
| Reservation window | Reservation service | Capacity availability; no assumption of Spot-equivalent notice. |

Use the detailed sources linked in K02, K08–K10 and V12–V13. The timeline must not add overlapping durations as if all waits are serial. It also must not start cooldown at alarm breach merely because that is the first visible event.

Simple-cooldown fixtures must distinguish batch launch completion from launch-hook waiting and from the documented ELB scale-in path where cooldown can overlap deregistration/hook work. The cooldown guide contains broad and specific descriptions that differ; use the applicable specific path and keep a source note beside it. [Cooldown timing](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-scaling-cooldowns.html)

### Precedence is operation-specific

| Relationship | Required explanation |
|---|---|
| Group versus refresh maintenance bounds | Explicit refresh preferences take precedence for that refresh; group policy applies to other relevant maintenance. |
| Policy warmup inheritance | Policy override → group default warmup → default cooldown when group warmup is unset. |
| Refresh warmup inheritance | Refresh override → group default warmup → health grace when group warmup is unset. |
| Target-tracking policies | Availability-oriented agreement rules apply within that policy family; do not blindly sum requested changes. |
| Scaling versus replacement | A healthy-capacity floor does not prevent ordinary desired-capacity changes; a failed instance can reduce availability regardless of the floor. |
| Template updates | Future launches resolve the configured source; existing instances preserve their launched configuration until an applicable replacement/update. |
| Protection | Scope depends on the operation. A protected instance can still fail or be explicitly terminated; refresh has its own protected-instance preference. |
| Termination policy | Eligible pool is constrained by the operation, purchase/placement rules, and protection before ordered selection. Reservation-first cases need their own branch. |
| ASG max versus actual resources | Ordinary desired bounds, weighted overage, AZ-rebalance headroom, Spot-rebalance headroom, maintenance overlap, warm pools, and retained resources are separate mechanisms. |
| Group tags versus template instance tags | Group propagation wins for a duplicate instance-tag key; this does not propagate group tags to volumes. |
| Zonal shift versus dynamic scale-in | During the documented active-shift behavior, dynamic scale-in is blocked; this is not a universal prohibition on every manual operation. |

Do not combine these rows into one supposed global AWS rule order. When a compound incident involves undocumented ordering, display the valid branch selected by the fixture.

### Required compatibility checks

| Combination | Simulator response |
|---|---|
| Warm pool + weighted mixed group | Reject with reason. |
| Warm pool + mixed group containing Spot | Reject; eligible mixed warm-pool fixture is unweighted and On-Demand-only. |
| Warm pool + distribution segments | Reject. |
| Warm pool + active root-volume refresh | Reject the incompatible operation in either direction. |
| Hibernated pool + unmet hibernation prerequisites | Explain launch/configuration failure or the documented stopped fallback on reuse, according to the path. |
| Root-volume strategy + dynamic template version / missing AMI override / multi-volume AMI / unmatched instance type | Reject at the documented applicable validation stage. |
| Attribute selection + explicit instance type in the same override | Reject. |
| Attribute selection + prioritized On-Demand / capacity-optimized-prioritized Spot | Reject unsupported strategy. |
| Allowed and excluded instance lists together | Reject. |
| Both Spot percentage price-protection fields | Reject. |
| `SpotInstancePools` with another Spot strategy | Explain its strategy-specific applicability; no fake effect. |
| Invalid maintenance bounds or excessive gap | Reject. |
| Refresh rollback + unsupported configuration | Explain unavailability before starting. |
| Existing fixed ENI + fleet needing several instances | Explain the single-attachment constraint. |
| Cluster placement group + multiple AZs | Reject. |
| Distribution segments + Spot / non-final On-Demand / incompatible allocation or reservation preference | Reject. |
| Two active refreshes | Reject the second start. |
| Synchronous launch + legacy launch configuration or combined On-Demand/Spot split | Explain the unsupported configuration; normal asynchronous ASG scaling is a separate operation. |
| Synchronous launch + warm pool | Label unsupported and require observed-state reconciliation; do not infer absence of side effects from the documented error. |
| Explicit desired outside min/max; standby return beyond max | Reject the operation; do not silently reinterpret it as a successful request. |

Sources: [warm-pool limitations](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-warm-pools.html), [root-volume requirements](https://docs.aws.amazon.com/autoscaling/ec2/userguide/replace-root-volume.html), [allocation restrictions](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstancesDistribution.html), [attribute constraints](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstanceRequirements.html), [maintenance constraints](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstanceMaintenancePolicy.html), [launch-template constraints](https://docs.aws.amazon.com/autoscaling/ec2/userguide/create-launch-template.html).

## 8. Required scenario register

These 120 named scenarios define observable acceptance cases, not a promise that 120 examples exhaust all combinations. Each becomes a repeatable fixture with initial configuration, fleet, workload, event order, expected decisions, expected ledger changes, explanatory caption, and references. Scenario variants inherit their parent fixture and change only named inputs.

“Pass” means the visualization explains the expected outcome. It can be a failed launch, a rejected configuration, or intentionally unmet desired capacity. It does not mean every scenario converges to a healthy fleet.

### Capacity and group changes — K01–K02; V01

| ID | Scenario | Expected observable result |
|---|---|---|
| S001 | Fixed six-instance group loses an instance | Desired stays six; replacement occurs without a scaling policy. |
| S002 | Desired rises from six to nine | Requested capacity moves first; pending and serving capacity follow distinct events. |
| S003 | Minimum rises above current size without explicit desired | Effective desired changes as defined by the group update; show both fields. |
| S004 | Maximum drops below current size without explicit desired | Scale-in is requested; termination eligibility can prevent immediate convergence. |
| S005 | Explicit desired violates min/max | Reject request and retain the prior configuration. |
| S006 | Min = desired = max | Dynamic size changes are bounded; failed-instance replacement still exists. |
| S007 | Min/desired zero, no independent demand signal | No instance CPU signal can wake the empty fleet; explain the missing trigger. |
| S008 | Maximum reached while demand grows | Show constrained capacity and workload impact without an unexplained extra instance. |
| S009 | Launch template version changed | Existing cohort retains old configuration; new launches use the new source. |
| S010 | Change purchase-option ratio on an existing group | Show gradual fleet replacement separately from a template-only future-launch change. |

Sources: [group updates](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_UpdateAutoScalingGroup.html), [distribution updates](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstancesDistribution.html).

### Launch and lifecycle actions — K03, K09; V02–V03

| ID | Scenario | Expected observable result |
|---|---|---|
| S011 | Domain join finishes before launch-hook timeout | Valid completion releases the hook and allows later registration/service. |
| S012 | Launch hook explicitly abandons | The failed launch does not become a serving instance; replacement demand remains. |
| S013 | Timeout with `CONTINUE` versus `ABANDON` | The same expired clock produces different outcomes from the configured default result. |
| S014 | Heartbeats succeed until the absolute limit | Heartbeat deadline moves; absolute deadline does not. |
| S015 | Completion arrives after the action expired | The stale completion cannot revive the old action or terminate its replacement. |
| S016 | Hook notification delivered twice | Worker-side idempotency prevents duplicate setup; state remains coherent. |
| S017 | Several lifecycle actions remain outstanding | One completed action does not erase another action's wait. |
| S018 | Repeated bootstrap/hook failure | Show persistent launch failure and throttled progress, not unlimited instant churn. |
| S019 | Secondary ENI already attached elsewhere | Preparation fails at the application/EC2 operation, with the hook still requiring resolution. |
| S020 | No hook and user data still running | Instance lifecycle progress is not treated as proof of successful bootstrap. |

Sources: [hooks](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html), [hook parameters](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutLifecycleHook.html), [launch-template constraints](https://docs.aws.amazon.com/autoscaling/ec2/userguide/create-launch-template.html).

### Health, readiness, and replacement — K02; V03–V04

| ID | Scenario | Expected observable result |
|---|---|---|
| S021 | Target unhealthy, ELB health consumption disabled | Routing health changes without attributing ASG replacement to the disabled source. |
| S022 | Enable ELB health consumption for a persistently bad target | ASG can mark unhealthy and replace after applicable grace/check behavior. |
| S023 | Application starts after a short grace period | Show the replacement loop caused by premature health action. |
| S024 | Grace long enough, warmup still active | Target can serve while scaling/replacement calculations still wait. |
| S025 | EC2 instance stopped during grace | Running-state failure triggers replacement despite remaining grace. |
| S026 | Brief EC2 status impairment versus insufficient data | Do not mark every single bad or absent sample as immediate replacement. |
| S027 | EBS health fails while CPU looks normal | Enabled storage health supplies the replacement reason. |
| S028 | One of several attached target groups is unhealthy | Inspect source-specific health and why it affects the group; include a misconfigured auxiliary group variant. |
| S029 | EC2 application check impaired / excluded / suppressed | Only the applicable aggregated impaired status drives the application-check replacement path. |
| S030 | Shared dependency makes every app fail health | Show guarded replacement progress and continuing outage; replacement alone does not repair the dependency. |

Sources: [health mechanisms](https://docs.aws.amazon.com/autoscaling/ec2/userguide/health-checks-overview.html), [application checks](https://docs.aws.amazon.com/autoscaling/ec2/userguide/use-application-status-checks-auto-scaling-group.html), [grace](https://docs.aws.amazon.com/autoscaling/ec2/userguide/health-check-grace-period.html).

### Target tracking, metrics, and workers — K06; V05, V07

| ID | Scenario | Expected observable result |
|---|---|---|
| S031 | Sustained utilization rise | Policy proposes more capacity; ready capacity arrives after fixture delays. |
| S032 | Second demand increase while new instances warm | Explain already requested capacity and why additional capacity may still be required. |
| S033 | Utilization falls during warmup | Policy-driven scale-in waits; do not generalize the wait to every manual action. |
| S034 | Two target policies disagree | An out request can expand; in requires the applicable policy agreement. |
| S035 | Disable scale-in on one policy | Show its changed participation and continuing possible scale-out. |
| S036 | Custom metric disappears | Display missing data, not artificial zero demand and scale-to-zero. |
| S037 | Raw queue length or latency used as utilization | Explain why the signal may not scale inversely with capacity; offer normalized backlog comparison. |
| S038 | Wrong metric dimension/resource label | Identify wrong/missing series before changing policy aggressiveness. |
| S039 | Queue receives work at zero workers | Compare absent wake-up with an independent queue-based bootstrap trigger; handle zero denominator. |
| S040 | Long job interrupted before acknowledgment | Work returns/retries according to the queue fixture; ASG does not guarantee exactly-once processing. |

Sources: [target tracking](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html), [custom metrics](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CustomizedMetricSpecification.html), [SQS example](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-using-sqs-queue.html).

### Steps, schedules, and forecasts — K07–K08; V06, V08

| ID | Scenario | Expected observable result |
|---|---|---|
| S041 | Metric exactly on each positive/negative step boundary | Match the correct inclusive/exclusive interval and show arithmetic. |
| S042 | Percent adjustment yields ±0.4 or ±3.7 | Apply documented rounding, then minimum magnitude; show both signs. |
| S043 | Repeated same-step breach during warmup | Do not repeatedly add the already requested batch; a larger breach has its own calculation. |
| S044 | Simple policy retriggers during cooldown | Show waiting, then a schedule or unhealthy-replacement path using its own rules. |
| S045 | Schedule crosses a daylight-saving change | Local recurrence and UTC instant remain inspectable; include nonexistent/repeated-hour behavior as source-verified variants. |
| S046 | Schedule expires, overlaps another, or was suspended | Expiry does not revert sizes; same-time ordering is not invented; past suspended actions are not replayed. |
| S047 | Forecast-only with fewer than 24 hours of history | No usable forecast-backed scaling action is invented. |
| S048 | Regular morning load with forecast-and-scale | Show buffer-driven prelaunch, then dynamic response to forecast error. |
| S049 | Forecast exceeds configured maximum | Compare honoring max versus increasing it with buffer; raised max remains raised. |
| S050 | Forecast workload efficiency or instance mix changes | The same historical load can produce a misleading capacity estimate; compare assumptions. |

Sources: [steps](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-simple-step.html), [schedules](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-scheduled-scaling.html), [forecast mechanics](https://docs.aws.amazon.com/autoscaling/ec2/userguide/predictive-scaling-policy-overview.html).

### Warm pools — K09; V09

| ID | Scenario | Expected observable result |
|---|---|---|
| S051 | Cold versus stopped warm start | Avoid repeated first initialization; retain nonzero restart/readiness time. |
| S052 | Running versus hibernated residence | Show runtime cost exposure versus memory persistence and resume work. |
| S053 | Change group desired with default pool sizing | Pool target follows the prepared-capacity relationship, independently of actual population. |
| S054 | Desired exceeds custom prepared target with pool minimum | Minimum pool target remains visible; prepared target is not a universal hard fleet cap. |
| S055 | Pool exhausted by a spike | Cold launches satisfy remaining supported demand if capacity/configuration permits. |
| S056 | Long user data without preparation hook | Pool stop interrupts preparation; later service entry is not shown as proof bootstrap finished. |
| S057 | Same launch hook during preparation and service entry | Show the two contexts and independent actions; application logic distinguishes the destination. |
| S058 | Reuse on scale-in enabled | Instance returns through warm preparation; cleanup and stale application state remain visible. |
| S059 | Hibernation-ineligible old instance returned to pool | Show the documented stopped fallback rather than preserved RAM. |
| S060 | AMI updated while pool contains old instances | Old pool instances persist until applicable refresh/replacement; active refresh phase precedes pool phase. |

Sources: [warm pools](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-warm-pools.html), [pool lifecycle](https://docs.aws.amazon.com/autoscaling/ec2/userguide/warm-pool-instance-lifecycle.html).

### Mixed types and allocation — K03–K05; V11

| ID | Scenario | Expected observable result |
|---|---|---|
| S061 | Desired ten units, only weight-four instances eligible | Three instances provide twelve units; count and units disagree visibly. |
| S062 | Weighted surplus exceeds a small decrement | Explain why the requested decrement need not remove an instance. |
| S063 | Weighted On-Demand base and percentage | Capacity-unit split differs from instance-count ratio. |
| S064 | Preferred On-Demand type unavailable | Eligible lower-priority type can fill remaining demand. |
| S065 | Compare all four Spot allocation strategies | Same fixture inventory exposes each documented preference; no fabricated real AWS scores. |
| S066 | Tight Spot price ceiling | Launches fail or become constrained; low ceiling is not guaranteed savings. |
| S067 | Attribute filters produce no matching type | Show the successive exclusions and the first useful relaxation. |
| S068 | AMI/type architecture mismatch across overrides | Reject/fail the incompatible launch; manufacturer filter alone does not repair it. |
| S069 | API omission versus explicit allocation defaults | Show effective strategy and distinguish the API default from the recommended choice. |
| S070 | Configure incompatible weighting/Spot/warm-pool/attribute options | Prevent impossible simulation and link the specific restriction. |

Sources: [overrides](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_LaunchTemplateOverrides.html), [requirements](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstanceRequirements.html), [allocation](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_InstancesDistribution.html).

### Zones and reservations — K01, K05; V10, V13, V18

| ID | Scenario | Expected observable result |
|---|---|---|
| S071 | One AZ cannot launch | Compare best-effort fallback with balanced-only continuing to target the constrained AZ. |
| S072 | AZ recovers after fallback | Rebalance can launch there and terminate a healthy instance elsewhere. |
| S073 | AZRebalance suspended during scale-out | No proactive redistribution, but new scaling placement still considers zone balance. |
| S074 | Subnet addresses exhausted, EC2 inventory available | Failure is subnet capacity, not Spot availability or policy threshold. |
| S075 | Reservations concentrated in one zone | Reservation-first strategy prioritizes consumption over equal zonal counts. |
| S076 | Reservation-only versus reservation-first | Exhaustion causes failure or On-Demand fallback, respectively. |
| S077 | Distribution segment capacity exhausted | Advance through ordered eligible capacity types; optional final On-Demand changes the outcome. |
| S078 | Scale in after segment order/type change | Reverse capacity priority and removed-type handling appear in candidate selection. |
| S079 | Zonal shift with ignore versus replace unhealthy | Show different impaired-zone health handling and healthy-zone placement. |
| S080 | Zonal shift with inadequate surviving capacity | Shift does not create headroom; show workload deficit and blocked dynamic scale-in. |

Sources: [AZ strategies](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-availability-zone-balanced.html), [reservation settings](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CapacityReservationSpecification.html), [segments](https://docs.aws.amazon.com/autoscaling/ec2/userguide/use-distribution-segments.html), [zonal shift](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-zonal-shift.html).

### Interruption and draining — K02, K09; V12, V16

| ID | Scenario | Expected observable result |
|---|---|---|
| S081 | Early rebalance recommendation, healthy replacement | Replacement becomes eligible before the old instance is drained/removed. |
| S082 | Recommendation arrives with interruption notice | Proactive lead time disappears; the independent deadline remains. |
| S083 | Replacement cannot launch before interruption | Serving capacity drops; replacement retries do not postpone reclamation. |
| S084 | Replacement launches but fails health | Old instance can still be interrupted before a usable replacement exists. |
| S085 | Several correlated Spot interruptions | Capacity loss can exceed the planned maintenance floor. |
| S086 | Draining plus hook exceeds interruption time | Forced event can arrive before application cleanup completes. |
| S087 | Scale-in protection on interrupted instance | Protection does not block EC2 reclamation. |
| S088 | Capacity Rebalancing near maximum | Show its documented temporary allowance with desired-capacity denominator. |
| S089 | Replacement candidate offers worse interruption availability | Do not depict every recommendation as guaranteed immediate replacement. |
| S090 | Capacity Block ends / interruptible reservation reclaimed | Use the reservation-specific event fixture and source; scale-in protection is not a reservation extension. |

Sources: [Capacity Rebalancing](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-capacity-rebalancing.html), [protection exclusions](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-instance-protection.html), [capacity-type distinctions](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_DistributionSegment.html).

### Maintenance and refresh — K10; V14–V15

| ID | Scenario | Expected observable result |
|---|---|---|
| S091 | Healthy rolling refresh with 100/150 bounds | Old cohort remains until new capacity meets the applicable readiness condition. |
| S092 | One-instance group, omitted versus explicit maximum 100 | Show the documented difference in fallback replacement ordering. |
| S093 | Bad AMI with no launchable replacement | Progress waits/fails according to observed rules; no instant successful rollout. |
| S094 | Bad application passes shallow target health | Capacity floor alone misses the bug; an application alarm can detect it. |
| S095 | Checkpoint followed by final bake time | Checkpoint delay and bake are different waits with different start events. |
| S096 | Protected/standby instance under each refresh preference | Wait/ignore/replace behavior follows the selected preference, including intervention expiry. |
| S097 | Skip matching with manually modified filesystem | Configuration match can skip an instance whose application contents differ. |
| S098 | Cancel versus rollback, and rollback launch failure | Cancellation preserves mixed cohorts; rollback is another fallible operation. |
| S099 | Root-volume replacement with pre/post hooks | Identity persists; root changes; deregistration/reboot/readiness are visible. |
| S100 | Root-volume replacement fails or is incompatible | Failed replacement can lead to full replacement; invalid configuration is rejected before an invented happy path. |

Sources: [refresh flow](https://docs.aws.amazon.com/autoscaling/ec2/userguide/instance-refresh-overview.html), [preferences](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_RefreshPreferences.html), [cancel](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CancelInstanceRefresh.html), [root replacement](https://docs.aws.amazon.com/autoscaling/ec2/userguide/replace-root-volume.html).

### Instance operations and safeguards — K09–K11; V16–V18

| ID | Scenario | Expected observable result |
|---|---|---|
| S101 | All active instances protected during scale-in | Desired decreases; termination cannot converge until eligibility changes. |
| S102 | Newest instance is in the overfull AZ | An oldest-instance preference is applied within the eligible placement context, not globally. |
| S103 | Custom termination Lambda returns none/errors/times out | No ordinary candidate is selected; retries and refresh failure behavior are explained. |
| S104 | Termination action abandoned with retention enabled | Instance is retained outside desired capacity and still incurs applicable charges. |
| S105 | Retained instance manually resolved | Explicit ASG termination removes the retained resource; explain active desired separately. |
| S106 | Standby with and without desired decrement | Compare replacement need, continued membership, and later return increment/bounds. |
| S107 | Detach and reattach a protected instance | Membership and protection inheritance change; instance identity persists. |
| S108 | Explicit launch partially succeeds, caller retries | Preserve successful IDs, account for failed capacity, and exercise token reuse/mismatch. |
| S109 | Resume AddToLoadBalancer after missed launches | Newly resumed behavior does not backfill missed registrations; repair is explicit. |
| S110 | Attempt group deletion at each protection level | Rejection or deletion follows protection/force mode; force bypasses termination hooks when allowed. |

Required extensions to this group: lifetime rotation with and without scale-in protection; several overdue instances when lifetime is shortened; custom Lambda returning more candidates than needed; and direct EC2 termination protection contrasted with explicit ASG termination. A failed/empty custom policy is not a license to select an arbitrary healthy instance. For refresh, persistent inability to select through the custom policy has a documented one-hour failure window. [Lifetime behavior](https://docs.aws.amazon.com/autoscaling/ec2/userguide/asg-max-instance-lifetime.html), [custom termination selection](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lambda-custom-termination-policy.html)

Sources: [protection](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-instance-protection.html), [custom selection](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lambda-custom-termination-policy.html), [retention](https://docs.aws.amazon.com/autoscaling/ec2/userguide/instance-lifecycle-policy.html), [suspension effects](https://docs.aws.amazon.com/autoscaling/ec2/userguide/understand-how-suspending-processes-affects-other-processes.html), [explicit launch](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_LaunchInstances.html), [deletion safeguards](https://docs.aws.amazon.com/autoscaling/ec2/userguide/resource-deletion-protection.html).

### Diagnosis and compound incidents — all families; V19–V20

| ID | Scenario | Expected observable result |
|---|---|---|
| S111 | Missing AMI, invalid profile, KMS denial, or subnet exhaustion | Failure variants stop at their distinct stages and present the relevant evidence/recovery. |
| S112 | Launch suspended while unhealthy replacement remains active | Existing unhealthy instances can be removed without replacement launches; resume restores the launch path. |
| S113 | Terminate suspended during AZ rebalance | Additional capacity can remain above the ordinary envelope until termination resumes. |
| S114 | Long-term failures cause administrative suspension | Fixing the original issue and resuming the suspended process are separate recovery steps. |
| S115 | Traffic spike while refresh has pending replacements | Capacity requests, warmup, and rollout readiness interact without double-counting new instances. |
| S116 | Schedule lowers maximum during refresh | Desired-capacity update and replacement planning use their respective rules; expose interrupted progress. |
| S117 | AZ impairment during Spot replacement | Destination constraints and forced deadline can jointly reduce serving capacity. |
| S118 | Warm pool depleted, current AMI broken | Warm capacity initially helps, then cold launches expose the new configuration failure. |
| S119 | Queue backlog falls while every worker holds protection | Requested scale-in remains unfulfilled until jobs finish and protection is released; retained failures add cost exposure. |
| S120 | Reservation expiry with no eligible fallback | Capacity disappears despite nominal desired size; remaining inventory and constraints determine recovery. |

### Boundary and cross-feature coverage beyond the named fixtures

Apply this expansion to every applicable setting; these are additional acceptance obligations:

- **Presence:** omitted, explicit default, explicit zero/false, changed value, and documented clear/reset form.
- **Numbers:** below minimum, exact minimum, one inside, exact maximum, above maximum; fractional input where integers are required; dimensional mismatch.
- **Collections:** empty, one, several, duplicate, maximum supported length, and overflow; stable order versus unordered membership.
- **Identity:** missing/deleted resource, wrong Region/account/AZ/VPC, wrong resource type, denied permission, expired or inaccessible reference.
- **Timing:** before trigger, exactly at boundary, just after expiry, repeated event, late evidence, concurrent update, and operation completion during cancellation.
- **Capacity:** zero, one, smaller than a batch, equal to a bound, weighted overage, all eligible instances unavailable/protected, and no spare placement capacity.
- **Recovery:** transient failure resolves; failure persists; fallback succeeds; fallback fails; manual intervention succeeds; resumption has backlog or missed events.
- **Mutation:** effect on existing instances, future instances, pending actions, and already-resolved template versions.
- **Observability:** available, delayed, absent, inconsistent, and paginated evidence; the UI must disclose uncertainty rather than fill gaps with an invented event.

For supported pairs sharing a decision, create pairwise fixtures. For high-risk triples, require explicit fixtures: refresh × warmup × scale-out; lifecycle × interruption × draining; protection × scale-in × retention; AZ policy × reservation distribution × capacity shortage; warm pool × template update × depletion. Invalid pairs belong in the compatibility matrix and must never enter a fake operational state.

## 9. Worked animation storyboards

All timestamps and workloads below are illustrative fixture values. They establish an implementation-ready narrative; they are not AWS timing guarantees.

### T01 — An instance can serve traffic while it is still warming

Fixture: desired 2 → 3 through a manual capacity change; launch hook enabled; grace 120 seconds; default warmup 180 seconds; the two original instances are serving. The new instance is `i-new`.

| Simulated time | Visible event | Capacity/readiness annotation |
|---|---|---|
| 00:00 | Desired becomes 3; launch begins | Desired 3; old serving 2; new launch is not usable capacity. |
| 00:30 | `i-new` enters `Pending:Wait` | Application initialization proceeds; grace/warmup have not begun. |
| 01:30 | Bootstrap completes; hook receives `CONTINUE` | The transition is released; registration is a separate event. |
| 01:35 | Registration and `InService` entry | ASG in-service count becomes 3; grace and warmup bars start. |
| 01:45 | Target/application readiness succeeds | Serving count becomes 3; new instance still warming. |
| 03:35 | Grace expires | Startup-health protection ends; warmup still has 60 seconds. |
| 04:35 | Warmup expires | Mark the new instance eligible for the relevant aggregate/replacement calculation. |

Comparison: set grace to 600 while keeping warmup 180, then reverse the values. The bars change independently. Stop `i-new` at 02:00 to expose the EC2 running-state exception. The caption should explain one relationship: “Traffic readiness, startup health protection, and scaling warmup answer different questions.”

### T02 — Why another alarm breach does not always add another batch

Fixture: ten ready homogeneous instances; desired ten; step scale-out threshold 60; `[0,10)` adds 10%, `[10,+∞)` adds 30%; min/max 1/30; warmup 180 seconds.

| Event | Calculation | Visible result |
|---|---|---|
| Metric 60 breaches | 10% of ready baseline 10 = 1 | Desired 11; one addition pending/warming. |
| Metric 62 while that addition warms | Same step still indicates one above the ready baseline | Desired remains 11; do not add a second identical batch. |
| Metric 70 before warmup finishes | 30% of baseline 10 = 3 | Desired 13; two further additions supply the remaining difference. |
| New instances finish warming | Ready baseline can advance | Subsequent calculations use the applicable updated capacity. |

Keep this exact arithmetic in the step-scaling lab. Do not transfer it into target tracking as an alleged implementation of the adaptive controller. [Documented step example](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-simple-step.html)

### T03 — Drain plus cleanup does not extend a Spot deadline

Fixture: one at-risk Spot worker, alternative capacity unavailable, 120-second interruption notice; configured target draining takes 90 seconds; termination cleanup requires another 60 seconds.

| Time | Visible event | Consequence |
|---|---|---|
| 00:00 | Recommendation and interruption notice arrive together | No earlier recommendation head start; forced deadline shown at 02:00. |
| 00:00 onward | Replacement attempts fail | Desired remains unmet by usable replacement capacity. |
| 00:00–01:30 | Ordinary removal/draining path progresses where applicable | Existing requests have their own drain behavior. |
| 01:30 | Cleanup hook starts in this fixture | It needs 60 seconds, but only 30 remain before forced reclamation. |
| 02:00 | Spot interruption occurs | Instance vanishes before cleanup completes; hooks and protection do not postpone it. |

The animation must also support a valid alternative event ordering when interruption overtakes deregistration itself. A successful comparison provides earlier recommendation plus launch capacity; it does not lengthen the forced deadline. [Interruption interaction](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-capacity-rebalancing.html)

### T04 — A safe-looking refresh that cannot make progress

Fixture: four old instances serving; desired four; refresh min 100/max 150; numeric template v2; all new launches fail due to an invalid image; no forced external loss.

| Phase | Visual | Explanation |
|---|---|---|
| Plan | Four old cards and two potential overlap slots | The chosen percentage envelope permits overlapping replacements in this fixture. |
| Launch attempt | A failed attempt marker, not a new instance card | EC2 has not supplied a healthy replacement. |
| Wait/retry | Old serving cards remain | The readiness floor blocks intended old-instance removal. |
| Failure outcome | Refresh failure/reason shown from the fixture's documented failure path | Do not invent an exact universal timeout for every launch error. |
| Correct/recover | Choose valid configuration and applicable retry/rollback path | Recovery is another sequence; it is not immediate restoration. |

Comparison: make v2 boot successfully but fail an application-only request test while shallow health succeeds. The visual must show why health percentages alone do not detect this defect; add a relevant refresh alarm.

### T05 — Retention preserves cleanup work, not active capacity

Fixture: desired four; all four serve; scale-in sets desired three; selected instance drains; termination hook cleanup fails.

| Branch | Visible result |
|---|---|
| Trigger disabled / `terminate` | The abandoned termination action permits removal. |
| Trigger `retain` | The selected instance enters `Terminating:Retained`; three active instances satisfy desired three; retained resource is displayed separately. |
| Same retention failure during health replacement at desired four | Retained instance does not satisfy desired; a replacement is needed to restore four active instances. |
| Manual resolution | Cleanup can finish outside the failed hook; explicit termination removes the retained instance. |

Do not relaunch an extra instance simply because a scale-in termination became retained when the remaining active fleet already meets the reduced desired capacity. [Retention mechanics](https://docs.aws.amazon.com/autoscaling/ec2/userguide/instance-lifecycle-policy.html)

### T06 — Prepared capacity is not the same as pool size

Fixture: unweighted On-Demand group; max 12; desired 6; no custom prepared target; pool minimum 0.

| Action | Active desired | Pool target | Explanation |
|---|---:|---:|---|
| Create pool | 6 | 6 | Default preparation target derives from maximum minus desired. |
| Scale out to 10 | 10 | 2 | Warm instances move toward service; target pool size shrinks. |
| Set custom prepared target to 11 | 10 | 1 | Prepared target includes active desired plus target reserve in this fixture. |
| Set pool minimum to 3 | 10 | 3 | Pool minimum is an independent lower bound. |
| Raise desired to 12 | 12 | 3 | Minimum reserve persists even above the custom prepared target. |
| Enable reuse; scale desired down to 8 | 8 | 3 | Return eligible instances, then reconcile pool excess; do not retain every returned instance forever. |

Every row is a target; the actual pool can still be preparing or resource-constrained. [Pool sizing](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutWarmPool.html)

## 10. Choosing settings for a workload

These starting points are scenario presets, with editable assumptions. The visual must connect each choice to a workload need and show when that choice stops helping.

| Workload | Starting mechanism | Measurements and operational decisions |
|---|---|---|
| Stateless web/API | Target tracking on a validated utilization/per-target throughput signal; multiple AZs; meaningful application health | Measure startup and saturation; separate health grace from warmup; choose max with subnet/quota headroom; drain realistic request durations. |
| Queue workers | Backlog per worker, plus an independent wake-up path when zero capacity is allowed | Measure service time/queue-delay objective; coordinate protection with job acquisition/release; make retries safe. |
| Predictable business hours | Compare scheduled sizing and forecast-only predictive policy, then dynamic correction | Verify local scheduling/time zones or forecast accuracy; prelaunch with measured startup lead. |
| Slow first initialization | Warm pool and preparation/service-entry hooks where supported | Measure first initialization versus restart; choose stopped/hibernated/running based on latency and resource cost; exercise pool depletion. |
| Interruption-tolerant batch | Diverse eligible types/AZs, capacity-aware Spot allocation, appropriate On-Demand base | Checkpoint application work; measure recovery and interruption exposure; do not rely on a hook to preserve an instance indefinitely. |
| GPU or scarce capacity | Explicit eligibility, reservations/Capacity Blocks where appropriate, distribution/fallback controls | Compare reservation utilization with zonal distribution; define behavior when the reservation window ends or fallback is unaffordable/unavailable. |
| Stateful worker | Externalized durable state where practical, job ownership, safe drain, protection/retention as appropriate | Replacing EC2 is not database failover or consensus membership management; application coordination remains visible. |
| ECS/EKS-backed group | Show external controller ownership and its interaction with ASG capacity | A second controller can rewrite desired capacity or manage draining. Do not recommend independent policies without showing the competing ownership. |

The last preset is an integration boundary comparison, not a full container-autoscaling tutorial. Warm-pool readiness must account for premature ECS/EKS registration and scheduling. ECS's managed draining should be shown as the responsible component when used, not attributed to ASG itself. [Warm-pool integration caveats](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-warm-pools.html), [ECS managed draining](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/managed-instance-draining.html)

### Operational decision prompts

Every preset should help answer: What signal represents demand? How long until added capacity does useful work? What survives losing an instance? How much capacity can the remaining AZs carry? Which controller owns desired capacity? What is the fallback if EC2 cannot launch? What evidence shows replacement is safe? What happens if cleanup never finishes? What continues to incur charges after active capacity falls?

## 11. Accessibility, responsive layout, and static content

- Every diagram has a readable initial state, meaningful caption, and ordered textual trace that communicates the mechanism without animation.
- All controls work with keyboard input, have visible focus and explicit labels, and expose units and validation messages. Dragging always has a button/input alternative.
- Pause is always available. No understanding depends on reacting before an animation finishes. The default does not autoplay a destructive cascade.
- Reduced motion replaces movement with immediate state changes and highlighted differences; manual stepping retains the full explanation.
- Screen readers receive concise event summaries on explicit steps, not announcements on every animation frame. Full traces remain available as ordinary text.
- Mobile stacks the fleet, controls, and explanation; deep state graphs offer a focused path view plus safe scrolling. Do not shrink all labels until they become unreadable.
- Color is reinforced by state text, icon, pattern, or connector style. Abbreviations and units have definitions.
- Section/scenario deep links survive refresh and back/forward navigation. The selected configuration is understandable without relying on a hidden interaction history.
- The setting reference and source links remain readable if interactive enhancement fails. Core explanations are not trapped inside tooltips.
- No accounts, server state, behavioral analytics, quiz scores, badges, or saved progress are introduced.

## 12. Acceptance and editorial review

### Coverage gates

1. All 20 labs have their baseline diagram, meaningful controls, failure branch, textual trace, parameter links, and primary references.
2. All 120 named scenarios have reproducible inputs and expected observable outcomes. Every fixture references setting families and governing rules.
3. Each documented ASG request field and nested leaf is assigned a reference entry. Reserved/deprecated/transport-only fields are explicitly classified. A bare API link is not a substitute for explaining a learner-relevant setting.
4. Each adjustable setting has a normal example and the applicable presence/numeric/identity/timing boundary cases from section 8.
5. Every known incompatible combination has a prevented transition and an explanation. Supported unusual combinations have a reachable fixture.
6. Lifecycle vocabulary reconciles with the current API; transitions reconcile with operation-specific guides. Unused states have no invented transitions.
7. Default values identify API versus console, and omission versus explicit default where behavior differs.
8. Unresolved documentation conflicts are constrained and disclosed in the affected reference; no guessed AWS behavior is animated as fact.

### Simulation invariants

- A capacity-unit change never silently changes an instance count.
- EC2 running, ASG in-service, application-ready, and warmup-complete remain independently observable.
- ASG replacement does not move an existing instance into another AZ.
- A failed launch with no instance ID contributes no instance capacity.
- A completed/expired lifecycle action cannot be revived by an old token.
- Grace does not hide EC2 stop/termination from the documented running-state check.
- Policy warmup does not erase raw metric history.
- Missing data is never silently replaced with zero demand.
- A retained instance is not counted toward desired capacity; it can still incur charges.
- Spot reclamation can overtake drain, hooks, protection, and maintenance floor.
- Cancelling refresh does not automatically restore old instances.
- Updating a template does not update the already launched fleet in place.
- A configured percentage is not a guarantee that scarce capacity exists.
- Forecast-only produces no forecast-driven capacity mutation.
- Group deletion protection is not modeled as protection against individual scaling operations.

### Content and interaction checks

Review each mechanism against its primary sources, check internal/deep/source links, validate topic metadata, and apply the site's publication gates when the page is implemented. Verify keyboard operation, reduced motion, representative desktop/mobile layouts, and readable static output. Use automated assertions for simulator state and consequential arithmetic, plus representative browser traces. Do not claim tests of this specification are tests of live AWS behavior.

The specification itself is complete when it defines scope, all labs, parameter families, scenario outcomes, state/timer rules, and publication criteria. The published simulator is complete only when the field-level reconciliation and these acceptance gates pass. Do not market this draft as a formally verified emulator of every ASG behavior.

## 13. Source reconciliation notes and publication metadata

The research found specific inconsistencies worth preserving for implementers:

| Topic | Observed documentation issue | Specification decision |
|---|---|---|
| Root-volume replacement | Introductory guide language suggests continuing application execution, while the same guide describes shutdown/reboot hooks and lifecycle deregistration. | Show identity preservation and readiness interruption; do not promise uninterrupted application execution. |
| Hook timeout default | A lifecycle overview illustrates timeout continuing, while `PutLifecycleHook` documents default `ABANDON`. | API fixtures use the configured/API default result; no unconditional timeout-to-success arrow. |
| Predictive prelaunch | Broad guide describes hourly behavior; API documents a 300-second default scheduling buffer. | Explicitly show the API default and the effective configured value. |
| Metrics for retained states | Metrics guide includes retained-state metrics not uniformly listed in the selection API. | Include observable retained capacity; verify selectable metric names against the supported service surface before publication. |
| Direct Lambda lifecycle notification | Hook API prose emphasizes SNS/SQS while the notification guide documents direct Lambda invocation. | Include direct Lambda and EventBridge-routed Lambda as distinct supported notification paths, with their own permission setup. |
| Synchronous launch with warm pool | Guide says unsupported but also mentions cold-start behavior alongside an error. | Do not simulate a guaranteed side-effect-free failure or guaranteed warm reuse; label the combination unsupported and require state inspection. |
| Reservation preference vocabulary | Introductory API prose mentions `open`, while the ASG field's valid enum is `default`/`none`/reservation-first/reservation-only. | Keep ASG and EC2 launch-template preference enums distinct; do not insert `open` into the ASG selector. |
| Cooldown start during ELB scale-in | Broad guide wording waits for deregistration, while the lifecycle-hook subsection explicitly permits overlap beginning at drain start. | Distinguish the specific path; do not teach a universal sum of drain + hook + cooldown. |

Sources: [root replacement](https://docs.aws.amazon.com/autoscaling/ec2/userguide/replace-root-volume.html), [hook API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PutLifecycleHook.html), [predictive API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_PredictiveScalingConfiguration.html), [metrics API](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_EnableMetricsCollection.html), [notification targets](https://docs.aws.amazon.com/autoscaling/ec2/userguide/prepare-for-lifecycle-notifications.html), [synchronous launches](https://docs.aws.amazon.com/autoscaling/ec2/userguide/launch-instances-synchronously), [ASG reservation shape](https://docs.aws.amazon.com/autoscaling/ec2/APIReference/API_CapacityReservationSpecification.html).

This file's research date is not a publication date. Set published and last-reviewed dates when the topic is actually reviewed and published. Region/account availability and connected-service limits should be checked at that review; do not imply every feature is available in every partition because an API field exists.

All primary references are linked next to their claims and register families. The published page should collect those same references into its Sources section without maintaining a competing research/outline document. Any substantial new research belongs in this specification until the canonical authored topic replaces it as the content source.
