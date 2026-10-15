/** Enables the four-question simulator: presets load a whole request, and every control re-renders the decision. */
import { evaluate, presets, resourceOf, words, type Ask } from './iam-eval';
import { contextHtml, policyText, trailHtml, verdictHtml } from './pillars-view';

export function initPillars() {
  const root = document.querySelector<HTMLElement>('[data-iq]');
  const form = root?.querySelector<HTMLFormElement>('[data-iq-form]');
  if (!root || !form) return;
  const one = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const field = (name: string) => form.elements.namedItem(name) as RadioNodeList | HTMLInputElement | HTMLSelectElement;
  const checked = (name: string) => (field(name) as HTMLInputElement).checked;

  const read = (): Ask => ({
    who: (field('who') as RadioNodeList).value as Ask['who'], action: (field('action') as RadioNodeList).value as Ask['action'],
    origin: (field('origin') as RadioNodeList).value as Ask['origin'], require: (field('require') as HTMLSelectElement).value as Ask['require'],
    identity: checked('identity'), bucket: checked('bucket'), scp: checked('scp'), boundary: checked('boundary'), deny: checked('deny'),
  });
  const write = (ask: Ask) => {
    (['who', 'action', 'origin'] as const).forEach((name) => { (field(name) as RadioNodeList).value = ask[name]; });
    (field('require') as HTMLSelectElement).value = ask.require;
    (['identity', 'bucket', 'scp', 'boundary', 'deny'] as const).forEach((name) => { (field(name) as HTMLInputElement).checked = ask[name]; });
  };
  const render = (announce: boolean) => {
    const ask = read();
    const decision = evaluate(ask);
    const verdict = one('[data-iq-verdict]');
    verdict.innerHTML = verdictHtml(ask);
    verdict.dataset.allowed = String(decision.allowed);
    one('[data-iq-rows]').innerHTML = trailHtml(ask);
    one('[data-iq-context]').innerHTML = contextHtml(ask);
    one('[data-iq-resource]').textContent = resourceOf(ask.action).replace('arn:aws:s3:::', '');
    const text = policyText(ask);
    one('[data-iq-identity-title]').textContent = text.identityTitle;
    one('[data-iq-identity]').textContent = text.identity;
    one('[data-iq-bucket]').textContent = text.bucket;
    // An unsigned request has no identity policy, SCP or boundary to toggle.
    ['identity', 'scp', 'boundary'].forEach((name) => { (field(name) as HTMLInputElement).disabled = ask.who === 'anonymous'; });
    if (announce) one('[data-iq-live]').textContent = `${decision.allowed ? words.ok : words.stopped}. ${decision.reason}`;
  };

  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-iq-preset]')];
  const choose = (id: string | null) => buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.iqPreset === id)));
  buttons.forEach((button) => button.addEventListener('click', () => {
    const preset = presets.find((item) => item.id === button.dataset.iqPreset)!;
    write(preset.ask);
    choose(preset.id);
    one('[data-iq-note]').textContent = preset.note;
    render(true);
  }));
  form.addEventListener('change', () => {
    choose(null);
    one('[data-iq-note]').textContent = 'Your own request. Pick an example above to start again.';
    render(true);
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  form.querySelectorAll('fieldset').forEach((set) => { set.disabled = false; });
  one('[data-iq-presets]').hidden = false;
  render(false);
}
