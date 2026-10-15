import {pipelineFlows, samples} from './pipeline-data';
import {pipelineBoxes} from './pipeline-boxes';
export function initPipeline(){
 const root=document.querySelector<HTMLElement>('.identity-console');const pipe=root?.querySelector<HTMLElement>('[data-ip]');if(!root||!pipe)return;
 const view=pipe.closest<HTMLElement>('[data-lsn-view]');
 const inspector=pipe.querySelector<HTMLElement>('[data-ip-box-inspector]');
 const example=pipe.querySelector<HTMLElement>('.ip-example');
 const boxButtons=[...pipe.querySelectorAll<HTMLButtonElement>('[data-ip-box]')];
 const clearBox=()=>{boxButtons.forEach(button=>button.setAttribute('aria-pressed','false'));if(inspector)inspector.hidden=true;if(example)example.hidden=false};
 const showSample=(key:keyof typeof samples)=>{
  pipe.querySelectorAll<HTMLElement>('[data-ip-sample-state]').forEach(panel=>{panel.hidden=panel.dataset.ipSampleState!==key});
  pipe.querySelectorAll<HTMLButtonElement>('[data-ip-sample]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ipSample===key)));
 };
 const showFlow=(id:string)=>{
  clearBox();
  const flow=pipelineFlows.find(item=>item.id===id)??pipelineFlows[0];
  const more=pipe.querySelector<HTMLDetailsElement>('.ip-more-flows');
  if(more)more.open=!!pipe.querySelector(`[data-ip-flow="${flow.id}"]`)?.closest('.ip-more-flows');
  pipe.querySelectorAll<HTMLElement>('[data-ip-flow-state]').forEach(panel=>{panel.hidden=panel.dataset.ipFlowState!==flow.id});
  pipe.querySelectorAll<HTMLButtonElement>('[data-ip-flow]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ipFlow===flow.id)));
  pipe.querySelectorAll<HTMLElement>('[data-ip-entry]').forEach(item=>item.classList.toggle('is-highlighted',flow.stageHighlights.includes(item.dataset.ipEntry??'')));
  pipe.querySelectorAll<HTMLElement>('[data-ip-stage]').forEach(stage=>stage.classList.toggle('is-denied',flow.result==='denied'&&stage.dataset.ipStage==='5'));
  const message=root.querySelector<HTMLElement>('[data-lsn-live]');if(message)message.textContent=`${flow.label}. ${flow.note}`;
  showSample(flow.code);
 };
 const showBox=(button:HTMLButtonElement)=>{
  const key=button.dataset.ipBox??'';const info=pipelineBoxes[key];if(!info||!inspector)return;
  if(button.getAttribute('aria-pressed')==='true'){clearBox();return}
  boxButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  const stage=button.closest<HTMLElement>('[data-ip-stage]');
  inspector.querySelector<HTMLElement>('[data-ip-box-stage]')!.textContent=`Stage ${stage?.dataset.ipStage} · ${stage?.querySelector('h3')?.textContent??''}`;
  const title=button.querySelector('strong')?.textContent??'';
  inspector.querySelector<HTMLElement>('[data-ip-box-title]')!.textContent=title;
  inspector.querySelector<HTMLElement>('[data-ip-box-summary]')!.textContent=info.summary;
  const route=inspector.querySelector<HTMLButtonElement>('[data-ip-box-route]')!;
  route.hidden=!info.flow;
  route.textContent=info.flow?`Show ${pipelineFlows.find(flow=>flow.id===info.flow)?.label??''} route →`:'';
  route.dataset.ipBoxFlow=info.flow??'';
  inspector.querySelector<HTMLAnchorElement>('[data-ip-box-source]')!.href=info.source;
  if(example)example.hidden=true;
  inspector.hidden=false;
  const message=root.querySelector<HTMLElement>('[data-lsn-live]');if(message)message.textContent=`${title}. ${info.summary}`;
  if(window.matchMedia('(max-width: 950px)').matches)inspector.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 };
 boxButtons.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>showBox(button))});
 inspector?.querySelector<HTMLButtonElement>('[data-ip-box-close]')?.addEventListener('click',clearBox);
 inspector?.querySelector<HTMLButtonElement>('[data-ip-box-route]')?.addEventListener('click',event=>showFlow((event.currentTarget as HTMLButtonElement).dataset.ipBoxFlow??''));
 pipe.querySelectorAll<HTMLButtonElement>('[data-ip-flow]').forEach(button=>button.addEventListener('click',()=>showFlow(button.dataset.ipFlow!)));
 pipe.querySelectorAll<HTMLButtonElement>('[data-ip-sample]').forEach(button=>button.addEventListener('click',()=>showSample(button.dataset.ipSample as keyof typeof samples)));
 pipe.querySelectorAll<HTMLAnchorElement>('[data-ip-concept]').forEach(link=>link.addEventListener('click',()=>showFlow(link.dataset.ipConcept!)));
 const sync=()=>root.classList.toggle('ip-active',view?.classList.contains('is-active')??false);
 if(view)new MutationObserver(sync).observe(view,{attributes:true,attributeFilter:['class']});
 root.classList.add('ip-enhanced');showFlow(location.hash==='#identity-map--user'?'iam-user':'cross-account');sync();
 window.addEventListener('hashchange',()=>{if(location.hash==='#identity-map--user')showFlow('iam-user');else if(location.hash==='#identity-map--role')showFlow('cross-account')});
}
