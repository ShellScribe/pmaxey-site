# Local Development

Use this guide when configuring, building, or previewing the Jekyll site locally.

## Allowed Local Actions

Agents may:

- Inspect `Gemfile`, `_config.yml`, `.gitignore`, and source files.
- Run `bundle install`.
- Run `bundle exec jekyll build`.
- Run `bundle exec jekyll serve --baseurl /personal-site` for local preview.
- Update `.gitignore` if build artifacts are not ignored.
- Fix minimal dependency or configuration issues needed for local build.

## Not Allowed Without Explicit Approval

Agents must not:

- Commit, push, publish, or deploy.
- Add analytics, forms, external services, trackers, third-party embeds, JavaScript frameworks, or unrelated dependencies.
- Change public content or design unless needed to verify the build.
- Remove user-authored files without explaining why first.
- Add secrets, tokens, private keys, Codex config, or local machine configuration to the repo.

## Expected Local Commands

Use the repo Ruby version:

```bash
ruby -v
```

Expected major version:

```text
ruby 3.x
```

Install dependencies:

```bash
bundle install
```

Build the site:

```bash
bundle exec jekyll build
```

Preview locally with the GitHub Pages project base URL:

```bash
bundle exec jekyll serve --baseurl /personal-site
```

Then open:

```text
http://127.0.0.1:4000/personal-site/
```

## Ruby Version

This repo declares its local Ruby version in `.ruby-version`. Use a Ruby version manager such as `rbenv`, `asdf`, `mise`, or `chruby` to install and activate that version before running Bundler.

The macOS system Ruby is not sufficient for this project because the lockfile uses a modern Bundler version and the Jekyll dependency set expects a supported Ruby 3 environment.

## Common Failure

If `bundle exec jekyll build` fails before Jekyll starts with an error like:

```text
Could not find 'bundler' (...) required by your Gemfile.lock
```

check the active Ruby:

```bash
ruby -v
```

If it reports Ruby `2.6`, activate the repo Ruby version and run:

```bash
gem install bundler:2.5.22
bundle install
bundle exec jekyll build
```
