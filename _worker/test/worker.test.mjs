import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHandler } from '../src/index.mjs';

const origin = 'http://localhost:4000';
const env = {
  ALLOWED_ORIGIN: origin, TURNSTILE_HOSTNAME: 'localhost', TURNSTILE_ACTION: 'test',
  TURNSTILE_SECRET: '1x0000000000000000000000000000000AA', CONTACT_EMAIL: 'contact@example.invalid',
};
const now = Date.now();
const success = { success: true, hostname: 'localhost', action: 'test', challenge_ts: new Date(now).toISOString() };
const request = (options = {}) => new Request(origin + '/api/contact', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' },
  body: JSON.stringify({ token: 'XXXX.DUMMY.TOKEN.XXXX' }), ...options,
});
function setup(result = success) {
  const calls = [];
  const logs = [];
  const handler = createHandler({ now: () => now, log: e => logs.push(e), fetcher: async (...args) => {
    calls.push(args);
    return Response.json(result);
  } });
  return { handler, calls, logs };
}
async function status(handler, req, expected, config = env) {
  const response = await handler(req, config);
  assert.equal(response.status, expected);
  assert.equal(response.headers.get('Cache-Control'), 'no-store, private');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  const body = await response.text();
  if (expected !== 200) assert.ok(!body.includes(env.CONTACT_EMAIL));
  return body;
}

test('valid dummy fixture: server verifies once, returns only the configured address, no logs', async () => {
  const { handler, calls, logs } = setup();
  assert.deepEqual(JSON.parse(await status(handler, request(), 200)), { email: env.CONTACT_EMAIL });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(calls[0][1].body.get('secret'), env.TURNSTILE_SECRET);
  assert.equal(calls[0][1].body.get('response'), 'XXXX.DUMMY.TOKEN.XXXX');
  assert.equal(calls[0][1].body.has('remoteip'), false);
  assert.ok(calls[0][1].signal instanceof AbortSignal);
  assert.deepEqual(logs, []);
});

test('reject invalid, expired, duplicate, wrong hostname/action and malformed verification results', async () => {
  for (const result of [
    { success: false, 'error-codes': ['invalid-input-response'] },
    { success: false, 'error-codes': ['timeout-or-duplicate'] },
    { ...success, hostname: 'untrusted.example' }, { ...success, action: 'other' },
    { ...success, success: 'true' }, { ...success, challenge_ts: undefined },
    { ...success, challenge_ts: new Date(now - 300001).toISOString() },
    { ...success, challenge_ts: new Date(now + 31000).toISOString() }, null,
  ]) await status(setup(result).handler, request(), 403);
});

test('a second use is rejected by Siteverify; successes are not cached locally', async () => {
  let used = false;
  const handler = createHandler({ now: () => now, fetcher: async () => {
    const result = used ? { success: false, 'error-codes': ['timeout-or-duplicate'] } : success;
    used = true;
    return Response.json(result);
  } });
  await status(handler, request(), 200);
  await status(handler, request(), 403);
});

test('malformed, missing and oversized bodies fail before external verification', async () => {
  const { handler, calls } = setup();
  for (const body of ['', '{', 'null', '[]', '{}', '{"token":0}', '{"token":" "}', JSON.stringify({ token: 'x'.repeat(2049) }), 'x'.repeat(4097)]) {
    await status(handler, request({ body }), 400);
  }
  await status(handler, request({ body: null }), 400);
  const bytes = new TextEncoder().encode('x'.repeat(4097));
  await status(handler, request({ body: new ReadableStream({ start(c) { c.enqueue(bytes); c.close(); } }), duplex: 'half' }), 400);
  await status(handler, request({ headers: { Origin: origin, 'Content-Type': 'text/plain' } }), 415);
  assert.equal(calls.length, 0);
});

test('require exact origin, request host, JSON and same-origin fetch metadata', async () => {
  const { handler, calls } = setup();
  for (const badOrigin of [null, 'null', 'https://evil.example', origin + '.evil.example']) {
    const headers = { 'Content-Type': 'application/json' };
    if (badOrigin !== null) headers.Origin = badOrigin;
    await status(handler, request({ headers }), 403);
  }
  await status(handler, request({ headers: { Origin: origin, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' } }), 403);
  await status(handler, new Request('http://other.example/api/contact', request()), 403);
  await status(handler, request({ method: 'GET', body: null }), 405);
  await status(handler, request({ method: 'OPTIONS', body: null }), 405);
  assert.equal(calls.length, 0);
});

test('missing or unsafe environment fails closed without disclosing values', async () => {
  const { handler, calls } = setup();
  for (const key of Object.keys(env)) {
    const config = { ...env }; delete config[key];
    await status(handler, request(), 503, config);
  }
  for (const change of [
    { ALLOWED_ORIGIN: 'http://public.example' }, { ALLOWED_ORIGIN: origin + '/' },
    { TURNSTILE_HOSTNAME: 'other.example' }, { TURNSTILE_ACTION: 'bad action' },
    { CONTACT_EMAIL: 'email\r\nInjected: value' }, { CONTACT_EMAIL: 'a@example.com?bcc=other@example.com' },
    { TURNSTILE_SECRET: '' }, { CONTACT_EMAIL: 'x'.repeat(255) + '@example.com' },
  ]) await status(handler, request(), 503, { ...env, ...change });
  for (const key of ['1', '2', '3']) {
    await status(handler, request(), 503, {
      ...env, ALLOWED_ORIGIN: 'https://pmaxey.com', TURNSTILE_HOSTNAME: 'pmaxey.com',
      TURNSTILE_SECRET: key + 'x0000000000000000000000000000000AA',
    });
  }
  assert.equal(calls.length, 0);
});

test('Cloudflare failure, malformed JSON and network timeout have a safe fallback', async () => {
  for (const fetcher of [
    async () => { throw new Error(env.CONTACT_EMAIL); },
    async () => new Response('upstream unavailable', { status: 503 }),
    async () => new Response('{'),
    async () => { throw new DOMException('timeout', 'TimeoutError'); },
  ]) await status(createHandler({ fetcher }), request(), 503);
});

test('three traps are harmless for GET, HEAD and other methods and log no personal data', async () => {
  const { handler, calls, logs } = setup();
  for (const trap of ['archive', 'export', 'contacts']) {
    for (const method of ['GET', 'HEAD', 'POST', 'DELETE']) {
      const req = new Request(origin + '/_crawler/' + trap + '?sensitive=query', { method, headers: { 'User-Agent': 'private', Referer: 'https://private.example', 'CF-Connecting-IP': '192.0.2.1' } });
      assert.equal(await status(handler, req, 204, {}), '');
    }
  }
  assert.equal(calls.length, 0);
  assert.equal(logs.length, 12);
  assert.deepEqual(logs[0], { event: 'crawler_trap', trap: 'archive', method: 'GET' });
  for (const log of logs) assert.deepEqual(Object.keys(log), ['event', 'trap', 'method']);
  assert.equal(logs[3].method, 'OTHER');
});

test('routing keeps unknown API/trap paths local and normal origin traffic intact', async () => {
  const { handler, calls } = setup();
  for (const path of ['/api/contacts', '/api/contact/', '/_crawler/unknown']) {
    await status(handler, new Request(origin + path), 404);
  }
  const req = new Request(origin + '/about/');
  await handler(req, env);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], req);
  const config = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const routes = [...config.matchAll(/pattern = "([^"]+)"/g)].map(m => new RegExp('^' + m[1].split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$'));
  assert.equal(routes.length, 2);
  for (const path of ['/api/contact', '/api/contact?query=1', '/_crawler/archive']) assert.ok(routes.some(r => r.test('https://pmaxey.com' + path)));
  for (const path of ['/', '/contact/', '/about/', '/assets/js/site-terminal.js', '/robots.txt']) assert.ok(routes.every(r => !r.test('https://pmaxey.com' + path)));
  assert.match(config, /workers_dev = false/);
  assert.match(config, /invocation_logs = false/);
});


test('bootstrap has no public routes or URLs and matches production bindings', async () => {
  const production = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const bootstrap = await readFile(new URL('../wrangler.bootstrap.toml', import.meta.url), 'utf8');
  assert.match(bootstrap, /^routes = \[\]$/m);
  assert.match(bootstrap, /^workers_dev = false$/m);
  assert.match(bootstrap, /^preview_urls = false$/m);
  assert.match(bootstrap, /^invocation_logs = false$/m);
  for (const key of ['name', 'main', 'compatibility_date', 'ALLOWED_ORIGIN', 'TURNSTILE_HOSTNAME', 'TURNSTILE_ACTION']) {
    const pattern = new RegExp('^' + key + ' = "([^"\\n]+)"$', 'm');
    assert.ok(production.match(pattern), key);
    assert.equal(bootstrap.match(pattern)?.[1], production.match(pattern)[1], key);
  }
});
