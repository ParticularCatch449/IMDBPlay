# Chrome Web Store assets

Upload-ready images for the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). All PNGs are **24-bit RGB** (no alpha), sized to Google’s requirements.

**Published listing:** https://chromewebstore.google.com/detail/imdbplay/aifhjjpecbbeopjjhfaamikldjhobjmp

Regenerate anytime:

```bash
python3 scripts/generate-store-assets.py
```

Source screenshots live in `docs/screenshots/`. Promo tiles use `icons/icon128.png` and IMDb-style dark background `#121212`.

---

## Screenshots (Store listing → Screenshots)

Upload up to **5** images. Each is **1280×800** (also valid at 640×400 if you resize manually).

| File | Dimensions | Shows |
|------|------------|-------|
| `screenshot-1-title-page.png` | 1280×800 | IMDb title page with yellow **Play Now** button |
| `screenshot-2-homepage-carousel.png` | 1280×800 | IMDb homepage carousel with **Play** on posters |
| `screenshot-3-list-play-buttons.png` | 1280×800 | List/search results with inline **Play** buttons |
| `screenshot-4-popup-search.png` | 1280×800 | Toolbar extension popup — search IMDb titles |
| `screenshot-5-lightbox-player.png` | 1280×800 | In-page lightbox player overlay |

**Where in dashboard:** Store listing tab → **Screenshots** → upload one or more files above (order: title page first recommended).

---

## Promo tiles (optional but recommended)

| File | Dimensions | Upload field |
|------|------------|--------------|
| `promo-small-440x280.png` | 440×280 | Store listing → **Small promo tile** |
| `promo-marquee-1400x560.png` | 1400×560 | Store listing → **Marquee promo tile** |

The small tile is icon + **IMDBPlay** branding. The marquee combines branding with a cropped homepage screenshot and tagline *“Play movies & TV from IMDb”*.

---

## Extension icon (separate from this folder)

| File | Dimensions | Upload field |
|------|------------|--------------|
| `icons/icon128.png` | 128×128 | Store listing → **Icon** |

---

## Quick upload checklist

- [ ] Icon: `icons/icon128.png`
- [ ] Screenshots: at least one from `screenshot-*.png` (up to 5)
- [ ] Small promo: `promo-small-440x280.png` (optional)
- [ ] Marquee promo: `promo-marquee-1400x560.png` (optional)

See [CHROME_WEB_STORE.md](../CHROME_WEB_STORE.md) for the full publishing walkthrough.
