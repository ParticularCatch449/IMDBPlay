# Chrome Web Store publishing guide

Step-by-step checklist for publishing IMDBPlay to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole).

## 1. Developer account

1. Sign in at the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time **$5 USD** registration fee
3. Complete identity verification if prompted

## 2. Prepare the upload zip

From the repo root:

```bash
./scripts/package.sh
```

Upload the generated `imdbplay-vX.X.X.zip`. The zip root must contain `manifest.json` (not a nested folder).

**Do not include:** `.git`, `_metadata`, `docs`, `scripts`, `*.zip`, or `icon-source.png` unless you want the larger asset in the store build.

## 3. Store listing

| Field | Suggested content |
|-------|-------------------|
| **Name** | IMDBPlay |
| **Summary** | Play IMDb titles in a lightbox with ad blocking |
| **Description** | Expand README feature list. State clearly: unofficial, not affiliated with IMDb/Amazon; **does not host or provide video files**; streams from third-party players (playimdb.com); user responsible for content watched |
| **Category** | Entertainment |
| **Language** | English |

### Graphics

- **Icon:** 128×128 PNG (`icons/icon128.png`)
- **Screenshots:** at least one 1280×800 or 640×400 image of the popup and lightbox
- **Small promo tile:** optional

### Links

| Field | Value |
|-------|-------|
| **Privacy policy** | GitHub URL to `PRIVACY.md` (e.g. `https://github.com/YOU/IMDBPlay/blob/main/PRIVACY.md`) |
| **Homepage** | Repository URL |
| **Support** | GitHub Issues URL |

## 4. Privacy practices (dashboard form)

- **Single purpose:** Add Play controls and ad reduction on IMDb pages
- **Data collection:** None transmitted to developer
- **Certify** uses match [PRIVACY.md](../PRIVACY.md)

## 5. Permissions justification

Prepare short explanations for review:

| Permission | Justification |
|------------|---------------|
| `tabs` | Opens the IMDb title page when user selects a popup search result |
| `declarativeNetRequest` | Blocks known ad/tracking URLs via bundled static rules |
| `host_permissions` (IMDb) | Injects Play UI and lightbox on IMDb |
| `host_permissions` (player domains) | Embeds third-party player and blocks player popups |
| `https://*/*` | Required for player iframe embeds across redirect targets |

## 6. Distribution

- **Visibility:** Public (or Unlisted for beta)
- **Regions:** All regions or your choice
- **Pricing:** Free

## 7. Review tips

- State clearly: **unofficial**, not affiliated with IMDb/Amazon
- **Does not host, store, or provide video files** — playback streams from third-party players (playimdb.com); users could navigate there manually; the extension adds Play Now UI and ad reduction
- Playback is via **third-party embeds** only; the developer does not operate any streaming service
- No remote analytics or user accounts
- Test the uploaded zip in a clean Chrome profile before submitting
- Rejections often cite broad host permissions — reference the player iframe requirement in your justification
- Updates: bump `version` in `manifest.json`, run `package.sh`, upload new zip

## 8. After approval

Add the store URL to `README.md` under **Chrome Web Store**.
