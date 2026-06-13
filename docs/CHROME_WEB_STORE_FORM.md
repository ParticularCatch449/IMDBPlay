# Chrome Web Store — permission & policy form copy

Copy-paste blocks for the **Privacy practices** tab when submitting IMDBPlay. Based on `manifest.json` v1.5.17.

For the full listing walkthrough (zip upload, screenshots, description), see [CHROME_WEB_STORE.md](CHROME_WEB_STORE.md).

---

## Single purpose description*

```
IMDBPlay adds one-click Play Now buttons and a toolbar search popup on IMDb, opens playback in an on-page lightbox via third-party embeds, and reduces ads on IMDb and player pages. It does not host or provide video files.
```

---

## declarativeNetRequest justification*

```
IMDBPlay uses declarativeNetRequest to apply bundled, static rules that block known ad, tracking, and popup URLs on IMDb pages and embedded player domains (playimdb.com and related hosts). Rules are shipped inside the extension package (rules/imdb-ads.json and rules/player-ads.json) and are not downloaded at runtime. This is required for the extension’s ad-reduction feature and keeps playback usable inside the lightbox overlay.
```

---

## tabs justification*

```
The tabs permission is used only when the user selects a title from the toolbar search popup. IMDBPlay opens that title’s IMDb page in a new tab with a query parameter that auto-opens the lightbox player, then closes the popup. No tabs are read, modified, or monitored otherwise.
```

---

## Host permission justification*

```
• imdb.com / www.imdb.com / m.imdb.com — Content scripts inject Play Now buttons, the lightbox player overlay, on-page ad cleanup, and SPA re-injection when IMDb client-side navigation changes the page. This is the only surface where the extension UI runs.

• playimdb.com — Primary third-party embed domain loaded inside the lightbox iframe for playback. Host access lets content scripts run the player ad guard and inject the bundled page-context guard script on trusted player pages only.

• streamimdb.ru — Alternate player/embed domain used by the same playback flow (declared in manifest and player-guard scripts). Same ad-blocking and guard behavior as playimdb.com.

• nextgencloudfabric.com — Additional embed/CDN host used by the player iframe chain during playback. Required so guard scripts and network rules apply when the player redirects or nests frames on this domain.

• v3.sg.media-imdb.com — Public IMDb title-suggestion API used by the toolbar popup search as the user types. The popup fetches suggestion JSON from this host only; no other IMDb API endpoints are called.

• https://*/* — Broad host access for player iframe embeds that may redirect across third-party streaming/CDN domains during playback. IMDBPlay does not inject UI on arbitrary sites; this scope covers nested iframe origins the player loads at runtime.
```

---

## Remote code

**Answer:** **Yes** — select **Yes** on the remote-code question.

IMDBPlay injects `player-guard-page.js` from a `chrome-extension://` URL (via `web_accessible_resources`) into the page context on trusted player domains. Chrome classifies this as remote code even though the script is bundled in the extension package and is never fetched from the internet.

### Justification* (remote code)

```
IMDBPlay injects one bundled script (player-guard-page.js) into the page context on trusted player embed domains (playimdb.com and related hosts listed in manifest.json). The script is included in the extension package, exposed only through web_accessible_resources to those player hosts, and loaded via chrome.runtime.getURL — it is not downloaded from any external server and is not updated remotely.

The injected script runs only inside the playback iframe to block intrusive popups/overlays, relay fullscreen events to the parent IMDb lightbox, and apply DOM-level ad cleanup that declarativeNetRequest cannot reach. Without page-context execution, player popunders and overlay ads would interrupt playback in the lightbox.
```

---

## Quick reference — declared permissions (manifest.json)

| Field | Value |
|-------|-------|
| `permissions` | `declarativeNetRequest`, `tabs` |
| `host_permissions` | `playimdb.com`, `streamimdb.ru`, `nextgencloudfabric.com`, `v3.sg.media-imdb.com`, `https://*/*` |
| Content script hosts (no separate host permission) | `imdb.com`, `m.imdb.com`, player domains above |
| `web_accessible_resources` | `player-guard-page.js` (player domains only) |
