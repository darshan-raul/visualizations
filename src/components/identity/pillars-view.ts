/** Renders the simulator's results. The page renders the first preset with it; the client re-renders on every change. */
import { context, evaluate, json, policies, resourceOf, who, words, type Ask } from './iam-eval';

const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function verdictHtml(ask: Ask) {
  const decision = evaluate(ask);
  return `<span>${decision.allowed ? words.ok : words.stopped}</span><strong>${esc(decision.reason)}</strong>`;
}

export function trailHtml(ask: Ask) {
  let account = '';
  return evaluate(ask).rows.map((row) => {
    const head = row.account !== account ? `<li class="iq-account">${esc(row.account)}</li>` : '';
    account = row.account;
    return `${head}<li class="is-${row.result}"><b>${esc(row.check)}</b><em>${words[row.result]}</em><span>${esc(row.why)}</span></li>`;
  }).join('');
}

export function contextHtml(ask: Ask) {
  const rows: [string, string][] = [['Principal', who[ask.who].arn], ['Action', ask.action], ['Resource', resourceOf(ask.action)], ...context(ask)];
  return rows.map(([key, value]) => `<div><dt>${esc(key)}</dt><dd><code>${esc(value)}</code></dd></div>`).join('');
}

export function policyText(ask: Ask) {
  const { identity, bucket } = policies(ask);
  return {
    identity: ask.who === 'anonymous' ? '// An unsigned request has no identity, so no identity policy applies.' : json(identity),
    bucket: json(bucket),
    identityTitle: ask.who === 'anonymous' ? 'Identity policy' : `Identity policy on ${who[ask.who].short.split('/')[0]} (${who[ask.who].account.slice(0, 3)}…)`,
  };
}
