# Paul Maxey Portfolio

This repository contains a Jekyll-based professional portfolio deployed to GitHub Pages.

## Local development

### Prerequisites

- Ruby 3.1+
- Bundler
- Node.js 20+ and npm for production JavaScript artifact optimization

### Run locally

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000/personal-site/>.

Local development serves readable source JavaScript from `assets/js/`.
To preview the production artifact optimization step after a Jekyll build, run:

```bash
npm ci
bundle exec jekyll build --source . --destination ./_site
npm run optimize:js
```

The optimizer minifies generated JavaScript with Terser, writes content-hashed script filenames in `_site/assets/js/`, and rewrites generated site references before deployment.

## Deployment IaC

Deployment is defined as code via GitHub Actions in `.github/workflows/deploy.yml`.

- Pushes to `main` build the Jekyll site.
- The build runs a central JavaScript optimization step against the generated `_site` artifact.
- The workflow publishes the generated `_site` artifact to GitHub Pages.
- `workflow_dispatch` is enabled for manual deployments.

## AI-Assisted Development

This repository may use AI-assisted tools for planning, implementation support, code review, and verification. Public-facing portfolio content should remain accurate, human-reviewed, and free of AI/process/scaffold language.

Repository rules, review standards, and contributor guidance live in `AGENTS.md` and `docs/`.
