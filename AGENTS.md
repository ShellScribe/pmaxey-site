# Agent Instructions

This repository is a Jekyll GitHub Pages personal portfolio for a senior cloud/platform engineer. Treat it as a public professional artifact: every change should improve credibility, clarity, maintainability, or deployment safety.

## Primary References

- Start with `docs/PROJECT_BRIEF.md` to understand the site's purpose, audience, and positioning.
- Follow `docs/PROMPTING_GUIDE.md` when interpreting or refining future user requests.
- Follow `docs/CONTENT_RULES.md` for public-facing copy, portfolio claims, and writing standards.
- Follow `docs/SECURITY_RULES.md` before adding links, embeds, scripts, dependencies, analytics, forms, workflows, or automation.
- Use `docs/REVIEW_CHECKLIST.md` before handing work back.

## Working Principles

- Always run `git status` before making changes.
- For structural, design, dependency, workflow, or configuration changes, use a new descriptive branch unless the user directs otherwise.
- Do not commit, push, publish, or deploy unless the user explicitly asks.
- Do not change the public site design unless the user explicitly asks for design or theme work.
- Preserve the current Jekyll/GitHub Pages architecture unless there is a clear user request and a low-risk migration path.
- Prefer small, reviewable changes over broad rewrites.
- Keep the portfolio accurate, senior-level, and evidence-driven. Avoid inflated claims, vague buzzwords, unverifiable metrics, and invented details.
- Do not invent employers, dates, certifications, metrics, projects, responsibilities, links, or technologies.
- Assume all committed content is public. Do not add secrets, private employer data, customer names, internal system details, or sensitive infrastructure diagrams.
- Respect user edits. If the working tree is dirty, inspect relevant files before changing them and do not revert unrelated changes.

## Technical Context

- Static site generator: Jekyll.
- Current theme: `minima`.
- Package manager: Bundler.
- Key files: `_config.yml`, `Gemfile`, `index.md`, and future Markdown pages/posts.
- Production target: GitHub Pages at the configured `url` and `baseurl`.
- This is a GitHub Pages project site, so internal links and assets must work correctly with the configured `baseurl`.

## Implementation Defaults

- Use Markdown and YAML idiomatically. Keep front matter valid and minimal.
- Use `relative_url` for internal links and assets unless there is a specific reason not to.
- Keep dependencies conservative. Add gems only when needed and only if compatible with GitHub Pages and the local Jekyll version.
- Prefer built-in Jekyll features over custom JavaScript.
- Avoid adding third-party embeds, tracking, remote scripts, analytics, forms, or client-side frameworks without explicit approval.
- Keep accessibility, mobile readability, performance, and SEO basics in scope for any public-facing change.
## Public Site Hygiene

- Do not include agent instructions, prompt text, implementation notes, planning notes, TODO scaffolding, or AI/process language in public-facing pages.
- Placeholder content is acceptable only when explicitly requested and should be clearly generic, not process-oriented.
- Before handing work back, check changed public-facing files for accidental scaffold text.

## Verification Defaults

- For content-only changes, run a quick Markdown/YAML sanity review.
- For Jekyll config, layout, dependency, or navigation changes, run `bundle exec jekyll build` when dependencies are available.
- If a local server is needed, use `bundle exec jekyll serve` and verify the rendered page in a browser.
- Report any verification that could not be run and why.

## Handoff Expectations

When finishing work, summarize:

- Files changed.
- What changed and why.
- Verification performed.
- Any risks, assumptions, or follow-up items.

Do not commit, push, publish, or deploy unless the user explicitly asks.