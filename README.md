# Vampires MC — Website

[![Production](https://img.shields.io/badge/live-vampiresmc.com-cc0000?style=flat-square)](https://vampiresmc.com)
[![Staging](https://img.shields.io/badge/staging-stage.vampiresmc.com-555?style=flat-square)](https://stage.vampiresmc.com)

Public site for [Vampires Motorcycle Club](https://www.facebook.com/vampiresmc), founded 1954. Chapters in Santa Cruz, San Francisco, and San Luis Obispo, CA.

## Stack

- HTML5 / SCSS / Vanilla JS
- [GSAP 3](https://gsap.com) — hero entrance animation and the Discord member-count ticker
- [node-qrcode](https://github.com/soldair/node-qrcode) 1.4.4 — generates the Discord invite QR code on the contact panel (pinned; later versions ship an ESM-only bundle)
- [Font Awesome 6.7.2](https://fontawesome.com) — social icons
- Google Fonts — Montserrat, Lato
- Discord widget API (`/api/guilds/:id/widget.json`) — live online-member count on the contact panel

No build step or package manager. Everything loads from CDN.

## Structure

```text
index.html
events.json           # data file consumed by the Events panel
js/
  main.js
styles/
  scss/               # source — edit these
    main.scss
    _variables.scss
    _reset.scss
    _typography.scss
    _hero.scss          # panel system + hero styles
    _sections.scss      # shared section/container/button styles
    _about.scss
    _events.scss
    _fans.scss
    _reviews.scss
    _contact.scss
    _discord.scss
    _bottom-nav.scss
    _footer.scss
  css/                # compiled — do not edit
    main.css
    main.min.css
images/
  heroes/             # background slideshow images, per section
    home/
    about/
    events/
    fans/
    contact/
  icons/              # e.g. icon-biker.svg for the bottom nav progress indicator
  logos/
```

## Development

SCSS is compiled by the [Live Sass Compiler](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) VS Code extension. It watches `styles/scss/main.scss` and writes both expanded (`main.css`) and minified (`main.min.css`) output on save. `index.html` loads the minified build.

To run the site locally, open `index.html` through any static server (VS Code Live Server works). There's no Node tooling or package manager.

A small `#viewport-widget` at the top of the page shows the current viewport size during development. It's part of the markup in `index.html` and is removed from the DOM at runtime on any non-local host (anything that isn't `localhost` or `127.0.0.1`), so it never ships to production. To broaden the dev-host match for LAN testing, edit the regex in the inline script right after the widget element.

## Deployment

> **Before your first deploy:** `.vscode/sftp.json` is git-ignored because it carries server credentials (host, username, remote paths, SSH agent config). The deploy scripts read connection details from it at runtime, so it must exist locally before anything will work. If you don't already have one, ask Ziad at <ziad@feralcreative.co> or <ziad@vampiresmc.com> for a copy and drop it in `.vscode/`.

Deploys run from the scripts in `utils/deploy/`. Both targets use `rsync -avz --delete` over SSH, authenticating through `$SSH_AUTH_SOCK` (same agent the VS Code SFTP extension uses). Connection details (host, username, port, remote paths) are read at runtime from `.vscode/sftp.json`, so credentials live in exactly one place.

```bash
./utils/deploy/stage.sh              # push to stage.vampiresmc.com
./utils/deploy/prod.sh               # push to vampiresmc.com
./utils/deploy/stage.sh --dry-run    # preview without uploading
./utils/deploy/prod.sh  --dry-run    # preview prod without uploading
./utils/deploy/prod.sh  --force      # bypass prod git-clean / on-main gates
```

Each run compiles SCSS via `npx sass`, rewrites the `.css?v=<...>` cache-bust string in `index.html` to the current timestamp, rsyncs the tree, and prints a summary box (target, git sha, cache-bust version, files moved, bytes, timings). The cache-bust rewrite is auto-reverted locally after rsync — the new version string only exists on disk long enough to be uploaded, so your working tree stays clean. The exclude list lives in `utils/deploy/ignore.json` and mirrors the `ignore` array in `.vscode/sftp.json` — keep both in sync when adding or removing patterns.

**Prod safety gates:** `prod.sh` refuses to run when the working tree is dirty or when you're not on `main`, and it requires you to type `yes` at the confirmation prompt. `--force` bypasses the git checks but not the confirmation.

**Dependencies:** `rsync`, `ssh`, `jq`, `git`, and `npx` (Node). Install the non-default ones with `brew install jq rsync`.

The VS Code SFTP extension remains configured via `.vscode/sftp.json` as a fallback for single-file pushes or emergency manual deploys.

## Sections

The site is a single-page horizontal scroll with five full-viewport panels. Navigation is driven by a fixed bottom nav with a progress rail, arrow keys, wheel/trackpad, and touch swipes. Deeplinks via hash (`#about`, `#events`, etc.) work on load and via back/forward.

1. **Hero** — club name and founding year with a GSAP entrance animation
2. **About** — club history and membership philosophy
3. **Events** — upcoming rides and rallies. Cards are rendered from `events.json` at the project root; past events are filtered out automatically (end-date-aware), capped at 6, sorted chronologically. Empty state falls back to a Facebook/Discord nudge.
4. **Fans** — a single featured quote from an event attendee
5. **Contact** — Discord handoff: live-member count (via the Discord widget API, gated to ≥10 online), a "Join the Discord" button, and a QR code of the permanent invite for desktop → mobile handoff

Each panel also has a rotating background slideshow pulled from `images/heroes/{section}/` via a hardcoded manifest in [`js/main.js`](js/main.js).
