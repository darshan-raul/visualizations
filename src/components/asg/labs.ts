export type Tone = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'muted';

export interface LabNode {
  label: string;
  detail: string;
  tone: Tone;
  explanation?: string;
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
  introduction?: string;
  kind: 'fleet' | 'flow' | 'timeline' | 'signals' | 'allocation';
  scenarios: LabScenario[];
}

const n = (label: string, detail: string, tone: Tone = 'cyan'): LabNode => ({ label, detail, tone });

export const labs: Lab[] = [
  {
    id: 'v01', nav: 'Fleet', title: 'Desired capacity and the fleet', kind: 'fleet',
    question: 'What happens when the computer running your website fails?',
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
      { label: 'Startup clocks overlap', summary: 'Health checks keep running while grace and warmup gate different consumers.', nodes: [n('Boot 0–55s', 'Operating system starts'), n('Hook 10–100s', 'ASG transition held', 'amber'), n('Grace 100–400s', 'From entry into InService', 'amber'), n('Warmup 100–280s', 'Scaling metric eligibility waits', 'purple'), n('Serving at 130s', 'Target readiness is separate', 'green')], result: 'The target can serve at 130 seconds while scaling calculations still exclude it.', evidence: 'Each bar begins at its documented trigger, not at page time zero.', setting: 'DefaultInstanceWarmup = 180; HealthCheckGracePeriod = 300' },
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
      { label: 'Business hours', summary: 'A recurring schedule raises the floor before the morning load.', nodes: [n('08:45 local', 'Schedule executes', 'purple'), n('Min 6', 'Desired clamps upward'), n('09:00 local', 'Traffic begins', 'amber'), n('Serving 6', 'Prepared fleet', 'green')], result: 'The configured time zone determines schedule interpretation, including daylight-saving changes.', evidence: 'Inspect the scheduled action’s recurrence and time zone to establish when it will run.', setting: 'PutScheduledUpdateGroupAction.TimeZone' },
      { label: 'Forecast miss', summary: 'Predictive capacity arrives early, but dynamic scaling handles demand above the fixture forecast.', nodes: [n('History', '≥24h available'), n('Forecast', '8 instances', 'purple'), n('Prelaunch', 'Capacity requested early'), n('Actual demand', 'Needs 11', 'red'), n('Dynamic scale-out', '+3', 'amber')], result: 'Forecasts are fixture data; the visual does not invent AWS’s forecasting formula.', evidence: 'Predicted and actual series remain separate.', setting: 'PredictiveScalingConfiguration.Mode = ForecastAndScale' },
    ],
  },
  {
    id: 'v09', nav: 'Warm pools', title: 'Warm-pool preparation, reuse, and depletion', kind: 'flow',
    question: 'How much startup work did the pool remove, and what still remains?',
    scenarios: [
      { label: 'Reuse prepared instance', summary: 'The instance restarts from the pool, then finishes hooks and readiness.', nodes: [n('Warm pool', 'Stopped · prepared', 'cyan'), n('Restart', 'EC2 returns to running', 'amber'), n('Launch hook', 'Configuration check', 'amber'), n('InService', 'Active ASG member', 'cyan'), n('Target ready', 'Registered and healthy', 'green')], result: 'The pool avoids repeated initialization but does not make serving capacity instant.', evidence: 'Pool population and active desired capacity use separate ledgers.', setting: 'InstanceReusePolicy.ReuseOnScaleIn = true' },
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
      { label: 'One instance: conflicting bounds', summary: 'A single-instance group requires 100% healthy but allows no overlap.', nodes: [n('Desired', '1'), n('Healthy floor', '1 required', 'green'), n('Ceiling', '1 maximum', 'red'), n('Terminate first', 'Would break floor', 'red'), n('Launch first', 'Documented fallback: temporary overlap', 'amber')], result: 'Both requested bounds cannot be maintained. With explicit maximum 100%, AWS launches first and temporarily exceeds desired capacity.', evidence: 'Explicit 100% maximum remains distinct from an omitted value.', setting: 'MinHealthyPercentage = 100; MaxHealthyPercentage = 100' },
    ],
  },
  {
    id: 'v15', nav: 'Root volume', title: 'Replace the root volume and keep the instance', kind: 'flow',
    question: 'Which identity persists while application service pauses?',
    scenarios: [
      { label: 'Compatible replacement', summary: 'The instance identity and attached non-root resources persist across the reboot.', nodes: [n('i-0abc', 'Identity + ENI persist', 'cyan'), n('Deregister', 'Traffic pauses', 'amber'), n('Root volume', 'Old data discarded', 'red'), n('Reboot + hook', 'Readiness work', 'amber'), n('InService', 'Same instance ID', 'green')], result: 'The strategy preserves the instance, not uninterrupted application execution.', evidence: 'Old and new root volume IDs are both recorded.', setting: 'Strategy = ReplaceRootVolume' },
      { label: 'Incompatible AMI', summary: 'A failed root-volume replacement can branch to full instance replacement.', nodes: [n('Template check', 'Numeric version', 'green'), n('AMI', 'Multi-volume image', 'red'), n('Root replace', 'Rejected', 'red'), n('Choose a supported strategy', 'Compatible image or rolling replacement', 'amber')], result: 'Reject the incompatible configuration before starting. A runtime failure and its replacement fallback are a separate case.', evidence: 'The incompatibility is reported before presenting the branch as successful.', setting: 'DesiredConfiguration.LaunchTemplate.Version = "12"' },
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

// Authored teaching copy: one explanation for every node, including alternate paths.
const teaching = [
  [
    "Keep a web application running",
    "A customer opens your website. An EC2 instance is the virtual computer running the application that answers them. Start with that one computer, then add the pieces needed to share work and replace a failed machine."
  ],
  [
    "Finish preparation before joining",
    "A new computer can boot before your application has downloaded its configuration. A lifecycle hook is a pause in the group’s launch or termination transition. Your preparation program completes the hook when its work is done; receiving a notification alone does not release the pause."
  ],
  [
    "Give startup time to finish",
    "Your application needs time to settle after startup. A health-check grace period delays covered replacement decisions; warmup delays the use of new capacity in scaling calculations. These clocks have different jobs even when they overlap."
  ],
  [
    "Check whether the application works",
    "A running computer can host a broken application. Health checks are tests of different layers: EC2 checks the machine, while a load balancer checks a registered application destination, called a target. ASG uses configured health evidence to decide whether to replace an instance."
  ],
  [
    "Add computers when they get busy",
    "A metric is a measured value, such as CPU utilization. A target-tracking policy asks ASG to adjust instance count toward a chosen metric value. Scale out means add capacity; scale in means remove it. Two policies can disagree about which is needed."
  ],
  [
    "Choose how much capacity to add",
    "An alarm reports that a measurement crossed a threshold. Step scaling chooses an adjustment based on how far it crossed; simple scaling uses an adjustment followed by a cooldown before another simple-policy action. The intervals below are alternatives, not successive launches."
  ],
  [
    "Give queued jobs enough workers",
    "Some applications receive jobs through a queue instead of a load balancer. A worker takes a job, processes it, and acknowledges completion. Backlog is work still waiting; dividing it by usable workers helps reveal whether each worker has too much to do."
  ],
  [
    "Prepare for demand you expect",
    "If traffic arrives every morning, waiting for busy computers may be too late. A schedule changes capacity at a chosen time. Predictive scaling uses historical measurements to forecast future demand; dynamic policies can still react when actual demand differs."
  ],
  [
    "Prepare spare computers in advance",
    "When setup takes minutes, you can prepare instances before you need them. A warm pool holds those instances outside the active fleet, often stopped. Starting one still requires restart and application-readiness work."
  ],
  [
    "Choose where new computers can run",
    "An Availability Zone is a separate location within an AWS Region. A subnet supplies network addresses within one zone. Spreading instances across zones reduces dependence on one location, but a launch still needs both an address and available EC2 capacity."
  ],
  [
    "Use more than one kind of computer",
    "Instance types offer different CPU and memory sizes. A mixed-instance group can choose among types and purchase options. A weight says how many configured capacity units one instance contributes; it does not guarantee equivalent application performance. On-Demand is ordinary purchased capacity; Spot uses spare capacity that AWS can reclaim."
  ],
  [
    "Replace interruptible capacity early",
    "Spot instances can be reclaimed. A rebalance recommendation warns that an instance is at elevated interruption risk. Capacity Rebalancing lets ASG try a replacement early, but the warning does not guarantee enough time or available supply."
  ],
  [
    "Use capacity reserved for the workload",
    "A reservation holds matching EC2 capacity; a Capacity Block supplies capacity for a specified time window. Distribution segments express an order of capacity sources. A reservation must both have room and match the instance you want to launch."
  ],
  [
    "Roll out a new application image",
    "A launch template is the configuration used to create an instance, including its machine image. Changing the template does not update existing machines. Instance refresh replaces the old fleet in batches; minimum healthy capacity and maximum overlap constrain each batch."
  ],
  [
    "Update the startup disk",
    "An AMI is a machine image used to initialize a computer. The root volume is its startup disk. A root-volume refresh replaces that disk while preserving supported instance resources, but the application must pause and restart. Check compatibility before choosing this strategy."
  ],
  [
    "Choose which computer to remove",
    "Reducing desired capacity starts scale-in selection. Scale-in protection excludes an instance from ordinary scale-in, for example while it finishes a job. The termination policy chooses among eligible candidates; it does not override every earlier exclusion."
  ],
  [
    "Take an instance out for maintenance",
    "Standby keeps an instance associated with the group while it leaves normal service. Detach removes it from group management. Both can leave EC2 running; your choice about reducing desired capacity determines whether ASG needs a replacement."
  ],
  [
    "Pause an automatic action",
    "ASG has separate processes for launching, terminating, health replacement, and other work. Suspending one blocks that process. A zonal shift addresses an impaired Availability Zone and has separate placement, health, and traffic-routing effects."
  ],
  [
    "Find where a launch stopped",
    "A capacity request passes through configuration, permissions, EC2 launch, application setup, and readiness. Activity history records ASG actions; application logs explain work inside the machine. Match the failed stage to its evidence before changing the scaling policy."
  ],
  [
    "Put the mechanisms together",
    "Real incidents overlap. A refresh may be running when traffic rises, or a warm pool may hide a broken image until it empties. Follow the requested capacity, usable application capacity, and the reason each instance is changing."
  ]
];
const explanations: Record<string, string[][]> = {
  "v01": [
    [
      "The policy has requested eight instances, but a request cannot serve a customer. Desired capacity is the count ASG is trying to maintain.",
      "ASG starts two launch attempts. Present capacity counts machines that actually exist, so failed or unfinished attempts cannot fill the gap.",
      "InService is ASG’s active membership state. Here the six existing instances remain active while the new launches are pending.",
      "Serving counts the instances that can handle this application’s requests. Six are ready; the requested eight will only help once the new application copies are ready."
    ],
    [
      "ASG still wants eight instances after a failed attempt. Failure to fulfill a request does not automatically lower that target.",
      "The eligible subnets have no free network addresses. These attempts return no instance IDs, so there are no new computers to count.",
      "Six existing machines remain. Look at the failed scaling activity to explain why present capacity has not reached desired.",
      "The existing healthy application copies keep answering requests. Restore launch capacity to close the two-instance gap."
    ],
    [
      "The target stays six. Replacing a failed member does not require asking the group to grow.",
      "A configured health source reports one instance unhealthy. ASG can use that evidence to request replacement.",
      "ASG starts another machine. A new instance ID means new capacity is being created, not that the failed machine moved between zones.",
      "Only five application copies are ready while replacement starts. Serving capacity recovers after the new application is prepared and healthy."
    ]
  ],
  "v02": [
    [
      "EC2 has accepted the launch. Pending means the instance has not yet entered ASG’s active InService state.",
      "The launch hook holds the transition in Pending:Wait. Its action token identifies this particular wait so a worker can complete the right action.",
      "A preparation program joins the instance to the required domain. Delivering the notification started work; the work itself still had to succeed.",
      "The worker sends CONTINUE for the current action. ASG can now proceed beyond this hook rather than waiting for its timeout.",
      "ASG admits the instance into active service. Load-balancer registration and application checks still determine whether it can receive requests."
    ],
    [
      "One lifecycle action is waiting for preparation. Several messages about it do not create several independent actions.",
      "The worker claims the task and records the action token so it can recognize repeat deliveries.",
      "The same notification arrives again. The worker checks its record and avoids running the domain join twice.",
      "The worker completes the original action once. Duplicate delivery has not duplicated the application-side work."
    ],
    [
      "Deregistration takes the target out of new traffic selection while existing requests drain in the ordinary termination path.",
      "The termination hook holds the transition so the cleanup program can finish its work.",
      "The worker reports ABANDON because cleanup failed. The configured retention rule now determines the resource’s disposition.",
      "The retain setting preserves this EC2 instance outside active capacity. Someone must resolve it; retention is not free replacement capacity."
    ]
  ],
  "v03": [
    [
      "The operating system is starting. A running VM alone does not prove the application is ready.",
      "The launch hook pauses admission into active service while preparation continues inside the machine.",
      "Once the instance enters InService, the grace period gives covered startup health failures time to recover before ASG acts on them.",
      "Warmup starts from InService in this example. Its 180 seconds govern scaling eligibility, independently of the application’s traffic checks.",
      "At 130 seconds the target passes readiness. It can receive traffic even though its scaling warmup has not expired."
    ],
    [
      "This instance has entered InService and is within its configured startup grace period.",
      "The VM is stopped. This is an EC2 state change, not simply an application taking longer to answer a health check.",
      "ASG can act immediately on an instance that leaves running. Increasing the grace period does not keep a stopped VM usable."
    ]
  ],
  "v04": [
    [
      "EC2 system checks test the infrastructure supporting the VM. Passing them narrows the fault location but says little about application behavior.",
      "EC2 instance checks also pass. The machine is reachable at that layer even though its application may fail.",
      "The application check fails. Its raw result is separate from the machine checks and can contribute to aggregated application status.",
      "The load balancer’s target check fails too. With healthy alternatives available in this example, routing can avoid this destination.",
      "With the relevant health evidence enabled, ASG can replace the instance after applicable grace handling. Routing and replacement are separate decisions."
    ],
    [
      "The machine-level check passes, so this example is about application-check aggregation.",
      "The application check fails but is excluded from the aggregate. Exclusion changes which evidence contributes, not the raw test result.",
      "The remaining included checks pass. That produces a passing aggregate despite the excluded failure.",
      "ASG has no failing aggregate from this check to act on. The application problem still needs investigation."
    ]
  ],
  "v05": [
    [
      "CPU is above the configured target. This fixture assigns the CPU policy a proposal of three more instances; it does not reproduce AWS’s private controller formula.",
      "Requests per target also exceed their target. That policy proposes one extra instance, a different request based on different evidence.",
      "The larger scale-out proposal determines this example’s increase. Any target-tracking policy can support scale-out.",
      "The newly launched capacity must warm up before it contributes normally to the scaling calculation. The request has changed before its full effect is measurable."
    ],
    [
      "Low CPU supports removing two instances in this authored example.",
      "The requests policy still needs capacity. Low CPU does not establish that the application has spare request-handling capacity.",
      "The scale-in-enabled target-tracking policies do not agree, so the CPU proposal cannot shrink the fleet."
    ]
  ],
  "v06": [
    [
      "For a breach less than ten points above the threshold, this policy would add one instance. That interval does not match the current 23-point breach.",
      "The next interval covers breaches from ten up to twenty points. It also does not match 23; these are alternative rules.",
      "The 23-point breach matches the interval starting at twenty, which requests a thirty-percent increase.",
      "Thirty percent of the ten-instance starting fleet is three. This example needs no fractional rounding.",
      "The resulting target is thirteen, subject to the group’s limits. It is a requested count, not thirteen immediately usable machines."
    ],
    [
      "The alarm triggers a simple scaling action that requests two additional instances.",
      "The applicable cooldown is still active. It spaces simple-policy actions so the previous change has time to affect demand.",
      "An instance fails health checks during that wait. Replacement is a separate path and can proceed.",
      "Another breach occurs, but this simple-policy action is gated by cooldown. The group itself has not been frozen."
    ]
  ],
  "v07": [
    [
      "Jobs arrive at the queue at the assumed rate. A queue lets work wait until a worker can take it.",
      "There are 240 visible waiting messages. Work already being processed belongs in a separate in-flight count.",
      "Four workers can take jobs. Use comparable, usable workers as the denominator for this teaching model.",
      "Dividing 240 by four gives sixty waiting messages per worker, twice the illustrative target.",
      "At two seconds per job, a sixty-second acceptable delay suggests thirty messages per worker. More usable workers can reduce this ratio, subject to downstream limits."
    ],
    [
      "Twelve messages are waiting, so there is work even though the fleet is empty.",
      "There are no usable workers. Backlog per worker cannot be calculated by dividing by zero.",
      "There are also no workers publishing CPU samples. An absent sample does not mean idle machines exist.",
      "An independent queue-depth alarm requests the first worker. Once workers exist, the per-worker metric can become useful."
    ]
  ],
  "v08": [
    [
      "The scheduled action runs at the configured local time. The time zone matters when converting recurring occurrences to UTC.",
      "Raising minimum to six also raises a desired count that was below six. This starts preparation before the traffic arrives.",
      "Customers arrive at nine in this example. The benefit depends on how long startup actually takes.",
      "Here six application copies finished preparation in time. A schedule requests capacity early; it cannot guarantee launches will succeed."
    ],
    [
      "Predictive scaling needs historical measurements before it can forecast. The fixture supplies sufficient history.",
      "The authored forecast calls for eight instances. Forecast demand is a prediction, separate from actual arrivals.",
      "Prelaunch requests that capacity before it is expected to be needed, allowing time for startup.",
      "Actual demand instead needs eleven instances under the workload assumptions. The forecast was too low.",
      "Dynamic scaling requests the additional three. The application still waits for those new instances to become usable."
    ]
  ],
  "v09": [
    [
      "The pool contains an instance that has already performed preparation and is now stopped. It contributes no running application service yet.",
      "EC2 restarts it. This avoids some cold initialization but still takes time.",
      "A launch hook can verify current configuration before returning the prepared machine to active service.",
      "The instance enters InService after the hook completes. Target registration and health checks must still finish.",
      "Once the registered target is healthy, the application can use it. Pool preparation reduced work without removing every startup gate."
    ],
    [
      "The group requests four more active instances. This is separate from the pool’s desired population.",
      "Only two prepared instances are actually available to restart, even if the pool target was larger.",
      "The remaining two must take the cold launch path, including full application setup.",
      "The prepared pair can become useful earlier. The remaining serving gap persists until cold launches finish."
    ]
  ],
  "v10": [
    [
      "The first zone has room in its subnet. Free IP addresses are one launch prerequisite.",
      "The second zone’s subnet has no free addresses. Even an available EC2 type cannot launch there without networking.",
      "The third zone also has addresses available. The placement strategy determines whether it can be used instead.",
      "Balanced best effort can try another eligible zone. The successful launch changes distribution; later rebalancing can restore it."
    ],
    [
      "Two units already run in the first zone. Adding there would not satisfy the intended placement balance.",
      "The second zone also has two units. The extra unit is needed in the constrained zone.",
      "The needed zone cannot accept the launch. Balanced-only does not use another zone merely to fill the requested count.",
      "One unit remains unfulfilled. Changing demand thresholds would not repair this placement restriction."
    ]
  ],
  "v11": [
    [
      "The requirement filter finds three compatible types. Eligibility is a configuration question before it is a supply question.",
      "Only the type with weight four is available in this fixture. Other eligible types need not be launchable now.",
      "Two such instances supply eight units, below desired ten, so a third is needed.",
      "Three instances supply twelve configured units. Whole instances explain the surplus; twelve units are not twelve machines."
    ],
    [
      "The first two units of the requested ten are assigned to On-Demand by the base setting.",
      "Eight units remain above that base. Apply the percentage to these eight rather than to all ten.",
      "Twenty-five percent of eight is two more On-Demand units. Together with the base, that makes four.",
      "The remaining six are assigned to Spot. This arithmetic describes the requested purchase mix before actual supply constraints."
    ]
  ],
  "v12": [
    [
      "A recommendation warns of elevated interruption risk. This fixture places the interruption notice at the same starting time; recommendations do not universally provide this lead time.",
      "ASG tries to create replacement capacity while the old instance still exists.",
      "The replacement passes target checks in time in this example. Serving work can move to it.",
      "The old target starts draining. Cleanup has its own timing and does not control AWS’s reclamation.",
      "The forced interruption arrives on its own schedule. The earlier replacement is what preserved serving capacity."
    ],
    [
      "The risk notification starts a proactive attempt. It is not a promise that spare capacity is available.",
      "The replacement launch fails because eligible Spot supply is unavailable.",
      "This example has no applicable On-Demand fallback to satisfy the missing replacement. Rebalancing alone does not create one.",
      "AWS reclaims the instance despite the failed replacement. Hooks cannot postpone this deadline."
    ]
  ],
  "v13": [
    [
      "The first preferred source was time-bounded. Its expired capacity is no longer usable for this launch.",
      "The next reservation has no remaining matching room. Naming a reservation does not make it unlimited.",
      "This configuration allows a later On-Demand source. The ordered search can continue rather than stop at the empty reservation.",
      "A new launch can use that source. Existing instances do not move just because future launch preferences changed."
    ],
    [
      "The preferred source has no available room. There is nothing to consume there.",
      "Another reservation has capacity but does not match the requested type. Availability and eligibility are distinct.",
      "The configuration does not allow a further source. ASG cannot silently ignore that restriction.",
      "Two units remain requested but unavailable. Supply or allowed sources must change to fulfill the request."
    ]
  ],
  "v14": [
    [
      "Six old application copies still serve traffic. They provide availability while replacements start.",
      "Three new instances exist but are warming. Presence alone does not make them ready to replace the old cohort.",
      "The hundred-percent minimum requires six healthy units for the planned replacement calculation.",
      "A hundred-fifty-percent maximum allows nine total units against desired six. That supplies room for three temporary replacements.",
      "Refresh waits for the replacements’ required readiness and warmup before retiring the next old instances."
    ],
    [
      "The group wants one instance. Percentage rules become whole-machine constraints at this size.",
      "A hundred-percent healthy minimum asks the operation to preserve the one healthy machine.",
      "An explicit hundred-percent maximum permits no overlap. These bounds cannot both be maintained while replacing one machine.",
      "Terminating first sacrifices the requested healthy minimum. This is one possible tradeoff to inspect.",
      "With explicit maximum 100%, AWS launches a new instance first when both bounds cannot be honored. It temporarily exceeds desired capacity; omitting maximum instead gives different replacement ordering."
    ]
  ],
  "v15": [
    [
      "The instance ID identifies the machine; its network interface is its connection to the subnet. Supported resources persist through this strategy.",
      "The application is taken out of traffic before the disk work. Identity preservation does not mean uninterrupted service.",
      "The startup disk is replaced. Data on the old root volume is not automatically carried into the new image.",
      "The instance reboots and performs the required preparation. Hooks can coordinate that work before service resumes.",
      "The same instance ID returns to InService. Application checks still establish whether requests can succeed."
    ],
    [
      "A numeric template version pins the configuration being evaluated, instead of a moving default or latest version.",
      "This selected AMI describes multiple volumes and does not meet this strategy’s prerequisites.",
      "Validation rejects this configuration. No root-volume replacement has succeeded.",
      "Choose a compatible image or use ordinary rolling replacement. Runtime replacement failure can also lead to full instance replacement; validation rejection does not itself guarantee automatic fallback."
    ]
  ],
  "v16": [
    [
      "Start with six active instances. This is the initial pool, not a promise that each can be terminated.",
      "The overrepresented zone narrows the ordinary scale-in candidates according to placement needs.",
      "Protection excludes a candidate from ordinary scale-in. Two eligible machines remain in this example.",
      "NewestInstance selects among that narrowed set. An older machine elsewhere can survive without the policy being ignored.",
      "The chosen target drains and completes the applicable termination work. Selection and actual removal are separate steps."
    ],
    [
      "The requested size is reduced from six to four. Updating the target can succeed before any machine is removed.",
      "All six existing instances have scale-in protection. The old count therefore remains present.",
      "No instance is eligible for this ordinary scale-in action. Choosing a different age policy cannot overcome that exclusion.",
      "All six continue serving. Releasing appropriate protection allows the group to work toward four."
    ]
  ],
  "v17": [
    [
      "The group has six active instances. One is selected for maintenance.",
      "EnterStandby keeps membership but requests removal from normal service. Here desired capacity is not decremented.",
      "ASG initiates load-balancer deregistration so existing traffic can drain.",
      "The same EC2 instance reaches Standby. It remains associated with the group but is outside its active serving fleet.",
      "Because desired still asks for six active instances, the group launches replacement capacity, subject to normal constraints."
    ],
    [
      "This instance begins as an active group member under ASG management.",
      "Detach removes management, and the decrement option reduces desired with it, provided bounds allow the operation.",
      "The EC2 machine continues running independently. Detaching is not terminating it.",
      "The reduced target avoids asking ASG to replace the detached member. The independently running resource still needs an owner."
    ]
  ],
  "v18": [
    [
      "The group accepts a request for two more instances. Its desired target changes.",
      "The Launch process is suspended, so ASG cannot perform the launch work required by that request.",
      "There are no new attempts to count. Investigate the suspended process before hunting for an EC2 launch error.",
      "Resuming Launch permits reconciliation with the outstanding target. Other processes have their own resume behavior."
    ],
    [
      "A shift is active away from an impaired zone. Enabling the integration alone would not start this shift.",
      "The configured IgnoreUnhealthy behavior changes how affected unhealthy instances are handled during the shift.",
      "New placement uses the remaining zones, whose capacity and subnet constraints still apply.",
      "Only one additional unit is available there in this fixture. Avoiding an impaired zone does not create surviving-zone headroom."
    ]
  ],
  "v19": [
    [
      "ASG accepts the desired-capacity request. That validates neither the entire launch path nor application readiness.",
      "The launch resolves a specific template version. Check that version when investigating encrypted disk settings.",
      "KMS, the key-management service, denies the access needed for encrypted storage. Inspect the launch service identity and key policy.",
      "This fixture has no usable created instance. Real failures can also create an ID briefly before termination; activity and EC2 evidence distinguish them.",
      "The original request remains unmet. Changing the scaling target will not grant the missing encryption permission."
    ],
    [
      "The requested capacity is accepted, so the investigation proceeds into the launch path.",
      "EC2 reaches running. Placement and basic boot have succeeded far enough to inspect the application.",
      "The startup script, supplied as user data, cannot download an artifact. Its outbound network path or destination must be checked.",
      "The application never answers the configured target health check. A running VM cannot serve this workload yet.",
      "Replacement repeats the same broken setup. Fixing the shared launch configuration prevents the next instance from failing identically."
    ]
  ],
  "v20": [
    [
      "The assumed workload now needs ten usable application copies. That is a demand estimate, separate from ASG’s current desired target.",
      "Only six copies can handle requests. The immediate service shortfall is four under this workload model.",
      "Three replacements are warming. Counting them as already usable would hide part of the incident.",
      "A scaling action requests two more. Those launches compete for the same supply and still need startup time.",
      "The authored incident assigns four minutes twenty seconds below need. It illustrates exposure during overlap, not a computed AWS latency prediction."
    ],
    [
      "The queue has 1,840 waiting jobs and is growing. Work arrives faster than usable workers finish it.",
      "Six workers are occupied. Check throughput and downstream constraints as well as instance count.",
      "All six are protected from ordinary scale-in while busy. Protection itself does not block adding workers.",
      "Maximum size prevents further growth in this configuration. That explains the backlog’s scaling constraint.",
      "After jobs finish, the application must release protection when safe. Otherwise a later scale-in request cannot remove these workers."
    ],
    [
      "Two instances were prepared using a working configuration. Their presence can make the service look ready for growth.",
      "Demand asks for five more instances, exceeding the prepared population.",
      "The prepared pair becomes useful after restart and checks, consuming the available pool.",
      "Three cold launches use the bad image. An AMI is the machine image, so a broken shared image can repeat the same setup failure.",
      "The three-instance gap persists. Compare image and template versions between the working pool members and the failing cold launches."
    ]
  ]
};
for (const [index, lab] of labs.entries()) {
  lab.title = teaching[index][0];
  lab.introduction = teaching[index][1];
  const paths = explanations[lab.id];
  if (paths.length !== lab.scenarios.length) throw new Error('Missing scenario explanations: ' + lab.id);
  lab.scenarios.forEach((scenario, scenarioIndex) => {
    const copy = paths[scenarioIndex];
    if (copy.length !== scenario.nodes.length) throw new Error('Missing step explanations: ' + lab.id + '/' + scenario.label);
    scenario.nodes.forEach((node, nodeIndex) => { node.explanation = copy[nodeIndex]; });
  });
}
labs[0].scenarios.unshift({
  label: 'Start here: one application',
  summary: 'Build the system one piece at a time. Follow a customer request before introducing the group that keeps the computers running.',
  nodes: [{"label":"One application","detail":"A customer sends a request","tone":"cyan","explanation":"An EC2 instance is a virtual computer. Your application runs on it and sends a response to the customer. If that one computer fails, this example has no other application copy to answer."},{"label":"Share the requests","detail":"Add application copies and a load balancer","tone":"cyan","explanation":"Run the application on more instances. An Application Load Balancer receives customer requests and sends them to healthy registered application destinations, called targets. It distributes traffic; it does not create replacement computers."},{"label":"Keep six running","detail":"Give an Auto Scaling group a target","tone":"purple","explanation":"An Auto Scaling group, or ASG, manages a set of EC2 instances. You ask it to maintain six. When one fails, the group can launch a replacement using a launch template: the saved configuration for creating a machine."},{"label":"Prepare the replacement","detail":"Boot → start the app → check readiness","tone":"amber","explanation":"The replacement exists before it can answer requests. EC2 boots, the application starts, and the load balancer checks it. During that preparation, the other five healthy application copies carry the traffic."},{"label":"Name the three counts","detail":"Desired 6 · present 6 · serving 5","tone":"green","explanation":"Now the terms describe something you have seen: desired is the six instances requested; present is the five existing machines plus the replacement; serving is the five application copies ready for requests. When the replacement is ready, serving also becomes six."}],
  result: 'Asking for a replacement, creating it, and making it useful are three different milestones.',
  evidence: 'This worked example assumes five existing healthy application copies and one replacement still starting.',
  setting: 'DesiredCapacity = 6; the launch template supplies each new instance’s configuration.',
});
