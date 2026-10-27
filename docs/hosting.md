# Hosting

profit.licky.com.au is a Cloudflare Worker serving `dist/` as static assets (`wrangler.jsonc`), built by Workers Builds from this repo. DNS for licky.com.au is on Cloudflare.

- No build command; deploy command `npx wrangler deploy`. Every push to `main` redeploys; other branches get preview URLs.
- `dist/` is committed, so `./build.sh` before merging is what updates the site.
- Custom domain is set in the dashboard: Worker → Settings → Domains & Routes.

When the multiplayer server lands, run it on the Mac mini behind a Cloudflare Tunnel on its own subdomain (e.g. `play.licky.com.au`); the static page can stay here.
