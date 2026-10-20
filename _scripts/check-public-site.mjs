import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';

const root = resolve(process.argv[2] || '_site');
let checked = 0;
async function scan(dir) {
  for (const entry of await readdir(dir)) {
    const path = join(dir, entry);
    if ((await stat(path)).isDirectory()) { await scan(path); continue; }
    if (!['.html', '.js', '.json', '.xml', '.txt', '.css', '.yml', '.toml', '.mjs', '.map'].includes(extname(path))) continue;
    const text = await readFile(path, 'utf8');
    // The existing terminal prompt is a username@hostname, not a contact address.
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    assert.deepEqual(emails.filter(e => e !== 'guest@pmaxey.com'), [], 'Contact address in ' + path);
    assert.ok(!/TURNSTILE_SECRET|CONTACT_EMAIL|XXXX\.DUMMY\.TOKEN|1x0000000000000000000000000000000AA/.test(text), 'Private/test implementation in ' + path);
    checked++;
  }
}
await scan(root);
for (const name of ['_worker', '_scripts', '_dev', 'docs', '.dev.vars', 'package.json']) {
  await assert.rejects(stat(join(root, name)), { code: 'ENOENT' });
}
const contact = await readFile(join(root, 'contact/index.html'), 'utf8');
assert.match(contact, /data-contact-gate/);
assert.match(contact, /role="status"/);
assert.match(contact, /<noscript>/);
assert.match(contact, /https:\/\/www.linkedin.com\/in\/paul-maxey/);
assert.match(contact, /https:\/\/github.com\/shellscribe/);
for (const page of ['index.html', 'contact/index.html', 'about/index.html', 'experience/index.html', 'projects/index.html', 'skills/index.html']) {
  const html = await readFile(join(root, page), 'utf8');
  assert.match(html, /class="crawler-traps" hidden inert aria-hidden="true"/);
  const traps = [...html.matchAll(/<a href="[^"]*\/_crawler\/(?:archive|export|contacts)" rel="nofollow" tabindex="-1">/g)];
  assert.equal(traps.length, 3, 'Trap semantics in ' + page);
  for (const src of [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1])) {
    assert.ok(!src.startsWith('http'), 'Unexpected remote script in ' + page);
    // Also works for a separately built /pmaxey-site baseurl preview.
    await stat(join(root, src.replace(/^\/pmaxey-site\//, '/')));
  }
}
console.info('Public asset and navigation checks passed (' + checked + ' text assets).');
