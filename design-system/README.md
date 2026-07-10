# Control Surface Design System

Portable design tokens and documentation extracted from the Advanced Autoponics marketing site. Use this package to apply the same Hut8-inspired, industrial AgTech UI to **Geminy IoT** and related apps.

## What's included

| File | Purpose |
|------|---------|
| `CONTROL-SURFACE.md` | Full design system specification |
| `tokens.css` | Copy-paste CSS custom properties |

You also need the Cursor rule file (kept at project root for discoverability):

| File | Purpose |
|------|---------|
| `.cursor/rules/control-surface-design.mdc` | Instructs Cursor AI to follow this system |

## Copy to your Geminy IoT project

From this workspace (`Advanced Website 2`), run:

```bash
# Replace /path/to/geminy-iot with your target app folder
GEMINY="/path/to/geminy-iot"

mkdir -p "$GEMINY/design-system"
mkdir -p "$GEMINY/.cursor/rules"

cp design-system/CONTROL-SURFACE.md "$GEMINY/design-system/"
cp design-system/tokens.css "$GEMINY/design-system/"
cp design-system/README.md "$GEMINY/design-system/"
cp .cursor/rules/control-surface-design.mdc "$GEMINY/.cursor/rules/"
```

Or copy the folders manually in Finder:

1. Copy the entire `design-system/` folder into your Geminy IoT project root.
2. Copy `.cursor/rules/control-surface-design.mdc` into your Geminy IoT project's `.cursor/rules/` directory (create `.cursor/rules/` if it doesn't exist).

## Quick start in code

1. Add Barlow fonts to your HTML or framework head (see comment in `tokens.css`).
2. Import tokens before your app styles:

```css
@import "./design-system/tokens.css";
```

3. Read `CONTROL-SURFACE.md` for component patterns, motion rules, and Geminy-specific guidance.
4. Cursor will pick up `.cursor/rules/control-surface-design.mdc` automatically when you work on UI files in that project.

## Source reference

Canonical implementation: Advanced Autoponics site (`index.html`, `css/style.css`, `js/main.js` in this repo).
