import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			// Media storage (R2) omitted: account R2 not enabled and the site uses no
			// media. To re-enable: `npm i` already has @emdash-cms/cloudflare; restore
			//   import { d1, r2 } from "@emdash-cms/cloudflare";
			//   storage: r2({ binding: "MEDIA" }),
			// and re-add the r2_buckets block in wrangler.jsonc, then create the bucket.
		}),
	],
	devToolbar: { enabled: false },
});
