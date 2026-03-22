# Vampires MC — Website

Brochure site for [Vampires Motorcycle Club](https://www.facebook.com/vampiresmc), founded 1954. Chapters in Santa Cruz, San Francisco, and San Luis Obispo, CA.

## Stack

- HTML5 / SCSS / Vanilla JS
- [GSAP 3](https://gsap.com) — hero entrance animation
- [Font Awesome 6](https://fontawesome.com) — social icons
- Google Fonts — Montserrat, Lato
- Netlify Forms — contact form submissions _(tentative)_

## Structure

```
index.html
js/
  main.js
styles/
  scss/           # Source — edit these
    main.scss
    _variables.scss
    _hero.scss
    _sections.scss
    ...
  css/            # Compiled — do not edit
    main.css
    main.min.css
images/
  heroes/
  logos/
```

## Development

SCSS is compiled with the [Live Sass Compiler](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) VS Code extension. It watches `styles/scss/main.scss` and outputs to `styles/css/` on save (both expanded and minified).

No build step or package manager required.

## Deployment

Files are deployed via SFTP. Configure credentials in `.vscode/sftp.json` (not committed).

## Sections

The site is a single-page horizontal scroll with five full-viewport panels:

1. **Hero** — Club name and founding year
2. **About** — Club history and membership philosophy
3. **Events** — Upcoming rides and rallies
4. **Fans** — Testimonials
5. **Contact** — Name / Email / Message form
