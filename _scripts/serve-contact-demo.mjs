// Local-only preview with Cloudflare's official test credentials, no production email.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createHandler } from '../_worker/src/index.mjs';

const root = resolve(process.argv[2] || '_site');
const origin = 'http://localhost:4000';
const env = {
  ALLOWED_ORIGIN: origin,
  TURNSTILE_HOSTNAME: 'localhost',
  TURNSTILE_ACTION: 'test',
  TURNSTILE_SECRET: '1x0000000000000000000000000000000AA',
  CONTACT_EMAIL: 'contact@example.invalid',
};
// Browser preview mocks Siteverify only. Production Worker has no mock switch.
const worker = createHandler({ fetcher: async (url, options) => {
  if (url !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') throw new Error('unexpected fetch');
  const valid = options.body.get('response') === 'XXXX.DUMMY.TOKEN.XXXX';
  return Response.json({ success: valid, hostname: 'localhost', action: 'test', challenge_ts: new Date().toISOString() });
} });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin);
    if (url.pathname.startsWith('/api/contact') || url.pathname.startsWith('/_crawler/')) {
      const options = { method: req.method, headers: req.headers };
      if (!['GET', 'HEAD'].includes(req.method)) { options.body = req; options.duplex = 'half'; }
      const response = await worker(new Request(url, options), env);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!path.startsWith(root + sep) && path !== root) throw new Error('path');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found.');
  }
});
server.listen(4000, 'localhost', () => console.info('Local test preview: ' + origin + '/contact/ (MOCK Siteverify; official test widget; example address only)'));
