import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const source = await readFile(new URL('../../assets/js/contact-gate.js', import.meta.url), 'utf8');

function preview({ sitekey = '1x00000000000000000000AA', hostname = 'localhost', width = 335, response = Response.json({ email: 'contact@example.invalid' }) } = {}) {
  const element = () => ({ hidden: false, disabled: false, textContent: '', children: [], listeners: {},
    addEventListener(type, cb) { this.listeners[type] = cb; },
    appendChild(child) { this.children.push(child); },
    replaceChildren(...children) { this.children = children; },
    remove() {}, focus() { this.focused = true; },
  });
  const start = element(); start.hidden = true;
  const nodes = { '[data-contact-start]': start, '[data-contact-status]': element(), '[data-contact-widget]': element(), '[data-contact-result]': element() };
  nodes['[data-contact-result]'].hidden = true;
  nodes['[data-contact-widget]'].clientWidth = width;
  const attrs = { 'data-sitekey': sitekey, 'data-action': 'test', 'data-endpoint': '/api/contact' };
  const gate = { querySelector: s => nodes[s], getAttribute: s => attrs[s] };
  let options;
  const calls = [];
  const scripts = [];
  const timers = [];
  const window = { setTimeout: cb => { timers.push(cb); return timers.length; }, clearTimeout() {},
    turnstile: { render(node, config) { options = config; return 'widget'; }, remove() {} },
  };
  runInNewContext(source, {
    window, location: { hostname }, AbortSignal,
    document: { querySelector: () => gate, createElement: element, head: { appendChild: s => scripts.push(s) } },
    fetch: async (...args) => { calls.push(args); return response; },
  });
  return { start, nodes, calls, scripts, timers, window, options: () => options,
    async begin() { const promise = start.listeners.click(); window.pmaxeyTurnstileReady(); await promise; },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('email stays absent until server success; script loads only after an explicit choice', async () => {
  const p = preview();
  assert.equal(p.scripts.length, 0);
  assert.equal(p.nodes['[data-contact-status]'].hidden, true);
  assert.equal(p.calls.length, 0);
  assert.equal(p.nodes['[data-contact-result]'].hidden, true);
  await p.begin();
  assert.equal(p.scripts.length, 1);
  assert.match(p.scripts[0].src, /^https:\/\/challenges.cloudflare.com\//);
  assert.equal(p.start.disabled, true);
  assert.equal(p.nodes['[data-contact-status]'].hidden, false);
  assert.equal(p.nodes['[data-contact-widget]'].hidden, false);
  p.options().callback('XXXX.DUMMY.TOKEN.XXXX');
  await settle();
  assert.equal(p.calls.length, 1);
  assert.equal(p.calls[0][0], '/api/contact');
  assert.equal(p.calls[0][1].cache, 'no-store');
  assert.equal(p.start.hidden, true);
  const result = p.nodes['[data-contact-result]'];
  assert.equal(result.hidden, false);
  assert.equal(result.children[0].textContent, 'contact@example.invalid');
  assert.equal(result.children[0].href, 'mailto:contact%40example.invalid');
  assert.equal(result.children[0].focused, true);
});

test('server rejection, expiry and retry cannot expose an address or reuse the old attempt', async () => {
  const p = preview({ response: new Response('unavailable', { status: 503 }) });
  await p.begin();
  const old = p.options();
  old.callback('XXXX.DUMMY.TOKEN.XXXX');
  await settle();
  assert.equal(p.start.disabled, false);
  assert.equal(p.nodes['[data-contact-result]'].hidden, true);
  assert.match(p.nodes['[data-contact-status]'].textContent, /professional profile/);
  await p.start.listeners.click();
  old.callback('stale');
  await settle();
  assert.equal(p.calls.length, 1);
  p.options()['expired-callback']();
  assert.match(p.nodes['[data-contact-status]'].textContent, /expired/);
  assert.equal(p.start.disabled, false);
});

test('script errors and load timeouts leave a retry and non-sensitive fallback', async () => {
  for (const reason of ['error', 'timeout']) {
    const p = preview();
    const pending = p.start.listeners.click();
    if (reason === 'error') p.scripts[0].onerror(); else p.timers[0]();
    await pending;
    assert.equal(p.start.disabled, false);
    assert.match(p.nodes['[data-contact-status]'].textContent, /professional profile/);
    assert.equal(p.calls.length, 0);
  }
});

test('missing sitekey and testing sitekey on a public hostname leave the static fallback', () => {
  for (const config of [{ sitekey: '' }, { hostname: 'pmaxey.com' }]) {
    const p = preview(config);
    assert.equal(p.start.hidden, true);
    assert.equal(p.scripts.length, 0);
    assert.equal(p.start.listeners.click, undefined);
  }
});

test('narrow mobile containers use the compact widget', async () => {
  const p = preview({ width: 280 });
  await p.begin();
  assert.equal(p.options().size, 'compact');
});
