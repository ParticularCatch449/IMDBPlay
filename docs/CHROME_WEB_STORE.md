# Chrome Web Store — beginner's guide

**IMDBPlay is live on the Chrome Web Store:**

**https://chromewebstore.google.com/detail/imdbplay/aifhjjpecbbeopjjhfaamikldjhobjmp**

For everyday installs, share that link (also in [README.md](../README.md)). The steps below document the initial publish walkthrough and how to ship updates.

---

## What file to upload

**Use the same zip as GitHub Releases:** `imdbplay-v1.5.18.zip`

- This file lives in the project folder (repo root).
- If it is missing, open Terminal in the project folder and run: `./scripts/package.sh`
- **Do not** upload the green **Code → Download ZIP** from GitHub — that is the full source repo and is the wrong shape for the store.
- The correct zip has `manifest.json` at the **root** when you open it (not inside a subfolder).

---

## Step 1 — Register as a Chrome Web Store developer

1. Open [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the one-time **$5 USD** registration fee
4. Complete any identity verification Google asks for

---

## Step 2 — Create a new listing

1. In the dashboard, click **New item** (or **Add new item**)
2. When prompted to upload your extension, click **Choose file** (or drag and drop)
3. Select **`imdbplay-v1.5.18.zip`** from your computer  
   (Path example: `IMDBPlay/imdbplay-v1.5.18.zip`)
4. Wait for the upload to finish — Chrome will read `manifest.json` and show version **1.5.18**

---

## Step 3 — Store listing (what users see)

Fill in the **Store listing** tab:

| Field | What to enter |
|-------|---------------|
| **Language** | English |
| **Name** | IMDBPlay |
| **Summary** (132 chars max) | Play IMDb titles in a lightbox with ad blocking — unofficial fan extension |
| **Description** | Copy/adapt from [README.md](../README.md). Include: Play Now buttons on IMDb, toolbar search popup, lightbox player, ad reduction. **Clearly state:** unofficial, not affiliated with IMDb or Amazon; does not host video; streams from third-party players (playimdb.com); user is responsible for content watched. |
| **Category** | Entertainment |
| **Icon** | Upload `icons/icon128.png` (128×128 PNG) from the project folder |
| **Screenshots** | Upload at least one screenshot (1280×800 or 640×400). Use ready-made files in **`docs/store-assets/`** (`screenshot-1-title-page.png` through `screenshot-5-lightbox-player.png`). Regenerate with `python3 scripts/generate-store-assets.py` after updating `docs/screenshots/` |
| **Small promo tile** | Optional: `docs/store-assets/promo-small-440x280.png` (440×280) |
| **Marquee promo tile** | Optional: `docs/store-assets/promo-marquee-1400x560.png` (1400×560) |
| **Homepage URL** | `https://github.com/ParticularCatch449/IMDBPlay` |
| **Support URL** | `https://github.com/ParticularCatch449/IMDBPlay/issues` |

### Privacy policy URL

Paste this exact link:

```
https://github.com/ParticularCatch449/IMDBPlay/blob/main/PRIVACY.md
```

---

## Step 4 — Privacy practices tab

Answer the dashboard questions to match [PRIVACY.md](../PRIVACY.md):

- **Single purpose:** Add Play controls and ad reduction on IMDb pages
- **Data collection:** No personal data is collected or transmitted to the developer
- **Certify** that your answers match the privacy policy

---

## Step 5 — Permissions justification

Reviewers may ask why each permission is needed. Use these explanations:

| Permission | Justification |
|------------|---------------|
| **`tabs`** | Opens the correct IMDb title tab when the user picks a result from the toolbar search popup |
| **`declarativeNetRequest`** | Applies bundled static rules to block known ad and tracking URLs on IMDb and player pages |
| **IMDb hosts** (`imdb.com`, `m.imdb.com`) | Injects Play Now buttons, lightbox overlay, and on-page ad cleanup |
| **Player hosts** (`playimdb.com`, related embed domains) | Embeds third-party playback and blocks intrusive player popups |
| **`v3.sg.media-imdb.com`** | Public IMDb suggestion API used for popup title search as you type |
| **`https://*/*`** | Broad host access required for player iframe embeds that redirect across third-party domains |

---

## Step 6 — Single purpose description

Paste something like:

> IMDBPlay adds one-click **Play Now** buttons and a toolbar search popup on IMDb, opens playback in an on-page lightbox via third-party embeds, and reduces ads on IMDb and player pages. It does not host or provide video files.

---

## Step 7 — Unofficial / not affiliated disclaimer

Include prominently in the **Description** (and in any reviewer notes field):

> **IMDBPlay is an unofficial fan project.** It is **not** affiliated with, endorsed by, or connected to IMDb, Amazon, or any streaming service. The developer does not host, store, or provide video files. Playback streams from third-party players; users could open those sites manually — this extension only adds convenient UI and ad reduction.

---

## Step 8 — Distribution and submit

1. **Visibility:** Public (or Unlisted if you want a direct link only during beta)
2. **Regions:** All regions (or your choice)
3. **Pricing:** Free
4. Click **Submit for review**

Review often takes **several days** (sometimes longer). You will get email when it is approved or if Google needs changes.

---

## After approval

IMDBPlay is approved and public. Canonical listing URL:

```
https://chromewebstore.google.com/detail/imdbplay/aifhjjpecbbeopjjhfaamikldjhobjmp
```

Keep this link in [README.md](../README.md), Reddit post blurbs, and release notes so users can install with one click.

---

## Updating later

1. Bump `version` in `manifest.json`
2. Run `./scripts/package.sh` to create a new `imdbplay-vX.X.X.zip`
3. In the developer dashboard, open your item → **Package** → upload the new zip
4. Update the store description if needed → **Submit for review** again

---

## Quick checklist

- [ ] Developer account registered ($5 paid)
- [ ] Uploaded **`imdbplay-v1.5.18.zip`** (not the GitHub repo zip)
- [ ] Name, description, icon 128px, screenshots from `docs/store-assets/` added
- [ ] Privacy policy URL set to GitHub `PRIVACY.md`
- [ ] Single purpose + permissions justifications filled in
- [ ] Unofficial / not affiliated disclaimer in description
- [ ] Submitted for review
