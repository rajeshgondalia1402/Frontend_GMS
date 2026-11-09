# GaragePilot PWA — setup, Nginx and deployment

GaragePilot is installable as a Progressive Web App (Android Chrome, desktop
Chrome/Edge, iPhone/iPad via Safari "Add to Home Screen"). It is the same
website and the same login / OTP / Razorpay flow. Nothing about the backend changed.

## How it works

| Piece | Where |
|---|---|
| Manifest + service worker generation | `vite.config.ts` (`vite-plugin-pwa`, generateSW) |
| SW registration, update check, install state, logout cache purge | `src/lib/pwa.ts` (called from `src/main.tsx`) |
| React hook for install state | `src/hooks/usePwaInstall.ts` |
| Install card + iPhone instructions modal | `src/components/pwa/InstallApp.tsx` |
| Install banner (14-day snooze) + "new version" banner | `src/components/common/PwaUI.tsx` |
| Install entry points | Login page, Garage Profile page, account menu ("Install App"), banner in the owner/admin shell |
| Icons (made from the existing `favicon.svg` mark) | `public/icons/*` |

Build output adds `dist/sw.js`, `dist/workbox-*.js`, `dist/manifest.webmanifest`
and `dist/icons/`.

### Caching rules

* **Precached:** only the build output (JS, CSS, `index.html`, icons, favicon, small logo).
* **Navigations (`/`, `/login`, `/app/...`):** NetworkFirst with a 4 s timeout, falling back
  to the cached `index.html` when offline. Each route returns the same public HTML shell. No user data.
* **Google Fonts:** cached (public, static).
* **Everything else is not touched by the service worker:** `https://api.garagepilot.co.in/*`,
  same-origin `/api/*`, auth, OTP, Razorpay checkout/verification, customers, vehicles, job cards,
  payments. These requests always go to the network.
* API `fetch` calls now use `cache: 'no-store'`, so the browser's HTTP disk cache keeps no copy of
  responses fetched with the user's token either.
* On logout (manual, token expiry, subscription expiry) any Cache Storage entry not owned by the
  GaragePilot service worker is deleted (`purgePrivateCaches`). This is a safety net. The token in
  localStorage was already cleared by the existing logout.

### Updates

`skipWaiting` + `clientsClaim`: a new deploy is downloaded and activated automatically (checked on
load, every hour, and whenever the app comes back to the foreground). Open screens are **not**
force-reloaded, so a half-filled job card is never lost. A slim "A new version of GaragePilot is
ready · Refresh" bar appears instead. The next launch always uses the new version.

## Nginx changes (site `garagepilot`, root `/var/www/garagepilot/frontend`)

The existing SPA `try_files` already serves the new files. What remains is making sure the service
worker and manifest are **never cached by the browser/CDN**, so updates propagate. Add these
`location` blocks inside the existing `server { listen 443 ssl; server_name garagepilot.co.in ...; }`
block, **above** the existing `location / { ... }`. Leave the `/api` block and everything else as it is.

```nginx
    # --- PWA -------------------------------------------------------------
    # Service worker: must always be revalidated or updates get stuck.
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Service-Worker-Allowed "/" always;
        try_files $uri =404;
    }

    # Web app manifest with the correct content type.
    location = /manifest.webmanifest {
        types { }
        default_type application/manifest+json;
        add_header Cache-Control "no-cache" always;
        try_files $uri =404;
    }

    # The HTML shell: always revalidate so a new deploy is seen at once.
    location = /index.html {
        add_header Cache-Control "no-cache" always;
    }

    # Hashed build files never change. Cache them for a year.
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }
    location ~ ^/workbox-[a-z0-9]+\.js$ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location /icons/ {
        add_header Cache-Control "public, max-age=604800" always;
        try_files $uri =404;
    }
    # ---------------------------------------------------------------------
```

Notes:

* `add_header` inside a `location` **replaces** any `add_header` lines inherited from the `server`
  block (e.g. HSTS / security headers). If the server block has such headers, copy them into
  each block above too.
* Keep the existing `location / { try_files $uri $uri/ /index.html; }` for SPA routing.
* HTTPS is already in place (Let's Encrypt). Service workers only run on HTTPS (or localhost).
* The API site `api.garagepilot.co.in` needs **no** change.

Apply:

```bash
sudo nano /etc/nginx/sites-available/garagepilot
sudo nginx -t && sudo systemctl reload nginx
```

## Production deployment

The same flow as before. Build `main` locally, upload `dist/`, swap the directories:

```bash
# local (Git Bash), in D:\GMS\Frontend\Frontend_GMS on main
npm ci
npm run build
tar -czf /tmp/gp-frontend.tgz -C dist .
scp -i ~/.ssh/garagepilot_vps /tmp/gp-frontend.tgz root@72.60.203.133:/tmp/
```

```bash
# server
TS=$(date +%Y%m%d%H%M%S)
tar -czf /root/garagepilot-frontend-backup-$TS.tgz -C /var/www/garagepilot frontend
rm -rf /var/www/garagepilot/frontend.new && mkdir /var/www/garagepilot/frontend.new
tar -xzf /tmp/gp-frontend.tgz -C /var/www/garagepilot/frontend.new
mv /var/www/garagepilot/frontend /var/www/garagepilot/frontend.old-$TS
mv /var/www/garagepilot/frontend.new /var/www/garagepilot/frontend
# verify
curl -sI https://garagepilot.co.in/sw.js | grep -i 'content-type\|cache-control'
curl -sI https://garagepilot.co.in/manifest.webmanifest | grep -i 'content-type'
curl -s  https://garagepilot.co.in/manifest.webmanifest
```

Rollback: swap `frontend.old-$TS` back. A browser that already installed the new service
worker gets the old build on its next update check, because the SW and HTML are `no-cache`.

## Manual test checklist (real devices)

1. Android Chrome → https://garagepilot.co.in/login → "Install GaragePilot App" card appears
   (Chrome only fires its install event after the page has had some interaction or engagement, so it can take a moment).
2. Install → icon on the home screen → opens full screen (no address bar).
3. Register with OTP, log in, renew/buy a plan with Razorpay, open dashboard and modules.
4. iPhone Safari → login → Install → instructions → Share → Add to Home Screen → open from icon.
   Note: on iOS the installed app has **its own storage**, so the user signs in once inside it.
5. Deploy a new build → reopen the app → "new version ready" bar, or the new build on the next launch.
6. DevTools → Application → Cache Storage: only `garagepilot-*` caches with static files and no `/api` URLs.
7. Uninstall (long-press icon → Uninstall) → reload site → install card is back.
