# Release process

How to publish a new IMDBPlay version on GitHub.

## 1. Bump version

Edit `manifest.json` and increment `version` (semver, e.g. `1.5.17` → `1.5.18`).

Update the version badge and install instructions in `README.md` if you keep them in sync manually.

## 2. Test locally

1. Load unpacked in `chrome://extensions`
2. Confirm the new version number
3. Smoke-test: popup search, title Play, card Play, lightbox, ad guard

## 3. Package

```bash
chmod +x scripts/package.sh   # first time only
./scripts/package.sh
```

Creates `imdbplay-v{version}.zip` in the repo root.

## 4. Git tag and GitHub Release

```bash
git add -A
git commit -m "Release v1.5.18"
git tag v1.5.18
git push origin main
git push origin v1.5.18
```

On GitHub: **Releases → Draft a new release**

- **Tag:** `v1.5.18` (match manifest)
- **Title:** `v1.5.18`
- **Description:** short changelog (features, fixes)
- **Attach:** `imdbplay-v1.5.18.zip`

## 5. What goes in the zip

Included by `package.sh`:

- `manifest.json`
- `*.js`, `*.css`, `*.html` at repo root
- `icons/icon16.png`, `icon48.png`, `icon128.png`
- `rules/*.json`

Excluded: `.git`, `docs`, `scripts`, `_metadata`, `README`, `LICENSE`, `PRIVACY.md`, source-only assets.

Users install from the **[Chrome Web Store](https://chromewebstore.google.com/detail/imdbplay/aifhjjpecbbeopjjhfaamikldjhobjmp)** (recommended) or by unzipping and **Load unpacked** for manual/sideload installs. Store updates use the same zip — see [CHROME_WEB_STORE.md](CHROME_WEB_STORE.md).
