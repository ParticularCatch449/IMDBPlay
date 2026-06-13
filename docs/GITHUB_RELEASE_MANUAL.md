# Publish a GitHub Release manually (GitHub Desktop)

Use this guide when automated `gh` / `git push` is not set up on your machine. You need **`imdbplay-v1.5.18.zip`** in your project folder (run `./scripts/package.sh` if it is missing).

---

## Part A — Sync code to GitHub (GitHub Desktop)

1. Open **GitHub Desktop**.
2. In the left sidebar, select the **IMDBPlay** repository.  
   *(Screenshot: left panel shows “Current Repository: IMDBPlay” at the top.)*  
   If it is not listed: **File → Add Local Repository** → browse to your `IMDBPlay` folder → **Add repository**.
3. Look at the **Changes** tab:
   - If it says **“No local changes”** → click **Fetch origin**, then **Push origin** if anything is pending. Skip to **Part B** when synced.
   - If changed files are listed:
     1. Check the boxes for files you want to include (at minimum: `README.md`, `manifest.json`).
     2. Type in **Summary**: `docs: clarify install; release v1.5.18`
     3. Click **Commit to main**.
     4. Click **Push origin** in the top bar.  
        *(Screenshot: blue “Push origin” button with an upward arrow, top center.)*

You should see **“No local changes”** and the latest commit on GitHub.

---

## Part B — Create the release on github.com

1. Open a browser and go to:  
   **https://github.com/ParticularCatch449/IMDBPlay**
2. On the right under **About**, click **Releases** (or open **https://github.com/ParticularCatch449/IMDBPlay/releases** directly).  
   *(Screenshot: repo home page — “Releases” link in the right sidebar.)*
3. Click **Draft a new release** (green button, top right).  
   *(Screenshot: releases list with “Draft a new release” button.)*
4. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Choose a tag** | Type `v1.5.18` → select **Create new tag: v1.5.18 on publish** |
   | **Target** | `main` |
   | **Release title** | `v1.5.18` |
   | **Description** | Paste: |

   ```
   Download imdbplay-v1.5.18.zip, unzip, then Load unpacked in chrome://extensions.

   Direct download: https://github.com/ParticularCatch449/IMDBPlay/releases/download/v1.5.18/imdbplay-v1.5.18.zip
   ```

5. **Attach the zip:**
   - Scroll to **Attach binaries by dropping them here or selecting them**.
   - Click the dashed box (or drag and drop).  
     *(Screenshot: gray dashed upload area below the description field.)*
   - In the file picker, go to your **IMDBPlay** project folder.
   - Select **`imdbplay-v1.5.18.zip`** (about 47 KB).
   - Wait until the filename appears listed under the release form.
6. Click **Publish release** (green button, bottom).  
   *(Screenshot: green “Publish release” button at the bottom of the form.)*

---

## Part C — Verify

1. You should land on:  
   **https://github.com/ParticularCatch449/IMDBPlay/releases/tag/v1.5.18**
2. Under **Assets**, confirm **`imdbplay-v1.5.18.zip`** with a download link.
3. Test the direct link from the README:  
   **https://github.com/ParticularCatch449/IMDBPlay/releases/download/v1.5.18/imdbplay-v1.5.18.zip**

---

## If you do not have the zip yet

1. Open **Terminal** (Mac: Spotlight → type Terminal).
2. Run:
   ```bash
   cd "/path/to/your/IMDBPlay"
   ./scripts/package.sh
   ```
3. Confirm **`imdbplay-v1.5.18.zip`** appears in the IMDBPlay folder.
4. Continue with **Part B**, step 5.

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Cannot push in GitHub Desktop | **Repository → Repository Settings → Remote** — confirm URL is `https://github.com/ParticularCatch449/IMDBPlay.git`. Sign out and sign back into GitHub Desktop. |
| Tag `v1.5.18` already exists | Open the existing release → **Edit** → attach zip if missing → **Update release**. |
| Wrong zip uploaded | **Edit release** → remove wrong asset → upload `imdbplay-v1.5.18.zip` again. |
| Download link 404 | The release was not published or the zip was not attached — repeat **Part B**. |
