/** Enhances the focused views. The opening pipeline has its own client. */
export function initIdentity() {
 const root=document.querySelector<HTMLElement>('.identity-console');if(!root)return;
 const inspector=root.querySelector<HTMLElement>('[data-lsn-inspector]');
 const live=root.querySelector<HTMLElement>('[data-lsn-live]');
 const panels=[...root.querySelectorAll<HTMLElement>('[data-ic-panel]')];
 const selections=new Map<HTMLElement,number>();
 const updateInspector=()=>{
  const view=root.querySelector<HTMLElement>('[data-lsn-view].is-active');
  if(!view||!inspector)return;
  const panel=view.querySelector<HTMLElement>('[data-ic-panel]');
  const state=panel?.querySelector<HTMLElement>(`[data-ic-state="${selections.get(panel)??0}"]`);
  const context=state?.querySelector('[data-ic-context]');
  const reading=view.querySelector('[data-lsn-reading]');
  if(context)inspector.innerHTML=context.innerHTML+(reading?.querySelector('.lsn-note')?.outerHTML??'')+(reading?.querySelector('.lsn-view-sources')?.outerHTML??'');
 };
 const resetChecks=(state:HTMLElement)=>{
  const checks=[...state.querySelectorAll<HTMLElement>('[data-ic-check]')];
  checks.forEach((check,i)=>check.hidden=i>0);
  const button=state.querySelector<HTMLButtonElement>('[data-ic-reveal]');
  if(button){button.hidden=false;button.disabled=false;button.textContent='Reveal next check →';}
 };
 const show=(panel:HTMLElement,index:number,announce=false)=>{
  selections.set(panel,index);
  panel.querySelectorAll<HTMLElement>('[data-ic-state]').forEach((state,i)=>{state.hidden=i!==index;if(i===index)resetChecks(state)});
  panel.querySelectorAll('[data-ic-select]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  updateInspector();
  if(announce&&live)live.textContent=panel.querySelector(`[data-ic-state="${index}"] h3`)?.textContent??'';
 };
 panels.forEach(panel=>{
  panel.querySelector('[data-ic-controls]')?.removeAttribute('hidden');
  panel.querySelectorAll<HTMLButtonElement>('[data-ic-select]').forEach((button,i)=>button.addEventListener('click',()=>show(panel,i,true)));
  panel.querySelector('[data-ic-reset]')?.addEventListener('click',()=>show(panel,0,true));
  panel.querySelectorAll<HTMLButtonElement>('[data-ic-reveal]').forEach(button=>button.addEventListener('click',()=>{
   const state=button.closest<HTMLElement>('[data-ic-state]')!;
   state.querySelector<HTMLElement>('[data-ic-check][hidden]')?.removeAttribute('hidden');
   button.disabled=!state.querySelector('[data-ic-check][hidden]');
   if(button.disabled)button.textContent='All checks shown';
   if(live)live.textContent=state.querySelector('[data-ic-check]:last-of-type p')?.textContent??'Evidence revealed';
  }));
  show(panel,0);
 });
 root.querySelectorAll('[data-lsn-view]').forEach(view=>new MutationObserver(updateInspector).observe(view,{attributes:true,attributeFilter:['class']}));
 root.classList.add('ic-enhanced');updateInspector();
}
