export type Tone = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'muted';

export interface LabNode {
  label: string;
  detail: string;
  tone: Tone;
}

export interface LabScenario {
  label: string;
  summary: string;
  nodes: LabNode[];
  result: string;
  evidence: string;
  setting: string;
}

export interface Lab {
  id: string;
  nav: string;
  title: string;
  question: string;
  kind: 'fleet' | 'flow' | 'timeline' | 'signals' | 'allocation';
  scenarios: LabScenario[];
}

const n = (label: string, detail: string, tone: Tone = 'cyan'): LabNode => ({ label, detail, tone });

export const labs: Lab[] = [
  {
    id: 'v01', nav: 'Fleet', title: 'Desired capacity and the fleet', kind: 'fleet',
    question: 'Why can desired, present, and serving capacity disagree?',
    scenarios: [
      { label: 'Scale from 6 to 8', summary: 'The request changes immediately. Instances and usable capacity arrive later.', nodes: [n('Desired 8', 'Target tracking requests +2', 'purple'), n('Present 6', 'Two launch attempts started', 'amber'), n('In service 6', 'Existing ASG members', 'cyan'), n('Serving 6', 'Healthy registered targets', 'green')], result: 'Capacity gap: 2. The group is fulfilling the new desired capacity.', evidence: 'Activity history shows two launches in progress.', setting: 'AutoScalingGroup.DesiredCapacity = 8' },
      { label: 'Launches blocked', summary: 'A failed launch does not become an instance, and the unmet request remains.', nodes: [n('Desired 8', 'Target remains unchanged', 'purple'), n('Attempts 2', 'No instance IDs returned', 'red'), n('Present 6', 'No new EC2 capacity', 'amber'), n('Serving 6', 'Existing targets continue', 'green')], result: 'Capacity gap: 2. Subnet addresses are exhausted in every eligible destination.', evidence: 'Scaling activity: Failed · insufficient free addresses.', setting: 'VPCZoneIdentifier → three configured subnets' },
      { label: 'Unhealthy member', summary: 'Replacement restores the target even when no scaling policy asks for more capacity.', nodes: [n('Desired 6', 'Requested size is unchanged', 'purple'), n('Unhealthy 1', 'ASG accepted the health result', 'red'), n('Replacement', 'Pending in another AZ', 'amber'), n('Serving 5', 'Readiness trails presence', 'amber')], result: 'The health path requested replacement. This is not a scale-out policy decision.', evidence: 'Instance health reason identifies the failing target.', setting: 'HealthCheckType = EC2,ELB' },
    ],
  },
  {
    id: 'v02', nav: 'Lifecycle', title: 'Instance lifecycle and hook delivery', kind: 'flow',
    question: 'What does a lifecycle hook actually pause?',
    scenarios: [
      { label: 'Launch hook completes', summary: 'The hook holds the ASG transition while a worker prepares the instance.', nodes: [n('Pending', 'EC2 launch accepted'), n('Pending:Wait', 'Hook token is active', 'amber'), n('Worker', 'Domain join completed', 'purple'), n('Pending:Proceed', 'CONTINUE received'), n('InService', 'Eligible for registration', 'green')], result: 'The worker completed the action once, then addressed the current hook token.', evidence: 'Delivery and lifecycle completion are separate events.', setting: 'LifecycleHookSpecificationList[].HeartbeatTimeout' },
      { label: 'Duplicate delivery', summary: 'At-least-once notification delivery must not repeat application work.', nodes: [n('Pending:Wait', 'One open action', 'amber'), n('Message 1', 'Worker claims task', 'purple'), n('Message 2', 'Duplicate is detected', 'amber'), n('CONTINUE', 'One completion call', 'green')], result: 'The second notification is acknowledged without repeating the domain join.', evidence: 'Idempotency record matches the lifecycle action token.', setting: 'CompleteLifecycleAction.LifecycleActionToken' },
      { label: 'Termination retained', summary: 'A failed termination action can retain the EC2 instance outside active capacity.', nodes: [n('Deregister', 'Target starts draining'), n('Terminating:Wait', 'Cleanup hook is active', 'amber'), n('ABANDON', 'Cleanup failed', 'red'), n('Retained', 'Outside desired capacity', 'amber')], result: 'The group can launch replacement capacity; the retained instance still incurs cost.', evidence: 'Retention trigger applies to the abandoned termination action.', setting: 'InstanceLifecyclePolicy.RetentionTriggers.TerminateHookAbandon = retain' },
    ],
  },
  {
    id: 'v03', nav: 'Timing', title: 'The clocks people confuse', kind: 'timeline',
    question: 'Which decision does each timer gate?',
    scenarios: [
      { label: 'Startup clocks overlap', summary: 'Health checks keep running while grace and warmup gate different consumers.', nodes: [n('Boot 0–55s', 'Operating system starts'), n('Hook 10–100s', 'ASG transition held', 'amber'), n('Grace 55–355s', 'Startup health action deferred', 'amber'), n('Warmup 100–280s', 'Scaling metric eligibility waits', 'purple'), n('Serving at 130s', 'Target readiness is separate', 'green')], result: 'The target can serve at 130 seconds while scaling calculations still exclude it.', evidence: 'Each bar begins at its documented trigger, not at page time zero.', setting: 'DefaultInstanceWarmup = 180; HealthCheckGracePeriod = 300' },
      { label: 'Stopped during grace', summary: 'Leaving EC2 running can cause immediate replacement despite the startup grace period.', nodes: [n('EC2 running', 'Grace begins'), n('Instance stopped', 'EC2 state changes', 'red'), n('Health action', 'Replacement requested immediately', 'purple')], result: 'Grace does not make a stopped instance healthy.', evidence: 'The EC2 lifecycle state is direct replacement evidence.', setting: 'HealthCheckGracePeriod = 300' },
    ],
  },
  {
    id: 'v04', nav: 'Health', title: 'Health is several signals', kind: 'signals',
    question: 'Which failing signal changes ASG health, routing, or both?',
    scenarios: [
      { label: 'Application fails', summary: 'The VM runs, but the target and aggregated application status fail.', nodes: [n('EC2 system', 'Passed', 'green'), n('EC2 instance', 'Passed', 'green'), n('Application', 'Failed', 'red'), n('Target group', 'Unhealthy', 'red'), n('ASG health', 'Replacement after grace', 'amber')], result: 'Routing stops using the target before the ASG necessarily replaces it.', evidence: 'Raw target reason and aggregated application status remain visible.', setting: 'HealthCheckType = EC2,ELB' },
      { label: 'Check excluded', summary: 'An excluded EC2 application check does not change the aggregated application status.', nodes: [n('EC2 system', 'Passed', 'green'), n('Application', 'Failed · excluded', 'amber'), n('Aggregation', 'Passed', 'green'), n('ASG health', 'Healthy', 'green')], result: 'The exclusion changes aggregation; it does not repair the application.', evidence: 'The raw failure stays inspectable beside the aggregate.', setting: 'EC2 application-status check exclusion' },
    ],
  },
  {
    id: 'v05', nav: 'Scaling', title: 'Target tracking and competing policies', kind: 'signals',
    question: 'How do several policies contribute to one capacity decision?',
    scenarios: [
      { label: 'Either policy scales out', summary: 'A scale-out recommendation can proceed when any target-tracking policy needs capacity.', nodes: [n('CPU 78 / 50%', '+3 proposed', 'purple'), n('Requests 920 / 800', '+1 proposed', 'purple'), n('Final request', '+3 capacity', 'cyan'), n('Warmup', 'New capacity excluded', 'amber')], result: 'The stronger scale-out proposal wins this fixture.', evidence: 'The panel shows each policy proposal without claiming AWS controller internals.', setting: 'TargetTrackingConfiguration.TargetValue' },
      { label: 'Scale-in disagreement', summary: 'Target-tracking policies with scale-in enabled must agree before capacity falls.', nodes: [n('CPU 22 / 50%', '−2 proposed', 'purple'), n('Requests 870 / 800', '+1 proposed', 'purple'), n('Final request', 'No scale-in', 'amber')], result: 'The requests policy blocks the CPU policy’s scale-in proposal.', evidence: 'Scale-in agreement is evaluated separately from other policy types.', setting: 'DisableScaleIn = false on both policies' },
    ],
  },
  {
    id: 'v06', nav: 'Steps', title: 'Step scaling and simple scaling', kind: 'timeline',
    question: 'Which breach interval applies, and what does cooldown or warmup block?',
    scenarios: [
      { label: 'Step boundary', summary: 'The metric is 23 points above the alarm threshold.', nodes: [n('0 to 10', '+1'), n('10 to 20', '+2'), n('20 or more', '+30%', 'purple'), n('10 instances', 'Raw result +3', 'cyan'), n('Desired 13', 'Request accepted', 'green')], result: 'The upper interval includes this 23-point breach; percent adjustment rounds to three.', evidence: 'Metric − threshold = 23.', setting: 'StepAdjustments[].MetricIntervalLowerBound = 20' },
      { label: 'Simple cooldown', summary: 'A repeated alarm breach waits for the policy cooldown; replacement does not use that gate.', nodes: [n('Alarm breach', '+2 accepted', 'purple'), n('Cooldown', '240s remaining', 'amber'), n('Health failure', 'Replacement proceeds', 'red'), n('Next breach', 'Simple action skipped', 'amber')], result: 'Cooldown gates this simple policy, not the entire group.', evidence: 'Activity history names the initiator for each action.', setting: 'ScalingPolicy.Cooldown = 300' },
    ],
  },
  {
    id: 'v07', nav: 'Workers', title: 'Queue workers and scaling from zero', kind: 'signals',
    question: 'How does backlog become a useful per-worker signal?',
    scenarios: [
      { label: 'Backlog target', summary: 'At two seconds per job and 60 seconds acceptable delay, the illustrative target is 30 messages per usable worker.', nodes: [n('Arrivals', '18 messages/s'), n('Visible backlog', '240'), n('Usable workers', '4', 'green'), n('Backlog / worker', '60', 'purple'), n('Target', '30 → scale out', 'amber')], result: 'The fixture needs more comparable workers; this is not an exact latency guarantee.', evidence: 'Service time and queue-delay assumptions are explicit.', setting: 'CustomizedMetricSpecification · backlog / usable workers' },
      { label: 'Zero workers', summary: 'Division by zero and absent CPU samples need an independent wake-up path.', nodes: [n('Visible backlog', '12', 'amber'), n('Usable workers', '0', 'red'), n('CPU metric', 'No samples', 'muted'), n('Wake-up alarm', 'Requests capacity 1', 'purple')], result: 'A separate queue-depth signal starts the fleet; missing data is not treated as zero.', evidence: 'The alarm shows insufficient data for CPU and breaching for queue depth.', setting: 'MinSize = 0; independent CloudWatch alarm' },
    ],
  },
  {
    id: 'v08', nav: 'Forecasting', title: 'Schedules and forecast-driven capacity', kind: 'timeline',
    question: 'Is capacity requested from a calendar, a forecast, or current demand?',
    scenarios: [
      { label: 'Business hours', summary: 'A recurring schedule raises the floor before the morning load.', nodes: [n('08:45 local', 'Schedule executes', 'purple'), n('Min 6', 'Desired clamps upward'), n('09:00 local', 'Traffic begins', 'amber'), n('Serving 6', 'Prepared fleet', 'green')], result: 'The IANA time zone determines the next occurrence, including DST rules.', evidence: 'The schedule and its next UTC execution are both shown.', setting: 'PutScheduledUpdateGroupAction.TimeZone' },
      { label: 'Forecast miss', summary: 'Predictive capacity arrives early, but dynamic scaling handles demand above the fixture forecast.', nodes: [n('History', '≥24h available'), n('Forecast', '8 instances', 'purple'), n('Prelaunch', 'Capacity requested early'), n('Actual demand', 'Needs 11', 'red'), n('Dynamic scale-out', '+3', 'amber')], result: 'Forecasts are fixture data; the visual does not invent AWS’s forecasting formula.', evidence: 'Predicted and actual series remain separate.', setting: 'PredictiveScalingConfiguration.Mode = ForecastAndScale' },
    ],
  },
  {
    id: 'v09', nav: 'Warm pools', title: 'Warm-pool preparation, reuse, and depletion', kind: 'flow',
    question: 'How much startup work did the pool remove, and what still remains?',
    scenarios: [
      { label: 'Reuse prepared instance', summary: 'The instance restarts from the pool, then finishes hooks and readiness.', nodes: [n('Warm pool', 'Stopped · prepared', 'cyan'), n('Restart', 'EC2 returns to running', 'amber'), n('Launch hook', 'Configuration check', 'amber'), n('Target ready', 'Registered and healthy', 'green'), n('InService', 'Serving capacity', 'green')], result: 'The pool avoids repeated initialization but does not make serving capacity instant.', evidence: 'Pool population and active desired capacity use separate ledgers.', setting: 'InstanceReusePolicy.ReuseOnScaleIn = true' },
      { label: 'Pool depleted', summary: 'Prepared capacity is consumed first; remaining demand falls back to cold launch.', nodes: [n('Demand +4', 'Scale-out request', 'purple'), n('Pool 2', 'Two restarts', 'cyan'), n('Cold launch 2', 'Full bootstrap required', 'amber'), n('Serving gap', 'Closes in stages', 'amber')], result: 'Actual pool population lagged its target, so two instances take the cold path.', evidence: 'WarmPoolDesiredCapacity differs from WarmPoolWarmedCapacity.', setting: 'MaxGroupPreparedCapacity − group desired' },
    ],
  },
  {
    id: 'v10', nav: 'Placement', title: 'Placement and Availability Zone recovery', kind: 'allocation',
    question: 'Which destinations are eligible, and why does placement retry elsewhere?',
    scenarios: [
      { label: 'Subnet exhausted', summary: 'One zone is eligible for the group but its selected subnet has no free addresses.', nodes: [n('us-east-1a', '2 instances · 18 IPs', 'green'), n('us-east-1b', '2 instances · 0 IPs', 'red'), n('us-east-1c', '2 instances · 11 IPs', 'green'), n('Retry 1c', 'Launch accepted', 'amber')], result: 'Balanced best effort uses another eligible zone, then can rebalance later.', evidence: 'Placement failure is distinct from instance-type capacity.', setting: 'CapacityDistributionStrategy = balanced-best-effort' },
      { label: 'Balanced only', summary: 'Strict distribution leaves demand unmet when the required zone cannot launch.', nodes: [n('Zone 1a', '2 units', 'green'), n('Zone 1b', '2 units', 'green'), n('Zone 1c', 'Blocked', 'red'), n('Capacity gap', '1 unit', 'amber')], result: 'The strategy preserves balance rather than placing the extra unit elsewhere.', evidence: 'The failed destination and next permitted attempt are visible.', setting: 'CapacityDistributionStrategy = balanced-only' },
    ],
  },
  {
    id: 'v11', nav: 'Mixed fleet', title: 'Mixed instances, weights, and attributes', kind: 'allocation',
    question: 'How do eligibility, purchase choice, and capacity units differ?',
    scenarios: [
      { label: 'Weighted overshoot', summary: 'Only weight-4 types are available for a desired capacity of 10 units.', nodes: [n('Requirements', '3 matching types', 'purple'), n('Available', 'Only c7i.2xlarge'), n('3 instances', '4 units each', 'cyan'), n('Delivered 12', '2-unit overshoot', 'amber')], result: 'Instance count is three while capacity is twelve units.', evidence: 'Candidate filtering happens before allocation preference.', setting: 'Overrides[].WeightedCapacity = "4"' },
      { label: 'Purchase split', summary: 'An unweighted fleet has desired 10, On-Demand base 2, then 25% On-Demand above base.', nodes: [n('Base', '2 On-Demand', 'green'), n('Above base', '8 units'), n('25%', '2 On-Demand', 'green'), n('Remainder', '6 Spot', 'amber')], result: 'The requested split is 4 On-Demand and 6 Spot before indivisible-instance effects.', evidence: 'Purchase split and AZ placement remain separate stages.', setting: 'OnDemandBaseCapacity = 2; OnDemandPercentageAboveBaseCapacity = 25' },
    ],
  },
  {
    id: 'v12', nav: 'Spot', title: 'Spot interruption and Capacity Rebalancing', kind: 'timeline',
    question: 'Can replacement become ready before the independent interruption deadline?',
    scenarios: [
      { label: 'Replacement ready', summary: 'A rebalance recommendation starts a proactive replacement.', nodes: [n('00:00', 'Recommendation', 'purple'), n('00:08', 'Replacement launch'), n('01:02', 'Target ready', 'green'), n('01:10', 'Drain old target', 'amber'), n('02:00', 'Forced deadline', 'red')], result: 'Serving capacity is restored before the at-risk instance disappears.', evidence: 'The forced deadline does not pause for hooks or protection.', setting: 'CapacityRebalance = true' },
      { label: 'No capacity', summary: 'The replacement attempt fails and the interruption still arrives.', nodes: [n('00:00', 'Recommendation', 'purple'), n('00:06', 'Spot launch fails', 'red'), n('00:40', 'On-Demand fallback absent', 'amber'), n('02:00', 'Instance reclaimed', 'red')], result: 'The group cannot restore capacity before interruption under this configuration.', evidence: 'The launch failure and interruption event have different actors.', setting: 'MixedInstancesPolicy.InstancesDistribution' },
    ],
  },
  {
    id: 'v13', nav: 'Reservations', title: 'Reservations and distribution segments', kind: 'allocation',
    question: 'Does preferred capacity fall through or leave demand unmet?',
    scenarios: [
      { label: 'Fallback allowed', summary: 'An empty preferred reservation segment falls through to On-Demand.', nodes: [n('Segment 1', 'Capacity Block expired', 'red'), n('Segment 2', 'Targeted reservation full', 'amber'), n('On-Demand', 'Fallback eligible', 'green'), n('Launch', 'Future instance only', 'cyan')], result: 'Existing instances do not migrate merely because launch preference changed.', evidence: 'Availability and reservation eligibility are shown separately.', setting: 'CapacityReservationPreference = open' },
      { label: 'No fallback', summary: 'The ordered segments contain no eligible available capacity.', nodes: [n('Segment 1', 'No remaining capacity', 'red'), n('Segment 2', 'Instance type ineligible', 'red'), n('Fallback', 'Disabled', 'muted'), n('Unmet demand', '2 units', 'amber')], result: 'The preferred constraint causes a capacity gap.', evidence: 'This is not modeled with Spot interruption timing.', setting: 'CapacityReservationSpecification' },
    ],
  },
  {
    id: 'v14', nav: 'Refresh', title: 'Maintenance policy and rolling refresh', kind: 'fleet',
    question: 'What floor, ceiling, and readiness gate let the next batch move?',
    scenarios: [
      { label: 'Safe rolling batch', summary: 'Desired 6, a 100% floor, and 150% ceiling permit three temporary replacements.', nodes: [n('Old cohort', '6 serving'), n('New cohort', '3 warming', 'amber'), n('Healthy floor', '6 required', 'green'), n('Overlap ceiling', '9 allowed', 'purple'), n('Next action', 'Wait for warmup', 'amber')], result: 'Target health alone does not complete the batch; refresh warmup is still running.', evidence: 'Batch selection and wait reason are recorded separately.', setting: 'Preferences.MinHealthyPercentage = 100; MaxHealthyPercentage = 150' },
      { label: 'Cannot progress', summary: 'A single-instance group requires 100% healthy but allows no overlap.', nodes: [n('Desired', '1'), n('Healthy floor', '1 required', 'green'), n('Ceiling', '1 maximum', 'red'), n('Terminate first', 'Would break floor', 'red'), n('Launch first', 'Would break ceiling', 'red')], result: 'The refresh waits because neither legal next action exists.', evidence: 'Explicit 100% maximum remains distinct from an omitted value.', setting: 'MinHealthyPercentage = 100; MaxHealthyPercentage = 100' },
    ],
  },
  {
    id: 'v15', nav: 'Root volume', title: 'Replace the root volume and keep the instance', kind: 'flow',
    question: 'Which identity persists while application service pauses?',
    scenarios: [
      { label: 'Compatible replacement', summary: 'The instance identity and attached non-root resources persist across the reboot.', nodes: [n('i-0abc', 'Identity + ENI persist', 'cyan'), n('Deregister', 'Traffic pauses', 'amber'), n('Root volume', 'Old data discarded', 'red'), n('Reboot + hook', 'Readiness work', 'amber'), n('InService', 'Same instance ID', 'green')], result: 'The strategy preserves the instance, not uninterrupted application execution.', evidence: 'Old and new root volume IDs are both recorded.', setting: 'Strategy = ReplaceRootVolume' },
      { label: 'Incompatible AMI', summary: 'A failed root-volume replacement can branch to full instance replacement.', nodes: [n('Template check', 'Numeric version', 'green'), n('AMI', 'Multi-volume image', 'red'), n('Root replace', 'Rejected', 'red'), n('Fallback', 'Full instance replacement', 'amber')], result: 'Identity preservation is lost on the fallback path.', evidence: 'The incompatibility is reported before presenting the branch as successful.', setting: 'DesiredConfiguration.LaunchTemplate.Version = "12"' },
    ],
  },
  {
    id: 'v16', nav: 'Termination', title: 'Termination, protection, and retention', kind: 'allocation',
    question: 'Why was this instance eligible when an older one survived?',
    scenarios: [
      { label: 'Candidate funnel', summary: 'Placement needs narrow the candidates before the configured policy breaks the tie.', nodes: [n('6 active', 'Initial candidates'), n('3 in zone 1b', 'Imbalanced zone', 'purple'), n('2 unprotected', 'Scale-in eligible'), n('NewestInstance', 'i-0f7 selected', 'red'), n('Drain + hook', 'Termination path', 'amber')], result: 'An older instance survives because it was excluded before the age policy ran.', evidence: 'Every exclusion reason stays inspectable.', setting: 'TerminationPolicies[] = [NewestInstance]' },
      { label: 'All protected', summary: 'Desired capacity falls, but ordinary scale-in has no eligible instance.', nodes: [n('Desired 4', 'Reduced from 6', 'purple'), n('Present 6', 'All protected', 'amber'), n('Candidates 0', 'No scale-in target', 'red'), n('Serving 6', 'Still above desired', 'green')], result: 'Protection blocks ordinary scale-in; it is different from deletion protection.', evidence: 'The desired update succeeded even though the fleet did not shrink.', setting: 'ProtectedFromScaleIn = true on all active instances' },
    ],
  },
  {
    id: 'v17', nav: 'Operations', title: 'Standby, attach, detach, and explicit launch', kind: 'flow',
    question: 'How does each operation change membership and desired capacity?',
    scenarios: [
      { label: 'Enter standby', summary: 'The same instance remains a group member but leaves ordinary service.', nodes: [n('InService', 'Desired 6 · present 6'), n('EnterStandby', 'Decrement desired: no', 'purple'), n('Deregister', 'Target drains', 'amber'), n('Standby', 'Outside active capacity'), n('Replacement', 'Group launches one', 'cyan')], result: 'Identity is preserved; desired remains six, so active capacity is replaced.', evidence: 'Direct target deregistration alone would not create Standby state.', setting: 'ShouldDecrementDesiredCapacity = false' },
      { label: 'Detach and decrement', summary: 'The instance leaves ASG management while EC2 continues running.', nodes: [n('InService', 'Managed by ASG'), n('Detach', 'Decrement desired: yes', 'purple'), n('Detached EC2', 'Still running', 'amber'), n('Desired −1', 'No replacement requested', 'cyan')], result: 'The resource now sits outside active capacity and can still cost money.', evidence: 'Membership, EC2 state, and desired capacity change independently.', setting: 'DetachInstances.ShouldDecrementDesiredCapacity = true' },
    ],
  },
  {
    id: 'v18', nav: 'Processes', title: 'Zonal shift and suspended processes', kind: 'signals',
    question: 'Which pending action is gated by each control-plane switch?',
    scenarios: [
      { label: 'Launch suspended', summary: 'The desired request survives while the process that fulfills it is suspended.', nodes: [n('Desired +2', 'Request accepted', 'purple'), n('Launch', 'Suspended', 'red'), n('Attempts', 'None started', 'muted'), n('Resume', 'Reconciliation may proceed', 'amber')], result: 'The request is pending; resumption does not imply replay semantics for every process.', evidence: 'Suspended process and outstanding capacity gap are shown together.', setting: 'SuspendProcesses.ScalingProcesses[] = Launch' },
      { label: 'Active zonal shift', summary: 'Placement avoids the impaired zone while traffic routing remains a separate surface.', nodes: [n('Zone 1a', 'Impaired · shift active', 'red'), n('Health behavior', 'Ignore unhealthy', 'purple'), n('Zones 1b/1c', 'Receive new launches', 'cyan'), n('Headroom', 'Only 1 unit', 'amber')], result: 'The surviving zones cannot supply all requested capacity.', evidence: 'Zonal placement and load-balancer routing are not merged into one state.', setting: 'ImpairedZoneHealthCheckBehavior = IgnoreUnhealthy' },
    ],
  },
  {
    id: 'v19', nav: 'Evidence', title: 'Launch failures and operational evidence', kind: 'flow',
    question: 'At which stage did the capacity request stop?',
    scenarios: [
      { label: 'KMS denial', summary: 'The group and template validate, but encrypted-volume creation is denied.', nodes: [n('ASG request', 'Accepted', 'green'), n('Template', 'Version 12 resolved', 'green'), n('Authorization', 'KMS grant denied', 'red'), n('EC2 instance', 'Not created', 'muted'), n('Capacity gap', 'Request remains', 'amber')], result: 'Fix the service-linked role or key policy involved in this launch.', evidence: 'Activity history names the denied actor and action.', setting: 'Launch template EBS KmsKeyId + ServiceLinkedRoleARN' },
      { label: 'Bootstrap egress', summary: 'EC2 launches, but the application never becomes ready.', nodes: [n('ASG request', 'Accepted', 'green'), n('EC2 boot', 'Running', 'green'), n('User data', 'Artifact fetch times out', 'red'), n('Target health', 'Unhealthy', 'red'), n('Replacement', 'Looping', 'amber')], result: 'The failure is downstream of placement and launch authorization.', evidence: 'Console output, application logs, and target reason align.', setting: 'Launch template networking + user data' },
    ],
  },
  {
    id: 'v20', nav: 'Workbench', title: 'Combined incident replay', kind: 'fleet',
    question: 'Which one-setting change improves the workload outcome?',
    scenarios: [
      { label: 'Spike during refresh', summary: 'Traffic rises while three old instances are already leaving the fleet.', nodes: [n('Needed serving', '10', 'purple'), n('Serving', '6', 'red'), n('New cohort', '3 warming', 'amber'), n('Scale-out', '+2 requested', 'cyan'), n('Below need', '4m 20s fixture', 'red')], result: 'Refresh and dynamic scaling share the same capacity and placement constraints.', evidence: 'The replay attributes each instance to refresh, scale-out, or replacement.', setting: 'Compare: MaxHealthyPercentage 100 → 150' },
      { label: 'Protected workers', summary: 'A queue grows while every busy worker is protected from scale in.', nodes: [n('Backlog', '1,840 and rising', 'red'), n('Workers', '6 busy', 'amber'), n('Protection', 'All six', 'purple'), n('Scale-out', 'Max size reached', 'red'), n('Completion', 'Protection not released', 'red')], result: 'The ASG cannot fix application-owned protection that never clears.', evidence: 'Backlog, protection state, and maximum capacity explain the stall.', setting: 'Worker completion must call SetInstanceProtection(false)' },
      { label: 'Warm pool + bad AMI', summary: 'The pool empties, then cold launches repeat a broken bootstrap.', nodes: [n('Pool', '2 prepared instances', 'green'), n('Demand', '+5', 'purple'), n('Warm starts', '2 become ready', 'green'), n('Cold launches', '3 use bad AMI', 'red'), n('Serving gap', '3 persists', 'amber')], result: 'A warm pool masks the bad launch path until prepared capacity is depleted.', evidence: 'Cohort template versions expose the difference.', setting: 'Compare: pin known-good numeric template version' },
    ],
  },
];
