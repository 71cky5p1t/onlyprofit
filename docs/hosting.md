# Hosting

profit.licky.com.au is Cloudflare Pages, connected to this repo. DNS for licky.com.au is on Cloudflare.

- Production branch `main`, no build command, output directory `dist`.
- Every push to `main` redeploys in about a minute. Other branches get preview URLs.
- `dist/` is committed, so `./build.sh` before merging is what updates the site.

When the multiplayer server lands, run it on the Mac mini behind a Cloudflare Tunnel on its own subdomain (e.g. `play.licky.com.au`); the static page can stay on Pages.
