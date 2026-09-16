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
  const clearMap = (map: HTMLElement) => {
    qa(map,'.is-current,.is-selected,.is-failed').forEach((item) => item.classList.remove('is-current','is-selected','is-failed'));
    qa<HTMLButtonElement>(map,'[data-map-actor]').forEach((item) => item.setAttribute('aria-pressed','false'));
  };
  const highlight = (map: HTMLElement, from: ActorId, to: ActorId, kind: EdgeKind, text: string, failed=false) => {
    clearMap(map);
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
    setText(map,'[data-map-current]',`${failed?'Blocked path':'Selected path'}: ${byActor.get(from)?.label || from} ${kind==='watch'?'··· WATCH ···':'→'} ${byActor.get(to)?.label || to}. ${text}`);
  };
  const selectView = (index: number, push=true) => {
    pauseAll(); activeIndex=(index+sections.length)%sections.length;
    const section=sections[activeIndex];
    sections.forEach((item,i)=>item.classList.toggle('is-active',i===activeIndex));
    links.forEach((link,i)=>{if(i===activeIndex)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    const group=links[activeIndex]?.closest<HTMLDetailsElement>('[data-api-index-group]');
    qa<HTMLDetailsElement>(console,'[data-api-index-group]').forEach((item)=>item.open=item===group);
    const count=`${String(activeIndex+1).padStart(2,'0')} / ${String(sections.length).padStart(2,'0')}`;
    setText(console,'[data-api-view-count]',count);setText(console,'[data-api-view-counter]',count);
    setText(console,'[data-api-bottom-takeaway]',section.dataset.apiTakeaway || '');
    inspector(section.dataset.apiTitle || '',section.dataset.apiInspector || '',section.dataset.apiTitle || '', 'Choose an actor or stage to inspect its relationship.',section.dataset.apiCaveat || '');
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
    qa<HTMLButtonElement>(map,'[data-map-actor]').forEach((button)=>button.addEventListener('click',()=>{
      pauseAll();clearMap(map);
      const id=button.dataset.mapActor as ActorId, actor=byActor.get(id);
      if(!actor)return;
      button.classList.add('is-selected');button.setAttribute('aria-pressed','true');
      actorFields(id);
      inspector(actor.label,actor.role,actor.short,`Reads: ${actor.reads}. Watches: ${actor.watches}. Writes: ${actor.writes}.`,actor.external ? `Direct external call: ${actor.external}` : sections[activeIndex].dataset.apiCaveat || '');
      setText(map,'[data-map-current]',`Selected actor: ${actor.label}. ${actor.role}`);
    }));
    qa<HTMLButtonElement>(map,'[data-map-edge]').forEach((button)=>button.addEventListener('click',()=>{
      pauseAll();
      const from=button.dataset.edgeFrom as ActorId,to=button.dataset.edgeTo as ActorId,kind=button.dataset.edgeKind as EdgeKind;
      highlight(map,from,to,kind,button.dataset.edgeLabel || kind);
      actorFields(from);
      inspector(`${byActor.get(from)?.label} → ${byActor.get(to)?.label}`,`${button.dataset.edgeLabel || kind}. ${byActor.get(from)?.role || ''}`,'Relationship selected',`${kind.toUpperCase()} · ${button.dataset.edgeLabel || ''}`,sections[activeIndex].dataset.apiCaveat || '');
    }));
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
    setText(map,'[data-map-current]',filter==='all'?'Actor filter cleared. Select any component or relationship.':`${button.textContent?.trim()} actors highlighted. Select one to inspect what it reads, watches and writes.`);
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
    setText(flowLab,'[data-flow-summary]',`${String(flowIndex+1).padStart(2,'0')} · ${step.label}: ${step.detail}`);
    setText(flowLab,'[data-flow-operation]',step.operation);
    setText(flowLab,'[data-flow-yaml]',step.yaml || `${step.object}\n${step.state}`);
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
  let selectedFault:Fault=faults[0],faultIndex=0,faultTimer:number|undefined;
  const stopFault=()=>{if(faultTimer)window.clearInterval(faultTimer);faultTimer=undefined;faultPlay.textContent='▶ Play fault';};timers.add(stopFault);
  const faultStage=(index:number)=>{
    faultIndex=Math.max(0,Math.min(selectedFault.steps.length-1,index));const step=selectedFault.steps[faultIndex];
    qa<HTMLButtonElement>(faultTimeline,'[data-fault-step]').forEach((button,i)=>{button.classList.toggle('is-active',i===faultIndex);if(i===faultIndex)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    faultMap.dataset.depth='internals';renderStep(faultMap,step,selectedFault.label,faultIndex,selectedFault.steps.length,true);
    q<HTMLButtonElement>(faultMap,`[data-map-actor="${selectedFault.actor}"]`)?.classList.add('is-failed');
    setText(faultLab,'[data-fault-summary]',`${step.label}: ${step.detail}. ${step.state}.`);
    setText(console,'[data-api-bottom-takeaway]',`${selectedFault.label}: ${selectedFault.stops}; ${selectedFault.continues}.`);
  };
  const faultSelect=(id:string)=>{
    const next=byFault.get(id);if(!next)return;stopFault();selectedFault=next;faultInput.value=id;faultIndex=0;
    faultPlay.disabled=!['pod','api'].includes(id);faultPlay.title=faultPlay.disabled?'Inspect this fault with manual steps':'Play or pause this hero failure trace';
    setText(faultLab,'[data-fault-title]',next.label);
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
    const preset=gateMode==='write'?byGate.get(gateInput.value):undefined;
    const blockAt=preset && preset.id!=='none'?failureIndex[preset.id]:undefined;
    gateIndex=Math.max(0,Math.min(stages.length-1,blockAt===undefined?index:Math.min(index,blockAt)));
    qa<HTMLElement>(gateRail,'[data-gate]').forEach((item,i)=>{item.classList.toggle('is-passed',i<gateIndex);item.classList.toggle('is-current',i===gateIndex);item.classList.toggle('is-blocked',blockAt===i&&gateIndex===i);item.classList.toggle('is-not-reached',blockAt!==undefined&&i>blockAt);});
    const blocked=blockAt!==undefined&&gateIndex===blockAt;
    const result=gateMode==='read'?`${stages[gateIndex]}: ${gateIndex===3?'Authorized API read returns a response; ordinary admission and write persistence are not part of this path.':'Request continues after this conceptual check.'}`:blocked?`${stages[gateIndex]} BLOCKED · ${preset?.result}. ${preset?.detail} NOT REACHED: ${preset?.notReached}.`:gateIndex===stages.length-1?'Accepted object is committed as shared state; controllers may now observe it.':`${stages[gateIndex]} passed in this fixture; later gates have not run yet.`;
    setText(gateLab,'[data-gate-result]',`${gateMode.toUpperCase()} REQUEST · STEP ${gateIndex+1} / ${stages.length}. ${result}`);
    setText(console,'[data-api-scenario-object]',blocked?'Deployment absent':gateMode==='read'?'GET demo Pods':'Deployment request in processing');
    setText(console,'[data-api-observed]','0');
    highlight(gateMap,'client','api','api',stages[gateIndex],blocked);
    if(gateMode==='write'&&gateIndex===stages.length-1&&!blocked)highlight(gateMap,'api','etcd','store','Accepted state committed');
    inspector(stages[gateIndex],result,blocked?`${preset?.result}`:gateIndex===stages.length-1?'Request complete':'Request processing',`Stage ${gateIndex+1}/${stages.length}`, 'This is a teaching order, not every kube-apiserver handler call.');
    setText(gateLab.closest('[data-api-view]') || console,'[data-api-canvas-state]',blocked?`BLOCKED · ${stages[gateIndex].toUpperCase()}`:`${gateMode.toUpperCase()} · GATE ${gateIndex+1}/${stages.length}`);
  };
  const renderGates=()=>{const names=gateMode==='write'?writeGates:readGates;gateRail.replaceChildren(...names.map((name,i)=>{const li=document.createElement('li'),strong=document.createElement('strong'),span=document.createElement('span'),small=document.createElement('small');li.dataset.gate=String(i);strong.textContent=String(i+1).padStart(2,'0');span.textContent=name;small.textContent=i===names.length-1?(gateMode==='read'?'RETURN':'COMMIT'):'CHECK';li.append(strong,span,small);return li;}));gateStage(0);};
  qa<HTMLButtonElement>(gateLab,'[data-gate-mode]').forEach((button)=>button.addEventListener('click',()=>{stopGate();gateMode=button.dataset.gateMode as 'write'|'read';qa<HTMLButtonElement>(gateLab,'[data-gate-mode]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));gateInput.disabled=gateMode==='read';renderGates();}));
  gateInput.addEventListener('change',()=>{stopGate();gateStage(0);});
  q(gateLab,'[data-gate-reset]')?.addEventListener('click',()=>{stopGate();gateStage(0);});
  q(gateLab,'[data-gate-prev]')?.addEventListener('click',()=>{stopGate();gateStage(gateIndex-1);});
  q(gateLab,'[data-gate-next]')?.addEventListener('click',()=>{stopGate();gateStage(gateIndex+1);});
  gatePlay.addEventListener('click',()=>{if(gateTimer){stopGate();return;}if(isReduced()){gateStage((gateMode==='write'?writeGates:readGates).length-1);return;}gateStage(0);gatePlay.textContent='Ⅱ Pause gates';gateTimer=window.setInterval(()=>{const length=(gateMode==='write'?writeGates:readGates).length;const old=gateIndex;gateStage(gateIndex+1);if(gateIndex===old||gateIndex>=length-1)stopGate();},1100);});

  const watchLab=q<HTMLElement>(console,'[data-api-watch-lab]')!;
  const watchMap=q<HTMLElement>(watchLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const watchPairs:[ActorId,ActorId,EdgeKind,string][]=[['controller','api','api','LIST Deployments'],['controller','api','watch','WATCH from resourceVersion 10245'],['api','controller','watch','MODIFIED event 11020'],['controller','api','api','Reconcile then write if needed']];
  let watchIndex=0;
  const watchStage=(index:number)=>{watchIndex=Math.max(0,Math.min(3,index));qa(watchLab,'[data-watch-step]').forEach((item,i)=>item.classList.toggle('is-current',i===watchIndex));const [from,to,kind,operation]=watchPairs[watchIndex];highlight(watchMap,from,to,kind,operation);inspector('LIST / WATCH',`${operation}. ${watchIndex===3?'The work queue triggers a compare-and-act loop.':'A client can follow later changes without repeated polling.'}`,'resourceVersion 10245 → 11020',operation,'A too-old watch requires re-LIST after 410 Gone.');};
  q(watchLab,'[data-watch-prev]')?.addEventListener('click',()=>watchStage(watchIndex-1));
  q(watchLab,'[data-watch-next]')?.addEventListener('click',()=>watchStage(watchIndex+1));
  q(watchLab,'[data-watch-reset]')?.addEventListener('click',()=>watchStage(0));

  const stateLab=q<HTMLElement>(console,'[data-api-state-lab]')!;
  const stateMap=q<HTMLElement>(stateLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const podVersions={
    unscheduled:{ready:0,yaml:'kind: Pod\nmetadata: {name: web-a}\nspec: {nodeName: null}\nstatus: {phase: Pending}',result:'Pod API object exists. Scheduler has not recorded placement; kubelet has not started its container.',from:'controller' as ActorId,to:'api' as ActorId,kind:'api' as EdgeKind},
    bound:{ready:0,yaml:'kind: Pod\nmetadata: {name: web-a}\nspec: {nodeName: worker-a}\nstatus: {phase: Pending}',result:'Scheduler recorded a binding through API. Kubelet must observe this assigned Pod separately.',from:'scheduler' as ActorId,to:'api' as ActorId,kind:'api' as EdgeKind},
    running:{ready:1,yaml:'kind: Pod\nmetadata: {name: web-a}\nspec: {nodeName: worker-a}\nstatus:\n  phase: Running\n  Ready: "True"',result:'Kubelet reports node-local reality through Pod status; one of three desired Pods is Ready.',from:'node-a' as ActorId,to:'api' as ActorId,kind:'status' as EdgeKind},
  };
  qa<HTMLButtonElement>(stateLab,'[data-pod-version]').forEach((button)=>button.addEventListener('click',()=>{const version=podVersions[button.dataset.podVersion as keyof typeof podVersions];if(!version)return;qa<HTMLButtonElement>(stateLab,'[data-pod-version]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));setText(stateLab,'[data-pod-yaml]',version.yaml);setText(stateLab,'[data-pod-version-result]',version.result);setText(stateLab,'[data-state-ready]',`${version.ready} ${version.ready===1?'replica':'replicas'}`);const meter=q<HTMLMeterElement>(stateLab,'[data-state-meter]');if(meter)meter.value=version.ready;setText(console,'[data-api-observed]',String(version.ready));highlight(stateMap,version.from,version.to,version.kind,button.textContent || 'Pod state');inspector('Pod object version',version.result,`${version.ready}/3 ready`,version.yaml,'Running phase and Ready condition are separate.');}));

  const planeLab=q<HTMLElement>(console,'[data-api-dataplane-lab]')!;
  const planeMap=q<HTMLElement>(planeLab.closest('[data-api-view]')!,'[data-api-map]')!;
  qa<HTMLInputElement>(planeLab,'input[name="api-plane"]').forEach((input)=>input.addEventListener('change',()=>{if(!input.checked)return;planeMap.dataset.plane=input.value;const result=input.value==='control'?'Controller writes EndpointSlice through API; Service proxy watches that API object.':input.value==='data'?'Client HTTP traverses Service forwarding to a Pod. It does not use kube-apiserver as a packet hop.':'API state configures the forwarding implementation; workload traffic follows the separate node dataplane.';setText(planeLab,'[data-plane-result]',result);if(input.value==='data')highlight(planeMap,'client','pod','data','HTTP via Service forwarding');else highlight(planeMap,'api','proxy','watch','WATCH EndpointSlices');inspector('Control plane versus data plane',result,input.value.toUpperCase(),input.value==='data'?'HTTP DATA PLANE':'WATCH EndpointSlices','kube-proxy is optional when another Service proxy implementation is used.');}));

  const haLab=q<HTMLElement>(console,'[data-api-ha-lab]')!;
  const haMap=q<HTMLElement>(haLab.closest('[data-api-view]')!,'[data-api-map]')!;
  const haResults:Record<string,string>={healthy:'API1, API2 and API3 can serve requests concurrently. Scheduler/controller-manager leadership is separate Lease coordination.',replica:'API2 failed. A healthy endpoint can route to API1 or API3; serving does not wait for one elected API leader.',endpoint:'The client endpoint is unavailable, so healthy API replicas may be unreachable from clients.',etcd:'Durable backing state is degraded. Multiple serving replicas cannot by themselves repair the shared storage dependency.'};
  qa<HTMLButtonElement>(haLab,'[data-ha-choice]').forEach((button)=>button.addEventListener('click',()=>{const choice=button.dataset.haChoice || 'healthy';qa<HTMLButtonElement>(haLab,'[data-ha-choice]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));qa<HTMLElement>(haLab,'[data-ha-replica]').forEach((item)=>{item.classList.toggle('is-failed',choice==='replica'&&item.dataset.haReplica==='2');item.textContent=`API${item.dataset.haReplica} · ${choice==='replica'&&item.dataset.haReplica==='2'?'FAILED':'SERVING'}`;});setText(haLab,'[data-ha-etcd]',choice==='etcd'?'etcd · DEGRADED':'etcd · HEALTHY');setText(haLab,'[data-ha-result]',haResults[choice]);highlight(haMap,choice==='endpoint'?'client':'api',choice==='endpoint'?'endpoint':'etcd',choice==='endpoint'?'special':'store',choice.toUpperCase(),choice!=='healthy');inspector('API high availability',haResults[choice],choice.toUpperCase(),'endpoint → concurrent API replicas → backing state','No fixed failure tolerance follows from API replica count alone.');}));

  qa<HTMLButtonElement>(console,'[data-capability-title]').forEach((button)=>button.addEventListener('click',()=>{const lab=button.closest('.api-responsibility-lab')!;setText(lab,'[data-capability-active]',button.dataset.capabilityTitle || '');setText(lab,'[data-capability-description]',button.dataset.capabilityCopy || '');qa<HTMLButtonElement>(lab,'[data-capability-title]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));inspector(button.dataset.capabilityTitle || 'API responsibility',button.dataset.capabilityCopy || '', 'Selected capability',button.dataset.capabilityTitle || '',sections[activeIndex].dataset.apiCaveat || '');}));
  q(console,'[data-finale-step]')?.addEventListener('click',(event)=>{const lab=(event.currentTarget as HTMLElement).closest<HTMLElement>('[data-api-finale-lab]')!;lab.classList.toggle('is-revealed');const map=q<HTMLElement>(lab.closest('[data-api-view]')!,'[data-api-map]')!;map.classList.toggle('is-finale',lab.classList.contains('is-revealed'));setText(lab,'[data-finale-result]',lab.classList.contains('is-revealed')?'Intent enters through API. Controllers and scheduler make scoped decisions, kubelets execute assigned state, and observed status returns through API.':'Kubernetes is a distributed system of reconciliation loops centered around a shared, versioned API.');});

  console.addEventListener('keydown',(event)=>{if(event.key==='Escape'){const active=sections[activeIndex];qa<HTMLDetailsElement>(active,'details[open]').forEach((detail)=>{if(!detail.classList.contains('api-flow-static'))detail.open=false;});}if(event.code==='Space'&&event.target instanceof HTMLElement && event.target.matches('[data-flow-timeline]')){event.preventDefault();flowPlay.click();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll();});
  flowSelect(new URL(location.href).searchParams.get('flow') || flows[0].id,false);
  faultSelect(faults[0].id);
  renderGates();
  watchStage(0);
  const initial=sections.findIndex((section)=>section.id===location.hash.slice(1));
  selectView(initial>=0?initial:0,false);
  console.classList.add('is-enhanced');
}
