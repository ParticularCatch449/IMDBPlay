# Reddit post — r/TVFlix

Tailored for **r/TVFlix** (author's own tools subreddit). More direct about functionality; still professional. Do not link to playimdb.com or specific stream URLs in public posts.

---

## Title

**IMDBPlay v1.5.18 — Play Now buttons on IMDb with an in-page lightbox player (Chrome / Edge / Brave)**

---

## Body (copy-paste ready)

Hey r/TVFlix — sharing the latest build of **IMDBPlay**, a Chrome extension I've been maintaining for one-click playback straight from IMDb.

If you browse IMDb for what to watch but hate opening new tabs or hunting for a player, this is for you.

### What it does

- **Play Now on title pages** — gold button on movie and TV show pages
- **Play Now on cards** — homepage carousels, search results, charts, and lists
- **Toolbar popup search** — find a title from the extension icon, jump to its IMDb page, and start playback
- **Lightbox player** — watch in an overlay on IMDb; fullscreen via the player controls; close with **X**, **Escape**, or a backdrop click
- **Ad guard** — network rules and DOM cleanup on IMDb, plus popup/overlay blocking on embedded player pages
- **SPA-aware** — buttons reinject when IMDb client-side navigation changes the page

Playback streams from **third-party embed players** — IMDBPlay does not host any video files.

### Install

Works in **Chrome**, **Brave**, and **Edge** (Manifest V3).

**Chrome Web Store (easiest):** https://chromewebstore.google.com/detail/imdbplay/aifhjjpecbbeopjjhfaamikldjhobjmp — click **Add to Chrome**. One click; no Developer mode.

**Manual / sideload** (about a minute, GitHub Release zip):

1. **Download** `imdbplay-v1.5.18.zip` from the latest GitHub Release:  
   **https://github.com/ParticularCatch449/IMDBPlay/releases**
2. **Unzip** to a folder. Open it and confirm **`manifest.json`** is at the top level of that folder — not buried in a parent or subfolder.
3. Open **`chrome://extensions`** (Edge: **`edge://extensions`**) and turn **Developer mode** ON.
4. Click **Load unpacked** and select the unzipped folder.
5. Confirm version **1.5.18** on the extension card, then hard-refresh any open IMDb tabs.

**Common mistakes:** selecting the `.zip` file instead of the unzipped folder, or picking a parent/subfolder that doesn't contain `manifest.json` at its root.

After manual installs: download the new zip, replace your folder, click **Reload** on the extension card, then hard-refresh IMDb tabs. Store installs update automatically.

### Links

- **Chrome Web Store:** https://chromewebstore.google.com/detail/imdbplay/aifhjjpecbbeopjjhfaamikldjhobjmp
- **Source, screenshots, privacy policy:** https://github.com/ParticularCatch449/IMDBPlay
- **Support development:** https://ko-fi.com/particularcatch

### Disclaimer

**IMDBPlay is an unofficial fan project** — not affiliated with IMDb, Amazon, or any streaming service. The extension does not host video; playback comes from third-party embeds. You are responsible for the content you watch and for complying with applicable laws in your region.

---

Feedback, bug reports, and feature ideas are welcome here or via GitHub Issues. Hope it saves you some tab-hopping.

---

## Shorter version (optional)

**IMDBPlay v1.5.18** adds **Play Now** buttons across IMDb (title pages, carousels, charts, search) plus a toolbar popup search. Click Play Now → watch in an on-page **lightbox** without leaving IMDb. Built-in ad guard on IMDb and player embeds.

**Install:** Chrome Web Store — https://chromewebstore.google.com/detail/imdbplay/aifhjjpecbbeopjjhfaamikldjhobjmp (easiest). Manual sideload: download `imdbplay-v1.5.18.zip` from https://github.com/ParticularCatch449/IMDBPlay/releases → unzip → `chrome://extensions` → Developer mode ON → **Load unpacked** → select the folder with `manifest.json` → hard-refresh IMDb tabs.

**Disclaimer:** unofficial; not affiliated with IMDb/Amazon; does not host video — streams from third-party embeds. You are responsible for what you watch.

**Store:** https://chromewebstore.google.com/detail/imdbplay/aifhjjpecbbeopjjhfaamikldjhobjmp · **GitHub:** https://github.com/ParticularCatch449/IMDBPlay · **Ko-fi:** https://ko-fi.com/particularcatch

Feedback welcome here or on GitHub Issues.
