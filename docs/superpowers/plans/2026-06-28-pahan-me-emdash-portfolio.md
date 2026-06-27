# pahan.me — EmDash Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Pahan Sarathchandra's portfolio (`pahan.me`) as an EmDash CMS project on Cloudflare, faithfully porting the imported `light.html` design, with Work / Projects / Awards as editable CMS collections.

**Architecture:** Astro + EmDash integration (`emdash/astro`) on Cloudflare Workers, content in D1, media in R2. The imported design is ported into focused Astro components and a global stylesheet. Three EmDash collections drive the list sections; the rest is hardcoded.

**Tech Stack:** Astro, EmDash CMS, Cloudflare Workers / D1 / R2, `wrangler`, TypeScript, Google Fonts.

## Global Constraints

- Design tokens baked to selected "Tweaks" values: **Cobalt** accent, **Modern** typeface, **Compact** density. The `:root` density vars are: `--pad-sec:54px; --pad-hero-t:132px; --pad-hero-b:58px; --gap-head:30px; --about-gap:40px; --pad-contact:70px;`.
- Dark theme is the default (`<html data-theme="dark">`); light is opt-in via toggle, persisted to `localStorage` key `pf-theme`.
- The React "Tweaks" panel and its CDN scripts from the import are NOT included.
- Fonts: Schibsted Grotesk, JetBrains Mono, Newsreader (Google Fonts).
- Seed content for collections is taken verbatim from the reference `index.html` / imported design.
- All section copy, links, emails (`pahan123@gmail.com`), phone (`+372 5803 2161`), and social URLs must match the design exactly.
- Reference source of truth for CSS + markup: the draft `index.html` at repo root (deleted in the final task).

## File Structure

- `astro.config.mjs` — Astro + `emdash({ database: d1() })` integration.
- `wrangler.toml` (or `.jsonc`) — Cloudflare Worker config, D1 + R2 bindings.
- `src/layouts/Base.astro` — `<head>`, fonts, global CSS import, theme bootstrap.
- `src/styles/global.css` — the full design stylesheet (verbatim, density baked).
- `src/scripts/ui.ts` — theme toggle, scroll-reveal, stat count-up.
- `src/components/Nav.astro`, `Hero.astro`, `About.astro`, `Stack.astro`, `Contact.astro`, `Footer.astro` — static sections.
- `src/components/Work.astro`, `OpenSource.astro`, `Awards.astro` — collection-driven sections.
- `src/pages/index.astro` — composes all sections.
- `src/content/seed/*.json` (or migration/seed scripts) — collection seed data.
- `docs/superpowers/specs/2026-06-28-pahan-me-emdash-portfolio-design.md` — the spec (already committed).

---

### Task 1: Scaffold the EmDash project into the repo

**Files:**
- Create: project scaffold (`astro.config.mjs`, `package.json`, `src/`, `wrangler` config, etc.) via the EmDash CLI.

**Interfaces:**
- Produces: a runnable Astro+EmDash project; `npm run dev` serves the site and `/admin`. Subsequent tasks rely on `astro.config.mjs`, `src/`, and the EmDash CLI being present.

- [ ] **Step 1: Scaffold**

The repo already contains `README.md`, `docs/`, and the draft `index.html`. Scaffold EmDash in the current directory (choose the **minimal/blank** starter when prompted, NOT the portfolio template — we port our own design):

```bash
npm create emdash@latest -- --template minimal .
```

If the CLI refuses to scaffold into a non-empty directory, scaffold into a temp dir and move files in:

```bash
npm create emdash@latest emdash-tmp
# then move generated files (excluding its README) into the repo root:
rsync -a --exclude README.md --exclude .git emdash-tmp/ ./ && rm -rf emdash-tmp
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Inspect the generated structure**

Run: `ls -1 && cat astro.config.mjs && cat package.json`
Expected: `astro.config.mjs` exists and references the EmDash integration; `package.json` has `dev`/`build` scripts. Note the actual `src/` layout — later tasks assume `src/pages/index.astro`, `src/layouts/`, `src/components/`; adapt paths to match the generated convention if it differs.

- [ ] **Step 4: Run the dev server**

Run: `npm run dev` (background it, then curl)
Expected: dev server starts; `curl -sI http://localhost:4321/` returns HTTP 200. The EmDash admin responds at `/admin` (may redirect to a login/setup page — that is expected). Stop the dev server after verifying.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold EmDash project"
```

---

### Task 2: Configure the Cloudflare adapter, D1, and R2 (local bindings)

**Files:**
- Modify: `astro.config.mjs` — ensure `emdash({ database: d1() })` and the Cloudflare adapter are set.
- Create/Modify: `wrangler.toml` (or `.jsonc`) — Worker name, `compatibility_date`, D1 binding, R2 binding.

**Interfaces:**
- Consumes: scaffold from Task 1.
- Produces: a config where EmDash uses D1 locally; `npm run dev` works against a local D1; `astro build` targets Cloudflare. Later deploy task relies on the binding names defined here: D1 binding `DB`, R2 binding `MEDIA`.

- [ ] **Step 1: Set the database adapter in `astro.config.mjs`**

Ensure the config reads (merge with whatever the scaffold generated; keep existing integrations):

```js
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { d1 } from "emdash/db";

export default defineConfig({
  integrations: [emdash({ database: d1() })],
});
```

If the scaffold already added a Cloudflare adapter (`@astrojs/cloudflare`) and `output`, leave those in place.

- [ ] **Step 2: Define `wrangler.toml`**

Create/merge `wrangler.toml` at repo root:

```toml
name = "pahan-me"
compatibility_date = "2026-06-01"

[[d1_databases]]
binding = "DB"
database_name = "pahan-me"
database_id = "local"   # replaced with the real id in the deploy task

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "pahan-me-media"
```

If EmDash's scaffold generated its own `wrangler` config with different binding names, keep EmDash's names and note them here instead of overwriting.

- [ ] **Step 3: Verify local dev still boots with D1**

Run: `npm run dev`, then `curl -sI http://localhost:4321/admin`
Expected: HTTP 200 or a redirect (3xx) to the admin setup/login. No D1 binding errors in the dev log. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs wrangler.toml
git commit -m "chore: configure Cloudflare D1/R2 bindings"
```

---

### Task 3: Port the global stylesheet and Base layout

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: scaffold structure.
- Produces: `Base.astro` exporting a default layout with a `<slot />`, importing `global.css`, the fonts, and the theme-bootstrap script. Later component/page tasks wrap content in `Base.astro`.

- [ ] **Step 1: Create `src/styles/global.css`**

Copy the entire contents of the `<style>...</style>` block from the reference `index.html` (repo root) into `src/styles/global.css`, **without** the `<style>` tags. The density vars in `:root` are already baked to Compact values (see Global Constraints) — verify they match. Do not include the `.pf-hint` rule (it belonged to the Tweaks panel) — it is already absent from the draft, confirm it is not present.

- [ ] **Step 2: Create `src/layouts/Base.astro`**

```astro
---
import "../styles/global.css";
---
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pahan Sarathchandra — Frontend Engineer</title>
  <script is:inline>try{var t=localStorage.getItem('pf-theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" rel="stylesheet" />
</head>
<body>
  <slot />
</body>
</html>
```

- [ ] **Step 3: Type-check**

Run: `npx astro check`
Expected: no errors referencing `Base.astro` or `global.css` (a warning about an unused layout before any page uses it is acceptable).

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css src/layouts/Base.astro
git commit -m "feat: add global stylesheet and base layout"
```

---

### Task 4: Port static sections (Nav, Hero, About, Stack, Contact, Footer) + client script

**Files:**
- Create: `src/components/Nav.astro`, `Hero.astro`, `About.astro`, `Stack.astro`, `Contact.astro`, `Footer.astro`
- Create: `src/scripts/ui.ts`

**Interfaces:**
- Consumes: `Base.astro` styles (class names from `global.css`).
- Produces: six section components each rendering the markup from the reference `index.html`, and `ui.ts` exporting an `initUI()` that wires nav scroll state, theme toggle, scroll-reveal, and stat count-up. `index.astro` (Task 8) imports these.

- [ ] **Step 1: Create `src/components/Nav.astro`**

Copy the `<nav id="nav">...</nav>` block verbatim from the reference `index.html`.

- [ ] **Step 2: Create `src/components/Hero.astro`**

Copy the `<header class="hero" ...>...</header>` block verbatim from the reference `index.html`.

- [ ] **Step 3: Create `src/components/About.astro`**

Copy the `<section id="about" ...>...</section>` block verbatim (includes the stat strip with `data-count` spans).

- [ ] **Step 4: Create `src/components/Stack.astro`**

Copy the `<section id="stack" ...>...</section>` block verbatim.

- [ ] **Step 5: Create `src/components/Contact.astro`**

Copy the `<section id="contact" ...>...</section>` block verbatim.

- [ ] **Step 6: Create `src/components/Footer.astro`**

Copy the `<footer>...</footer>` block verbatim.

- [ ] **Step 7: Create `src/scripts/ui.ts`**

Port the inline `<script>` (non-Tweaks) from the reference `index.html` into an exported init:

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

- [ ] **Step 8: Type-check**

Run: `npx astro check`
Expected: no errors in the new components or `ui.ts`.

- [ ] **Step 9: Commit**

```bash
git add src/components src/scripts/ui.ts
git commit -m "feat: port static sections and client UI script"
```

---

### Task 5: Create the Work collection, seed it, and build Work.astro

**Files:**
- Create: collection definition (via EmDash admin UI or MCP) + `src/content/seed/work.json`
- Create: `src/components/Work.astro`

**Interfaces:**
- Consumes: D1 binding from Task 2.
- Produces: a `work` collection with fields `order:number, title:text, company:text, description:text, tags:json/text[], yearLabel:text, url:text?`; `Work.astro` querying it sorted by `order` and rendering the `.work`/`.job` markup. `index.astro` imports `Work.astro`.

- [ ] **Step 1: Create the `work` collection**

In the EmDash admin (`npm run dev` → `/admin`), create a collection `work` with fields: `order` (number), `title` (text), `company` (text), `description` (long text), `tags` (list/JSON of text), `yearLabel` (text), `url` (text, optional). If EmDash exposes collection creation via its MCP server, that is an acceptable alternative — use whichever the live tool supports.

- [ ] **Step 2: Generate types**

Run: `npx emdash types`
Expected: TypeScript types for the `work` collection are generated (note the exact import path printed, e.g. `emdash:content` or a generated `.d.ts`); use that path in Step 4.

- [ ] **Step 3: Seed the 8 work entries**

Enter these 8 entries (verbatim from the design) via the admin, or via a seed file `src/content/seed/work.json` imported by an EmDash seed/migration step:

```json
[
  {"order":1,"title":"Sri Lanka Boutique Tours ↗","company":"Sirisara OÜ · Design & Frontend","yearLabel":"2025 — 26","url":"https://slboutiquetours.com/","tags":["Astro","Sveltia CMS","HubSpot","Claude Code","Claude Design","i18n","Vimeo","SEO"],"description":"Designed and built the marketing site for a Tallinn-based boutique travel studio — a cinematic Vimeo hero, a curated tour catalogue, and a CMS-driven travel journal, localized across English, Estonian, and Russian."},
  {"order":2,"title":"BigWins iGaming platform","company":"Moon-Rocket · Lead Frontend Engineer","yearLabel":"2023 — 24","tags":["Next.js","TypeScript","Payload CMS","Turborepo","Radix UI"],"description":"Primary frontend engineer for a crypto-first online casino. Built and maintained the design system and component library, localized into Japanese, and served as release manager."},
  {"order":3,"title":"Fishbrain — social app for 14M anglers","company":"Fishbrain · Senior Frontend Engineer","yearLabel":"2021 — 22","tags":["Next.js","GraphQL","Apollo","Storybook"],"description":"Built search-as-you-type for the main search (~30% faster), introduced Storybook visual testing into CI, and ran product A/B tests on the web platform."},
  {"order":4,"title":"Choreo cloud platform","company":"WSO2 · Associate Technical Lead","yearLabel":"2017 — 21","tags":["React","Redux","SWR","Material UI"],"description":"Led frontend architecture for a cloud-native development platform, guided a team of 6, drove a company-wide testing strategy, and cut build time from 1.5 hours to ~20 minutes."},
  {"order":5,"title":"Kadira — performance monitoring","company":"Kadira Inc · Founding Engineer","yearLabel":"2013 — 16","tags":["React","Node.js","Meteor","GraphQL"],"description":"First employee on a monitoring platform for Meteor.js — grew it to 8,000+ users and 3,000+ paying customers, and helped productize React Storybook into a UI development environment."},
  {"order":6,"title":"Storybook Hub","company":"Kadira Inc · Product project","yearLabel":"2016","tags":["React","React Router","Node.js"],"description":"A hosted UI development environment for React Storybook components, building both the front and back end."},
  {"order":7,"title":"BulletProof Meteor","company":"Kadira Inc · Product project","yearLabel":"2015","tags":["React","Meteor","Gumroad"],"description":"A gamified tutorial site teaching how to build fast, efficient Meteor apps, with payments via Gumroad."},
  {"order":8,"title":"Comet Engine","company":"Kadira Inc · Product project","yearLabel":"2013","tags":["Meteor","Blaze","DigitalOcean"],"description":"Painless Meteor scaling and hosting, with one-click DigitalOcean deployments."}
]
```

- [ ] **Step 4: Create `src/components/Work.astro`**

Query the collection (use the actual EmDash query API confirmed in Step 2; the shape below is the target) and render the design's `.work`/`.job` markup. Only entry 1 has a linked title in the design; render a link when `url` is present:

```astro
---
import { getCollection } from "emdash:content"; // use the import path from `npx emdash types`
const jobs = (await getCollection("work")).sort((a, b) => a.data.order - b.data.order);
const pad = (n: number) => String(n).padStart(2, "0");
---
<section id="work" data-screen-label="Selected Work">
  <div class="wrap">
    <div class="sec-head reveal"><h2>Selected work</h2><span class="kicker">02 — 2013–2026</span></div>
    <div class="work">
      {jobs.map((job, i) => (
        <article class="job reveal">
          <div class="no">{pad(i + 1)}</div>
          <div>
            <h3>{job.data.url
              ? <a href={job.data.url} target="_blank" rel="noopener">{job.data.title}</a>
              : job.data.title}</h3>
            <div class="co">{job.data.company}</div>
            <p>{job.data.description}</p>
            <div class="tags">{job.data.tags.map((t: string) => <span class="tag">{t}</span>)}</div>
          </div>
          <div class="meta"><span class="yr">{job.data.yearLabel}</span></div>
        </article>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Type-check**

Run: `npx astro check`
Expected: no errors; `getCollection("work")` resolves with the generated types.

- [ ] **Step 6: Commit**

```bash
git add src/components/Work.astro src/content/seed/work.json
git commit -m "feat: add work collection and Work section"
```

---

### Task 6: Create the Projects collection, seed it, and build OpenSource.astro

**Files:**
- Create: `projects` collection + `src/content/seed/projects.json`
- Create: `src/components/OpenSource.astro`

**Interfaces:**
- Consumes: D1 binding; EmDash query API.
- Produces: a `projects` collection with `order:number, name:text, pill:text, description:text, url:text?`; `OpenSource.astro` rendering the `.os-grid`/`.os` cards. `index.astro` imports it.

- [ ] **Step 1: Create the `projects` collection**

Fields: `order` (number), `name` (text), `pill` (text), `description` (long text), `url` (text, optional).

- [ ] **Step 2: Generate types**

Run: `npx emdash types`
Expected: `projects` types generated.

- [ ] **Step 3: Seed the 11 project entries**

```json
[
  {"order":1,"name":"React Storybook","pill":"PRODUCTIZATION","url":"https://storybook.js.org/blog/the-storybook-story/","description":"Contributed to the design and productization of Storybook — now the industry-standard UI development environment for components."},
  {"order":2,"name":"Kadira APM","pill":"PLATFORM","url":"https://github.com/meteorhacks/kadira","description":"Founding engineer on an end-to-end performance monitoring platform for Meteor.js, delivering real-time insights to thousands of apps."},
  {"order":3,"name":"Siyalu Browser","pill":"ANDROID · 100K","description":"A free, open-source web browser with comprehensive Sinhala language support. Reached 100,000 downloads on Google Play."},
  {"order":4,"name":"Kichibichiya","pill":"ANDROID","description":"A friendly Twitter client for Android with full Sinhala language support, built on Twidere."},
  {"order":5,"name":"Wadan Sewuma","pill":"ANDROID","description":"An English→Sinhala dictionary app for Android, with camera word capture for instant lookups. Nominated Best Android App at Etisalat AppZone Champions 2012."},
  {"order":6,"name":"QSChrome","pill":"CHROME · FIRST","description":"A Sinhala phonetic typing keyboard for Google Chrome — the first of its kind, before Google Input Tools shipped one."},
  {"order":7,"name":"Censitip","pill":"CHROME","description":"A Sinhala pop-up dictionary extension for Chrome — instant definitions on hover, anywhere on the web."},
  {"order":8,"name":"Sinhala Word Cloud","pill":"DATAVIZ · D3","description":"The first Sinhala word cloud, generated with D3 from a full book's text and used on the cover of “Economic Strategies Appropriate for Sri Lanka.”"},
  {"order":9,"name":"Buzzradio","pill":"WEB · RADIO","description":"Community-driven online radio on Google App Engine, with real-time chat and Ogg audio streaming."},
  {"order":10,"name":"Hathmaluwa","pill":"WEB · ANDROID","description":"A blog aggregator for Sinhala, Tamil & English blogs, plus a companion Android reader."},
  {"order":11,"name":"OLPC Workshops","pill":"COMMUNITY","description":"Volunteer workshops for One Laptop Per Child, bringing low-cost laptops to schoolchildren."}
]
```

- [ ] **Step 4: Create `src/components/OpenSource.astro`**

Render the design's `.os-grid` of `.os` cards. In the design every card is an anchor (cards without a real link use `href="#"`); replicate by defaulting to `"#"`:

```astro
---
import { getCollection } from "emdash:content";
const projects = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
---
<section id="opensource" data-screen-label="Open Source">
  <div class="wrap">
    <div class="sec-head reveal"><h2>Open source & side projects</h2><span class="kicker">04 — in the open</span></div>
    <div class="os-grid">
      {projects.map((p) => (
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

- [ ] **Step 5: Type-check**

Run: `npx astro check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/OpenSource.astro src/content/seed/projects.json
git commit -m "feat: add projects collection and Open Source section"
```

---

### Task 7: Create the Awards collection, seed it, and build Awards.astro

**Files:**
- Create: `awards` collection + `src/content/seed/awards.json`
- Create: `src/components/Awards.astro`

**Interfaces:**
- Consumes: D1 binding; EmDash query API.
- Produces: an `awards` collection with `order:number, rank:text, context:text, title:text, issuer:text, description:text, links:json[{label,url}]`; `Awards.astro` rendering `.awards`/`.award` markup. `index.astro` imports it.

- [ ] **Step 1: Create the `awards` collection**

Fields: `order` (number), `rank` (text), `context` (text — use a literal `\n` for the line break, rendered with `<br>`), `title` (text), `issuer` (text), `description` (long text), `links` (list/JSON of `{label, url}`).

- [ ] **Step 2: Generate types**

Run: `npx emdash types`
Expected: `awards` types generated.

- [ ] **Step 3: Seed the 4 award entries**

```json
[
  {"order":1,"rank":"1st","context":"Node Knockout '15\n~400 teams worldwide","title":"Fight Club — Overall Winner","issuer":"Node.js Knockout · Nov 2015 · with Kadira Inc.","description":"A real-time, webcam-based fighting game built in a 48-hour global hackathon — powered by WebRTC and motion detection, and inspired by the film. Judged the overall winner against roughly 400 teams worldwide.","links":[{"label":"Watch demo ↗","url":"https://www.youtube.com/watch?v=Bca7ccuzQuE"},{"label":"Source ↗","url":"https://github.com/nko5/fight-club"}]},
  {"order":2,"rank":"1st","context":"CMB.js Colombo '14\n+ People's Choice","title":"KO-Train — Overall Winner & People's Choice","issuer":"CMB.js Hackathon, Colombo · Apr 2014 · with Kadira Inc.","description":"A train-delay notification system built with Meteor.js and Android. Took both the overall winner and People's Choice awards at Colombo's JS hackathon.","links":[{"label":"Write-up ↗","url":"http://readme.lk/cmbhack-js-battle-javascript-warriors/"}]},
  {"order":3,"rank":"5th","context":"Node Knockout '16\n~400 teams worldwide","title":"The Big Wall — Top 5 finish","issuer":"Node.js Knockout · Nov 2016 · with Kadira Inc.","description":"A virtual wall spanning the US–Mexico border where anyone could draw collaborative graffiti in real time. Placed 5th overall among roughly 400 competing teams.","links":[]},
  {"order":4,"rank":"6th","context":"Node Knockout '13\n~400 teams worldwide","title":"Open Comment Box — Top 6 finish","issuer":"Node.js Knockout · Nov 2013 · with Kadira Inc.","description":"An open-source, self-hostable real-time commenting platform — a Disqus alternative you can run anywhere. Placed 6th overall among roughly 400 competing teams.","links":[]}
]
```

- [ ] **Step 4: Create `src/components/Awards.astro`**

```astro
---
import { getCollection } from "emdash:content";
const awards = (await getCollection("awards")).sort((a, b) => a.data.order - b.data.order);
---
<section id="awards" data-screen-label="Awards">
  <div class="wrap">
    <div class="sec-head reveal"><h2>Honors & awards</h2><span class="kicker">05 — recognition</span></div>
    <div class="awards">
      {awards.map((aw) => (
        <article class="award reveal">
          <div class="rank">
            <div class="big">{aw.data.rank}</div>
            <div class="of" set:html={aw.data.context.replace(/\n/g, "<br>")} />
          </div>
          <div>
            <h3>{aw.data.title}</h3>
            <div class="iss">{aw.data.issuer}</div>
            <p>{aw.data.description}</p>
            {aw.data.links.length > 0 && (
              <div class="links">
                {aw.data.links.map((l: {label: string; url: string}) => (
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

- [ ] **Step 5: Type-check**

Run: `npx astro check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Awards.astro src/content/seed/awards.json
git commit -m "feat: add awards collection and Awards section"
```

---

### Task 8: Compose the home page and wire client UI

**Files:**
- Create: `src/pages/index.astro`
- Modify: remove the placeholder home page the scaffold generated, if any.

**Interfaces:**
- Consumes: `Base.astro`, all section components, `initUI` from `ui.ts`.
- Produces: the full single-page site at `/`.

- [ ] **Step 1: Create `src/pages/index.astro`**

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

If the scaffold created a different default `index.astro`, overwrite it with the above.

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: no errors.

- [ ] **Step 3: Smoke test in dev**

Run: `npm run dev`, then load `http://localhost:4321/` in a browser (or `curl -s` and grep).
Expected, all confirmed:
- Hero headline "Frontend engineer building fast, reliable interfaces." renders.
- Work section shows 8 jobs in order; Open Source shows 11 cards; Awards shows 4 entries.
- Theme toggle switches dark/light and persists across reload (`localStorage` `pf-theme`).
- Scroll-reveal fades sections in; stat numbers count up (10+, 30%, 100k, "1.5h → 20m").
- Nav gains the `scrolled` background after scrolling.
- Resize to ~700px: nav links hide, grids reflow to single column.
Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: compose home page from sections"
```

---

### Task 9: Remove the draft, build for Cloudflare, and verify locally

**Files:**
- Delete: `index.html` (repo-root draft reference).
- Modify: `README.md` — brief project description and dev/deploy commands.

**Interfaces:**
- Consumes: everything above.
- Produces: a clean production build.

- [ ] **Step 1: Delete the draft reference**

```bash
git rm index.html
```

- [ ] **Step 2: Update `README.md`**

Replace contents with a short description: what the site is, `npm run dev` for local, `/admin` for the CMS, and the deploy command (Task 10). Keep it under ~25 lines.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build completes with no errors; output targets the Cloudflare adapter (a `dist/` and/or `.wrangler`/worker bundle is produced).

- [ ] **Step 4: Preview the built worker locally**

Run: `npx wrangler dev` (or the EmDash-provided preview command), then `curl -sI http://localhost:8787/`
Expected: HTTP 200; home page HTML served from the built worker. Stop the preview.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove design draft, update README, verify build"
```

---

### Task 10: Deploy to Cloudflare (D1 + R2 + Worker)

**Files:**
- Modify: `wrangler.toml` — real `database_id` after D1 creation.

**Interfaces:**
- Consumes: built worker, `wrangler` config.
- Produces: a live site on a `*.workers.dev` URL with working `/admin` and all three collections rendering.

**Prerequisite:** the user has a Cloudflare account and has run `wrangler login`. Confirm before starting: `npx wrangler whoami` prints the account.

- [ ] **Step 1: Create the D1 database**

```bash
npx wrangler d1 create pahan-me
```
Copy the printed `database_id` into `wrangler.toml`'s `[[d1_databases]]` block (replacing `"local"`).

- [ ] **Step 2: Create the R2 bucket**

```bash
npx wrangler r2 bucket create pahan-me-media
```

- [ ] **Step 3: Apply the EmDash schema / migrations to remote D1**

Run the EmDash migration/schema-apply command against remote D1 (confirm the exact command from EmDash docs; typically a migrations apply). If EmDash emits SQL migrations under a `migrations/` dir:
```bash
npx wrangler d1 migrations apply pahan-me --remote
```
Expected: tables for `work`, `projects`, `awards` (and EmDash system tables) created remotely.

- [ ] **Step 4: Seed remote collections**

Re-create the seed entries against the production database. Use the same content as Tasks 5–7 — either by running EmDash's seed mechanism against `--remote`, or by logging into the deployed `/admin` after Step 5 and entering them. Whichever the live tooling supports; prefer a scripted seed for reproducibility.

- [ ] **Step 5: Deploy the worker**

```bash
npx wrangler deploy
```
Expected: deploy succeeds; a `https://pahan-me.<subdomain>.workers.dev` URL is printed.

- [ ] **Step 6: Verify production**

Run: `curl -sI https://pahan-me.<subdomain>.workers.dev/`
Expected: HTTP 200. In a browser, confirm: home page renders with all sections; Work/Projects/Awards populated from remote D1; theme toggle works; `/admin` loads and lists the three collections.

- [ ] **Step 7: Commit**

```bash
git add wrangler.toml
git commit -m "chore: deploy to Cloudflare (D1 id, production)"
```

---

## Self-Review

**Spec coverage:**
- Architecture & stack → Tasks 1, 2. ✓
- Content model (Work/Projects/Awards collections) → Tasks 5, 6, 7. ✓
- Components & structure (Base, sections, index) → Tasks 3, 4, 8. ✓
- Styling & behavior preserved (CSS, fonts, theme, reveal, count-up, responsive, baked tokens) → Tasks 3, 4, 8 (Step 3 verifies). ✓
- Deployment (Cloudflare D1/R2/Worker, driven by us) → Tasks 2, 10. ✓
- Testing & verification (astro check, types, smoke, build, post-deploy) → Tasks 3–10. ✓
- Out-of-scope items → none introduced. ✓

**Placeholder scan:** No "TBD"/"implement later". Where EmDash's exact CLI/query API can't be known ahead of the live tool (collection creation, types import path, migration/seed command), the plan states the target shape and instructs confirming against the running tool — these are genuine environment unknowns, not skipped work.

**Type consistency:** `getCollection("work"|"projects"|"awards")` used consistently; field names (`order`, `title`, `company`, `description`, `tags`, `yearLabel`, `url`; `name`, `pill`; `rank`, `context`, `issuer`, `links[{label,url}]`) match between each collection's definition, seed JSON, and component. D1 binding `DB` and R2 binding `MEDIA` consistent across Tasks 2 and 10.

**Note on EmDash specifics:** EmDash is a new beta tool. The import path `emdash:content` and the `getCollection` API are the target/assumed shape modeled on Astro content collections; Task 5 Step 2 captures the real path from `npx emdash types`, and later components must use whatever that reveals. Treat the first collection task as the point where the real API is pinned down, then keep the others consistent.
