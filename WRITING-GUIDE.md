# Infra Illustrated — Writing Guide

Status: Style agreed on 2026-09-08 and applied across the current canonical pages.

Use this guide alongside `SITE-REBUILD-BRIEF.md`, which remains the source of truth for product, content, accuracy, and design decisions.

## Voice

Write like an engineer helping a capable colleague understand a system. Use concrete examples, explain what causes what, and give the reader time to follow the idea. Be conversational, precise, and restrained. Let personality come through in what you notice and how you explain it.

The reader understands basic computing but may be new to this mechanism. Define specialized terms at first use and connect new concepts to something they can picture.

The goal is clear, thoughtful explanation. Adding banter, dramatic failure stories, or analogies does not automatically make writing more human.

## Principles

### Name the actor and connect the ideas

Name the component doing the work and explain the consequence. Prefer “the resolver adds a search suffix” to “search expansion occurs.” Use “you” when the reader configures, inspects, or decides something; use the component's name when the component acts.

Keep related ideas together. Split a sentence when it asks the reader to hold too much at once. Short sentences work well for emphasis and labels; longer sentences help explain relationships. Do not mechanically alternate sentence lengths or turn every fact into its own paragraph.

### Show why the understanding helps

Show what this understanding helps the reader explain, decide, predict, or troubleshoot. An ordinary configuration choice or surprising behavior can provide enough motivation.

Include operational failures when they materially help the topic. Do not force every section into an outage story, inflate consequences, or invent personal production experience. The brief makes failure modes useful content, not mandatory framing.

### Let the visuals teach

Use prose to frame the question, connect mechanisms, and explain what the eye might miss. Give diagrams meaningful captions and enough accompanying text to make the core explanation accessible. Avoid narrating every node and arrow again in a paragraph.

Different surfaces need different writing:

| Surface | Approach |
|---|---|
| Explanatory prose | Connected sentences, concrete examples, and clear cause and effect |
| Diagram labels | Short, specific actors and actions; fragments are fine |
| Captions | Explain the relationship or takeaway worth noticing |
| Controls | Say what the action changes |
| Reference tables | Consistent terminology and concise facts |

“Request denied” is a useful diagram label. It does not need a conversational rewrite. Apply this guide to introductions, summaries, headings, captions, callouts, and interactive component text as well as ordinary paragraphs.

### Preserve accuracy while improving style

A style edit must preserve the claim's scope, conditions, and uncertainty. Do not make an explanation smoother by removing a qualification that changes its meaning. Recheck changed technical claims against primary sources and retain nearby citations where needed.

Use precise ordinary language: credentials expire; they do not “self-destruct.” Keep “during the configured backup window” rather than replacing it with “every night.” Avoid turning a common implementation into a universal rule.

An analogy should clarify a particular relationship. Keep it brief, explain any material limit, and return to the real components. An analogy is optional.

### Put caveats where they help

Integrate ordinary qualifications into the relevant sentence or diagram caption. Avoid a repetitive series of generic “Model boundary” boxes.

Keep a prominent callout when a limitation changes how the reader should interpret the visual or act on it. Clearly distinguish documented behavior from conceptual simplifications, especially for provider internals. Moving a caveat into prose must not weaken or erase it.

For example:

> This diagram illustrates incremental storage. RDS manages the backup dependencies internally; it doesn't expose this graph.

### Use structure that fits the topic

Choose headings that help the reader find an answer. Both “How CoreDNS learns Service names” and “Resolver configuration” can work. Question headings are optional, and descriptive headings do not need to be made playful.

The brief's content contract specifies what to cover, not a mandatory sequence of section titles. Do not force every topic into the same mental-model, mechanism, misconceptions, and troubleshooting scaffold.

Correct misconceptions by explaining the mechanism. Explain why a misconception is tempting when that helps understanding; a short correction or comparison is sometimes sufficient.

## Patterns to watch for

- Abstract phrases that hide the actor: “a human operating an already authenticated principal,” “selection establishes membership.”
- Dense facts placed next to one another without explaining their relationship.
- Repeated rhetorical scaffolding: “You might think X. But here's the catch. This can bite you in production.”
- Unnecessary opening and closing filler: “In this article, we explore,” “It is important to remember,” “In conclusion.”
- Marketing claims, forced banter, invented operational scars, and dramatic metaphors.
- Blanket negations that spend more time listing what a system does not do than explaining what it does.
- Conversational rewrites that become substantially longer without improving understanding.

These are review signals, not a phrase-matching substitute for editorial judgment. Read paragraphs aloud to find awkwardness, then judge whether the explanation is clear and useful on the page.

## Reference examples

These examples establish the intended direction. They are writing examples, not a replacement for topic-specific technical review.

### Introduction: Kubernetes DNS

> Your app connects to `payments`, but first it needs an IP address. The Pod's resolver uses its DNS configuration to look up that name through cluster DNS. For a normal ClusterIP Service, the answer points to the Service; choosing a backend Pod happens when the app connects.
>
> The diagram below follows those two steps: finding the address, then using it.

The example starts with a recognizable action, follows the mechanism, and gives the diagram a purpose. It does not require an outage or an analogy.

When a page explains a setting, begin with what the reader configures and what changes as a result. Introduce the system terminology after the reader has something concrete to attach it to.

### Explaining a setting: ndots:5

> `api.example.com` looks like a complete name, but it has only two dots. With `ndots:5`, a resolver that follows the usual search-list behavior can try names such as `api.example.com.team-a.svc.cluster.local` before trying `api.example.com` as an absolute name. That can produce extra DNS queries. The exact sequence depends on the resolver and the Pod's search configuration.

Do not claim a fixed number of failing queries without specifying the resolver, search list, and relevant behavior. See the [Kubernetes DNS documentation](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/) for the Pod configuration context.

### Explaining credentials: AWS STS

> When your CLI calls `AssumeRole`, it asks AWS STS for temporary credentials for the target role. If the request is allowed, STS returns an access key ID, secret access key, session token, and expiration time. The CLI can use that set to sign subsequent AWS requests until it expires.

Use the actual mechanism rather than a ticket-window metaphor or claims that credentials destroy themselves. See [AWS temporary credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html).

### Explaining retention: RDS

> Suppose you set backup retention to seven days. As RDS keeps new recovery points available, older ones age out. A time you could restore to today may fall outside the window tomorrow, even though you haven't changed the setting.
>
> To make that recovery possible, RDS takes automated snapshots during your configured backup window and uploads transaction logs. Together, they let you restore a new DB instance to an available time within the window. Manual snapshots have a separate lifecycle: they stay until you delete them.

The example starts with a setting and the consequence a reader will observe. It then explains the mechanism and separates the nearby concept most likely to cause confusion. Keep the configured schedule and available recovery range explicit. Avoid implying that every requested point is always available or that the diagram exposes RDS's internal backup graph. See [RDS backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html).

### Corrections to the previous guide's examples

The previous “human” examples are superseded. In addition to the corrections above:

- Do not say CoreDNS “only ever” returns one static ClusterIP. Account for address families and distinguish normal ClusterIP Services from headless Services.
- Do not equate connection reuse with DNS caching. A connection pool can keep using an existing connection without making another lookup.
- Do not imply that attaching any label to a Pod automatically adds it to a Service's endpoints. Preserve selector matching and other relevant conditions.
- Do not turn an illustrative EBS storage model into a claim about undocumented RDS internals.

## Review checklist

- [ ] Does the opening give the reader a concrete way into the subject?
- [ ] Is it clear who or what acts, what happens next, and why?
- [ ] Do sentences connect ideas without becoming crowded or repetitive?
- [ ] Does the prose help the visual rather than repeat it?
- [ ] Are labels, controls, and reference entries appropriately concise?
- [ ] Does the explanation show a useful implication without forcing drama?
- [ ] Have scope, conditions, uncertainty, and technical meaning survived the rewrite?
- [ ] Are material caveats easy to find and conceptual models clearly identified?
- [ ] Do headings and structure suit this topic and support quick reference?
- [ ] Can any filler, repeated correction, or unnecessary analogy be removed?

## Applying the guide to existing pages

The RDS Backup Retention rewrite established the first complete page example. It confirmed that a useful opening starts with a concrete configuration or action, explains the consequence the reader can observe, and then introduces the underlying mechanism. Use that approach when it fits the subject; do not force every page to copy the RDS structure.

Apply the style to text embedded in Astro/TypeScript interactive components and catalogue summaries as well as the main prose. Follow repository instructions for canonical content: edit MDX for rebuilt topics and root HTML for legacy topics, never generated `public/` copies.

Preserve technical meaning, sources, stable URLs and section anchors, accessibility, and interaction behavior. Revalidate claims when wording changes their substance or exposes an existing uncertainty. Use the brief's applicable quality checks in proportion to the changes. Do not mark a topic technically reviewed solely because its prose was edited.

Do not create commits or push changes unless explicitly requested.
