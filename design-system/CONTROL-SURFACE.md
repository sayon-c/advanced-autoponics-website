# Control Surface Design

**Tagline:** *Where data unlocks the grow.*

**Philosophy:** Control Surface Design is a premium industrial UI language for AgTech and IoT command centers. It treats the interface like a physical control panel — sparse, legible, and confident. Inspired by Hut8-style contemporary infrastructure sites, it pairs off-black/off-white contrast with a single brand green accent, condensed display typography, hairline rules, and restrained motion. Nothing is decorative for decoration's sake; every element reads as instrumentation, protocol, or operational status.

---

## 1. Color tokens

All values are extracted from `css/style.css`.

### Core

| Token | Hex / Value | Usage |
|-------|-------------|-------|
| `--off-black` | `#080808` | Primary dark surface, hero, nav overlay, spec panels |
| `--off-white` | `#f8f8f8` | Primary light surface, body background |
| `--brand-gray` | `#323232` | AA brand gray (logo, print collateral) |
| `--muted-surface` | `#efefef` | Alternate light sections |

### Grey scale

| Token | Hex | Usage |
|-------|-----|-------|
| `--grey-100` | `#e8e8e8` | — |
| `--grey-150` | `#d8d8d8` | List dividers on light sections |
| `--grey-175` | `#9a9a9a` | Traits, btn kickers |
| `--grey-200` | `#686868` | Body secondary text, eyebrows (light) |
| `--grey-400` | `#888888` | Tertiary text on dark, nav labels, sensor time |
| `--grey-700` | `#454545` | Hover state on news titles |

### Accent (AA circuit-tree green)

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#6EC177` | Primary brand green — CTAs, live status, focus rings |
| `--accent-bright` | `#68C070` | Hero brand line, subtle highlights |
| `--accent-ink` | `#080808` | Text on accent backgrounds |

### Derived / semantic

| Token | Value | Usage |
|-------|-------|-------|
| `--dim-white` | `rgba(248, 248, 248, 0.1)` | Hairline rules on dark surfaces |
| Hero lede | `rgba(248, 248, 248, 0.6)` | Secondary hero copy |
| Hero atmosphere | `#0c0c0c` → `#080808` → `#101810` | Layered gradient background |
| Accent glow | `rgba(110, 193, 119, 0.1–0.14)` | Hero radial highlights |
| Footer text | `rgba(248, 248, 248, 0.55)` | Muted footer copy |
| Protocol text | `rgba(248, 248, 248, 0.85)` | Marquee item labels |

### Section pairing

| Variant | Background | Text | Eyebrow |
|---------|------------|------|---------|
| Default | `--off-white` | `--off-black` | `--grey-200` |
| Dark | `--off-black` | `--off-white` | `--accent` |
| Muted | `--muted-surface` | `--off-black` | `--grey-200` |

---

## 2. Typography

### Font stacks

```css
--font-display: "Barlow Condensed", "Arial Narrow", sans-serif;
--font-body: "Barlow", "Helvetica Neue", Helvetica, Arial, sans-serif;
```

**Google Fonts URL:**

```
https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap
```

### Role assignment

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / headlines | Barlow Condensed | 500 | Titles, nav links, sensor values, feature labels |
| Body / UI | Barlow | 300–500 | Paragraphs, buttons, metadata |
| Eyebrows / labels | Barlow | 500 | 0.7–0.75rem, uppercase, wide tracking |

### Type scale

| Element | Size | Weight | Line-height | Tracking |
|---------|------|--------|-------------|----------|
| Body base | `16px` | 400 | 1.55 | — |
| Eyebrow | `0.75rem` | 500 | — | 0.1em, uppercase |
| Hero brand | `clamp(1rem, 2vw, 1.25rem)` | 500 | — | 0.06em, uppercase |
| Hero title | `clamp(2.6rem, 8vw, 4.75rem)` | 500 | 1.05 | -0.01em |
| Hero lede | `clamp(1rem, 1.5vw, 1.15rem)` | 300 | 1.6 | — |
| Section title | `clamp(2.25rem, 5.5vw, 4rem)` | 500 | 1.05 | -0.015em |
| Statement | `clamp(1.5rem, 3.5vw, 2.5rem)` | 400 | 1.2 | -0.01em |
| Nav link | `clamp(1.75rem, 4vw, 2.5rem)` | 500 | 1.2 | — |
| Layer title | `clamp(1.5rem, 2.5vw, 2rem)` | 500 | 1.1 | — |
| Layer index | `0.75rem` | 500 | — | 0.08em, uppercase |
| Sensor value | `1.35rem` | 500 | 1 | tabular-nums |
| Sensor label | `0.65rem` | 500 | — | 0.1em, uppercase |
| Btn kicker | `0.7rem` | 400 | — | 0.04em |
| Btn label | `0.95rem` | 500 | — | 0.02em |
| Footer copy | `0.7rem` | — | — | 0.04em, uppercase |

Use **tabular-nums** (`font-variant-numeric: tabular-nums`) for live readouts, timestamps, and any data that updates in place.

---

## 3. Spacing & layout grid

### Container

| Token | Value |
|-------|-------|
| `--max` | `1180px` |
| `--pad-x` | `clamp(24px, 5vw, 110px)` |
| `--pad-y` | `clamp(72px, 12vw, 140px)` |
| `--header-h` | `72px` |

Content is centered with `max-width: var(--max); margin: 0 auto`.

### Grid patterns

| Pattern | Columns | Gap | Notes |
|---------|---------|-----|-------|
| Platform layers | 3 → 1 (≤900px) | 0 | Vertical hairline dividers |
| Geminy split | 1.3fr / 1fr → 1 (≤900px) | 64px / 40px | Feature list + spec panel |
| Deliver cards | 2 → 1 | 0 | Crosshair grid with borders |
| Footer | 2fr / 1fr / 1fr → 1 | 40px | Brand + nav + contact |
| Nav overlay | 1.2fr / 1fr → 1 | 48px | Links + aside |

### Touch targets

Minimum interactive height: **44px** (`--touch-min`). Applies to nav links, menu toggle, contact links.

### Vertical rhythm

Section heads: `margin-bottom: clamp(56px, 8vw, 72px)`.

List rows (features, issues, steps, news): `padding: 28–36px 0` with `border-top: 1px solid`.

---

## 4. Component patterns

### Navigation (fixed logo + overlay menu)

**Structure:**
- Fixed header: logo left, menu toggle right (`pointer-events: none` on header, `auto` on children).
- Full-screen nav overlay with **clip-path reveal**: `inset(0 0 100% 0)` → `inset(0 0 0 0)` over 0.8s.
- Backdrop blur (`backdrop-filter: blur(5px)`) behind overlay.
- Nav links at 45% opacity; active/hover → 100%, active gets `--accent` color.
- Staggered link entrance on open (50ms increments).

**Menu toggle:**
- Off-black pill with uppercase "Menu" label + 2-line icon (1.5px bars).
- Expanded state: `--accent` background, `--accent-ink` text, icon rotates to X.

### Hero

- Full viewport (`100dvh`), `--off-black` base.
- Layered atmosphere: radial green glows + linear gradient (`#0c0c0c` → `#080808` → `#101810`).
- Optional mouse-reactive glow (fine pointer only, disabled with reduced motion).
- Brand line in `--accent-bright`, uppercase condensed.
- Title max-width ~12ch for dramatic line breaks.
- Meta line pinned to bottom: uppercase, `--grey-400`, 0.75rem.

### CTAs (underline, not pills)

**Primary `.btn-accent`:**
- Stacked kicker (grey) + label (white).
- 3px `--accent` underline via `::after`.
- Hover: underline scales to 35% width from left (`transform: scaleX(0.35)`).
- Optional `[data-magnetic]` subtle cursor follow (fine pointer, no reduced motion).

**Ghost `.btn-ghost`:** Same underline pattern, 75% opacity white.

**Dark `.btn-dark`:** Row layout, uppercase, 2px underline — used inside spec panels.

**Text link `.text-link`:** 1px underline with scale-on-hover; accent color on hover.

**Do not use:** Rounded pill buttons as primary CTAs. The only rounded fills are the menu toggle and nav-cta (small, utilitarian).

### Platform layers (Layer 1.0 / 2.0 / 3.0)

- Three-column grid separated by `--dim-white` vertical rules.
- Each layer: accent icon → index label ("Layer 1.0") → condensed title → light body copy.
- Hover reveals accent-colored detail line (desktop); accordion on mobile (≤900px).
- Index labels: uppercase, `--accent`, 0.75rem.

### Sensor panel (Geminy live readouts)

Dark inset panel inside spec card:

```
┌─────────────────────────────────┐
│ ● Zone 3 · Live          14:32:08│
├─────────────────────────────────┤
│ pH          EC                  │
│ 5.82        1.84 mS/cm          │
│ Temp        RH                  │
│ 72.4°F      64%                 │
└─────────────────────────────────┘
```

- Status row: pulsing 6px green dot + uppercase zone label + tabular timestamp.
- 2×2 readout grid; labels uppercase 0.65rem grey; values Barlow Condensed 1.35rem.
- Value updates: brief `--accent` flash (`.is-updating`), lerp animation between targets.
- Pulse animation: 2.4s blink; disabled under `prefers-reduced-motion`.

### Protocol bar (marquee banner)

- Full-width dark strip with top/bottom `--dim-white` rules.
- Fixed label "Supported protocols" in `--accent`, 0.7rem uppercase.
- Horizontal marquee (84s linear) on desktop; static scroll on mobile/reduced motion.
- Items: Barlow Condensed uppercase, separated by 4px `--accent` dots.
- Edge fade via `mask-image` gradient.
- Duplicate list for seamless loop; a11y static list for screen readers.

### Cards & lists

**Feature list:** Two-column rows (label | copy) with hairline top/bottom borders.

**Issue list:** Icon (28px) + title + body; hover shifts right 12px, icon turns accent.

**Deliver grid:** 2×2 with crosshair borders; hover adds inset accent border + icon color shift.

**News list:** Date | title | arrow grid; left accent bar scales in on hover.

**Spec panel:** `--off-black` block, definition list with uppercase dt labels, hairline row dividers.

### Footer

- Dark, top hairline rule.
- Stacked AA logo (circuit-tree branding), muted body copy.
- Uppercase column labels; mail/tel links bold, hover to accent.
- Copyright: 0.7rem uppercase, 50% opacity.

---

## 5. Motion & interaction

### Easing

```css
--ease: cubic-bezier(0.86, 0, 0.07, 1);      /* dramatic reveals, nav clip-path */
--ease-out: cubic-bezier(0.215, 0.61, 0.355, 1); /* hovers, micro-interactions */
```

### Scroll reveal

- `.reveal`: opacity 0, translateY(28px) → visible over 0.8s.
- IntersectionObserver threshold 0.12; stagger via transition-delay.
- Under reduced motion: all reveals instant (opacity 1, no transform).

### Interactions (fine pointer only)

| Feature | Behavior | Disable when |
|---------|----------|--------------|
| Hero glow | Follows cursor, 8% lerp | reduced motion, coarse pointer |
| Magnetic buttons | translate 12%/18% toward cursor | reduced motion, coarse pointer |
| Card tilt | ±3° perspective rotate | reduced motion, coarse pointer |
| Sensor lerp | 80ms tick, random target every 2.8s | reduced motion |
| Protocol marquee | 84s infinite scroll | reduced motion, mobile |

### Focus

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
```

Skip link: accent background, slides down on focus.

### Scroll progress

Fixed 2px top bar; fill width tracks scroll percentage in `--accent`.

---

## 6. Icon style guide

### Construction

- **Inline SVG** symbols in a hidden sprite (`<symbol id="icon-*">`).
- **Stroke only:** `fill: none`, `stroke: currentColor`, `stroke-width: 1.5`.
- **Caps:** `stroke-linecap: square`, `stroke-linejoin: miter`.
- **ViewBox:** 24×24 standard.

### Sizes

| Class | Size | Context |
|-------|------|---------|
| `.icon--nav-sm` | 16px | Nav aside contacts |
| `.icon--nav` | 20px | Nav primary links |
| `.icon--feature` | 22px | Feature list |
| `.icon--contact` | 22px | Contact links |
| `.icon--deliver` | 26px | Deliver cards |
| `.icon--layer` | 28px | Platform layers (accent) |
| `.icon--issue` | 28px | Problem list (grey → accent hover) |

### Subject matter

Industrial / operational: layers, pulse, forecast, eye, sliders, grid, disconnect, clock, stack, mail, phone. Avoid playful or rounded icon sets (Feather, Lucide defaults are close but prefer square caps and 1.5px stroke).

### AA circuit-tree logo

Use stacked or horizontal AA logo assets for brand marks. Logo sits fixed in header; footer uses stacked variant at ~88px width, 4px border-radius.

---

## 7. Do's and Don'ts

### Do

- Use off-black/off-white as the primary contrast pair.
- Reserve `--accent` green for status, focus, active nav, live indicators, and primary underlines.
- Use Barlow Condensed for headlines and data values; Barlow for everything else.
- Separate sections with 1px hairline rules, not heavy shadows or cards-with-drop-shadow.
- Use uppercase + letter-spacing for labels, eyebrows, and metadata.
- Prefer underline CTAs with kicker/label stacks over filled buttons.
- Show live data with tabular numerals and subtle update flashes.
- Honor `prefers-reduced-motion` — disable marquee, glow, tilt, magnetic, sensor animation.
- Maintain 44px minimum touch targets.
- Use clip-path or opacity for nav transitions, not bouncy slide-ins.

### Don't

- Don't use pill-shaped primary buttons or gradient buttons.
- Don't introduce secondary accent colors (blue, orange, purple).
- Don't use heavy border-radius on panels (max ~8px on utilitarian controls).
- Don't use drop shadows for elevation — use surface color shifts and hairlines.
- Don't use animated gradients, parallax scroll jacking, or particle effects.
- Don't use rounded friendly icon sets with round line caps.
- Don't use light gray text below `#888888` on dark backgrounds for critical data.
- Don't auto-play video backgrounds or carousels.
- Don't use Inter, Roboto, or system-ui as display fonts.

---

## 8. Applying to Geminy IoT app UI

Geminy IoT is the **command center** product — this design system maps directly to dashboard, zone monitoring, and control surfaces.

### Shell layout

| Marketing site | Geminy IoT app |
|----------------|----------------|
| Fixed header + overlay nav | Persistent sidebar or top bar + slide-out settings |
| Hero | Dashboard summary / selected zone header |
| Platform layers | Stack diagram: Data Layer → AI → Predictive |
| Sensor panel | **Primary zone readout widget** — reuse exactly |
| Protocol bar | Connected devices / protocol status strip |
| Spec panel | Zone detail drawer or inspector panel |
| Feature list | Capability checklist in onboarding/settings |

### Dashboard widgets

1. **Zone readout card** — Copy sensor panel pattern: dark background, live dot, timestamp, 2×2 or 4×1 metric grid, tabular nums, accent flash on change.
2. **Alert strip** — Protocol bar pattern: scrolling or static list of active alerts with dot separators.
3. **Layer status** — Three-column layer cards with index labels; use for pipeline health (ingest / detect / predict).
4. **Trend row** — News list pattern: timestamp | metric name | sparkline or delta arrow.

### Navigation

- Keep condensed nav typography for section jumps (Zones, Alerts, Automation, Settings).
- Active state: full opacity + `--accent` (not a filled background).
- Use icon + label pairs from the sprite pattern.

### Data density

Geminy will show more data than the marketing site. Stay on-brand by:
- Keeping backgrounds flat (off-white or off-black, not mid-greys).
- Using hairlines to separate rows, not boxed cards.
- Limiting accent green to **status and action**, not decoration.
- Using weight 300 for descriptive copy, 500 condensed for values.

### Forms & controls

- Toggle switches: square-ish, 1px borders, accent when active.
- Inputs: 1px `--grey-150` border, no heavy shadow; focus ring `--accent`.
- Submit actions: `.btn-accent` underline pattern, not filled green buttons.

### Implementation checklist

- [ ] Import `design-system/tokens.css` at app root
- [ ] Load Barlow + Barlow Condensed
- [ ] Map your CSS/Tailwind theme to token variables
- [ ] Add `.cursor/rules/control-surface-design.mdc` for AI-assisted UI work
- [ ] Build sensor readout component first (highest brand recognition)
- [ ] Test all screens at 900px and 640px breakpoints
- [ ] Verify `prefers-reduced-motion` disables all nonessential animation

### Token import example (React / Vite)

```css
/* src/index.css */
@import "../design-system/tokens.css";

body {
  background: var(--off-white);
  color: var(--off-black);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  -webkit-font-smoothing: antialiased;
}
```

### Token import example (Tailwind v4)

```css
@theme {
  --color-surface-dark: var(--off-black);
  --color-surface-light: var(--off-white);
  --color-accent: var(--accent);
  --font-display: var(--font-display);
  --font-body: var(--font-body);
}
```

---

## Reference files

| File | Contents |
|------|----------|
| `index.html` | Component markup, SVG sprite |
| `css/style.css` | All visual rules |
| `js/main.js` | Nav, reveal, sensor sim, tilt, magnetic |
| `design-system/tokens.css` | Portable custom properties |

---

*Control Surface Design · Advanced Autoponics · Geminy IoT · v1.0*
