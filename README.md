# Portfolio — Android Developer

Glassmorphic portfolio site with flashlight-reveal hero, liquid glass UI, scroll animations, and live Play Store data integration.

## Quick Start

1. Edit `data.json` with your details
2. Run `npm run build`
3. Open `index.html`

That's it. One file controls everything.

## Updating Content

Just edit `data.json` and rebuild:

```bash
npm run build
```

## Project Structure

```
├── index.html          # Minimal HTML shell
├── data.json           # YOUR DATA — edit this only
├── data.js             # Auto-generated from data.json
├── build.js            # Converts data.json → data.js
├── script.js           # Rendering + all interactions
├── styles.css          # Glass design system
├── package.json        # Build script
├── assets/
│   ├── placeholder-masked.jpg    # Hero base layer (600×800)
│   └── placeholder-unmasked.png  # Hero reveal layer (600×800)
└── worker/
    ├── worker.js       # Cloudflare Worker proxy
    ├── wrangler.toml   # Worker config
    ├── package.json    # Deploy deps
    └── deploy.sh       # One-command deploy
```

## Play Store Integration

Live app icons, ratings, download counts, and screenshots are fetched from the Google Play Store via a Cloudflare Worker proxy.

### Setup (one-time)

1. Deploy the Cloudflare Worker:

```bash
cd worker
bash deploy.sh
```

2. Paste your worker URL into `script.js` → `PLAY_STORE_WORKER` constant:

```js
const PLAY_STORE_WORKER = "https://your-worker.your-subdomain.workers.dev";
```

### Adding Play Store data to projects

Add `playStoreUrl` or `playStoreAppId` to any project in `data.json`:

```json
{
  "id": "ecommerce",
  "title": "E-Commerce App",
  "playStoreUrl": "https://play.google.com/store/apps/details?id=com.myapp.android",
  "playStoreAppId": "com.myapp.android"
}
```

- `playStoreUrl` — full Play Store URL (package ID is auto-extracted)
- `playStoreAppId` — package name directly (takes precedence)

Projects without Play Store data show the gradient glyph thumbnail as fallback.

### How it works

- Cards show the real app icon when fetched successfully
- Cards display star rating and download count below the description
- Detail modal shows a horizontal screenshots carousel, rating with review count, and download count
- Data is cached in `sessionStorage` for 1 hour (no re-fetch on same session)
- Falls back gracefully to gradient thumbnails if the worker is unreachable

## Tech Stack

- **Vanilla HTML/CSS/JS** — no framework, no build step
- **GSAP** — entrance animations, custom cursor, magnetic hover
- **Cloudflare Workers** — Play Store proxy (free tier)
- **Google Play Scraper API** — `play.rajkumaar.co.in` (free, no key)

## Design Features

- **Flashlight-reveal hero** — CSS `clip-path: circle()` with rAF lerp
- **Liquid glass UI** — `backdrop-filter: blur()` with glassmorphic borders
- **Scroll animations** — IntersectionObserver-triggered fade/slide
- **Custom cursor** — GSAP-powered dot + ring
- **Magnetic hover** — GSAP-powered button pull effect
- **Responsive** — 3-column desktop → stacked mobile
- **Dark theme** — `#060d09` base with `#3ddc84` accent

## Image Requirements

Hero images must be **identical dimensions** (recommended 600×800):

- `placeholder-masked.jpg` — base layer (shown by default)
- `placeholder-unmasked.png` — reveal layer (shown via spotlight)

Normalize with Pillow:

```bash
python3 -c "
from PIL import Image
img = Image.open('your-image.png')
img = img.resize((600, 800), Image.LANCZOS)
img.save('placeholder-unmasked.png')
img.save('placeholder-masked.jpg', quality=92)
"
```

## Browser Support

- Chrome 76+
- Firefox 103+
- Safari 15.4+
- Edge 79+

Requires `backdrop-filter` and CSS custom properties support.

## License

MIT
