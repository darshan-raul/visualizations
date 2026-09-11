# Fullscreen 3D topic tree

- Topic: Infra Illustrated library discovery.
- Status: Integrated, version 2.0; authorized by the user on 2026-09-11.
- Audience: Working developers discovering independently useful infrastructure references.
- Page promise: See the complete library hierarchy at once, fold collection branches, inspect a topic summary, and open a reference.
- Persistent scenario: A reader selects AWS, inspects VPC Packet Flow, follows a related reference, and opens its explanation.
- Scope: Homepage presentation and discovery interactions. The catalogue retains its existing map/list experience.
- Non-goals: Runtime architecture, prerequisites, geographic coordinates, physics simulation, or decorative auto-rotation.
- Visual thesis: A full-viewport branching atlas with genuine perspective and user-controlled orbit; the hierarchy stays legible while branches fold in place.
- Grammar: Existing collection accents; dashed undirected associations, never runtime connections. A visible outline and pressed state mark selection. Depth is a navigation presentation, not importance or technical dependency.

This specification supersedes the earlier two-dimensional and free-form 3D homepage refinements. The existing topic-mesh specification remains the historical record for the shared graph, filters, and catalogue. The confirmed site brief records the user's explicit 3D-tree direction and authorization to integrate directly without another prototype.

## Narrative sequence

| # | Surface | Reader question | Form | Interaction | Takeaway |
|---|---|---|---|---|---|
| 1 | 3D topic tree | What belongs where? | Root, collection branches, and topic leaves projected from XYZ positions | Fold branches; drag or use arrow keys to orbit; zoom and reset | Collection membership is visible without imposing a learning order. |
| 2 | Collection controls | Where are the AWS topics? | Top-right collection buttons | Exclusive collection selection; All clears this group | Only matching nodes and their associations remain. |
| 3 | Topic summary | Is this the reference I need? | Floating right panel | Node selection, related-topic selection, open and close | Read the summary before navigating; inspect why topics relate. |

## Visual 1 — The complete 3D tree

### Purpose
Make the complete library hierarchy the entire landing surface rather than a panel beneath a heading.
### Learner question
“What can I explore, and how do I move through it?”
### Persistent scenario state
The reader arrives with all topics visible and no summary selected.
### Concepts and actors
The Infra Illustrated root connects to four collection nodes. Each collection connects to its real catalogue topics. Root and collection nodes are buttons that fold branches; topic leaves are buttons that open summaries. SVG lines represent parent/child membership, while related-topic evidence remains in the inspector. A perspective camera projects deterministic three-dimensional positions. No filler nodes are invented.
### Composition
The scene fills 100svh, edge to edge. The root sits left of four vertically grouped collection branches; topic leaves fan to the right and through depth. Every branch starts expanded. Brand floats top left; search sits below it. Collection controls float top right. Camera controls and a full-title selector sit bottom left. A catalogue link sits bottom right. Labels remain screen-facing; depth changes scale and stacking. The tree uses a restrained dark background and collection-colored spheres.
### Interaction
Clicking the root folds or opens all topic leaves. Clicking a collection folds or opens only that collection's leaves. Drag with mouse or touch to rotate around two axes. Arrow keys rotate the focused viewport. Plus/minus change zoom; Fit and Reset restore the initial orientation and scale. Movement only occurs in response to input. A five-pixel drag threshold distinguishes orbit from click and suppresses node activation after a drag.
### Data or content states
Seventeen current topics grouped under four collections; titles and counts derive from the catalogue. XYZ positions are deterministic, without a running force simulation. Collapsed state changes visibility while keeping the remaining hierarchy stable.
### Failure or edge state
If JavaScript is unavailable, the server-rendered topic list remains readable and links work. Background labels yield when projected labels overlap; hover, focus, or selection reveals a title, and the full-title selector remains available.
### Required copy
“Drag to rotate · Select a collection to fold its branch · Select a topic for its summary”; “Browse the library”. Collection labels state their topic count and current action. The viewport accessible name includes arrow-key and branch instructions.
### Accuracy caveats
The parent/child lines represent collection membership only. Depth and position do not represent importance, technical dependency, or learning order. Related-topic evidence remains in the inspector. No new infrastructure claims are introduced.
### Mobile behavior
Keep the entire viewport as the stage. Wrap collection controls beneath the brand when space is insufficient; stretch the spatial distribution vertically on narrow screens. Keep touch rotation and browser pinch zoom. Use the native selector to reach an obscured topic.
### Accessibility
Native labeled node buttons, focus rings, keyboard orbit, and native zoom controls. No timing-dependent animation or idle movement; reduced-motion remains supported. Essential content exists in the no-JavaScript list.
### Source anchors
[Reference screenshot/site](https://www.aicodingdictionary.com/), [brief](../../../SITE-REBUILD-BRIEF.md), [graph implementation](../../../src/lib/topic-graph.ts).
### Acceptance checks
Viewport covers the page; all branches begin expanded; root and individual branch folding work; rotation changes projected positions; lines remain attached; orbit does not activate a node; reset is deterministic; narrow widths do not create page-level scrolling.

## Visual 2 — Collection controls

### Purpose
Narrow the visible tree with a single click.
### Learner question
“Can I see only Kubernetes?”
### Persistent scenario state
The reader narrows all references to AWS.
### Concepts and actors
All, AWS, Kubernetes, DevOps & SRE, Foundations; existing advanced filters, query, matching nodes and edges.
### Composition
Compact floating button group top right on desktop, wrapping on narrow screens. Text and pressed state identify each choice, with collection-color dots. Secondary filters remain available below search.
### Interaction
A collection button selects that collection exclusively. All removes collection restrictions and preserves other filters. Advanced filters retain OR-within-group and AND-across-group behavior. Chips remove individual constraints; browser history restores state.
### Data or content states
For the current inventory: AWS 7, Kubernetes 5, DevOps & SRE 3, Foundations 2. Counts are derived, not hard-coded in production.
### Failure or edge state
An empty query/filter intersection shows “No matching topics” with a working clear action. Filtering out the selected node closes its inspector.
### Required copy
Collection names, “All”, “More filters”, “No matching topics”, “Clear filters”.
### Accuracy caveats
Collection membership is metadata, not evidence of a relationship between topics.
### Mobile behavior
Controls wrap while retaining readable labels and native buttons. Search and advanced filters fit within the viewport.
### Accessibility
Group accessible name, aria-pressed choices, live result count, removable named chips, visible keyboard focus.
### Source anchors
[Catalogue constants](../../../src/lib/catalog.ts), [shared controller](../../../src/components/LibraryExplorer.astro).
### Acceptance checks
Each collection shows only its branch and topic leaves; All restores the collection set; URL refresh and history preserve selection; search intersection and clear work.

## Visual 3 — Topic summary

### Purpose
Let readers assess a reference before leaving the map.
### Learner question
“What does this explain, and what is related?”
### Persistent scenario state
VPC Packet Flow is selected and its summary is visible.
### Concepts and actors
Selected node, title, summary, collection, format, difficulty, publication state, open link, related references and evidence.
### Composition
A floating right-hand panel below the filters. The map remains behind it. Use the existing inspector composition and tokens, with internal scrolling when content exceeds the available height.
### Interaction
Click, keyboard-activate, or select a topic by title. Focus moves to the close button. Related-topic buttons replace the inspector selection. Open visual uses the canonical topic URL. Close or Escape hides the panel and restores node focus.
### Data or content states
Summaries and targets come from the content collection. Existing explicit relationship reasons remain visible; hidden connections are counted.
### Failure or edge state
A topic with no matching neighbors still has its summary and open link. Invalid URL selections do not produce an empty broken panel.
### Required copy
“Open visual”, “Close topic details”, full metadata title and summary, relationship reason text.
### Accuracy caveats
No summary or technical claim is rewritten in this change. Draft/legacy state is not upgraded.
### Mobile behavior
The panel fits the available width and height as an overlay with internal scrolling. Collection controls remain above it and closing restores the map.
### Accessibility
Labeled close control, live summary region, native links and buttons, keyboard closing, and focus restoration. It is a nonmodal inspector, not a modal dialog or focus trap.
### Source anchors
[Topic collection](../../../src/content/topics/), [shared inspector](../../../src/components/LibraryExplorer.astro).
### Acceptance checks
Actual node clicks open the correct summary, drag does not; open link is canonical; Escape and close restore focus; long content scrolls inside the viewport.

## Persistent elements, integration, and prototype contract

Canonical homepage: `src/pages/index.astro`. The hierarchy lives in `src/components/TopicTree.astro`; shared filtering and the inspector remain in `src/components/LibraryExplorer.astro`. The tree projection is isolated in `src/components/map/tree-camera.ts`; homepage styles in `src/styles/spatial-home.css` use shared tokens. The catalogue continues to use `src/components/TopicMap.astro`. No additional dependency or global framework is introduced.

The user explicitly requested direct homepage integration without a new prototype. The existing `topic-mesh-3d-visual-prototype.html` records the superseded free-form 3D direction and was not updated for this tree. It remains outside routing, catalogue, and search; production is the only current implementation.

No deep-dive handoffs apply: this is discovery UI, not a technical explainer. The production loop is orient in the hierarchy → fold or filter → orbit/select → inspect → open a reference.

## Page-level acceptance and sources

Run Astro check, build, graph validation, internal-link validation, and browser checks for full-viewport layout, real rotation, all four filters, actual node clicks, Escape, URL restoration, mobile widths from 320 px, reduced motion, and no-JavaScript list fallback. Inspect desktop and mobile screenshots. Safari and physical-device touch testing require additional device access and must not be claimed from Chromium emulation.

Sources: the user's attached reference screenshot and explicit placement requirements; [AI Coding Dictionary](https://www.aicodingdictionary.com/); [confirmed brief](../../../SITE-REBUILD-BRIEF.md); [writing guide](../../../WRITING-GUIDE.md); [visual generator](../../INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md); source anchors above. The spatial projection uses elementary rotation and perspective math; catalogue metadata provides all reader-facing topic facts.
