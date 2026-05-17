# Paul Maxey Portfolio

This repository contains a Jekyll-based professional portfolio deployed to GitHub Pages.

## Local development

### Prerequisites

- Ruby 3.1+
- Bundler

### Run locally

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000/personal-site/>.

## Deployment IaC

Deployment is defined as code via GitHub Actions in `.github/workflows/deploy.yml`.

- Pushes to `main` build the Jekyll site.
- The workflow publishes the generated `_site` artifact to GitHub Pages.
- `workflow_dispatch` is enabled for manual deployments.
