# Personal Site (Jekyll + GitHub Pages)

This repository contains a Jekyll-based personal site deployed to GitHub Pages.

## Local development

### Prerequisites

- Ruby 3.1+
- Bundler

### Run locally

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

## Get a test page live before DNS

You can fully test GitHub Pages **without** configuring a custom domain first.

1. Push this repo to GitHub.
2. In GitHub: **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow manually from the **Actions** tab).
5. After deploy completes, open:
   - `https://<your-github-username>.github.io/<repo-name>/` (project site), or
   - `https://<your-github-username>.github.io/` (user site if repo is named `<your-github-username>.github.io`).

Once that URL works, then configure DNS for your custom domain.

## Deployment IaC

Deployment is defined as code via GitHub Actions in `.github/workflows/deploy.yml`.

- Pushes to `main` build the Jekyll site.
- The workflow publishes the generated `_site` artifact to GitHub Pages.
- `workflow_dispatch` is enabled for manual deployments.

## Template selection plan (after main site is up)

Once the core pages/content are live, choose a long-term template by shortlisting 2-3 Jekyll themes and scoring each on:

1. Content readability and typography
2. Mobile performance
3. Ease of customization
4. Ongoing maintenance/updates

Keep the current minimal theme (`minima`) until structure and content stabilize, then switch themes in a focused pass.
