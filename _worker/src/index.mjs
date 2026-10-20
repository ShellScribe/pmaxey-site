const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_BODY = 4096;
const TRAPS = new Map([
  ['/_crawler/archive', 'archive'],
  ['/_crawler/export', 'export'],
  ['/_crawler/contacts', 'contacts'],
]);
const headers = {
  'Cache-Control': 'no-store, private',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
};
const reply = (status, data, extra = {}) => new Response(
  data === null ? null : JSON.stringify(data), { status, headers: { ...headers, ...extra } },
);
const unavailable = () => reply(503, { error: 'Contact verification is unavailable. Please use a professional profile link.' });

function configured(env) {
  try {
    const origin = new URL(env.ALLOWED_ORIGIN);
    const local = origin.hostname === 'localhost' || origin.hostname === '127.0.0.1';
    return origin.origin === env.ALLOWED_ORIGIN &&
      (origin.protocol === 'https:' || (local && origin.protocol === 'http:')) &&
      origin.hostname === env.TURNSTILE_HOSTNAME &&
      /^[a-zA-Z0-9_-]{1,32}$/.test(env.TURNSTILE_ACTION || '') &&
      typeof env.TURNSTILE_SECRET === 'string' && !!env.TURNSTILE_SECRET.trim() &&
      // Official testing secrets must never protect a public production origin.
      (local || !/^[123]x0+AA$/.test(env.TURNSTILE_SECRET)) &&
      typeof env.CONTACT_EMAIL === 'string' && env.CONTACT_EMAIL.length <= 254 &&
      /^[a-zA-Z0-9._+-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(env.CONTACT_EMAIL);
  } catch {
    return false;
  }
}

async function readJSON(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw new Error('size');
  if (!request.body) throw new Error('body');
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY) throw new Error('size');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

// Dependency injection keeps unit tests offline, using the same handler as deployment.
export function createHandler({ fetcher = fetch, log = (event) => console.info(event), now = Date.now } = {}) {
  return async function handle(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/_crawler/')) {
      const trap = TRAPS.get(url.pathname);
      if (!trap) return reply(404, { error: 'Not found.' });
      const method = ['GET', 'HEAD', 'POST', 'OPTIONS'].includes(request.method) ? request.method : 'OTHER';
      // No IP, user agent, query string, referrer, token, email, or request body.
      log({ event: 'crawler_trap', trap, method });
      return reply(204, null);
    }
    if (!url.pathname.startsWith('/api/contact')) return fetcher(request);
    if (url.pathname !== '/api/contact') return reply(404, { error: 'Not found.' });
    if (request.method !== 'POST') return reply(405, { error: 'Use POST.' }, { Allow: 'POST' });
    if (!configured(env)) return unavailable();
    if (url.origin !== env.ALLOWED_ORIGIN || request.headers.get('Origin') !== env.ALLOWED_ORIGIN ||
        (request.headers.has('Sec-Fetch-Site') && request.headers.get('Sec-Fetch-Site') !== 'same-origin')) {
      return reply(403, { error: 'Request not allowed.' });
    }
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return reply(415, { error: 'Use JSON.' });
    }
    let data;
    try { data = await readJSON(request); }
    catch { return reply(400, { error: 'Invalid request.' }); }
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        typeof data.token !== 'string' || !data.token.trim() || data.token.length > 2048) {
      return reply(400, { error: 'A verification token is required.' });
    }
    let result;
    try {
      const response = await fetcher(VERIFY_URL, {
        method: 'POST',
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: data.token }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return unavailable();
      result = await response.json();
    } catch { return unavailable(); }
    const age = now() - Date.parse(result?.challenge_ts);
    // Siteverify enforces single use and expiry globally; never cache its successes.
    if (result?.success !== true || result.hostname !== env.TURNSTILE_HOSTNAME ||
        result.action !== env.TURNSTILE_ACTION || !Number.isFinite(age) || age < -30000 || age > 300000) {
      return reply(403, { error: 'Verification failed. Please try a fresh challenge.' });
    }
    return reply(200, { email: env.CONTACT_EMAIL });
  };
}

export default { fetch: createHandler() };
