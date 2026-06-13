# Publish a GitHub Release manually (non-technical)

Use this guide if automated `gh` / git push is not set up on your machine. You need the file **`imdbplay-v1.5.17.zip`** in your project folder.

---

## Part A — Make sure your code is on GitHub (GitHub Desktop)

1. Open **GitHub Desktop**
2. In the left sidebar, select the **IMDBPlay** repository  
   (If it is not listed: **File → Add Local Repository** → browse to your `IMDBPlay` folder → **Add repository**)
3. Look at the top bar:
   - If it says **“Fetch origin”** or **“Pull origin”** with no changed files listed → your code is already synced. Skip to **Part B**.
   - If you see changed files under **Changes**:
     1. Type a short summary in **Summary**, e.g. `Release v1.5.17`
     2. Click **Commit to main**
     3. Click **Push origin** (top bar)

You should see **“No local changes”** and the latest commit on GitHub.

---

## Part B — Create the release on github.com

1. Open a browser and go to:  
   **https://github.com/ParticularCatch449/IMDBPlay**
2. Click the **Releases** link (right side of the page, under “About”, or use **https://github.com/ParticularCatch449/IMDBPlay/releases**)
3. Click **Draft a new release** (green button)
4. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Choose a tag** | Type `v1.5.17` → select **Create new tag: v1.5.17 on publish** |
   | **Target** | `main` |
   | **Release title** | `v1.5.17` |
   | **Description** | Paste: |

   ```
   Download imdbplay-v1.5.17.zip, unzip, Load unpacked in chrome://extensions.

   Or use the same zip for Chrome Web Store developer upload.
   ```

5. **Attach the zip:**
   - Scroll to **Attach binaries by dropping them here or selecting them**
   - Click the area (or drag and drop)
   - In the file picker, go to your **IMDBPlay** project folder
   - Select **`imdbplay-v1.5.17.zip`** (about 47 KB)
   - Wait until the filename appears under the release form
6. Click **Publish release** (green button)

---

## Part C — Verify

1. You should land on a page like:  
   **https://github.com/ParticularCatch449/IMDBPlay/releases/tag/v1.5.17**
2. Under **Assets**, you should see **`imdbplay-v1.5.17.zip`** with a download link
3. Share that Releases page URL with users — they click the zip to install

---

## If you do not have the zip yet

1. Open **Terminal** (Mac: Spotlight → type Terminal)
2. Run:
   ```bash
   cd "/path/to/your/IMDBPlay"
   ./scripts/package.sh
   ```
3. You should see **`imdbplay-v1.5.17.zip`** appear in the IMDBPlay folder
4. Continue with **Part B** step 5

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Cannot push in GitHub Desktop | **Repository → Repository Settings → Remote** — confirm URL is `https://github.com/ParticularCatch449/IMDBPlay.git`. Sign out and sign back into GitHub Desktop. |
| Tag `v1.5.17` already exists | Open existing release → **Edit** → attach zip if missing → **Update release** |
| Wrong zip uploaded | **Edit release** → remove wrong asset → upload `imdbplay-v1.5.17.zip` again |
