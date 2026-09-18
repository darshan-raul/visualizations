import { actors, flows, faults, gatePresets, type ActorId, type EdgeKind, type Step, type Flow, type Fault } from './api-server-data';

const byActor = new Map(actors.map((actor) => [actor.id, actor]));
const byFlow = new Map(flows.map((flow) => [flow.id, flow]));
const byFault = new Map(faults.map((fault) => [fault.id, fault]));
const byGate = new Map(gatePresets.map((preset) => [preset.id, preset]));
const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => root.querySelector<T>(selector);
const qa = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => [...root.querySelectorAll<T>(selector)];
const setText = (root: ParentNode, selector: string, value: string) => { const target = q<HTMLElement>(root,selector); if (target) target.textContent = value; };
const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initApiServerConsoles() {
  qa<HTMLElement>(document, '.api-server-console').forEach((console) => initConsole(console));
}

function initConsole(console: HTMLElement) {
  const sections = qa<HTMLElement>(console,'[data-api-view]');
  const links = qa<HTMLAnchorElement>(console,'[data-api-view-link]');
  const maps = qa<HTMLElement>(console,'[data-api-map]');
  let activeIndex = 0;
  const timers = new Set<() => void>();
  const pauseAll = () => timers.forEach((stop) => stop());
  const inspector = (title: string, copy: string, state: string, operation: string, caveat?: string) => {
    setText(console,'[data-api-inspector-title]',title);
    setText(console,'[data-api-inspector-copy]',copy);
    setText(console,'[data-api-inspector-state]',state);
    setText(console,'[data-api-inspector-operation]',operation);
    if (caveat !== undefined) setText(console,'[data-api-inspector-caveat]',caveat);
  };
  const actorFields = (actorId: ActorId) => {
    const actor = byActor.get(actorId);
    if (!actor) return;
    for (const key of ['reads','watches','writes','why','external'] as const) setText(console,`[data-api-actor-field="${key}"]`, key === 'external' ? actor.external || 'No direct external call in this selected relationship' : actor[key]);
  };
  const popoverTriggers = new WeakMap<HTMLElement,HTMLButtonElement>();
  const pinnedPopovers = new WeakSet<HTMLElement>();
  const hoverCloseTimers = new WeakMap<HTMLElement,number>();
  const cancelHoverClose = (map: HTMLElement) => {
    const timer=hoverCloseTimers.get(map);
    if(timer!==undefined)window.clearTimeout(timer);
    hoverCloseTimers.delete(map);
  };
  const hideMapPopover = (map: HTMLElement, restoreFocus=false) => {
    cancelHoverClose(map);
    const popover=q<HTMLElement>(map,'[data-map-popover]');
    pinnedPopovers.delete(map);
    console.classList.remove('is-map-inspecting');
    if(!popover || popover.hidden)return;
    popover.hidden=true;
    qa<HTMLButtonElement>(map,'[data-map-actor]').forEach((button)=>button.setAttribute('aria-expanded','false'));
    const trigger=popoverTriggers.get(map);
    popoverTriggers.delete(map);
    if(restoreFocus)trigger?.focus();
  };
  const positionMapPopover = (map: HTMLElement, trigger: HTMLButtonElement) => {
    const popover=q<HTMLElement>(map,'[data-map-popover]'),viewport=q<HTMLElement>(map,'.api-map-viewport');
    if(!popover || !viewport || popover.hidden || window.matchMedia('(max-width: 720px)').matches)return;
    const mapRect=map.getBoundingClientRect(),triggerRect=trigger.getBoundingClientRect(),viewportRect=viewport.getBoundingClientRect();
    const gap=14,popoverWidth=popover.offsetWidth,popoverHeight=popover.offsetHeight;
    const minX=viewportRect.left-mapRect.left+12,maxX=viewportRect.right-mapRect.left-popoverWidth-12;
    let x=triggerRect.right-mapRect.left+gap;
    if(x>maxX)x=triggerRect.left-mapRect.left-popoverWidth-gap;
    x=Math.max(minX,Math.min(x,maxX));
    const minY=viewportRect.top-mapRect.top+12,maxY=viewportRect.bottom-mapRect.top-popoverHeight-12;
    const y=Math.max(minY,Math.min(triggerRect.top-mapRect.top+(triggerRect.height-popoverHeight)/2,maxY));
    popover.style.setProperty('--popover-x',`${Math.round(x)}px`);
    popover.style.setProperty('--popover-y',`${Math.round(y)}px`);
  };
  const showActorPopover = (map: HTMLElement, trigger: HTMLButtonElement, actorId: ActorId) => {
    const actor=byActor.get(actorId),popover=q<HTMLElement>(map,'[data-map-popover]');
    if(!actor || !popover)return;
    setText(popover,'[data-map-popover-title]',actor.label);
    setText(popover,'[data-map-popover-role]',actor.role);
    for(const key of ['reads','watches','writes','why'] as const)setText(popover,`[data-map-popover-field="${key}"]`,actor[key]);
    const external=q<HTMLElement>(popover,'[data-map-popover-external]');
    if(external){external.hidden=!actor.external;if(actor.external)setText(external,'[data-map-popover-field="external"]',actor.external);}
    setText(popover,'[data-map-popover-mode]',pinnedPopovers.has(map) ? 'PINNED ACTOR' : 'HOVER PREVIEW');
    popover.hidden=false;
    popoverTriggers.set(map,trigger);
    qa<HTMLButtonElement>(map,'[data-map-actor]').forEach((button)=>button.setAttribute('aria-expanded',String(button===trigger)));
    positionMapPopover(map,trigger);
  };
  const clearMap = (map: HTMLElement) => {
    hideMapPopover(map);
    console.classList.remove('is-map-inspecting');
    qa(map,'.is-current,.is-selected,.is-failed').forEach((item) => item.classList.remove('is-current','is-selected','is-failed'));
    qa<HTMLButtonElement>(map,'[data-map-actor]').forEach((item) => {item.setAttribute('aria-pressed','false');item.setAttribute('aria-expanded','false');});
  };
  const queueHoverClose = (map: HTMLElement) => {
    if(pinnedPopovers.has(map))return;
    cancelHoverClose(map);
    hoverCloseTimers.set(map,window.setTimeout(()=>{if(!pinnedPopovers.has(map))clearMap(map);},180));
  };
  const highlight = (map: HTMLElement, from: ActorId, to: ActorId, kind: EdgeKind, text: string, failed=false) => {
    clearMap(map);
    map.dataset.mapState = failed ? 'blocked' : 'selected';
    for (const id of [from,to]) {
      const actor = q<HTMLButtonElement>(map,`[data-map-actor="${id}"]`);
      actor?.classList.add('is-current');
      if (failed && id===to) actor?.classList.add('is-failed');
    }
    const key = `${from}:${to}:${kind}`;
    const path = q<SVGPathElement>(map,`[data-map-path="${key}"]`);
    const edge = q<HTMLButtonElement>(map,`[data-map-edge="${key}"]`);
    path?.classList.add('is-current'); edge?.classList.add('is-current');
    if (failed) { path?.classList.add('is-failed'); edge?.classList.add('is-failed'); }
    setText(map,'[data-map-current-text]',`${failed?'Blocked path':'Selected path'}: ${byActor.get(from)?.label || from} ${kind==='watch'?'··· WATCH ···':'→'} ${byActor.get(to)?.label || to}. ${text}`);
  };
  const selectView = (index: number, push=true) => {
    pauseAll(); maps.forEach((map)=>hideMapPopover(map)); activeIndex=(index+sections.length)%sections.length;
    const section=sections[activeIndex];
    sections.forEach((item,i)=>item.classList.toggle('is-active',i===activeIndex));
    links.forEach((link,i)=>{if(i===activeIndex)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    const group=links[activeIndex]?.closest<HTMLDetailsElement>('[data-api-index-group]');
    qa<HTMLDetailsElement>(console,'[data-api-index-group]').forEach((item)=>item.open=item===group);
    const count=`${String(activeIndex+1).padStart(2,'0')} / ${String(sections.length).padStart(2,'0')}`;
    setText(console,'[data-api-view-count]',count);setText(console,'[data-api-view-counter]',count);
    setText(console,'[data-api-bottom-takeaway]',section.dataset.apiTakeaway || '');
    inspector(section.dataset.apiTitle || '',section.dataset.apiInspector || '',section.dataset.apiTitle || '', 'Choose an actor or stage to inspect its relationship.',section.dataset.apiCaveat || '');
    actorFields(activeIndex===0?'client':'api');
    setText(console,'[data-api-scenario-object]',section.id==='exchange'?'Deployment request prepared':'Deployment/demo/web');
    setText(console,'[data-api-desired]','3');
    setText(console,'[data-api-observed]',section.id==='exchange'||section.id==='request-gates'?'0':'3');
    setText(console,'[data-api-owner]',activeIndex===0?'API client':'Selected mechanism');
    if (push && location.hash!==`#${section.id}`) history.pushState(null,'',`#${section.id}`);
  };
  links.forEach((link,index)=>link.addEventListener('click',()=>selectView(index,false)));
  q(console,'[data-api-view-prev]')?.addEventListener('click',()=>selectView(activeIndex-1));
  q(console,'[data-api-view-next]')?.addEventListener('click',()=>selectView(activeIndex+1));
  const syncLocation = () => {
    const index=sections.findIndex((section)=>section.id===location.hash.slice(1));
    if(index>=0)selectView(index,false);
    const flowId=new URL(location.href).searchParams.get('flow');
    if(flowId && byFlow.has(flowId)) flowSelect(flowId,false);
  };
  window.addEventListener('hashchange',syncLocation);
  window.addEventListener('popstate',syncLocation);

  maps.forEach((map)=>{
    const inspectActor=(button:HTMLButtonElement,pin=false)=>{
      if(pin)pauseAll();
      clearMap(map);
      console.classList.add('is-map-inspecting');
      map.dataset.mapState = 'selected';
      const id=button.dataset.mapActor as ActorId, actor=byActor.get(id);
      if(!actor)return;
      if(pin)pinnedPopovers.add(map);
      button.classList.add('is-selected');button.setAttribute('aria-pressed','true');
      actorFields(id);
      inspector(actor.label,actor.role,actor.short,`Reads: ${actor.reads}. Watches: ${actor.watches}. Writes: ${actor.writes}.`,actor.external ? `Direct external call: ${actor.external}` : sections[activeIndex].dataset.apiCaveat || '');
      setText(map,'[data-map-current-text]',`Selected actor: ${actor.label}. ${actor.role}`);
      showActorPopover(map,button,id);
    };
    qa<HTMLButtonElement>(map,'[data-map-actor]').forEach((button)=>{
      button.addEventListener('click',()=>inspectActor(button,true));
      button.addEventListener('mouseenter',()=>{if(window.matchMedia('(hover: hover) and (pointer: fine)').matches&&!pinnedPopovers.has(map))inspectActor(button);});
      button.addEventListener('mouseleave',()=>queueHoverClose(map));
    });
    qa<HTMLButtonElement>(map,'[data-map-edge]').forEach((button)=>button.addEventListener('click',()=>{
      pauseAll();
      console.classList.remove('is-map-inspecting');
      const from=button.dataset.edgeFrom as ActorId,to=button.dataset.edgeTo as ActorId,kind=button.dataset.edgeKind as EdgeKind;
      highlight(map,from,to,kind,button.dataset.edgeLabel || kind);
      actorFields(from);
      inspector(`${byActor.get(from)?.label} → ${byActor.get(to)?.label}`,`${button.dataset.edgeLabel || kind}. ${byActor.get(from)?.role || ''}`,'Relationship selected',`${kind.toUpperCase()} · ${button.dataset.edgeLabel || ''}`,sections[activeIndex].dataset.apiCaveat || '');
    }));
    const popover=q<HTMLElement>(map,'[data-map-popover]');
    popover?.addEventListener('mouseenter',()=>cancelHoverClose(map));
    popover?.addEventListener('mouseleave',()=>queueHoverClose(map));
    q<HTMLButtonElement>(map,'[data-map-popover-close]')?.addEventListener('click',()=>hideMapPopover(map,true));
    q<HTMLElement>(map,'.api-map-viewport')?.addEventListener('click',(event)=>{if(!(event.target as Element).closest('[data-map-actor],[data-map-edge]'))hideMapPopover(map);});
  });
  qa<HTMLButtonElement>(console,'[data-actor-shortcut]').forEach((shortcut)=>shortcut.addEventListener('click',()=>{
    const map=q<HTMLElement>(sections[activeIndex],'[data-api-map]');
    q<HTMLButtonElement>(map || console,`[data-map-actor="${shortcut.dataset.actorShortcut}"]`)?.click();
  }));

  const actorGroups: Record<string, ActorId[]> = {
    humans: ['client'],
    control: ['endpoint','api','etcd','controller','scheduler'],
    nodes: ['node-a','node-b','runtime','pod'],
    networking: ['api','controller','proxy','pod'],
    storage: ['api','csi','provider','node-a'],
    autoscaling: ['metrics','controller','api'],
    extensions: ['operator','webhook','aggregated','api'],
    external: ['cloud','csi','operator','provider','webhook','aggregated','metrics'],
  };
  qa<HTMLButtonElement>(console,'[data-map-filter]').forEach((button)=>button.addEventListener('click',()=>{
    const filter=button.dataset.mapFilter || 'all';
    const lab=button.closest<HTMLElement>('.api-conversation-lab');
    const map=q<HTMLElement>(lab?.closest('[data-api-view]') || console,'[data-api-map]');
    if(!map)return;
    qa<HTMLButtonElement>(lab || console,'[data-map-filter]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));
    const matches=new Set(filter==='all'?actors.map((actor)=>actor.id):actorGroups[filter] || []);
    qa<HTMLButtonElement>(map,'[data-map-actor]').forEach((actor)=>{
      const match=matches.has(actor.dataset.mapActor as ActorId);
      actor.classList.toggle('is-filter-match',match&&filter!=='all');
      actor.classList.toggle('is-filter-muted',!match&&filter!=='all');
    });
    map.dataset.filter=filter;
    setText(map,'[data-map-current-text]',filter==='all'?'Actor filter cleared. Select any component or relationship.':`${button.textContent?.trim()} actors highlighted. Select one to inspect what it reads, watches and writes.`);
    map.dataset.mapState = filter === 'all' ? 'selected' : 'filtered';
  }));

  const renderStep = (map: HTMLElement, step: Step, label: string, index: number, total: number, failed=false) => {
    highlight(map,step.from,step.to,step.kind,step.operation,failed);
    actorFields(step.from);
    inspector(label,step.detail,step.state,`${step.operation} · ${step.object}`,sections[activeIndex].dataset.apiCaveat || '');
    setText(console,'[data-api-scenario-object]',step.object);
    if(step.desired!==undefined)setText(console,'[data-api-desired]',String(step.desired));
    if(step.observed!==undefined)setText(console,'[data-api-observed]',String(step.observed));
    setText(console,'[data-api-owner]',byActor.get(step.from)?.label || step.from);
    setText(map.closest('[data-api-view]') || console,'[data-api-canvas-state]',`${label.toUpperCase()} · STEP ${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`);
  };

  // The flow selector changes state on the same topology. Only the Deployment trace autoplays.
  const flowLab=q<HTMLElement>(console,'[data-api-flow-lab]')!;
  const flowMap=q<HTMLElement>(flowLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const flowInput=q<HTMLSelectElement>(flowLab,'[data-flow-select]')!;
  const flowTimeline=q<HTMLOListElement>(flowLab,'[data-flow-timeline]')!;
  const flowPlay=q<HTMLButtonElement>(flowLab,'[data-flow-play]')!;
  let selectedFlow: Flow=flows[0], flowIndex=0, flowTimer:number|undefined;
  const stopFlow=()=>{if(flowTimer)window.clearInterval(flowTimer);flowTimer=undefined;flowPlay.textContent='▶ Play Deployment';};timers.add(stopFlow);
  const flowStage=(index:number)=>{
    flowIndex=Math.max(0,Math.min(selectedFlow.steps.length-1,index));
    const step=selectedFlow.steps[flowIndex];
    qa<HTMLButtonElement>(flowTimeline,'[data-flow-step]').forEach((button,i)=>{button.classList.toggle('is-active',i===flowIndex);if(i===flowIndex)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    flowMap.dataset.depth=selectedFlow.group;
    renderStep(flowMap,step,selectedFlow.title,flowIndex,selectedFlow.steps.length);
    const summaryEl=q<HTMLElement>(flowLab,'[data-flow-summary]');
    if(summaryEl){const strong=summaryEl.querySelector('strong'),p=summaryEl.querySelector('p');if(strong&&p){strong.textContent=`${String(flowIndex+1).padStart(2,'0')} · ${step.label}`;p.textContent=step.detail;}else{summaryEl.textContent=`${String(flowIndex+1).padStart(2,'0')} · ${step.label}: ${step.detail}`;}}
    setText(flowLab,'[data-flow-operation]',step.operation);
    setText(flowLab,'[data-flow-yaml]',step.yaml || `${step.object}\n${step.state}`);
    setText(flowLab,'[data-flow-ledger-object]',step.object);
    setText(flowLab,'[data-flow-ledger-state]',step.state);
    setText(flowLab,'[data-flow-ledger-desired]',String(step.desired ?? '—'));
    setText(flowLab,'[data-flow-ledger-ready]',String(step.observed ?? '—'));
    setText(console,'[data-api-bottom-takeaway]',selectedFlow.takeaway);
  };
  const flowSelect=(id:string,push=true)=>{
    const next=byFlow.get(id);if(!next)return;
    stopFlow();selectedFlow=next;flowInput.value=id;flowIndex=0;
    flowPlay.disabled=id!=='deployment';flowPlay.title=id==='deployment'?'Play or pause the Deployment hero trace':'Inspect this flow with manual steps';
    setText(flowLab,'[data-flow-title]',next.title);setText(flowLab,'[data-flow-question]',next.question);
    flowTimeline.replaceChildren(...next.steps.map((step,i)=>{const li=document.createElement('li'),button=document.createElement('button'),number=document.createElement('span');button.type='button';button.dataset.flowStep=String(i);number.textContent=String(i+1).padStart(2,'0');button.append(number,step.label);button.addEventListener('click',()=>{stopFlow();flowStage(i);});li.append(button);return li;}));
    flowStage(0);
    if(push){const url=new URL(location.href);url.searchParams.set('flow',id);url.hash='flow-lab';history.pushState(null,'',url);if(activeIndex!==sections.findIndex((section)=>section.id==='flow-lab'))selectView(sections.findIndex((section)=>section.id==='flow-lab'),false);}
  };
  flowInput.addEventListener('change',()=>flowSelect(flowInput.value));
  q(flowLab,'[data-flow-first]')?.addEventListener('click',()=>{stopFlow();flowStage(0);});
  q(flowLab,'[data-flow-prev]')?.addEventListener('click',()=>{stopFlow();flowStage(flowIndex-1);});
  q(flowLab,'[data-flow-next]')?.addEventListener('click',()=>{stopFlow();flowStage(flowIndex+1);});
  q(flowLab,'[data-flow-last]')?.addEventListener('click',()=>{stopFlow();flowStage(selectedFlow.steps.length-1);});
  q(flowLab,'[data-flow-reset]')?.addEventListener('click',()=>{stopFlow();flowStage(0);});
  flowPlay.addEventListener('click',()=>{if(flowTimer){stopFlow();return;}if(isReduced()){flowStage(selectedFlow.steps.length-1);return;}flowStage(0);flowPlay.textContent='Ⅱ Pause Deployment';const speed=Number(q<HTMLSelectElement>(flowLab,'[data-flow-speed]')?.value || 1);flowTimer=window.setInterval(()=>{if(flowIndex>=selectedFlow.steps.length-1){stopFlow();return;}flowStage(flowIndex+1);},Math.round(1050*speed));});
  flowTimeline.addEventListener('keydown',(event)=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();stopFlow();flowStage(flowIndex+(event.key==='ArrowRight'?1:-1));q<HTMLButtonElement>(flowTimeline,`[data-flow-step="${flowIndex}"]`)?.focus();}if(event.code==='Space'&&event.target===flowTimeline){event.preventDefault();flowPlay.click();}});

  // Faults retain healthy actors while the current failed path is marked by text and a broken connector.
  const faultLab=q<HTMLElement>(console,'[data-api-failure-lab]')!;
  const faultMap=q<HTMLElement>(faultLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const faultInput=q<HTMLSelectElement>(faultLab,'[data-fault-select]')!;
  const faultTimeline=q<HTMLOListElement>(faultLab,'[data-fault-timeline]')!;
  const faultPlay=q<HTMLButtonElement>(faultLab,'[data-fault-play]')!;
  const faultEvidence:Record<string,string>={
    pod:'kubectl get pod web-b -o custom-columns=NAME:.metadata.name,UID:.metadata.uid,READY:.status.containerStatuses[0].ready,RESTARTS:.status.containerStatuses[0].restartCount\nkubectl describe pod web-b\n# UID stays the same; restartCount rises',
    node:'kubectl get node worker-b\nkubectl get lease -n kube-node-lease worker-b -o yaml\nkubectl get pods -A --field-selector spec.nodeName=worker-b',
    controller:'kubectl get deployment,rs,pod -n demo\nkubectl get lease -n kube-system\n# Desired state changes, but dependent objects stop progressing',
    scheduler:'kubectl get pod web-d -o wide\nkubectl describe pod web-d\n# PodScheduled=False and scheduling Events explain the stall',
    api:'kubectl get --raw=/readyz?verbose\n# Client connection failures plus disconnected watches separate API loss from workload loss',
    'api-replica':'Check control-plane endpoint health and each /readyz result\n# Requests continue through healthy serving replicas',
    webhook:'kubectl get validatingwebhookconfigurations,mutatingwebhookconfigurations\nInspect apiserver admission latency/rejection metrics and audit records',
    rbac:'kubectl auth can-i create deployments -n demo --as alice\n# 403 means identity was known but this operation was not allowed',
    etcd:'Check kube-apiserver /readyz and storage latency/error metrics\nCheck etcd endpoint status and quorum before changing membership',
    overload:'Inspect apiserver_flowcontrol_* metrics, request latency and 429 responses\nIdentify the FlowSchema and noisy client before tuning',
    proxy:'kubectl get service,endpointslice -n demo\nInspect the selected Service dataplane implementation on the affected Node',
  };
  let selectedFault:Fault=faults[0],faultIndex=0,faultTimer:number|undefined;
  const stopFault=()=>{if(faultTimer)window.clearInterval(faultTimer);faultTimer=undefined;faultPlay.textContent='▶ Play fault';};timers.add(stopFault);
  const faultStage=(index:number)=>{
    faultIndex=Math.max(0,Math.min(selectedFault.steps.length-1,index));const step=selectedFault.steps[faultIndex];
    qa<HTMLButtonElement>(faultTimeline,'[data-fault-step]').forEach((button,i)=>{button.classList.toggle('is-active',i===faultIndex);if(i===faultIndex)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    const broken=/EXIT|STOP|ERROR|TIMEOUT|NOT REACHED|POWER LOSS|unavailable|fail|forbidden|denied|reject|degraded|stalled|429/i.test(`${step.operation} ${step.state}`);
    faultMap.dataset.depth='internals';renderStep(faultMap,step,selectedFault.label,faultIndex,selectedFault.steps.length,broken);
    if(broken)q<HTMLButtonElement>(faultMap,`[data-map-actor="${selectedFault.actor}"]`)?.classList.add('is-failed');
    setText(faultLab,'[data-fault-summary]',`${step.label}: ${step.detail}. ${step.state}.`);
    setText(console,'[data-api-bottom-takeaway]',`${selectedFault.label}: ${selectedFault.stops}; ${selectedFault.continues}.`);
  };
  const faultSelect=(id:string)=>{
    const next=byFault.get(id);if(!next)return;stopFault();selectedFault=next;faultInput.value=id;faultIndex=0;
    faultPlay.disabled=!['pod','api'].includes(id);faultPlay.title=faultPlay.disabled?'Inspect this fault with manual steps':'Play or pause this hero failure trace';
    setText(faultLab,'[data-fault-title]',next.label);
    setText(faultLab,'[data-fault-evidence]',faultEvidence[id] || 'Inspect the changed object, the first detector and the component that owns the next transition.');
    for(const key of ['stops','continues','detector','object','reactor','traffic','recovery'] as const)setText(faultLab,`[data-fault-field="${key}"]`,next[key]);
    faultTimeline.replaceChildren(...next.steps.map((step,i)=>{const li=document.createElement('li'),button=document.createElement('button'),number=document.createElement('span');button.type='button';button.dataset.faultStep=String(i);number.textContent=String(i+1).padStart(2,'0');button.append(number,step.label);button.addEventListener('click',()=>{stopFault();faultStage(i);});li.append(button);return li;}));
    faultStage(0);
  };
  faultInput.addEventListener('change',()=>faultSelect(faultInput.value));
  q(faultLab,'[data-fault-first]')?.addEventListener('click',()=>{stopFault();faultStage(0);});
  q(faultLab,'[data-fault-prev]')?.addEventListener('click',()=>{stopFault();faultStage(faultIndex-1);});
  q(faultLab,'[data-fault-next]')?.addEventListener('click',()=>{stopFault();faultStage(faultIndex+1);});
  q(faultLab,'[data-fault-reset]')?.addEventListener('click',()=>{stopFault();faultStage(0);});
  faultPlay.addEventListener('click',()=>{if(faultTimer){stopFault();return;}if(isReduced()){faultStage(selectedFault.steps.length-1);return;}faultStage(0);faultPlay.textContent='Ⅱ Pause fault';faultTimer=window.setInterval(()=>{if(faultIndex>=selectedFault.steps.length-1){stopFault();return;}faultStage(faultIndex+1);},1200);});
  faultTimeline.addEventListener('keydown',(event)=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();stopFault();faultStage(faultIndex+(event.key==='ArrowRight'?1:-1));q<HTMLButtonElement>(faultTimeline,`[data-fault-step="${faultIndex}"]`)?.focus();}});

  // Request processing has a write sequence and a shorter read sequence; later gates never appear as reached after denial.
  const gateLab=q<HTMLElement>(console,'[data-api-gate-lab]')!;
  const gateMap=q<HTMLElement>(gateLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const gateRail=q<HTMLOListElement>(gateLab,'[data-gate-rail]')!;
  const gateInput=q<HTMLSelectElement>(gateLab,'[data-gate-preset]')!;
  const gatePlay=q<HTMLButtonElement>(gateLab,'[data-gate-play]')!;
  const writeGates=['TLS / API route','Authentication','Authorization','Mutating admission','Validating admission','Resource processing','Persistence'];
  const readGates=['TLS / API route','Authentication','Authorization','API response'];
  const failureIndex:Record<string,number>={'bad-credential':1,rbac:2,namespace:5,quota:4,podsecurity:4,'webhook-deny':4,'webhook-timeout':3,malformed:5,conflict:5,overload:0};
  let gateMode:'write'|'read'='write',gateIndex=0,gateTimer:number|undefined;
  const stopGate=()=>{if(gateTimer)window.clearInterval(gateTimer);gateTimer=undefined;gatePlay.textContent='▶ Play gates';};timers.add(stopGate);
  const gateStage=(index:number)=>{
    const stages=gateMode==='write'?writeGates:readGates;
    const candidate=byGate.get(gateInput.value);
    const preset=gateMode==='write'||['none','bad-credential','rbac','overload'].includes(gateInput.value)?candidate:undefined;
    const blockAt=preset && preset.id!=='none'?failureIndex[preset.id]:undefined;
    gateIndex=Math.max(0,Math.min(stages.length-1,blockAt===undefined?index:Math.min(index,blockAt)));
    qa<HTMLElement>(gateRail,'[data-gate]').forEach((item,i)=>{item.classList.toggle('is-passed',i<gateIndex);item.classList.toggle('is-current',i===gateIndex);item.classList.toggle('is-blocked',blockAt===i&&gateIndex===i);item.classList.toggle('is-not-reached',blockAt!==undefined&&i>blockAt);});
    const blocked=blockAt!==undefined&&gateIndex===blockAt;
    const result=blocked?`${stages[gateIndex]} BLOCKED · ${preset?.result}. ${preset?.detail} NOT REACHED: ${gateMode==='read'?'API response':preset?.notReached}.`:gateMode==='read'?`${stages[gateIndex]}: ${gateIndex===3?'Authorized API read returns a response; ordinary admission and write persistence are not part of this path.':'Request continues after this conceptual check.'}`:gateIndex===stages.length-1?'Accepted object is committed as shared state; controllers may now observe it.':`${stages[gateIndex]} passed in this fixture; later gates have not run yet.`;
    setText(gateLab,'[data-gate-result]',`${gateMode.toUpperCase()} REQUEST · STEP ${gateIndex+1} / ${stages.length}. ${result}`);
    setText(console,'[data-api-scenario-object]',blocked?'Deployment absent':gateMode==='read'?'GET demo Pods':'Deployment request in processing');
    setText(console,'[data-api-observed]','0');
    setText(console,'[data-api-desired]','3');
    setText(console,'[data-api-owner]','alice / kubectl');
    highlight(gateMap,'client','api','api',stages[gateIndex],blocked);
    if(gateMode==='write'&&gateIndex===stages.length-1&&!blocked)highlight(gateMap,'api','etcd','store','Accepted state committed');
    inspector(stages[gateIndex],result,blocked?`${preset?.result}`:gateIndex===stages.length-1?'Request complete':'Request processing',`Stage ${gateIndex+1}/${stages.length}`, 'This is a teaching order, not every kube-apiserver handler call.');
    setText(gateLab.closest('[data-api-view]') || console,'[data-api-canvas-state]',blocked?`BLOCKED · ${stages[gateIndex].toUpperCase()}`:`${gateMode.toUpperCase()} · GATE ${gateIndex+1}/${stages.length}`);
  };
  const renderGates=()=>{const names=gateMode==='write'?writeGates:readGates;gateRail.replaceChildren(...names.map((name,i)=>{const li=document.createElement('li'),strong=document.createElement('strong'),span=document.createElement('span'),small=document.createElement('small');li.dataset.gate=String(i);strong.textContent=String(i+1).padStart(2,'0');span.textContent=name;small.textContent=i===names.length-1?(gateMode==='read'?'RETURN':'COMMIT'):'CHECK';li.append(strong,span,small);return li;}));gateStage(0);};
  qa<HTMLButtonElement>(gateLab,'[data-gate-mode]').forEach((button)=>button.addEventListener('click',()=>{stopGate();gateMode=button.dataset.gateMode as 'write'|'read';qa<HTMLButtonElement>(gateLab,'[data-gate-mode]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));qa<HTMLOptionElement>(gateInput,'option').forEach((option)=>option.disabled=gateMode==='read'&&!['none','bad-credential','rbac','overload'].includes(option.value));if(gateMode==='read'&&!['none','bad-credential','rbac','overload'].includes(gateInput.value))gateInput.value='none';renderGates();}));
  gateInput.addEventListener('change',()=>{stopGate();gateStage(0);});
  q(gateLab,'[data-gate-reset]')?.addEventListener('click',()=>{stopGate();gateStage(0);});
  q(gateLab,'[data-gate-prev]')?.addEventListener('click',()=>{stopGate();gateStage(gateIndex-1);});
  q(gateLab,'[data-gate-next]')?.addEventListener('click',()=>{stopGate();gateStage(gateIndex+1);});
  gatePlay.addEventListener('click',()=>{if(gateTimer){stopGate();return;}if(isReduced()){gateStage((gateMode==='write'?writeGates:readGates).length-1);return;}gateStage(0);gatePlay.textContent='Ⅱ Pause gates';gateTimer=window.setInterval(()=>{const length=(gateMode==='write'?writeGates:readGates).length;const old=gateIndex;gateStage(gateIndex+1);if(gateIndex===old||gateIndex>=length-1)stopGate();},1100);});

  const watchLab=q<HTMLElement>(console,'[data-api-watch-lab]')!;
  const watchMap=q<HTMLElement>(watchLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const watchPairs:[ActorId,ActorId,EdgeKind,string][]=[['controller','api','api','LIST Deployments'],['controller','api','watch','WATCH from resourceVersion 10245'],['api','controller','watch','MODIFIED event 11020'],['controller','api','api','Reconcile then write if needed']];
  let watchIndex=0;
  const watchStageObjects=['Deployment/demo/web','resourceVersion 10245','MODIFIED 11020','queue: demo/web'];
  const watchStage=(index:number)=>{watchIndex=Math.max(0,Math.min(3,index));qa(watchLab,'[data-watch-step]').forEach((item,i)=>item.classList.toggle('is-current',i===watchIndex));const [from,to,kind,operation]=watchPairs[watchIndex];highlight(watchMap,from,to,kind,operation);setText(console,'[data-api-scenario-object]',watchStageObjects[watchIndex]);setText(console,'[data-api-desired]','3');setText(console,'[data-api-observed]','0');setText(console,'[data-api-owner]',byActor.get(from)?.label||from);inspector('LIST / WATCH',`${operation}. ${watchIndex===3?'The work queue triggers a compare-and-act loop.':'A client can follow later changes without repeated polling.'}`,'resourceVersion 10245 → 11020',operation,'A too-old watch requires re-LIST after 410 Gone.');};
  q(watchLab,'[data-watch-prev]')?.addEventListener('click',()=>watchStage(watchIndex-1));
  q(watchLab,'[data-watch-next]')?.addEventListener('click',()=>watchStage(watchIndex+1));
  q(watchLab,'[data-watch-reset]')?.addEventListener('click',()=>watchStage(0));

  const stateLab=q<HTMLElement>(console,'[data-api-state-lab]')!;
  const stateMap=q<HTMLElement>(stateLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const reconcileCases={
    stable:{existing:3,ready:3,pods:'web-a · web-b · web-c',identity:'3 existing · 3 Ready',owner:'ReplicaSet controller',decision:'No write needed',result:'Desired count and existing active Pods match. Reconciliation can finish without changing API state.',yaml:'Deployment/web → ReplicaSet/web-7c9 → Pods [web-a, web-b, web-c]\ndesired: 3 · existing: 3 · ready: 3',from:'api' as ActorId,to:'controller' as ActorId,kind:'watch' as EdgeKind},
    container:{existing:3,ready:2,pods:'web-a · web-b · web-c',identity:'3 existing · 2 Ready · web-b restartCount +1',owner:'kubelet · worker-b',decision:'Restart container in the same Pod',result:'ReplicaSet still sees three active Pods, so it does not create web-d. Kubelet applies restartPolicy locally; readiness controls traffic eligibility.',yaml:'Pod/web-b\nmetadata.uid: 6e2… (unchanged)\nstatus.containerStatuses[0]:\n  ready: false\n  restartCount: 1',from:'node-b' as ActorId,to:'runtime' as ActorId,kind:'local' as EdgeKind},
    delete:{existing:2,ready:2,pods:'web-a · web-c · web-d (new)',identity:'web-b deleted · web-d has a new UID',owner:'ReplicaSet controller',decision:'Create one replacement Pod',result:'Deletion removes web-b from the active set. ReplicaSet sees two active Pods for desired=3 and creates a new Pod object.',yaml:'ReplicaSet/web-7c9\nspec.replicas: 3\nactive Pods: [web-a, web-c]\n→ CREATE Pod/web-d',from:'controller' as ActorId,to:'api' as ActorId,kind:'api' as EdgeKind},
    paused:{existing:2,ready:2,pods:'web-a · web-c',identity:'gap persists while controller is unavailable',owner:'No active ReplicaSet reconciliation',decision:'No repair until the loop resumes',result:'The API can retain desired=3 while observed active Pods remain at two. Stored intent alone does not execute recovery.',yaml:'Deployment/web desired: 3\nReplicaSet/web-7c9 active: 2\ncondition: reconciliation stalled',from:'api' as ActorId,to:'controller' as ActorId,kind:'watch' as EdgeKind},
  };
  qa<HTMLButtonElement>(stateLab,'[data-reconcile-case]').forEach((button)=>button.addEventListener('click',()=>{const key=button.dataset.reconcileCase as keyof typeof reconcileCases;const state=reconcileCases[key];if(!state)return;qa<HTMLButtonElement>(stateLab,'[data-reconcile-case]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));setText(stateLab,'[data-state-pods]',state.pods);setText(stateLab,'[data-state-identity]',state.identity);setText(stateLab,'[data-state-existing]',`${state.existing} existing`);setText(stateLab,'[data-state-ready]',`${state.ready} ready`);setText(stateLab,'[data-state-owner]',state.owner.toUpperCase());setText(stateLab,'[data-state-decision]',state.decision);setText(stateLab,'[data-state-result]',state.result);setText(stateLab,'[data-pod-yaml]',state.yaml);const existingMeter=q<HTMLMeterElement>(stateLab,'[data-state-existing-meter]'),readyMeter=q<HTMLMeterElement>(stateLab,'[data-state-meter]');if(existingMeter)existingMeter.value=state.existing;if(readyMeter)readyMeter.value=state.ready;setText(console,'[data-api-observed]',String(state.ready));setText(console,'[data-api-scenario-object]',key==='delete'?'ReplicaSet/web-7c9':'Pod/web-b');setText(console,'[data-api-owner]',state.owner);highlight(stateMap,state.from,state.to,state.kind,state.decision,key==='paused');inspector('Reconciliation decision',state.result,`${state.existing} existing · ${state.ready} ready`,state.decision,'Existing and Ready are different counts; a container restart is not a replacement Pod.');}));

  const placementLab=q<HTMLElement>(console,'[data-api-placement-lab]')!;
  const placementMap=q<HTMLElement>(placementLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const renderPlacement=()=>{
    const cpu=Number(q<HTMLSelectElement>(placementLab,'[data-place-cpu]')?.value || 500);
    const tolerates=q<HTMLInputElement>(placementLab,'[data-place-toleration]')?.checked || false;
    const image=q<HTMLInputElement>(placementLab,'[data-place-image]')?.checked || false;
    const ready=q<HTMLInputElement>(placementLab,'[data-place-ready]')?.checked || false;
    const aFits=cpu<=2000,bFits=cpu<=4000&&tolerates,chosen=aFits?'worker-a':bFits?'worker-b':'';
    setText(placementLab,'[data-place-verdict="a"]',aFits?'FEASIBLE':'FILTERED · CPU');
    setText(placementLab,'[data-place-verdict="b"]',cpu>4000?'FILTERED · CPU':tolerates?'FEASIBLE':'FILTERED · TAINT');
    qa<HTMLElement>(placementLab,'[data-place-node]').forEach((node)=>node.classList.toggle('is-chosen',node.dataset.placeNode===(chosen==='worker-a'?'a':'b')));
    let state='PENDING · UNSCHEDULED',title='No Node satisfies the current request and constraints',explanation='Scheduler leaves spec.nodeName unset and records a FailedScheduling event.',evidence=`kubectl describe pod web-a\nPodScheduled=False\nWarning  FailedScheduling  0/2 nodes are available`,stage=1;
    if(chosen&&!image){state='PENDING · IMAGE PULL',title=`Bound to ${chosen}; container cannot start`,explanation='Scheduling succeeded. Kubelet owns the next failure and reports an image pull error.',evidence=`kubectl get pod web-a -o wide\nweb-a  0/1  ImagePullBackOff  ${chosen}\n\nkubectl describe pod web-a`,stage=2;}
    else if(chosen&&image&&!ready){state='RUNNING · NOT READY',title=`Running on ${chosen}; excluded from ready endpoints`,explanation='The container runs, but readiness is false. Kubelet keeps probing and the Pod is not an eligible ready backend.',evidence=`kubectl get pod web-a\nweb-a  0/1  Running\n\nPodScheduled=True · Ready=False`,stage=3;}
    else if(chosen&&image&&ready){state='RUNNING · READY',title=`Scheduled to ${chosen} and eligible for Service traffic`,explanation='Scheduler recorded the binding. Kubelet started the container and reported readiness separately.',evidence=`kubectl get pod web-a -o wide\nweb-a  1/1  Running  0  ${chosen}\n\nPodScheduled=True · Ready=True`,stage=4;}
    setText(placementLab,'[data-place-schedule]',chosen?`${chosen} selected`:'no feasible Node');setText(placementLab,'[data-place-prepare]',!chosen?'not reached':image?'image and sandbox ready':'ImagePullBackOff');setText(placementLab,'[data-place-run]',!chosen||!image?'not reached':'container Running');setText(placementLab,'[data-place-ready-copy]',stage===4?'eligible endpoint':stage===3?'Ready=False · excluded':'not reached');
    qa<HTMLElement>(placementLab,'[data-place-stage]').forEach((item,index)=>{item.classList.toggle('is-complete',index<stage);item.classList.toggle('is-current',index===stage);item.classList.toggle('is-not-reached',index>stage);});
    setText(placementLab,'[data-place-state]',state);setText(placementLab,'[data-place-title]',title);setText(placementLab,'[data-place-explanation]',explanation);setText(placementLab,'[data-place-evidence]',evidence);
    if(!chosen)highlight(placementMap,'scheduler','api','api','FailedScheduling',true);else if(!image)highlight(placementMap,chosen==='worker-a'?'node-a':'node-b','runtime','local','Image pull failed',true);else if(!ready)highlight(placementMap,chosen==='worker-a'?'node-a':'node-b','api','status','Ready=False');else highlight(placementMap,chosen==='worker-a'?'node-a':'node-b','api','status','Ready=True');
    setText(console,'[data-api-scenario-object]','Pod/web-a');setText(console,'[data-api-observed]',stage===4?'1':'0');setText(console,'[data-api-owner]',!chosen?'Scheduler':stage<3?`kubelet · ${chosen}`:'kubelet / EndpointSlice consumers');inspector('Placement to readiness',explanation,state,title,'Scheduling, execution and endpoint readiness are separate transitions.');
  };
  qa<HTMLInputElement|HTMLSelectElement>(placementLab,'input,select').forEach((control)=>control.addEventListener('change',renderPlacement));

  const planeLab=q<HTMLElement>(console,'[data-api-dataplane-lab]')!;
  const planeMap=q<HTMLElement>(planeLab.closest('[data-api-view]')!,'[data-api-map]')!;
  qa<HTMLInputElement>(planeLab,'input[name="api-plane"]').forEach((input)=>input.addEventListener('change',()=>{if(!input.checked)return;planeMap.dataset.plane=input.value;const result=input.value==='control'?'Controller writes EndpointSlice through API; Service proxy watches that API object.':input.value==='data'?'Client HTTP traverses Service forwarding to a Pod. It does not use kube-apiserver as a packet hop.':'API state configures the forwarding implementation; workload traffic follows the separate node dataplane.';setText(planeLab,'[data-plane-result]',result);if(input.value==='data')highlight(planeMap,'client','pod','data','HTTP via Service forwarding');else highlight(planeMap,'api','proxy','watch','WATCH EndpointSlices');inspector('Control plane versus data plane',result,input.value.toUpperCase(),input.value==='data'?'HTTP DATA PLANE':'WATCH EndpointSlices','kube-proxy is optional when another Service proxy implementation is used.');}));

  const haLab=q<HTMLElement>(console,'[data-api-ha-lab]')!;
  const haMap=q<HTMLElement>(haLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const haResults:Record<string,string>={healthy:'API1, API2 and API3 can serve requests concurrently. Scheduler/controller-manager leadership is separate Lease coordination.',replica:'API2 failed. A healthy endpoint can route to API1 or API3; serving does not wait for one elected API leader.',endpoint:'The client endpoint is unavailable, so healthy API replicas may be unreachable from clients.',etcd:'Durable backing state is degraded. Multiple serving replicas cannot by themselves repair the shared storage dependency.'};
  qa<HTMLButtonElement>(haLab,'[data-ha-choice]').forEach((button)=>button.addEventListener('click',()=>{const choice=button.dataset.haChoice || 'healthy';qa<HTMLButtonElement>(haLab,'[data-ha-choice]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));qa<HTMLElement>(haLab,'[data-ha-replica]').forEach((item)=>{item.classList.toggle('is-failed',choice==='replica'&&item.dataset.haReplica==='2');item.textContent=`API${item.dataset.haReplica} · ${choice==='replica'&&item.dataset.haReplica==='2'?'FAILED':'SERVING'}`;});setText(haLab,'[data-ha-etcd]',choice==='etcd'?'etcd · DEGRADED':'etcd · HEALTHY');setText(haLab,'[data-ha-result]',haResults[choice]);if(choice==='healthy'){clearMap(haMap);q<HTMLElement>(haMap,'[data-map-current]')?.setAttribute('data-map-state','selected');setText(haMap,'[data-map-current-text]','All API replicas serving concurrently. Durable etcd backing is healthy.');}else{highlight(haMap,choice==='endpoint'?'client':'api',choice==='endpoint'?'endpoint':'etcd',choice==='endpoint'?'special':'store',choice.toUpperCase(),true);}inspector('API high availability',haResults[choice],choice.toUpperCase(),'endpoint → concurrent API replicas → backing state','No fixed failure tolerance follows from API replica count alone.');}));

  qa<HTMLButtonElement>(console,'[data-capability-title]').forEach((button)=>button.addEventListener('click',()=>{const lab=button.closest('.api-responsibility-lab')!;setText(lab,'[data-capability-active]',button.dataset.capabilityTitle || '');setText(lab,'[data-capability-description]',button.dataset.capabilityCopy || '');if(button.dataset.capabilityExample)setText(lab,'[data-capability-pre]',button.dataset.capabilityExample);qa<HTMLButtonElement>(lab,'[data-capability-title]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));inspector(button.dataset.capabilityTitle || 'API responsibility',button.dataset.capabilityCopy || '', 'Selected capability',button.dataset.capabilityTitle || '',sections[activeIndex].dataset.apiCaveat || '');}));
  q(console,'[data-finale-step]')?.addEventListener('click',(event)=>{const lab=(event.currentTarget as HTMLElement).closest<HTMLElement>('[data-api-finale-lab]')!;lab.classList.toggle('is-revealed');const map=q<HTMLElement>(lab.closest('[data-api-view]')!,'[data-api-map]')!;map.classList.toggle('is-finale',lab.classList.contains('is-revealed'));setText(lab,'[data-finale-result]',lab.classList.contains('is-revealed')?'Intent enters through API. Controllers and scheduler make scoped decisions, kubelets execute assigned state, and observed status returns through API.':'Kubernetes is a distributed system of reconciliation loops centered around a shared, versioned API.');});

  console.addEventListener('keydown',(event)=>{if(event.key==='Escape'){const active=sections[activeIndex];const map=q<HTMLElement>(active,'[data-api-map]');if(map)hideMapPopover(map,true);qa<HTMLDetailsElement>(active,'details[open]').forEach((detail)=>{if(!detail.classList.contains('api-flow-static'))detail.open=false;});}if(event.code==='Space'&&event.target instanceof HTMLElement && event.target.matches('[data-flow-timeline]')){event.preventDefault();flowPlay.click();}});
  window.addEventListener('resize',()=>maps.forEach((map)=>{const trigger=popoverTriggers.get(map);if(trigger)positionMapPopover(map,trigger);}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll();});
  flowSelect(new URL(location.href).searchParams.get('flow') || flows[0].id,false);
  faultSelect(faults[0].id);
  renderGates();
  watchStage(0);
  renderPlacement();
  const initial=sections.findIndex((section)=>section.id===location.hash.slice(1));
  selectView(initial>=0?initial:0,false);
  console.classList.add('is-enhanced');
}
