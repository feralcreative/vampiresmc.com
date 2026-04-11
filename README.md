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

## Deployment

Files are deployed via SFTP. Credentials live in `.vscode/sftp.json` (gitignored). Two profiles are configured:

- **stage** → `stage.vampiresmc.com`
- **prod** → `vampiresmc.com`

Both point at the same DreamHost shared host; the remote paths differ.

## Sections

The site is a single-page horizontal scroll with five full-viewport panels. Navigation is driven by a fixed bottom nav with a progress rail, arrow keys, wheel/trackpad, and touch swipes. Deeplinks via hash (`#about`, `#events`, etc.) work on load and via back/forward.

1. **Hero** — club name and founding year with a GSAP entrance animation
2. **About** — club history and membership philosophy
3. **Events** — upcoming rides and rallies. Cards are rendered from `events.json` at the project root; past events are filtered out automatically (end-date-aware), capped at 6, sorted chronologically. Empty state falls back to a Facebook/Discord nudge.
4. **Fans** — a single featured quote from an event attendee
5. **Contact** — Discord handoff: live-member count (via the Discord widget API, gated to ≥10 online), a "Join the Discord" button, and a QR code of the permanent invite for desktop → mobile handoff

Each panel also has a rotating background slideshow pulled from `images/heroes/{section}/` via a hardcoded manifest in [`js/main.js`](js/main.js).
