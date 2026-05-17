# Prompting Guide

Use this guide when translating future requests into safe, useful work for this portfolio.

## Clarify Intent When Needed

Ask a brief question before editing when the request depends on unknown facts, such as:

- Actual work history, titles, certifications, dates, or employers.
- Private project details that may need sanitization.
- Preferred personal brand, tone, or audience.
- Whether a public design change is intended.
- Whether external services, analytics, forms, or embeds are acceptable.
- Whether the change should be content-only, design-focused, or structural.

When the request is clear and low risk, proceed directly.

## Prefer Strong Inputs

For portfolio content, ask for or use:

- Role, scope, and timeframe.
- Cloud platforms, services, and tools used.
- Business or operational problem.
- Constraints and tradeoffs.
- Measurable outcomes that are safe to publish.
- Sanitized architecture or implementation details.
- Source material from an approved resume, project note, or user-provided text.

If exact metrics are unavailable, use qualitative but honest wording instead of invented numbers.

## Good Task Shapes

Useful requests for this repo include:

- "Draft a senior platform engineer homepage from these resume bullets."
- "Turn this project into a public-safe case study."
- "Review this page for security-sensitive disclosure."
- "Add a writing page using the existing Jekyll structure."
- "Improve the clarity of this cloud engineering summary without changing claims."
- "Check whether this dependency or embed is appropriate for GitHub Pages."
- "Fix a GitHub Pages baseurl or asset path issue without redesigning the site."

## Workflow Defaults

For non-trivial changes:

1. Run `git status`.
2. Create a descriptive branch if the change is structural, design-related, dependency-related, or workflow-related.
3. Inspect the relevant files before editing.
4. Make small, reviewable changes.
5. Run the appropriate verification command when available.
6. Summarize changed files, verification results, assumptions, and recommended commit message.

Do not commit or push unless explicitly asked.

## Response Behavior

For future Codex work:

- Make the smallest change that satisfies the request.
- Keep public copy precise, credible, and easy to scan.
- Separate facts from suggested positioning.
- Flag assumptions explicitly.
- Do not publish unverified claims as fact.
- Do not expose private implementation details.
- Do not commit or push unless asked.

## Senior Engineer Portfolio Heuristics

Strong content usually answers:

- What was the system or platform responsible for?
- What reliability, security, cost, or delivery problem existed?
- What engineering choices were made?
- What tradeoffs were considered?
- What changed for users, developers, operators, or the business?
- What would be done differently with more time?

Weak content often includes:

- Tool lists without context.
- Generic ownership claims.
- Confidential implementation detail.
- Inflated impact language.
- Unexplained acronyms.
- Design polish that hides thin substance.
- AI/process language visible on public pages.