# pahan.me — Portfolio on EmDash CMS + Cloudflare

**Date:** 2026-06-28
**Status:** Approved design (pre-implementation)

## Summary

Build Pahan Sarathchandra's personal portfolio site (`pahan.me`) as an
[EmDash](https://emdashcms.com/) CMS project — an Astro-first, full-stack
TypeScript CMS running on Cloudflare. The visual design is ported faithfully
from the imported `portfolio/light.html` Claude Design file. Work history,
open-source/side projects, and awards are modeled as EmDash collections editable
in the admin UI; the remaining sections stay as code. The site is deployed to
Cloudflare Workers with D1 (content) and R2 (media).

## Goals

- Faithfully reproduce the imported design (layout, type, color, motion).
- Make the three list-driven sections (Work, Projects, Awards) editable via the
  EmDash admin without code changes or rebuilds.
- Deploy and run on Cloudflare (Workers + D1 + R2).

## Non-Goals (YAGNI)

- No blog, contact form, or comments.
- No authentication beyond EmDash's built-in admin auth.
- No résumé-PDF download (not present in the design).
- No internationalization / multi-language.
- No CMS modeling of Stack, hero, about, or contact prose (kept in code).

## Architecture & Stack

- **Framework:** Astro with the EmDash integration (`emdash/astro`), scaffolded
  via `npm create emdash@latest` into the `pahan.me` repository.
- **CMS:** EmDash — admin UI at `/admin`, REST API, typed collections.
- **Hosting:** Cloudflare Workers.
- **Content database:** Cloudflare D1 (`emdash/db` `d1()` adapter).
- **Media storage:** Cloudflare R2.
- **Deploy tooling:** `wrangler` (Cloudflare adapter / EmDash deploy flow).
- **Local dev:** Astro dev server backed by local D1 (Miniflare); EmDash admin
  available locally.

Astro config (illustrative):

```js
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { d1 } from "emdash/db";

export default defineConfig({
  integrations: [emdash({ database: d1() })],
});
```

The current draft `index.html` at the repo root is a visual reference only and
is deleted once the design is ported into Astro components.

## Content Model

Three EmDash collections, created through the admin UI (each backed by a real
SQL table), then `npx emdash types` generates TypeScript types consumed via
Astro Live Collections. An `order` field on each drives display order.

### Work (8 seed entries)
| Field | Type | Notes |
|-------|------|-------|
| `order` | number | Ascending display order |
| `title` | text | e.g. "Fishbrain — social app for 14M anglers" |
| `company` | text | e.g. "Fishbrain · Senior Frontend Engineer" |
| `description` | rich text / long text | One paragraph |
| `tags` | text[] | e.g. ["Next.js", "GraphQL"] |
| `yearLabel` | text | e.g. "2021 — 22" |
| `url` | text (optional) | External link for the title |

### Projects — open source / side projects (11 seed entries)
| Field | Type | Notes |
|-------|------|-------|
| `order` | number | Ascending display order |
| `name` | text | e.g. "Siyalu Browser" |
| `pill` | text | Badge label, e.g. "ANDROID · 100K" |
| `description` | long text | One paragraph |
| `url` | text (optional) | External link |

### Awards (4 seed entries)
| Field | Type | Notes |
|-------|------|-------|
| `order` | number | Ascending display order |
| `rank` | text | e.g. "1st" |
| `context` | text | Sub-rank line, e.g. "Node Knockout '15 / ~400 teams worldwide" |
| `title` | text | e.g. "Fight Club — Overall Winner" |
| `issuer` | text | e.g. "Node.js Knockout · Nov 2015 · with Kadira Inc." |
| `description` | long text | One paragraph |
| `links` | array of {label, url} | Optional demo/source/write-up links |

Seed content is taken verbatim from the imported design.

**Kept in code (not CMS):** hero (status, headline, sub, CTAs), about prose +
stat strip, Stack categories/items, contact card details, footer.

## Components & Structure

Port the single HTML file into focused Astro components under `src/`:

- `src/layouts/Base.astro` — `<head>`, Google Fonts preconnect/link, the full
  design CSS as a global stylesheet, theme-bootstrap inline script (reads
  `localStorage` `pf-theme` before paint to avoid flash).
- `src/components/` — `Nav.astro`, `Hero.astro`, `About.astro`, `Work.astro`,
  `Stack.astro`, `OpenSource.astro`, `Awards.astro`, `Contact.astro`,
  `Footer.astro`.
- `src/pages/index.astro` — composes the sections in order.
- Client behavior — theme toggle, scroll-reveal observer, and stat count-up —
  ported as a small inline/island script preserving current behavior.

Each list component (`Work`, `OpenSource`, `Awards`) queries its EmDash
collection and renders the markup the design specifies. `Stack` and the prose
sections render hardcoded content.

## Styling & Behavior (preserved from import)

- Exact CSS from the imported file.
- Google Fonts: Schibsted Grotesk, JetBrains Mono, Newsreader.
- Design tokens baked to the selected "Tweaks" values: **Cobalt** accent,
  **Modern** typeface, **Compact** density. The React "Tweaks" dev panel from
  the import is dropped.
- Dark theme default with light toggle persisted to `localStorage`.
- Scroll-reveal animations with `prefers-reduced-motion: reduce` fallback.
- Responsive breakpoints exactly as authored (nav collapse at 740px, grid
  reflows for about/work/stack/projects/awards).

## Deployment (Cloudflare)

Driven as part of implementation, assuming the user has a Cloudflare account and
`wrangler` authenticated (`wrangler login`).

1. Provision a D1 database and bind it in `wrangler` config.
2. Provision an R2 bucket for media and bind it.
3. Configure the EmDash/Cloudflare adapter and environment bindings.
4. Apply the EmDash schema / run migrations against D1.
5. Seed the three collections (Work, Projects, Awards) with the design content.
6. `astro build` with the Cloudflare adapter, then deploy via `wrangler`.
7. Verify the deployed site and `/admin`.

**Prerequisites (user-owned):** Cloudflare account, `wrangler login` completed,
permission to create D1/R2 resources. `pahan.me` DNS/custom-domain wiring is a
follow-up, not part of this spec.

## Testing & Verification

- `npx emdash types` succeeds; `astro check` / type-check passes.
- Local smoke test: site renders; all three collections drive their sections;
  adding/editing an entry in the admin reflects on the page; theme toggle,
  scroll-reveal, and stat count-up all work; responsive layout holds at mobile,
  tablet, desktop widths.
- `astro build` succeeds for the Cloudflare target.
- Post-deploy: production URL loads, `/admin` loads, collections render.

## Open Questions / Follow-ups

- Custom-domain (`pahan.me`) DNS configuration — handled after first deploy.
- Whether to add a résumé-PDF download later (excluded for now).
