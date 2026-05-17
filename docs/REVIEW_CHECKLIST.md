# Review Checklist

Use this checklist before handing work back to the user.

## Scope

- The change matches the user's request.
- No public design or theme changes were made unless requested.
- No unrelated files were reformatted or rewritten.
- Existing user changes were preserved.

## Jekyll Validity

- Markdown front matter is valid YAML.
- `_config.yml` remains valid YAML if edited.
- Internal links respect the configured `baseurl`.
- New pages have appropriate titles, layouts, and filenames.
- Navigation changes are intentional and compatible with the current theme.

## Content Quality

- Claims are supported by user-provided facts.
- Senior cloud/platform engineering signal is concrete and relevant.
- Tool mentions are tied to problems, decisions, or outcomes.
- No confidential employer, customer, infrastructure, or incident details are exposed.
- Tone is professional, specific, and measured.
- Headings, links, and alt text are accessible.

## Security And Privacy

- No secrets, keys, tokens, account IDs, private URLs, internal hostnames, or sensitive screenshots were added.
- External links use HTTPS and are appropriate for a professional portfolio.
- No analytics, forms, embeds, iframes, remote scripts, or tracking parameters were added without approval.
- Dependencies and plugins were not added without a clear reason.
- Any workflow or automation changes follow least privilege.

## Build And Verification

- For content-only changes, files were reviewed for Markdown/YAML correctness.
- For config, dependency, layout, include, or navigation changes, `bundle exec jekyll build` was run when available.
- If build verification was skipped, the reason is stated in the handoff.
- `git status --short` was checked and reported when useful.

## Handoff

- Summarize changed files.
- Mention verification performed.
- Note assumptions or residual risks.
- Do not commit, push, or deploy unless explicitly requested.
