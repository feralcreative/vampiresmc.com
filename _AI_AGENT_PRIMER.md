# Vampires MC — AI Agent Primer

vampiresmc.com — public website for Vampires Motorcycle Club, est. 1954

## Secrets Reference Guide

### 1. SFTP Credentials

**Location:** `.vscode/sftp.json` (git-ignored)

- Host: `pdx1-shared-a1-23.dreamhost.com`
- Username: `vampweb`
- Password: `5p#****6q` (15 chars)
- Remote path: `/home/vampweb/stage.vampiresmc.com`

### 2. Staging HTTP Auth

**Location:** `.htpasswd` (project root)

- Username: visible in `.htpasswd`
- Password: bcrypt-hashed in `.htpasswd`

### 3. Files That Must Stay Git-Ignored

`.vscode/sftp.json` contains plaintext SFTP password. `.htpasswd` contains hashed staging credentials. Both are excluded via `.gitignore` patterns. The `.htaccess` is also untracked.

## Architecture and Structure

### Directory Tree

```text
vampiresmc.com/
├── index.html                 # Single-page site (all 5 sections)
├── js/
│   └── main.js                # All site JS — navigation, slideshows, GSAP
├── styles/
│   ├── scss/                  # Source — edit these
│   │   ├── main.scss          # Entry point, imports all partials
│   │   ├── _variables.scss    # Colors, fonts, breakpoints, mixins
│   │   ├── _reset.scss        # Box-sizing, smoothing, element resets
│   │   ├── _typography.scss   # Body/heading styles, .section-title
│   │   ├── _header.scss       # Fixed logo, subway-dot nav (unused in current markup)
│   │   ├── _hero.scss         # Hero slideshow crossfade images
│   │   ├── _sections.scss     # .panel system, .container, .btn, header/social positioning
│   │   ├── _about.scss        # .about-content max-width and type
│   │   ├── _events.scss       # Event cards grid, card styling
│   │   ├── _fans.scss         # Blockquote/testimonial layout
│   │   ├── _contact.scss      # Contact form fields
│   │   ├── _bottom-nav.scss   # Fixed bottom dot nav with biker icon
│   │   ├── _footer.scss       # .site-copyright fixed element
│   │   └── _reviews.scss      # Empty partial (unused)
│   └── css/                   # Compiled — do not edit
│       ├── main.css           # Expanded output
│       └── main.min.css       # Compressed (linked in index.html)
├── images/
│   ├── heroes/                # Background slideshows, organized by section
│   │   ├── manifest.php       # Returns JSON listing of hero files per section
│   │   ├── home/              # Drop .jpg/.png/.webp/.avif files here
│   │   ├── about/
│   │   ├── events/
│   │   ├── fans/
│   │   └── contact/
│   ├── icons/
│   │   └── icon-biker.svg     # Biker silhouette for bottom-nav rider
│   ├── logos/
│   │   ├── top-rocker.svg     # Club logo (header)
│   │   └── top-rocker.png     # Raster fallback
│   └── event/
│       └── 2026-vampires-mc-32nd-annual-rally.jpg
├── events.json                # Event list — edit to add/remove rallies
├── utils/
│   └── dev.sh                 # Local dev launcher — runs php -S + BrowserSync
├── bs-config.js               # BrowserSync config (dev-only, don't deploy)
├── vampiresmc.md              # Tech stack audit and dev plan (reference doc)
├── README.md                  # Project overview
├── .htaccess                  # Basic auth for staging
├── .htpasswd                  # Staging credentials
├── .gitignore                 # Excludes .vscode, node_modules, maps, archives, etc.
└── .vscode/
    ├── settings.json          # Live Sass Compiler config
    ├── tasks.json             # "Start dev server" task bound to Cmd+Shift+B
    └── sftp.json              # SFTP deploy config (git-ignored)
```

### What Does Not Exist

- No `package.json` — no npm dependencies
- No build step — SCSS compiled by VS Code Live Sass Compiler extension
- No framework, no CMS
- The only server-side code is `images/heroes/manifest.php` — a single 50-line PHP endpoint that returns a directory listing of hero images. No routes, no state, no database. Runs on DreamHost's default PHP.
- No `_archive/` folder (planned but not yet created)

## Technology Stack

| Layer      | Technology                         | Version / Notes                           |
| ---------- | ---------------------------------- | ----------------------------------------- |
| Markup     | HTML5                              | Single `index.html`                       |
| Styles     | SCSS → CSS                         | Compiled by Live Sass Compiler (VS Code)  |
| JavaScript | Vanilla JS (IIFE)                  | No dependencies beyond GSAP               |
| Animation  | GSAP 3                             | CDN — hero entrance timeline + counter    |
| Icons      | Font Awesome 6.7.2                 | CDN — social icons (Facebook, Discord)    |
| Fonts      | Google Fonts                       | Montserrat (headings), Lato (body)        |
| QR codes   | node-qrcode                        | CDN — browser build for Discord handoff   |
| Contact    | Discord (`widget.json` + invite)   | Public widget API, no bot, no form        |
| Hero feed  | PHP (`manifest.php`)               | One 50-line endpoint — directory listing  |
| Deploy     | SFTP                               | DreamHost shared hosting via VS Code SFTP |
| Hosting    | DreamHost                          | Staging at `stage.vampiresmc.com`         |

## Data Flow

```text
User visits site
  → index.html loads (single page)
  → main.min.css (compiled SCSS)
  → Google Fonts, Font Awesome, GSAP (CDN)
  → main.js initializes:
      1. IntersectionObserver watches panels → updates bottom-nav dots + URL hash
      2. Wheel/keyboard listeners → horizontal panel-to-panel navigation
      3. Background image slideshows → 6s crossfade interval per section
      4. GSAP timeline → hero title/subtitle entrance animation
  → Contact form submits POST to api.web3forms.com
```

## Code Structure

### index.html — Single-Page Layout

Five full-viewport panels inside a horizontal scroll container:

| Panel   | ID         | Lines   | Content                                    |
| ------- | ---------- | ------- | ------------------------------------------ |
| Hero    | `#hero`    | 61–75   | Club name, "Est. 1954", home slideshows    |
| About   | `#about`   | 80–106  | Club history and philosophy                |
| Events  | `#events`  | ~111–128| Dynamic event cards rendered from `events.json` |
| Fans    | `#fans`    | 148–166 | Tongue-in-cheek negative testimonial       |
| Contact | `#contact` | ~171–198| Discord invite card + live count + QR     |

Fixed elements outside the scroll container:

- **Header logo** (line 19): fixed top-center, links to `top-rocker.svg`
- **Social icons** (lines 20–23): fixed top-right (Facebook, Discord)
- **Bottom nav** (lines 28–52): fixed bottom dot navigation with section labels
- **Copyright** (line 54): fixed bottom-center

### js/main.js — All Site JavaScript (185 lines)

Single IIFE, no modules. Key systems:

| System              | Lines    | Description                                                        |
| ------------------- | -------- | ------------------------------------------------------------------ |
| Panel navigation    | 16–29    | `goToPanel(index)` — scrolls to panel, updates CSS `--progress`    |
| Hash/deeplink       | 34–45    | Maps URL hash to panel index, updates on navigation                |
| IntersectionObserver| 50–63    | Watches panels at 0.5 threshold, syncs dots + hash                 |
| Dot click handlers  | 65–73    | Both `.scroll-dot` and `.bottom-dot` arrays                        |
| Scroll-end sync     | 76–78    | Keeps `targetIdx` current after swipe/scrollbar use                |
| Wheel redirect      | 85–117   | Vertical → horizontal, one panel per step, 800ms debounce          |
| Keyboard nav        | 122–130  | Arrow keys navigate between panels                                 |
| Deeplink on load    | 135–140  | Instant scroll to hash target on page load                         |
| Popstate            | 143–146  | Browser back/forward support                                       |
| Slideshows          | 151–164  | 6s interval crossfade on `.panel-bg[data-slideshow]` containers    |
| Events renderer     | see fn   | Fetches `events.json`, filters past events, renders `.event-card` grid |
| Discord count       | see fn   | Fetches `widget.json`, animates count if `presence_count >= 10`    |
| Discord QR          | see fn   | Generates SVG QR for the invite URL into the card's QR slot        |
| Hero animation      | end      | GSAP timeline: title lines stagger in, then subtitle fades up      |

**Strict rule:** Discord integration in this repo never uses a bot. All
dynamic data comes from Discord's native public `widget.json` endpoint.
See `.claude/` memory for the full rule.

### SCSS Architecture

Entry point: `styles/scss/main.scss` — imports 13 partials via `@import`.

**Note:** `_reviews.scss` partial exists but is empty and not imported.

#### Key Variables (`_variables.scss`)

- **Colors:** `$color-bg: #0b0b0b`, `$color-accent: #c00` (red), `$color-accent-lt: #ff0000`
- **Fonts:** `$font-body: "Lato"`, `$font-heading: "Montserrat"`
- **Breakpoints:** `$bp-sm: 480px`, `$bp-md: 768px`, `$bp-lg: 1024px`, `$bp-xl: 1280px`
- **Breakpoint mixin:** `@include bp(md) { ... }` wraps `@media (min-width: $bp-md)`
- **Hero font size:** `$fs-hero: clamp(5rem, 8vw, 7rem)`

#### Panel System (`_sections.scss`)

The core layout pattern: `.scroll-container` is a horizontal flexbox with `scroll-snap-type: x mandatory`. Each `.panel` is `100vw × 100vh` with `scroll-snap-align: start`. Panels can internally scroll vertically if content overflows (JS handles this in the wheel handler).

#### Bottom Navigation (`_bottom-nav.scss`)

Fixed at viewport bottom. A gray track line spans 10%–90% width. A red fill line grows with `--progress` CSS custom property. A biker SVG icon rides the fill line, rotating via `--bike-rotation` custom property driven by a sine-based easing in JS.

## Deployment

### Environments

| Environment | URL                         | Auth                          |
| ----------- | --------------------------- | ----------------------------- |
| Production  | `vampiresmc.com`            | Public                        |
| Staging     | `stage.vampiresmc.com`      | HTTP Basic Auth (`.htpasswd`) |

### Deploy Process

1. Edit SCSS source files in `styles/scss/`
2. Live Sass Compiler auto-compiles to `styles/css/main.css` and `main.min.css` on save
3. Deploy via SFTP using VS Code SFTP extension (`Ctrl+Shift+P` → "SFTP: Upload")
4. Target: DreamHost shared hosting at `pdx1-shared-a1-23.dreamhost.com`
5. Remote path: `/home/vampweb/stage.vampiresmc.com`

SFTP ignore patterns exclude: `_*` prefixed files/folders, `.git`, `.claude`, `.vscode`, `scss/`, `*.md`, `*.css.map`

### Staging Auth

`.htaccess` enforces Basic Auth on staging using `.htpasswd` at `/home/vampweb/stage.vampiresmc.com/.htpasswd`.

## Development Workflow

### Local Setup

1. Clone the repo
2. Open in VS Code
3. Install the [Live Sass Compiler](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) extension
4. The `.vscode/settings.json` configures it to watch `styles/scss/main.scss` and output both expanded and minified CSS to `styles/css/`
5. Click "Watch Sass" in the VS Code status bar
6. Install BrowserSync globally once: `npm install -g browser-sync`
7. Start the dev server: `./utils/dev.sh` (or `Cmd+Shift+B` in VS Code → "Start dev server")
8. Browser auto-opens at `http://localhost:3054`

**Do not** open `index.html` with Live Server. The site uses a PHP endpoint (`images/heroes/manifest.php`) for hero slideshows, which Live Server can't execute. The dev script boots `php -S` on 8054 and runs BrowserSync in proxy mode on 3054 in front of it — PHP executes correctly AND you get live reload + CSS injection on top.

### Dev Server Architecture

| Process      | Port | Purpose                                                |
| ------------ | ---- | ------------------------------------------------------ |
| `php -S`     | 8054 | Serves static files + executes `manifest.php`          |
| BrowserSync  | 3054 | Proxies to PHP, injects reload client, watches files   |

`utils/dev.sh` starts both. Ctrl+C cleanly shuts both down (trap handles the PHP cleanup). `bs-config.js` at the repo root defines the BrowserSync proxy target, watched files, and reload behavior.

**CSS injection:** BrowserSync watches `styles/css/**/*.css` (the Live Sass output) and injects CSS changes in-place without a full page reload. Scroll position, open panels, the horizontal scroll index, and Discord card state all stay put. Edit SCSS, save, see the change instantly.

**Cross-device testing:** BrowserSync prints an "External" URL (e.g., `http://192.168.1.18:3054`) on startup. Open it on a phone or iPad on the same network — scroll, clicks, and form input mirror across all connected browsers. Useful for testing the hero slideshow and Discord QR handoff across breakpoints.

**Port collision:** if something else has port 8054, the script kills the listener before starting fresh (per the project's "unique ports, never spawn duplicates" rule).

**SFTP ignore:** `bs-config.js`, `utils/`, and `.vscode/` should all be excluded from SFTP uploads. `.vscode/` is already excluded by the default SFTP ignore pattern. `bs-config.js` and `utils/` need to be added manually to `.vscode/sftp.json` if not already present.

### SCSS Compilation

- **Development:** Live Sass Compiler watches on save
- **Manual (if needed):** `npx sass styles/scss/main.scss:styles/css/main.css` and `npx sass --style=compressed styles/scss/main.scss:styles/css/main.min.css`
- Source maps are disabled (`.vscode/settings.json` → `generateMap: false`)

### Editing Patterns

- Edit SCSS partials, never edit `styles/css/` files directly
- `index.html` is the single source of all markup
- `js/main.js` is the single source of all JavaScript
- Hero images are organized into section subfolders under `images/heroes/`

## Architectural Decisions

### Why Static HTML Instead of WordPress

The previous site was WordPress + Elementor with heavy plugin overhead. The new site is a simple single-page brochure with no dynamic content needs. Static HTML eliminates hosting complexity, security surface, and maintenance burden. See `vampiresmc.md` for the full audit.

### Why Horizontal Scroll

The site is designed as a full-viewport horizontal scroll experience. Each section gets the full screen. Navigation is via bottom dot nav, keyboard arrows, mouse wheel (redirected from vertical), or touch swipe. This gives the site a distinctive, app-like feel appropriate for a motorcycle club.

### Why No Smooth Scroll Library

`vampiresmc.md` originally planned Lenis smooth scroll, but the current implementation uses native `scrollIntoView({ behavior: "smooth" })` with `scroll-snap-type: x mandatory`. The JS wheel handler with 800ms debounce provides controlled panel-to-panel movement without a library dependency.

### How Hero Slideshows Work

Hero images are **not hardcoded** in `index.html`. Each `.panel-bg[data-slideshow="{section}"]` starts empty. On page load, [js/main.js](js/main.js) fetches [images/heroes/manifest.php](images/heroes/manifest.php), which returns JSON like:

```json
{
  "home":    ["vmc-hero-03-home.jpg", "vmc-hero-04-home.jpg", ...],
  "about":   ["vmc-hero-06-about.jpg", ...],
  "events":  [...],
  "fans":    [...],
  "contact": [...]
}
```

The JS then populates each container with `<img>` elements built from the arrays. Sections with 2+ images get the crossfade interval; single-image sections stay static; empty or missing sections degrade silently (no 404s, no broken icons).

**Adding or removing a hero image:** drop a `.jpg` / `.jpeg` / `.png` / `.webp` / `.avif` file into the appropriate `images/heroes/{section}/` folder (or delete one). SFTP upload. That's the entire workflow — no HTML, JS, or manifest edits required. `manifest.php` reads the directory at request time.

**Local dev:** `utils/dev.sh` handles this transparently — it boots `php -S` and proxies BrowserSync in front of it, so `manifest.php` executes on the local dev server exactly as it does on DreamHost. BrowserSync also watches `images/heroes/**/*.{jpg,jpeg,png,webp,avif}`, so dropping a new hero image into a folder triggers a reload and the new file appears in the rotation without any other action.

### Why Discord-First Contact (No Form)

The club's primary public contact channel is Discord. The site's Contact panel is built as a Discord invite card with a live member count (via Discord's public `widget.json`) and a desktop→mobile QR handoff. No server-side form handler, no Web3Forms, no email endpoint — Discord is the single contact path alongside the existing Facebook link. **Discord bots are strictly prohibited in this repo.**

### Why `events.json` Instead of a CMS

Events are stored as a single same-origin JSON file at the repo root, fetched and rendered client-side. Past events auto-filter out by date, so the Events panel stays evergreen with zero manual cleanup. Adding an event is a 5-line JSON edit + SFTP upload. No calendar integration, no Google Sheets runtime dependency, no build step. The tradeoff: only one editor (whoever has repo access) can update events.

`events.json` schema (array of objects):

```json
{
  "title": "32nd Annual Rally",
  "startDate": "2026-06-12",
  "endDate": "2026-06-14",
  "location": "Santa Cruz",
  "description": "Optional 1–2 sentence description.",
  "url": "https://www.facebook.com/events/..."
}
```

`startDate` is required (ISO `YYYY-MM-DD`, parsed as local time). `endDate` defaults to `startDate` for single-day events. `location`, `description`, `url` are all optional. Events are filtered by `endDate >= today`, sorted ascending, and the first 6 are rendered. Empty state falls back to a "no rallies on the calendar right now" message pointing at Facebook and Discord.

### Why No Build Step

No bundler, no npm. SCSS compilation is handled entirely by the VS Code extension. This keeps the project simple and zero-config for anyone with VS Code.

## Known Issues and Incomplete Features

### Bugs / Issues

- **`.htpasswd` not in `.gitignore`** — staging credentials file shows as untracked; should probably be ignored
- **`.htaccess` not in `.gitignore`** — staging auth config shows as untracked; should probably be ignored

### Incomplete

- **Production deployment** — SFTP config points to staging only; no production deploy workflow documented
- **Responsive testing** — Mobile-first pass may not be complete; no media queries in several partials
- **SEO** — No favicon, no Open Graph tags, no structured data
- **Accessibility** — Hero background images lack meaningful alt text

### Technical Debt

- `_reviews.scss` is an empty, unused partial
- `_header.scss` contains `.scroll-dots` / `.scroll-dot` styles for a subway nav that exists in CSS but has no corresponding markup in `index.html` (was replaced by bottom-nav)
- The `$color-accent` variable comment says "warm amber" but the value is `#c00` (red)

## Next Steps

Based on `vampiresmc.md` dev plan and current state:

1. Fix broken image references (about/fans section mismatches)
2. Remove empty `_reviews.scss`
3. Clean up dead `.scroll-dot` styles or remove them
4. Add favicon and Open Graph meta tags
5. Responsive polish pass across all breakpoints
6. Image optimization (current hero images are unoptimized JPEGs)
7. Set up production SFTP config or alternative deploy
