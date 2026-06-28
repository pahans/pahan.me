# pahan.me — EmDash Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Pahan Sarathchandra's portfolio (`pahan.me`) as an EmDash CMS project on Cloudflare, faithfully porting the imported `light.html` design, with Work / Projects / Awards as editable CMS collections.

**Architecture:** Astro + EmDash (`emdash/astro`) on Cloudflare Workers, content in D1, media in R2. The imported design is ported into focused Astro components and a global stylesheet. Three EmDash collections (defined in `seed/seed.json`) drive the list sections; the rest is hardcoded.

**Tech Stack:** Astro, EmDash CMS (`emdash@0.23.0`), Cloudflare Workers / D1 / R2, `wrangler`, TypeScript, Google Fonts.

> **Revision note (2026-06-28):** Task 1 scaffolded the real EmDash project and pinned down the actual API, which differs from this plan's original assumptions. Tasks 2–10 below are rewritten to match reality. Task 1 is DONE (commit `b99bfb6`).

## EmDash facts (verified from the scaffold — authoritative)

- Scaffolded via `create-emdash@0.23.0` with the **starter** template, Cloudflare platform. Already present: `astro.config.mjs` (Cloudflare adapter + `emdash({ database: d1({binding:"DB"}), storage: r2({binding:"MEDIA"}) })`), `wrangler.jsonc` (D1 `DB`, R2 `MEDIA`, worker loader, cron), `src/live.config.ts` (boilerplate), `src/layouts/Base.astro` (starter layout with EmDash head/body wrappers), `src/pages/` (index, 404, `[slug]`, `posts/`, `category/`, `tag/`), `seed/seed.json` (starter posts/pages schema + demo content), `.env` (git-ignored, holds `EMDASH_ENCRYPTION_KEY`).
- **Content schema AND seed content both live in `seed/seed.json`.** Each collection becomes table `ec_{slug}`. Seed is applied automatically on first request when the DB is empty. Field types: `string`, `text`, `number`, `integer`, `boolean`, `datetime`, `image`, `reference`, `portableText`, `json`.
- **Query API (import from `"emdash"`):**
  - `const { entries, cacheHint } = await getEmDashCollection("slug", { status: "published", orderBy: { order: "asc" } })` → `entries: { id (slug), data (fields), edit }[]`.
  - `const { entry } = await getEmDashEntry("slug", id)`.
  - Guard caching: `if (Astro.cache?.enabled) Astro.cache.set(cacheHint);`
- **Types:** `emdash-env.d.ts` at project root is auto-generated when the dev server runs; or `npx emdash types`.
- **Dev:** `npx emdash dev` (runs migrations + applies seed). Admin UI at `/_emdash/admin` (first run = setup wizard to create an admin account). `npm run dev` (`astro dev`) also works but `npx emdash dev` is the one that guarantees migrate+seed locally.
- **Build/Deploy:** `npm run build` (`astro build`); `npm run deploy` (`astro build && wrangler deploy`). Production needs `EMDASH_ENCRYPTION_KEY` set as a Cloudflare secret. `wrangler.jsonc` already has `compatibility_flags: ["nodejs_compat"]`.
- EmDash reference docs are in the repo at `.agents/skills/building-emdash-site/references/` (`schema-and-seed.md`, `querying-and-rendering.md`, `configuration.md`). Implementers should read the relevant one.

## Global Constraints

- Design tokens baked to selected "Tweaks" values: **Cobalt** accent, **Modern** typeface, **Compact** density. The `:root` density vars are: `--pad-sec:54px; --pad-hero-t:132px; --pad-hero-b:58px; --gap-head:30px; --about-gap:40px; --pad-contact:70px;`.
- Dark theme is the default (`<html data-theme="dark">`); light is opt-in via toggle, persisted to `localStorage` key `pf-theme`.
- The React "Tweaks" panel and its CDN scripts from the import are NOT included.
- Fonts: Schibsted Grotesk, JetBrains Mono, Newsreader (Google Fonts).
- Collection seed content (Work ×8, Projects ×11, Awards ×4) is taken verbatim from the reference `index.html` / imported design. All section copy, links, email (`pahan123@gmail.com`), phone (`+372 5803 2161`), and social URLs must match the design exactly.
- Reference source of truth for CSS + markup: the draft `index.html` at repo root (deleted in the final cleanup task).
- Keep EmDash's visual-editing/SEO wrappers (`EmDashHead`, `EmDashBodyStart`, `EmDashBodyEnd`) working in the layout.
- Worker/resource name is `pahan-me`; D1 `pahan-me`; R2 bucket `pahan-me-media`; bindings stay `DB` and `MEDIA`.

## File Structure

- `wrangler.jsonc` — rename resources to `pahan-me` (Task 2).
- `src/styles/global.css` — full design stylesheet (verbatim, density baked) (Task 3).
- `src/layouts/Base.astro` — adapt existing: keep EmDash head/body wrappers; add fonts, global CSS, theme bootstrap; strip starter nav/footer/main chrome (Task 3).
- `src/scripts/ui.ts` — theme toggle, scroll-reveal, stat count-up (Task 4).
- `src/components/Nav.astro`, `Hero.astro`, `About.astro`, `Stack.astro`, `Contact.astro`, `Footer.astro` — static sections (Task 4).
- `seed/seed.json` — replace starter schema/content with `work`, `projects`, `awards` collections + their seed entries + site settings (Task 5).
- `src/components/Work.astro`, `OpenSource.astro`, `Awards.astro` — collection-driven via `getEmDashCollection` (Task 6).
- `src/pages/index.astro` — compose all sections; remove starter blog pages (Task 7).
- `README.md` — project description + commands; delete draft `index.html` (Task 9).

---

### Task 1: Scaffold the EmDash project — DONE

Completed: `npm create emdash@latest` (starter template, Cloudflare). Commit `b99bfb6`. Dev server boots (`/` → 200). See `.superpowers/sdd/task-1-report.md`. No further action.

---

### Task 2: Rename project resources to `pahan-me`

**Files:**
- Modify: `wrangler.jsonc`

**Interfaces:**
- Consumes: scaffolded `wrangler.jsonc`.
- Produces: worker name `pahan-me`, D1 `database_name` `pahan-me`, R2 `bucket_name` `pahan-me-media`. Bindings unchanged (`DB`, `MEDIA`). Deploy task (Task 10) relies on these names.

- [ ] **Step 1: Edit `wrangler.jsonc`**

Change three values only, leaving everything else (bindings, `compatibility_flags`, worker loader, crons, `main`) intact:
- `"name": "my-emdash-site"` → `"name": "pahan-me"`
- D1 `"database_name": "my-emdash-site"` → `"database_name": "pahan-me"`
- R2 `"bucket_name": "my-emdash-media"` → `"bucket_name": "pahan-me-media"`

- [ ] **Step 2: Verify config still parses**

Run: `npx astro check`
Expected: no new config errors (pre-existing starter type errors unrelated to wrangler are acceptable and addressed by later tasks; note them in the report).

- [ ] **Step 3: Commit**

```bash
git add wrangler.jsonc
git commit -m "chore: rename Cloudflare resources to pahan-me"
```

---

### Task 3: Port the global stylesheet and adapt the Base layout

**Files:**
- Create: `src/styles/global.css`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: scaffolded `Base.astro` (with `EmDashHead`/`EmDashBodyStart`/`EmDashBodyEnd`, `getSiteSettings`, `resolveStarterSiteIdentity`).
- Produces: `Base.astro` rendering `<html lang="en" data-theme="dark">` with our fonts + theme bootstrap + `global.css` in `<head>` (alongside `EmDashHead`), and a body of `EmDashBodyStart` → `<slot />` → `EmDashBodyEnd` with NO starter nav/header/footer/main wrapper (the page owns body layout). Accepts an optional `title` prop (default `"Pahan Sarathchandra — Frontend Engineer"`). Later component/page tasks render inside this slot.

- [ ] **Step 1: Create `src/styles/global.css`**

Copy the entire contents of the `<style>...</style>` block from the reference `index.html` (repo root) into `src/styles/global.css`, WITHOUT the `<style>` tags. Confirm the `:root` density vars match the Compact values in Global Constraints. The `.pf-hint` rule (Tweaks-panel only) must not be present.

- [ ] **Step 2: Rewrite `src/layouts/Base.astro`**

Keep the EmDash integration imports and page-context wiring from the scaffold, but replace the document shell. Target:

```astro
---
import { getSiteSettings } from "emdash";
import { EmDashHead, EmDashBodyStart, EmDashBodyEnd } from "emdash/ui";
import { createPublicPageContext } from "emdash/page";
import { resolveStarterSiteIdentity } from "../utils/site-identity";
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string | null;
}
const { title = "Pahan Sarathchandra — Frontend Engineer", description } = Astro.props;
const { siteTitle, siteTagline } = resolveStarterSiteIdentity(await getSiteSettings());
const pageDescription = description ?? siteTagline;
const pageCtx = createPublicPageContext({
  Astro,
  kind: "custom",
  pageType: "website",
  title,
  pageTitle: title,
  description: pageDescription,
  siteName: siteTitle,
});
---
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    {pageDescription && <meta name="description" content={pageDescription} />}
    <script is:inline>try{var t=localStorage.getItem('pf-theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" rel="stylesheet" />
    <EmDashHead page={pageCtx} />
  </head>
  <body>
    <EmDashBodyStart page={pageCtx} />
    <slot />
    <EmDashBodyEnd page={pageCtx} />
  </body>
</html>
```

Note: confirm the exact import path for `EmDashHead`/`EmDashBodyStart`/`EmDashBodyEnd` and `createPublicPageContext` against the scaffolded `Base.astro` (the original imports them from `emdash/ui` and `emdash/page`). If `createPublicPageContext` requires fields not provided, mirror the scaffold's original call shape.

- [ ] **Step 3: Type-check**

Run: `npx astro check`
Expected: no errors referencing `Base.astro` or `global.css`.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css src/layouts/Base.astro
git commit -m "feat: add global stylesheet and adapt base layout"
```

---

### Task 4: Port static sections (Nav, Hero, About, Stack, Contact, Footer) + client script

**Files:**
- Create: `src/components/Nav.astro`, `Hero.astro`, `About.astro`, `Stack.astro`, `Contact.astro`, `Footer.astro`
- Create: `src/scripts/ui.ts`

**Interfaces:**
- Consumes: class names from `global.css`.
- Produces: six section components rendering the exact markup from the reference `index.html`, and `ui.ts` exporting `initUI()` (nav scroll state, theme toggle, scroll-reveal, stat count-up). `index.astro` (Task 7) imports these.

- [ ] **Step 1: `src/components/Nav.astro`** — copy the `<nav id="nav">...</nav>` block verbatim from the reference `index.html`.
- [ ] **Step 2: `src/components/Hero.astro`** — copy the `<header class="hero" ...>...</header>` block verbatim.
- [ ] **Step 3: `src/components/About.astro`** — copy the `<section id="about" ...>...</section>` block verbatim (includes stat strip with `data-count` spans).
- [ ] **Step 4: `src/components/Stack.astro`** — copy the `<section id="stack" ...>...</section>` block verbatim.
- [ ] **Step 5: `src/components/Contact.astro`** — copy the `<section id="contact" ...>...</section>` block verbatim.
- [ ] **Step 6: `src/components/Footer.astro`** — copy the `<footer>...</footer>` block verbatim.

- [ ] **Step 7: Create `src/scripts/ui.ts`**

```ts
export function initUI() {
  const nav = document.getElementById('nav');
  if (nav) addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 16), { passive: true });

  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('pf-theme', next); } catch (e) {}
  });

  function countUp(el: HTMLElement) {
    const target = parseFloat(el.dataset.count || '0'), suf = el.dataset.suffix || '';
    const dur = 1000, start = performance.now();
    function step(t: number) {
      const p = Math.min((t - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const counted = new WeakSet<Element>();
  function reveal() {
    document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) {
        el.classList.add('in');
        el.querySelectorAll<HTMLElement>('[data-count]').forEach(n => {
          if (!counted.has(n)) { counted.add(n); countUp(n); }
        });
      }
    });
  }
  reveal();
  addEventListener('scroll', reveal, { passive: true });
  addEventListener('load', reveal);
  setTimeout(reveal, 400);
}
```

- [ ] **Step 8: Type-check** — Run: `npx astro check`. Expected: no errors in new components/`ui.ts`.

- [ ] **Step 9: Commit**

```bash
git add src/components src/scripts/ui.ts
git commit -m "feat: port static sections and client UI script"
```

---

### Task 5: Define collections and seed content in `seed/seed.json`

**Files:**
- Modify: `seed/seed.json` (replace starter schema + content)

**Interfaces:**
- Consumes: nothing (data file).
- Produces: three collections — `work`, `projects`, `awards` — each with table `ec_{slug}`, plus published seed content. Field slugs that Task 6 components rely on:
  - `work`: `order` (integer), `title` (string), `company` (string), `description` (text), `tags` (json: string[]), `year_label` (string), `url` (string, optional).
  - `projects`: `order` (integer), `name` (string), `pill` (string), `description` (text), `url` (string, optional).
  - `awards`: `order` (integer), `rank` (string), `context` (text), `title` (string), `issuer` (string), `description` (text), `links` (json: `{label,url}[]`).
- Also sets site `settings.title` to "Pahan Sarathchandra" and `settings.tagline` to "Frontend Engineer".

- [ ] **Step 1: Read the schema reference**

Read `.agents/skills/building-emdash-site/references/schema-and-seed.md` for exact seed-file structure (`collections`, `content` keyed by slug, entry shape `{ id, slug, status, data }`).

- [ ] **Step 2: Replace `seed/seed.json`**

Replace the file with the structure below. Keep `$schema` and `version`. Remove the starter `posts`/`pages` collections and their content entirely.

```json
{
  "$schema": "https://emdashcms.com/seed.schema.json",
  "version": "1",
  "meta": { "name": "pahan.me", "description": "Personal portfolio of Pahan Sarathchandra", "author": "Pahan Sarathchandra" },
  "settings": { "title": "Pahan Sarathchandra", "tagline": "Frontend Engineer" },
  "collections": [
    {
      "slug": "work", "label": "Work", "labelSingular": "Job",
      "supports": ["drafts", "revisions"],
      "fields": [
        { "slug": "order", "label": "Order", "type": "integer", "required": true },
        { "slug": "title", "label": "Title", "type": "string", "required": true, "searchable": true },
        { "slug": "company", "label": "Company / Role", "type": "string", "required": true },
        { "slug": "description", "label": "Description", "type": "text", "searchable": true },
        { "slug": "tags", "label": "Tags", "type": "json" },
        { "slug": "year_label", "label": "Year label", "type": "string" },
        { "slug": "url", "label": "URL", "type": "string" }
      ]
    },
    {
      "slug": "projects", "label": "Projects", "labelSingular": "Project",
      "supports": ["drafts", "revisions"],
      "fields": [
        { "slug": "order", "label": "Order", "type": "integer", "required": true },
        { "slug": "name", "label": "Name", "type": "string", "required": true, "searchable": true },
        { "slug": "pill", "label": "Pill", "type": "string" },
        { "slug": "description", "label": "Description", "type": "text", "searchable": true },
        { "slug": "url", "label": "URL", "type": "string" }
      ]
    },
    {
      "slug": "awards", "label": "Awards", "labelSingular": "Award",
      "supports": ["drafts", "revisions"],
      "fields": [
        { "slug": "order", "label": "Order", "type": "integer", "required": true },
        { "slug": "rank", "label": "Rank", "type": "string", "required": true },
        { "slug": "context", "label": "Context", "type": "text" },
        { "slug": "title", "label": "Title", "type": "string", "required": true, "searchable": true },
        { "slug": "issuer", "label": "Issuer", "type": "string" },
        { "slug": "description", "label": "Description", "type": "text", "searchable": true },
        { "slug": "links", "label": "Links", "type": "json" }
      ]
    }
  ],
  "content": {
    "work": [
      { "id": "sl-boutique-tours", "slug": "sl-boutique-tours", "status": "published", "data": { "order": 1, "title": "Sri Lanka Boutique Tours ↗", "company": "Sirisara OÜ · Design & Frontend", "year_label": "2025 — 26", "url": "https://slboutiquetours.com/", "tags": ["Astro","Sveltia CMS","HubSpot","Claude Code","Claude Design","i18n","Vimeo","SEO"], "description": "Designed and built the marketing site for a Tallinn-based boutique travel studio — a cinematic Vimeo hero, a curated tour catalogue, and a CMS-driven travel journal, localized across English, Estonian, and Russian." } },
      { "id": "bigwins", "slug": "bigwins", "status": "published", "data": { "order": 2, "title": "BigWins iGaming platform", "company": "Moon-Rocket · Lead Frontend Engineer", "year_label": "2023 — 24", "tags": ["Next.js","TypeScript","Payload CMS","Turborepo","Radix UI"], "description": "Primary frontend engineer for a crypto-first online casino. Built and maintained the design system and component library, localized into Japanese, and served as release manager." } },
      { "id": "fishbrain", "slug": "fishbrain", "status": "published", "data": { "order": 3, "title": "Fishbrain — social app for 14M anglers", "company": "Fishbrain · Senior Frontend Engineer", "year_label": "2021 — 22", "tags": ["Next.js","GraphQL","Apollo","Storybook"], "description": "Built search-as-you-type for the main search (~30% faster), introduced Storybook visual testing into CI, and ran product A/B tests on the web platform." } },
      { "id": "choreo", "slug": "choreo", "status": "published", "data": { "order": 4, "title": "Choreo cloud platform", "company": "WSO2 · Associate Technical Lead", "year_label": "2017 — 21", "tags": ["React","Redux","SWR","Material UI"], "description": "Led frontend architecture for a cloud-native development platform, guided a team of 6, drove a company-wide testing strategy, and cut build time from 1.5 hours to ~20 minutes." } },
      { "id": "kadira", "slug": "kadira", "status": "published", "data": { "order": 5, "title": "Kadira — performance monitoring", "company": "Kadira Inc · Founding Engineer", "year_label": "2013 — 16", "tags": ["React","Node.js","Meteor","GraphQL"], "description": "First employee on a monitoring platform for Meteor.js — grew it to 8,000+ users and 3,000+ paying customers, and helped productize React Storybook into a UI development environment." } },
      { "id": "storybook-hub", "slug": "storybook-hub", "status": "published", "data": { "order": 6, "title": "Storybook Hub", "company": "Kadira Inc · Product project", "year_label": "2016", "tags": ["React","React Router","Node.js"], "description": "A hosted UI development environment for React Storybook components, building both the front and back end." } },
      { "id": "bulletproof-meteor", "slug": "bulletproof-meteor", "status": "published", "data": { "order": 7, "title": "BulletProof Meteor", "company": "Kadira Inc · Product project", "year_label": "2015", "tags": ["React","Meteor","Gumroad"], "description": "A gamified tutorial site teaching how to build fast, efficient Meteor apps, with payments via Gumroad." } },
      { "id": "comet-engine", "slug": "comet-engine", "status": "published", "data": { "order": 8, "title": "Comet Engine", "company": "Kadira Inc · Product project", "year_label": "2013", "tags": ["Meteor","Blaze","DigitalOcean"], "description": "Painless Meteor scaling and hosting, with one-click DigitalOcean deployments." } }
    ],
    "projects": [
      { "id": "react-storybook", "slug": "react-storybook", "status": "published", "data": { "order": 1, "name": "React Storybook", "pill": "PRODUCTIZATION", "url": "https://storybook.js.org/blog/the-storybook-story/", "description": "Contributed to the design and productization of Storybook — now the industry-standard UI development environment for components." } },
      { "id": "kadira-apm", "slug": "kadira-apm", "status": "published", "data": { "order": 2, "name": "Kadira APM", "pill": "PLATFORM", "url": "https://github.com/meteorhacks/kadira", "description": "Founding engineer on an end-to-end performance monitoring platform for Meteor.js, delivering real-time insights to thousands of apps." } },
      { "id": "siyalu-browser", "slug": "siyalu-browser", "status": "published", "data": { "order": 3, "name": "Siyalu Browser", "pill": "ANDROID · 100K", "description": "A free, open-source web browser with comprehensive Sinhala language support. Reached 100,000 downloads on Google Play." } },
      { "id": "kichibichiya", "slug": "kichibichiya", "status": "published", "data": { "order": 4, "name": "Kichibichiya", "pill": "ANDROID", "description": "A friendly Twitter client for Android with full Sinhala language support, built on Twidere." } },
      { "id": "wadan-sewuma", "slug": "wadan-sewuma", "status": "published", "data": { "order": 5, "name": "Wadan Sewuma", "pill": "ANDROID", "description": "An English→Sinhala dictionary app for Android, with camera word capture for instant lookups. Nominated Best Android App at Etisalat AppZone Champions 2012." } },
      { "id": "qschrome", "slug": "qschrome", "status": "published", "data": { "order": 6, "name": "QSChrome", "pill": "CHROME · FIRST", "description": "A Sinhala phonetic typing keyboard for Google Chrome — the first of its kind, before Google Input Tools shipped one." } },
      { "id": "censitip", "slug": "censitip", "status": "published", "data": { "order": 7, "name": "Censitip", "pill": "CHROME", "description": "A Sinhala pop-up dictionary extension for Chrome — instant definitions on hover, anywhere on the web." } },
      { "id": "sinhala-word-cloud", "slug": "sinhala-word-cloud", "status": "published", "data": { "order": 8, "name": "Sinhala Word Cloud", "pill": "DATAVIZ · D3", "description": "The first Sinhala word cloud, generated with D3 from a full book's text and used on the cover of “Economic Strategies Appropriate for Sri Lanka.”" } },
      { "id": "buzzradio", "slug": "buzzradio", "status": "published", "data": { "order": 9, "name": "Buzzradio", "pill": "WEB · RADIO", "description": "Community-driven online radio on Google App Engine, with real-time chat and Ogg audio streaming." } },
      { "id": "hathmaluwa", "slug": "hathmaluwa", "status": "published", "data": { "order": 10, "name": "Hathmaluwa", "pill": "WEB · ANDROID", "description": "A blog aggregator for Sinhala, Tamil & English blogs, plus a companion Android reader." } },
      { "id": "olpc-workshops", "slug": "olpc-workshops", "status": "published", "data": { "order": 11, "name": "OLPC Workshops", "pill": "COMMUNITY", "description": "Volunteer workshops for One Laptop Per Child, bringing low-cost laptops to schoolchildren." } }
    ],
    "awards": [
      { "id": "fight-club", "slug": "fight-club", "status": "published", "data": { "order": 1, "rank": "1st", "context": "Node Knockout '15\n~400 teams worldwide", "title": "Fight Club — Overall Winner", "issuer": "Node.js Knockout · Nov 2015 · with Kadira Inc.", "description": "A real-time, webcam-based fighting game built in a 48-hour global hackathon — powered by WebRTC and motion detection, and inspired by the film. Judged the overall winner against roughly 400 teams worldwide.", "links": [{"label":"Watch demo ↗","url":"https://www.youtube.com/watch?v=Bca7ccuzQuE"},{"label":"Source ↗","url":"https://github.com/nko5/fight-club"}] } },
      { "id": "ko-train", "slug": "ko-train", "status": "published", "data": { "order": 2, "rank": "1st", "context": "CMB.js Colombo '14\n+ People's Choice", "title": "KO-Train — Overall Winner & People's Choice", "issuer": "CMB.js Hackathon, Colombo · Apr 2014 · with Kadira Inc.", "description": "A train-delay notification system built with Meteor.js and Android. Took both the overall winner and People's Choice awards at Colombo's JS hackathon.", "links": [{"label":"Write-up ↗","url":"http://readme.lk/cmbhack-js-battle-javascript-warriors/"}] } },
      { "id": "the-big-wall", "slug": "the-big-wall", "status": "published", "data": { "order": 3, "rank": "5th", "context": "Node Knockout '16\n~400 teams worldwide", "title": "The Big Wall — Top 5 finish", "issuer": "Node.js Knockout · Nov 2016 · with Kadira Inc.", "description": "A virtual wall spanning the US–Mexico border where anyone could draw collaborative graffiti in real time. Placed 5th overall among roughly 400 competing teams.", "links": [] } },
      { "id": "open-comment-box", "slug": "open-comment-box", "status": "published", "data": { "order": 4, "rank": "6th", "context": "Node Knockout '13\n~400 teams worldwide", "title": "Open Comment Box — Top 6 finish", "issuer": "Node.js Knockout · Nov 2013 · with Kadira Inc.", "description": "An open-source, self-hostable real-time commenting platform — a Disqus alternative you can run anywhere. Placed 6th overall among roughly 400 competing teams.", "links": [] } }
    ]
  }
}
```

- [ ] **Step 3: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('seed/seed.json','utf8')); console.log('valid')"`
Expected: prints `valid`.

- [ ] **Step 4: Apply seed locally and confirm schema loads**

Run: `npx emdash dev --types` in the background. Watch the log for successful migration + seed application with no validation errors, and confirm `emdash-env.d.ts` regenerates including `work`, `projects`, `awards`. Then `curl -sI http://localhost:4321/` → 200. Stop the server.
Expected: no seed validation errors in the log. If the first run shows a setup-wizard requirement that blocks seed application, note it — the seed applies when DB is empty and the wizard is not yet completed; document the exact behavior observed.

- [ ] **Step 5: Commit**

```bash
git add seed/seed.json emdash-env.d.ts
git commit -m "feat: define work/projects/awards collections and seed content"
```

---

### Task 6: Build the collection-driven components (Work, OpenSource, Awards)

**Files:**
- Create: `src/components/Work.astro`, `src/components/OpenSource.astro`, `src/components/Awards.astro`

**Interfaces:**
- Consumes: `getEmDashCollection` from `"emdash"`; the `work`/`projects`/`awards` schemas from Task 5.
- Produces: three components rendering the design's `.work`/`.os-grid`/`.awards` markup from live content, sorted by `order`. `index.astro` (Task 7) imports them.

- [ ] **Step 1: Read the query reference**

Read `.agents/skills/building-emdash-site/references/querying-and-rendering.md` to confirm the `getEmDashCollection` signature, entry shape (`entry.id` = slug, `entry.data` = fields), and the `Astro.cache.set(cacheHint)` guard.

- [ ] **Step 2: Create `src/components/Work.astro`**

```astro
---
import { getEmDashCollection } from "emdash";
const { entries: jobs, cacheHint } = await getEmDashCollection("work", {
  status: "published",
  orderBy: { order: "asc" },
});
if (Astro.cache?.enabled) Astro.cache.set(cacheHint);
const sorted = jobs.toSorted((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
const pad = (n: number) => String(n).padStart(2, "0");
---
<section id="work" data-screen-label="Selected Work">
  <div class="wrap">
    <div class="sec-head reveal"><h2>Selected work</h2><span class="kicker">02 — 2013–2026</span></div>
    <div class="work">
      {sorted.map((job, i) => (
        <article class="job reveal">
          <div class="no">{pad(i + 1)}</div>
          <div>
            <h3>{job.data.url
              ? <a href={job.data.url} target="_blank" rel="noopener">{job.data.title}</a>
              : job.data.title}</h3>
            <div class="co">{job.data.company}</div>
            <p>{job.data.description}</p>
            <div class="tags">{(job.data.tags ?? []).map((t: string) => <span class="tag">{t}</span>)}</div>
          </div>
          <div class="meta"><span class="yr">{job.data.year_label}</span></div>
        </article>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Create `src/components/OpenSource.astro`**

```astro
---
import { getEmDashCollection } from "emdash";
const { entries: projects, cacheHint } = await getEmDashCollection("projects", {
  status: "published",
  orderBy: { order: "asc" },
});
if (Astro.cache?.enabled) Astro.cache.set(cacheHint);
const sorted = projects.toSorted((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
---
<section id="opensource" data-screen-label="Open Source">
  <div class="wrap">
    <div class="sec-head reveal"><h2>Open source & side projects</h2><span class="kicker">04 — in the open</span></div>
    <div class="os-grid">
      {sorted.map((p) => (
        <a class="os reveal" href={p.data.url ?? "#"} target="_blank" rel="noopener">
          <div class="tagrow"><span class="pill">{p.data.pill}</span><span class="arr">↗</span></div>
          <h3>{p.data.name}</h3>
          <p>{p.data.description}</p>
        </a>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Create `src/components/Awards.astro`**

```astro
---
import { getEmDashCollection } from "emdash";
const { entries: awards, cacheHint } = await getEmDashCollection("awards", {
  status: "published",
  orderBy: { order: "asc" },
});
if (Astro.cache?.enabled) Astro.cache.set(cacheHint);
const sorted = awards.toSorted((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
---
<section id="awards" data-screen-label="Awards">
  <div class="wrap">
    <div class="sec-head reveal"><h2>Honors & awards</h2><span class="kicker">05 — recognition</span></div>
    <div class="awards">
      {sorted.map((aw) => (
        <article class="award reveal">
          <div class="rank">
            <div class="big">{aw.data.rank}</div>
            <div class="of" set:html={String(aw.data.context ?? "").replace(/\n/g, "<br>")} />
          </div>
          <div>
            <h3>{aw.data.title}</h3>
            <div class="iss">{aw.data.issuer}</div>
            <p>{aw.data.description}</p>
            {(aw.data.links ?? []).length > 0 && (
              <div class="links">
                {(aw.data.links as {label: string; url: string}[]).map((l) => (
                  <a href={l.url} target="_blank" rel="noopener">{l.label}</a>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Type-check** — Run: `npx astro check`. Expected: no errors; collection fields resolve against generated types (if a field type is `any`/loose, that is acceptable).

- [ ] **Step 6: Commit**

```bash
git add src/components/Work.astro src/components/OpenSource.astro src/components/Awards.astro
git commit -m "feat: add collection-driven Work, Open Source, Awards sections"
```

---

### Task 7: Compose the home page and remove starter blog pages

**Files:**
- Modify: `src/pages/index.astro` (replace starter content)
- Delete: `src/pages/[slug].astro`, `src/pages/posts/`, `src/pages/category/`, `src/pages/tag/`

**Interfaces:**
- Consumes: `Base.astro`, all section components, `initUI` from `ui.ts`.
- Produces: the full single-page site at `/`.

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
import Base from "../layouts/Base.astro";
import Nav from "../components/Nav.astro";
import Hero from "../components/Hero.astro";
import About from "../components/About.astro";
import Work from "../components/Work.astro";
import Stack from "../components/Stack.astro";
import OpenSource from "../components/OpenSource.astro";
import Awards from "../components/Awards.astro";
import Contact from "../components/Contact.astro";
import Footer from "../components/Footer.astro";
---
<Base>
  <Nav />
  <main id="top">
    <Hero />
    <About />
    <Work />
    <Stack />
    <OpenSource />
    <Awards />
    <Contact />
  </main>
  <Footer />
  <script>
    import { initUI } from "../scripts/ui.ts";
    initUI();
  </script>
</Base>
```

- [ ] **Step 2: Delete the starter blog pages**

```bash
git rm src/pages/\[slug\].astro
git rm -r src/pages/posts src/pages/category src/pages/tag
```

If `Base.astro`'s `LiveSearch` or any remaining file references `posts`/`pages` collections, that reference was removed in Task 3 (Base no longer renders LiveSearch). Verify no remaining import references the deleted pages.

- [ ] **Step 3: Type-check + dev smoke** — Run: `npx astro check`, then `npx emdash dev` (background). Load `http://localhost:4321/`.
Expected, all confirmed:
- Hero headline "Frontend engineer building fast, reliable interfaces." renders.
- Work shows 8 jobs in order; Open Source shows 11 cards; Awards shows 4 entries — all from the CMS.
- Theme toggle switches dark/light and persists across reload.
- Scroll-reveal fades sections in; stat numbers count up (10+, 30%, 100k, "1.5h → 20m").
- Nav gains `scrolled` background after scrolling; at ~700px nav links hide and grids reflow.
Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: compose home page; remove starter blog pages"
```

---

### Task 8: Production build verification (Cloudflare target)

**Files:** none (verification task).

**Interfaces:**
- Consumes: everything above.
- Produces: a confirmed-good `npm run build`.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: `astro build` completes with no errors; produces `dist/` for the Cloudflare adapter.

- [ ] **Step 2: Preview the built worker**

Run: `npx wrangler dev` (background), then `curl -sI http://localhost:8787/`
Expected: HTTP 200; home page served from the built worker. (D1 may be empty in this preview; a 200 with empty collections is acceptable here — content is verified against real D1 in Task 10.) Stop the preview.

- [ ] **Step 3: Commit** (only if build produced tracked changes, e.g. updated lockfile or generated types)

```bash
git add -A
git commit -m "chore: verify production build" || echo "nothing to commit"
```

---

### Task 9: Cleanup — remove draft, update README

**Files:**
- Delete: `index.html` (repo-root draft reference)
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a clean repo root.

- [ ] **Step 1: Delete the draft** — `git rm index.html`

- [ ] **Step 2: Update `README.md`** (under ~30 lines): what the site is, local dev (`npx emdash dev`, admin at `/_emdash/admin`), build (`npm run build`), deploy (`npm run deploy`), and where content lives (`seed/seed.json` + the three collections). Keep the EmDash-generated `CLAUDE.md`/`AGENTS.md` as-is.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove design draft and update README"
```

---

### Task 10: Deploy to Cloudflare

**Files:**
- Possibly modify: `wrangler.jsonc` (add the created `database_id` if `wrangler` requires it for deploy).

**Interfaces:**
- Consumes: built worker, `wrangler.jsonc` resource names from Task 2.
- Produces: a live site on `*.workers.dev` with `/_emdash/admin` and all three collections rendering from D1.

**Prerequisite:** user has a Cloudflare account and ran `wrangler login`. Confirm before starting: `npx wrangler whoami` prints the account. If not authenticated, STOP and report — this task needs the user.

- [ ] **Step 1: Create the D1 database**

```bash
npx wrangler d1 create pahan-me
```
If the output prints a `database_id`, add it to the `[[d1_databases]]`/`d1_databases` block in `wrangler.jsonc`.

- [ ] **Step 2: Create the R2 bucket**

```bash
npx wrangler r2 bucket create pahan-me-media
```

- [ ] **Step 3: Set the encryption key secret**

The encryption key is in the git-ignored `.env` (`EMDASH_ENCRYPTION_KEY`). Set it as a Worker secret:
```bash
npx wrangler secret put EMDASH_ENCRYPTION_KEY   # paste the value from .env
```
Confirm the exact required secret name(s) against EmDash's deploy docs (`.agents/skills/emdash-cli/SKILL.md`); set any others it requires.

- [ ] **Step 4: Apply schema/migrations + seed to remote D1**

Run the EmDash deploy/migrate step against remote D1. The seed in `seed/seed.json` is applied on first request when the DB is empty; if EmDash provides an explicit remote migrate/seed command (check `.agents/skills/emdash-cli/SKILL.md`), run it. Otherwise, deploy first (Step 5) and trigger the first request, then verify content appears.

- [ ] **Step 5: Deploy**

```bash
npm run deploy
```
Expected: deploy succeeds; prints `https://pahan-me.<subdomain>.workers.dev`.

- [ ] **Step 6: Verify production**

Run: `curl -sI https://pahan-me.<subdomain>.workers.dev/` → expect 200. In a browser: home page renders all sections; Work/Projects/Awards populated; theme toggle works; `/_emdash/admin` loads (setup wizard on first visit is expected). Report the live URL.

- [ ] **Step 7: Commit**

```bash
git add wrangler.jsonc
git commit -m "chore: deploy to Cloudflare" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:**
- Architecture & stack → Tasks 1 (done), 2. ✓
- Content model (work/projects/awards collections) → Task 5 (schema+seed), Task 6 (rendering). ✓
- Components & structure (Base, sections, index) → Tasks 3, 4, 6, 7. ✓
- Styling & behavior preserved (CSS, fonts, theme, reveal, count-up, responsive, baked tokens) → Tasks 3, 4; verified in Task 7 Step 3. ✓
- Deployment (Cloudflare D1/R2/Worker, driven by us) → Tasks 2, 10. ✓
- Testing & verification (astro check, types, dev smoke, build, post-deploy) → Tasks 3–10. ✓
- Out-of-scope items → none introduced (starter blog pages removed in Task 7). ✓

**Type/field consistency:** Field slugs are consistent between Task 5 schema, Task 5 seed content, and Task 6 components: `work.{order,title,company,description,tags,year_label,url}`, `projects.{order,name,pill,description,url}`, `awards.{order,rank,context,title,issuer,description,links}`. `getEmDashCollection` + `entry.data.*` + `entry.id` used consistently. Bindings `DB`/`MEDIA` and names `pahan-me`/`pahan-me-media` consistent across Tasks 2 and 10.

**Residual unknowns (genuine, environment-bound):** exact `createPublicPageContext` argument shape (Task 3 — mirror the scaffold's original), whether remote D1 needs an explicit migrate command vs. first-request seed (Task 10 — checks `.agents/skills/emdash-cli/SKILL.md`), and the exact secret name(s) for deploy (Task 10). Each task names where to confirm against the in-repo EmDash docs.
