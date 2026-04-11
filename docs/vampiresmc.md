# vampiresmc.com — Tech Stack Audit & Development Plan

## Current Site: vampiresmc.com

### Platform & CMS

- WordPress 6.9.4 (core assets served via wp.com CDN at c0.wp.com)
- Hello Elementor parent theme (v3.0.0)
- Custom child theme "Vampires MC" (v2024.11.25.1852) by Feral Creative

### Page Builder & Plugins

- Elementor 3.35.7 + Elementor Pro 3.35.1 (page layout, forms, sticky header, nav menu)
- Smart Slider 3 (hero image carousel — 22 slides of ride/event photography)
- Jetpack (forms, stats via stats.wp.com)
- Really Simple Security / RSSSL (session cookie hardening)
- Google reCAPTCHA (contact form spam protection)

### Frontend Stack

- jQuery 3.7.1 + jQuery Migrate 3.4
- jQuery SmartMenus (dropdown nav), jQuery Sticky (header)
- Font Awesome 5.15.3 (social icons in footer)
- Google Fonts: Kanit (body + headings)
- SCSS compiled via VS Code Live Sass Compile extension

### Custom JavaScript

- **audio-player.js** — play/pause toggle with remaining time display, icon switching
- **balance-text.js** — UMD module for typographic text balancing (by Ziad Ezzat / Feral Creative)
- **refresh.js** — development utility for live CSS hot-reload via hash-based change detection

### Custom PHP (Child Theme)

- **functions.php** — enqueues child theme styles (priority 20), renames Posts to Blog, loads PHP modules
- **no-comments.php** — completely disables WordPress comments system-wide (metaboxes, menu pages, admin bar, front-end)
- **allow-svg.php** — enables SVG uploads with XML structure validation and sanitization
- **hide-login.php** — security hardening: redirects `/dashboard` to login, blocks direct `wp-login.php` access for unauthenticated users

### Design & Color Scheme

- Dark theme: black (#000) background, white (#fff) text, red (#d00) accents
- Kanit font family throughout, 200 weight body text, heavier headings
- Sticky header with logo shrink effect on scroll (Elementor sticky + custom CSS)
- Single-page layout with anchor navigation

### Site Sections

1. **Hero** — full-width Smart Slider 3 carousel with "VAMPIRES / MOTORCYCLE CLUB" text overlay, 22 ride/event photos, prev/next arrows, dot navigation
2. **About** — club description and mission statement. Chapters in Santa Cruz, San Francisco, and San Luis Obispo. Emphasizes diversity and riding passion
3. **Quote** — humorous fake-negative testimonial ("Organization was poor. Pace was generally too fast for road conditions.")
4. **Upcoming Events** — descriptive intro text + 3×2 grid of event cards organized by chapter (Santa Cruz, SF) and scope (World, US, California, Earth). Links to Facebook events. Google Calendar subscribe link
5. **Contact** — Elementor Pro form (Name, Email, Message) with reCAPTCHA v3
6. **Footer** — copyright (©1954–2026 Vampires Motorcycle Club, Inc.), social icons (Facebook, Twitter/X, YouTube)

### Infrastructure

- Custom media uploads directory at `/media/` (instead of default `/wp-content/uploads/`)
- MySQL database: `wp_vmc_db` (localhost, root credentials for local dev)
- WP memory limit: 128MB
- Debug mode: disabled

### SCSS Architecture

Main `style.scss` imports modular partials:

```text
@import "./scss/variables"
@import "./scss/typography"
@import "./scss/header"
@import "./scss/footer"
@import "./scss/sections"
@import "./scss/hero"
@import "./scss/interactive"
@import "./scss/temp"
```

Admin styles (`admin.scss`) import external utility CSS from `feralcreative.dev/utils.min.css`.

## Forum: forum.vampiresmc.com

- **Platform:** vBulletin 5.6.2
- **Content:** 6,220 topics, 50,999 posts, 421 registered members
- **Last meaningful activity:** July 2024 (most forums inactive since 2020–2023)
- **Current state:** Effectively dormant — 0 active members, ~1,300 guest bot sessions
- **Categories:** Vampire Rides/Rallys/News (2,218 posts), Virtual Perg/Random Chat (6,991 posts), Santa Cruz/SF/SLO Motorcycle Chat, Non-Vampire Rally Announcements, Wanted/For Sale/Trade
- **Decision:** To be decommissioned. Forum will not carry over to the new site.

## New Site: Development Plan

### Decisions Made

| Decision     | Choice                                                             |
| ------------ | ------------------------------------------------------------------ |
| Platform     | Static HTML/CSS/JS — no framework, no CMS, no build step           |
| Layout       | Single-page with anchor navigation (same structure as current)     |
| Events       | Link to Facebook events page (API is locked to Marketing Partners) |
| Forum        | Remove entirely                                                    |
| Branding     | Full redesign — dark theme, Space Grotesk + Inter, amber accent    |
| Contact form | TBD — user will decide later                                       |
| Stylesheets  | SCSS compiled via VS Code Live Sass Compile                        |
| JavaScript   | Vanilla JS, no jQuery                                              |
| Animation    | GSAP 3 + ScrollTrigger (CDN)                                       |
| Scroll       | Lenis smooth scroll (CDN)                                          |

### Facebook Events API Note

Facebook's Graph API `/events` endpoint is restricted to Facebook Marketing Partners only (requires $5K+ ad spend in 180 days). Auto-pulling events from the club's Facebook page is not feasible for a small club site. The chosen approach is to link directly to the Facebook events page with a simple, well-designed CTA.

### Proposed File Structure

```text
vampiresmc.com/
├── _archive/              # archived WordPress child theme
├── index.html             # single-page site
├── css/
│   └── style.css          # compiled from SCSS (do not edit directly)
├── scss/
│   ├── style.scss         # main SCSS entry point
│   ├── _variables.scss    # colors, fonts, breakpoints
│   ├── _reset.scss        # CSS reset/normalize
│   ├── _typography.scss   # font imports, type scale
│   ├── _header.scss       # nav + sticky behavior
│   ├── _hero.scss         # hero section
│   ├── _sections.scss     # about, events, contact
│   └── _footer.scss       # footer styles
├── js/
│   └── main.js            # smooth scroll, sticky header, interactivity
├── img/                   # optimized images (logo, hero, etc.)
├── vampiresmc.md          # this document
└── .gitignore
```

### Sections for New Site

1. **Header** — club logo + sticky nav (About, Events, Contact)
2. **Hero** — full-viewport section with club imagery and title. Approach TBD (static hero, CSS parallax, or lightweight vanilla JS slider)
3. **About** — club history, mission, chapter locations
4. **Events** — descriptive text + prominent CTA linking to facebook.com/vampiresmc/events
5. **Contact** — form or mailto (implementation TBD)
6. **Footer** — copyright, social links

### Implementation Order

1. Create file structure and update `.gitignore`
2. Build HTML skeleton with semantic markup
3. Set up SCSS architecture (variables, reset, typography)
4. Style header + sticky nav (vanilla JS)
5. Build and style hero section
6. Style remaining sections (About, Events, Contact, Footer)
7. Add smooth-scroll anchor navigation
8. Responsive pass (mobile-first)
9. Image optimization
10. Contact form implementation (when approach is decided)
