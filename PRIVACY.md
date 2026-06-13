# Privacy Policy

**Last updated:** June 2026  
**Extension:** IMDBPlay

## Summary

IMDBPlay does not collect, store, or transmit personal data to any server operated by the extension author. There is no analytics, tracking, or account system.

**The extension author does not host, store, or provide video files.** Playback uses third-party embeds (for example playimdb.com). You could navigate to those players manually; IMDBPlay only automates opening them in a convenient UI on IMDb.

## Data the extension uses

### Local browser storage

On third-party player pages (for example `playimdb.com`), the extension may write timestamps to `localStorage` and `sessionStorage` on that page only. This is used to reduce intrusive player ads and popups. Data stays in your browser on that site and is not sent to the extension author.

### Network requests

The extension makes network requests only as needed to function:

| Request | Purpose |
|---------|---------|
| IMDb suggestion API (`v3.sg.media-imdb.com`) | Popup title search while you type |
| PlayIMDB / related player hosts | Embedded playback when you choose Play |
| Declarative network rules | Block known ad and tracking URLs on IMDb and player pages |

These requests go directly from your browser to those services. The extension author does not receive them.

### Permissions

- **`tabs`** — Open an IMDb title tab when you pick a search result from the popup.
- **`declarativeNetRequest`** — Apply bundled ad-blocking rules locally in the browser.
- **Host permissions** — Run content scripts and load the player iframe on IMDb and supported player domains.

## What we do not do

- No remote logging or crash reporting
- No sale or sharing of user data
- No collection of browsing history beyond what is required for on-page Play buttons and popup search

## Third-party services

Playback streams from third-party players (for example playimdb.com). Those sites have their own privacy practices and terms. IMDBPlay is not affiliated with IMDb, Amazon, or those player providers. You are responsible for the content you choose to watch.

## Contact

Open an issue on the project GitHub repository for privacy questions.
