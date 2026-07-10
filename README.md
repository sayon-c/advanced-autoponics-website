# Advanced Autoponics — Website Redesign

A redesign of [advancedautoponics.com](https://www.advancedautoponics.com/) — AI-driven AgTech automation for CEA & greenhouses.

## Visual identity

**Contemporary infrastructure tech** — inspired by the feel of [hut8.com](https://www.hut8.com/): full-bleed dark hero, off-black / off-white contrast, condensed sans display (Barlow Condensed + Barlow), sparse acid-green accent, overlay navigation, and restrained scroll reveals. Not a copy of Hut8 branding — Advanced Autoponics content and voice throughout.

## Pages

- `index.html` — Homepage: hero, platform layers, Geminy IoT command center, problem/solution, deliverables, insights, contact CTA

## Stack

Plain HTML, CSS, and vanilla JavaScript — no build step or dependencies required.

- `css/style.css` — Hut8-inspired theme, responsive layout
- `js/main.js` — overlay menu, scroll reveals, active nav on scroll

## Improvements

- **Accessibility** — skip link, focus-visible states, aria labels, aria-current nav, improved contrast
- **SEO** — see below
- **Performance** — `fetchpriority` on header logo, lazy-load footer logo, font preconnect
- **UX** — active nav highlights on scroll, Escape closes menu, 44px tap targets, smooth anchor scroll
- **Polish** — card/link hover transitions, external link indicators (↗), prominent contact block

## SEO

Single-page site at the canonical URL `https://www.advancedautoponics.com/`.

- **Meta** — keyword-aware title & description, `robots`, `theme-color`, canonical link
- **Social** — Open Graph + Twitter Card (`summary_large_image`) using `assets/og-image.png` (1200×630)
- **Crawl** — `robots.txt` and `sitemap.xml` at site root
- **Structured data** — JSON-LD `@graph` with Organization, WebSite, WebPage, SoftwareApplication (Geminy IoT), and Service (AgTech automation). No FAQPage (no FAQ content on-page)
- **Semantics** — one `h1`, section landmarks with `aria-labelledby`, logo alt text, footer nav anchors aligned with primary nav

## Deploy notes

Cloudflare Workers/Pages allows assets up to **25 MiB** each. Keep videos in `assets/` under that limit (hero background is compressed for a muted loop). Local uncompressed backups may live as `assets/*.original.mp4` and are gitignored.

## Run locally

```bash
python3 -m http.server 8877
```

Then open http://127.0.0.1:8877

## Contact

- info@advancedautoponics.com
- (720) 383-7223
