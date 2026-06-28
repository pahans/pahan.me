# pahan.me

Personal portfolio of Pahan Sarathchandra, built with [EmDash CMS](https://github.com/emdash-cms/emdash) on Cloudflare (Astro).

## Local Development

Requires **Node 22.x**.

```bash
npx emdash dev
```

This runs migrations and applies the seed. The site is available at `http://localhost:4321`; the admin panel is at `http://localhost:4321/_emdash/admin` (first run launches the setup wizard).

## Content

The schema and seed content live in `seed/seed.json`. Three collections — **Work**, **Projects**, and **Awards** — are editable in the admin. The rest of the page (hero, about, stack, contact) is in `src/components/`.

## Build

```bash
npm run build
```

## Deploy

Live at **https://pahan-me.pahan123.workers.dev** (Cloudflare Workers, free plan).

```bash
npm run deploy
```

Prerequisites: `wrangler login`, a D1 database named `pahan-me` (bound as `DB`), the
`EMDASH_ENCRYPTION_KEY` secret (`wrangler secret put EMDASH_ENCRYPTION_KEY`), and a
KV namespace for `SESSION`.

This deployment runs on the **Workers free plan**, which required two adjustments
(both reversible, see comments in `astro.config.mjs` / `wrangler.jsonc`):

- **No R2** — R2 isn't enabled on the account and the site uses no media, so media
  storage is omitted. To re-enable: enable R2, create bucket `pahan-me-media`, and
  restore the `r2(...)` storage + `r2_buckets` binding.
- **No Dynamic Worker Loader** — the `LOADER` binding (plugin sandboxing) needs the
  Workers Paid plan. With no plugins it's never used at runtime, so it's removed.

### Seeding content in production

The seed in `seed/seed.json` is applied to a **fresh** database only. Because the
first request creates the schema tables, the Setup Wizard then sees a non-empty DB
and skips seeding the sample content. After completing the wizard, load the content
into remote D1 directly, e.g.:

```bash
# export schema+content rows from a locally-seeded run, then:
wrangler d1 execute pahan-me --remote --file=content.sql
```

(Insert `revisions` rows before the `ec_*` tables, which FK-reference them.)

## Notes

`CLAUDE.md` and `AGENTS.md` are EmDash-generated and left as-is.
