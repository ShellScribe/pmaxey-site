# Contact gate and crawler experiments

## Routing decision (before implementation)

Keep Jekyll, the existing Pages workflow, domain, and GitHub Pages origin. Use a
separately deployed Worker with only these HTTPS routes on the proxied apex:

| Route | Behavior |
| --- | --- |
| `https://pmaxey.com/api/contact*` | Exact `/api/contact` accepts contact verification; other paths return 404. The suffix wildcard also covers query strings. |
| `https://pmaxey.com/_crawler/*` | Three fixed traps; all other paths return 404. |
| Everything else | Existing GitHub Pages origin, without a Worker invocation. |

Cloudflare [Worker routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
run in front of an existing origin and require a proxied DNS record. This can
coexist with GitHub Pages: preserve its DNS targets, custom-domain configuration,
and HTTPS certificate. Do not create a Worker Custom Domain for `pmaxey.com`,
replace DNS targets, or install an apex-wide `/*` route. The Worker also passes
unrelated paths to the origin defensively if misrouted. Live changes require explicit owner deployment authorization.

GitHub Pages serves the contact UI, script and hidden trap links. It cannot store
server secrets or validate tokens. The Worker performs Siteverify and returns the
email only on success; Cloudflare dashboard settings supply proxying and optional
AI Labyrinth. The site deployment and Worker deployment remain separate.

## Review findings and limits

Reviewed at base `b32e987` on 2026-10-19. The address was present in `contact.md`
and the terminal's `status` response; both copies are removed. No other copies
were found in tracked source. Generated HTML, feeds and optimized JavaScript are
checked separately. Git history, old deployments, external caches and previously
collected addresses remain public; this gate cannot retract them. Consider a new
alias if preventing reuse of the previously published address matters.

Live public DNS resolved to GitHub Pages addresses, and HTTPS returned GitHub
headers with HSTS and permissive static-asset CORS. No CSP, X-Frame-Options or
X-Content-Type-Options was observed. The repository supplies SEO metadata, not
custom security headers. Authenticated account preflight is recorded in the local review package,
separately from these publishable instructions. A Free Website zone does not
prove the separate Workers billing plan is Free. Confirm both that billing plan
and the applicable cache rules before deployment. Proxying must be enabled
before these routes or AI Labyrinth can work.
No broad header or proxy changes are included. GitHub Pages does not honor a
Cloudflare Pages `_headers` file. If adding CSP later through Cloudflare response
header rules, allow `https://challenges.cloudflare.com` for scripts and frames,
plus same-origin API connections, and test Turnstile before enforcing it.

This is address-harvesting friction, not authentication or a guarantee that every
verified visitor is human. A bot that passes verification can retain the address.
Origins can be spoofed by non-browser clients; Siteverify is the actual gate.
No bans, tracking cookies, persistent database, cross-origin API access or blanket
bot blocking are added. Public content remains available directly at Pages and
through any unproxied hostname. Hidden links are crawler signals only: scanners,
previews and crawlers may follow them without malicious intent.

## Turnstile and Worker setup (manual, after review)

1. Record current Pages custom-domain and HTTPS state, Cloudflare DNS records,
   proxy switches, SSL/TLS mode, cache rules and Worker routes for rollback. Confirm
   `pmaxey.com` is an active Cloudflare zone. Keep existing Pages A/AAAA/CNAME targets
   and GitHub domain verification records. Follow the existing Pages custom-domain
   configuration; do not replace it with a Worker origin.
2. Check that GitHub Pages has a valid certificate for `pmaxey.com` and Enforce HTTPS
   works. Prefer Cloudflare **Full (strict)** for a validated origin connection;
   avoid Flexible mode and redirect loops. If the zone serves other applications,
   review their certificates before changing a zone-wide SSL setting. A
   [configuration rule](https://developers.cloudflare.com/rules/configuration-rules/settings/#ssltls-encryption-mode)
   matching only `http.host eq "pmaxey.com"` can set `ssl: "strict"` without changing
   other hosts; first check rule availability and existing rules in the account.
   If certificate issuance or renewal needs
   DNS-only mode, coordinate that change and verify the certificate before reproxying.
3. In Cloudflare DNS, enable **Proxied** for the existing apex records that serve the
   site. Check `/`, `/contact/`, every primary navigation link, CSS/images, terminal,
   redirects, canonical URL and Pages custom-domain health before adding any route.
   This is a prerequisite requiring owner action, not a change performed here.
4. Account dashboard → **Turnstile → Add widget**. Use **Managed** mode, restrict
   hostnames to `pmaxey.com`, leave pre-clearance off. Save the public sitekey in
   `_config.yml` as `turnstile_sitekey`; keep `turnstile_action: "contact"`.
   Turnstile is loaded only when the visitor chooses verification on Contact.
   Never use testing keys on production. An empty key leaves profile links and
   an unavailable message; testing keys are rejected on public hostnames.
5. Confirm **Workers Free** in the account dashboard before creating or deploying
   resources. The zone's Free Website plan and the Worker usage-model string alone
   are insufficient billing evidence. This rollout does not authorize a paid
   subscription. Use official Wrangler 4 (dry-run checked with 4.151.2). From
   the repository root,
   authenticate with your Cloudflare account using `wrangler login`. Review the
   Worker name and the two routes in `_worker/wrangler.toml`. Check that no existing
   Worker routes conflict; do not overwrite another application's routes.
6. Run the checks below and inspect both local deployment bundles:

   ```sh
   wrangler deploy --dry-run --config _worker/wrangler.bootstrap.toml
   wrangler deploy --dry-run --config _worker/wrangler.toml
   ```

   Both target `pmaxey-contact`; the bootstrap config has **no routes** and keeps
   workers.dev and preview URLs disabled. Never run bootstrap again after normal
   activation without reviewing its effect on existing routes.
7. Only after deployment authorization, deploy the bootstrap Worker and set its
   two secrets interactively:

   ```sh
   wrangler deploy --config _worker/wrangler.bootstrap.toml
   wrangler secret put TURNSTILE_SECRET --config _worker/wrangler.bootstrap.toml
   wrangler secret put CONTACT_EMAIL --config _worker/wrangler.bootstrap.toml
   ```

   Use the widget's private secret and the intended contact address. **Secret
   uploads create and immediately deploy new Worker versions**; these commands
   are not a local staging operation. Confirm there are still no public routes
   or workers.dev/preview URLs during this step. Never put secrets in Git, shell
   history, Jekyll config or CI output. For an agent-operated secret command,
   approve the exact canonical Wrangler executable/version outside the project;
   do not resolve that command through npx or project package scripts.

   The non-secret bindings are `ALLOWED_ORIGIN=https://pmaxey.com`,
   `TURNSTILE_HOSTNAME=pmaxey.com`, and `TURNSTILE_ACTION=contact`; they must match
   exactly. The address validator accepts ordinary ASCII aliases (letters,
   digits, dots, underscores, plus and hyphens), not all RFC address forms.
8. Verify both secret binding names and the disabled public URLs. Then activate
   only the two reviewed routes by deploying the production config:

   ```sh
   wrangler deploy --config _worker/wrangler.toml
   ```

   Verify that existing secrets are preserved. In **Workers & Pages →
   pmaxey-contact → Settings → Domains & Routes**, verify exactly the two routes
   listed above. Do not attach routes for `/contact/`, `/`, all subdomains, or all
   static assets. Keep any cache rules from overriding `no-store` on
   `/api/contact*` and `/_crawler/*`. Confirm failures return a non-sensitive
   message before publishing the contact UI.
9. Publish the reviewed static-site changes using the existing Pages process only
   after separate authorization. No workflow modifications are required: the
   existing optimizer automatically handles the new contact script. Jekyll excludes
   Worker code, tests, docs and local settings from its public output.

Adding `www` later requires deliberate canonicalization or matching routes, widget
hostname and origin handling; it is not enabled implicitly. Project-baseurl previews
have working contact-page and asset links, but the production API routes are defined
for the existing empty baseurl at the apex.

## Verification and local development

No new npm or Ruby dependency is required for the implementation or unit tests.
Use Node 20+ and the existing Bundler dependencies:

```sh
npm ci
npm test
bundle exec jekyll build
npm run optimize:js
npm run test:site
```

The Node test runner mocks Siteverify. Tests cover valid responses, invalid,
expired and spent tokens, freshness, hostname/action/origin checks, bounded JSON
bodies (including streamed bodies), configuration failure, safe upstream errors,
route isolation, three traps, privacy-safe log fields, and client retry/loading/
success/fallback behavior. Replay rejection relies on Cloudflare's globally
single-use Siteverify validation, not a per-isolate token cache. Every reveal calls
Siteverify again; successes are never cached. Tests emulate the second response
as `timeout-or-duplicate`. No production token or contact address is used in tests.

For browser preview with an official always-pass test widget:

```sh
bundle exec jekyll build --config _config.yml,_dev/contact.yml --destination ../contact-preview
npm run dev:contact -- ../contact-preview
```

Open `http://localhost:4000/contact/` (use `localhost`, not `127.0.0.1`). The preview
binds only to loopback. It uses the actual Worker handler, **mocked Siteverify**,
Cloudflare's official test sitekey and `contact@example.invalid`. It cannot send
mail and has no production secrets. The mock only accepts the official dummy token.
Stop with Ctrl-C. It is development tooling, never a deployment server.

Cloudflare's [official testing credentials](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
include the always-pass visible sitekey `1x00000000000000000000AA`, always-pass secret
`1x0000000000000000000000000000000AA`, always-fail secret
`2x0000000000000000000000000000000AA`, and spent-token secret
`3x0000000000000000000000000000000AA`. These are public dummy credentials. The
production Worker rejects these secrets on non-loopback origins. A live dummy API
probe returned `example.com` and no action; dummy service results must not justify
weakening production hostname/action/freshness checks. The local mock supplies the
expected fixture fields. Real production widget/domain verification is still a
separate owner acceptance step.

The contact UI preserves semantic buttons, keyboard focus, a polite status region,
flexible widget width, non-sensitive failure text and profile links without JS.
Cloudflare receives the widget interaction only after the visitor chooses Verify.
No address enters the page until the Worker returns success. No local/session
storage is used. All mail-link text uses `textContent`; it is not rendered as HTML.

## Honeypots, monitoring and privacy

Three footer links target `/_crawler/archive`, `/_crawler/export` and
`/_crawler/contacts`. Their container has `hidden`, `inert`, `aria-hidden` and a
CSS `display:none` backstop; each link has `tabindex=-1` and `rel=nofollow`.
They have no prefetch/prerender declarations, scripts or click handlers. Ordinary
browsers do not prefetch arbitrary anchors, but speculative extensions and link
scanners cannot be controlled. No legitimate navigation links target these URLs.
The traps return empty HTTP 204 with no-store/noindex headers for every method.
They do not generate more links or perform blocking/challenging.

The only application event is `{event: "crawler_trap", trap, method}`. `trap` is a
fixed label; `method` is GET, HEAD, POST, OPTIONS or OTHER. No IP, user agent,
referrer, query string, address, token or body is logged or sent as Siteverify's
optional `remoteip`. Logs carry Cloudflare-managed timestamps and execution metadata.
The Wrangler configuration enables Workers Logs but disables automatic invocation
logs (which otherwise include request URLs). Check this remains disabled in the
actual dashboard. No external sinks, databases or visitor identifiers are added.
Cloudflare still processes traffic and Turnstile data under its own policies;
AI Labyrinth and other account-level security logs have separate metadata/retention.

Inspect **Workers & Pages → pmaxey-contact → Observability → Logs**, filter
`event = crawler_trap`, compare trap counts over time, and check Worker error/request
metrics and Turnstile Analytics for failure patterns. Do not infer unique visitors
or malicious intent from counts. Logging is not an enforcement system. Under abuse,
lower `head_sampling_rate` or disable stored logs and inspect quotas; this version
has no application rate limiter. Optional future edge rate limiting must be scoped
to `/api/contact` and checked against the actual plan, not enabled globally.

For contact failures: check DevTools Network for `/api/contact` (do not share
successful response bodies), the published sitekey, proxied DNS, route, secrets,
origin, hostname/action and widget restrictions. 400/415 mean malformed client
requests, 403 means origin or verification rejection, 405 means wrong method, and
503 means missing/invalid configuration or an unavailable upstream. The visitor
gets generic messages. A 404 or HTML response usually means the Worker route is
missing. Check cache rules, browser script blockers and challenges.cloudflare.com
availability. Request bodies are bounded to 4 KiB and tokens to 2,048 characters;
Siteverify times out after 8 seconds, the client after 10 seconds, and script
loading after 15 seconds. A fresh verification attempt is required after failure.

## AI Labyrinth (manual activation)

Official documentation checked 2026-10-19:
[AI Labyrinth](https://developers.cloudflare.com/bots/additional-configurations/ai-labyrinth/),
[availability](https://developers.cloudflare.com/bots/additional-configurations/custom-rules/)
and [Free plan](https://developers.cloudflare.com/bots/plans/free/).
It is available on all plans, including Free; actual account settings were not
inspected. No duplicate maze engine is implemented.

1. Complete the proxy/HTTPS preflight above. Only proxied HTML responses can be
   modified at Cloudflare's edge; direct Pages/DNS-only traffic bypasses it.
2. Select the **pmaxey.com** zone → **Security → Settings** → filter **Bot traffic**
   → **AI Labyrinth → On**. Leave unrelated bot/blocking settings unchanged.
3. Visit normal pages and recheck content, links, keyboard navigation and appearance.
   Injection is conditional, so one browser response without hidden links does not
   prove it is disabled. Allow actual crawl traffic to accumulate; do not manufacture
   a crawl storm as a test.
4. In **Security Analytics** or **Security Events**, filter the service to
   **AI Labyrinth**. `AI Labyrinth Served` means links were injected;
   `AI Labyrinth Crawls` means an injected link was followed. **Neither action blocks
   nor challenges the request.** Dashboard event sampling/visibility may vary by
   plan; confirm the available view in the account.

The custom traps give a small independently labeled signal in Worker Logs. They
are unrelated to Cloudflare-generated Labyrinth URLs and do not trigger that
service. Narrow routes do not intercept Labyrinth's generated paths. Avoid
combining either signal into permanent bans. Any blocking or managed challenge
requires a separate explicit rule and review. To disable Labyrinth, switch it Off;
new injection stops immediately, but old links remain valid briefly and can still
produce activity until they expire.

## Costs, deployment acceptance and rollback

As of 2026-10-19, [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
includes 100,000 requests/day and 10 ms CPU/invocation on Free. Only contact API and
trap traffic invokes this Worker. Free limits are shared across the account;
exhaustion can make the gate/traps unavailable while normal Pages routes continue.
Workers Paid starts at $5/month with metered overages; it is separate from the
zone's plan. [Turnstile Free](https://developers.cloudflare.com/turnstile/plans/)
allows unlimited verification requests and up to 20 widgets. The custom system
needs no database or paid service for modest personal-site traffic. Operational
work is one Worker, one widget, two secrets and occasional log/quota review.
[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
on Free currently includes 200,000 events/day retained 3 days (Paid: 7 days).
Cloudflare announces different observability pricing from December 1, 2026;
recheck before upgrading or relying on those allowances. No subscription was created.

Before declaring live acceptance, manually verify:

- Pages HTTPS/custom-domain health and all ordinary pages after enabling the proxy.
- Exactly two routes, no conflicting Worker, correct production bindings/secrets,
  no dummy sitekey/secret, and invocation logging disabled.
- A real production widget reveals only the configured address, with keyboard and
  mobile checks; use DevTools to confirm no-store and no CORS wildcard on API output.
- Reusing the same real token returns 403, a wrong origin fails, and a test trap
  request returns 204 and appears without personal data in Worker Logs. Treat this
  known test request as a test, not an attack.
- No address in generated source, feeds, JavaScript or public configuration; expected
  profile fallback on script/API failure; all terminal commands still work.
- AI Labyrinth activation and activity separately, if enabled. Do not report it as
  blocking traffic.

Rollback: set `turnstile_sitekey` empty and republish to retain profile-only contact.
Remove the trap-link container if discontinuing the experiment. Remove only this
Worker's two routes in Cloudflare to stop its traffic; unhandled URLs then receive
Pages' ordinary 404. Keep profile links available, and do not restore a plaintext
address unless intentionally making it public again. To restore a previously working
Worker, use its saved Cloudflare version/rollback controls while retaining the
recorded bindings. Reverse the DNS proxy switch only if needed using the recorded
state and verify Pages HTTPS again; doing so also bypasses AI Labyrinth and the API.
No delete, rollback, deployment or account change has been performed by this task.
