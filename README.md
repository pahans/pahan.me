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

```bash
npm run deploy
```

Requires `wrangler login`, a D1 database named `pahan-me`, an R2 bucket named `pahan-me-media`, and the `EMDASH_ENCRYPTION_KEY` secret set in Cloudflare.

## Notes

`CLAUDE.md` and `AGENTS.md` are EmDash-generated and left as-is.
