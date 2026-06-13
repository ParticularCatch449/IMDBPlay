(function () {
  "use strict";

  const SUGGESTION_API =
    "https://v3.sg.media-imdb.com/suggestion/x/{query}.json";
  const TT_ID_RE = /^tt\d+$/i;
  const DEBOUNCE_MS = 300;
  const MIN_QUERY_LEN = 2;

  const PLAY_ICON =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const statusEl = document.getElementById("status");
  const resultsEl = document.getElementById("results");
  const imdbSearchEl = document.getElementById("imdb-search");
  const imdbSearchLinkEl = document.getElementById("imdb-search-link");

  let debounceTimer = null;
  let activeRequest = null;
  let requestId = 0;

  function setStatus(message, variant) {
    if (!message) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.className = "status";
      return;
    }

    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.className = "status";
    if (variant) {
      statusEl.classList.add(`status--${variant}`);
    }
  }

  function setResultsExpanded(expanded) {
    input.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  function getTypeLabel(item) {
    const qid = (item.qid || "").toLowerCase();
    if (qid === "movie" || qid === "feature") {
      return "Movie";
    }
    if (qid === "tvseries" || qid === "tvminiseries" || qid === "tvspecial") {
      return "Series";
    }
    if (qid === "tvepisode" || qid === "tvseason") {
      return "Episode";
    }

    const qualifier = (item.q || "").trim();
    if (/series|mini series|special/i.test(qualifier)) {
      return "Series";
    }
    if (/episode/i.test(qualifier)) {
      return "Episode";
    }
    if (/feature|movie/i.test(qualifier)) {
      return "Movie";
    }
    if (qualifier) {
      return qualifier;
    }
    return "";
  }

  function parseSuggestions(data) {
    const items = Array.isArray(data?.d) ? data.d : [];
    return items
      .filter((item) => item?.id && TT_ID_RE.test(item.id))
      .map((item) => ({
        id: item.id,
        title: (item.l || "").trim() || item.id,
        year: item.y || null,
        type: getTypeLabel(item),
      }));
  }

  async function fetchSuggestions(query, signal) {
    const url = SUGGESTION_API.replace(
      "{query}",
      encodeURIComponent(query.trim())
    );

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Search failed (${response.status})`);
    }

    return parseSuggestions(await response.json());
  }

  function imdbFindUrl(query) {
    return `https://www.imdb.com/find/?q=${encodeURIComponent(query.trim())}`;
  }

  function showImdbSearchLink(query) {
    imdbSearchLinkEl.href = imdbFindUrl(query);
    imdbSearchEl.hidden = false;
  }

  function hideImdbSearchLink() {
    imdbSearchEl.hidden = true;
  }

  function clearResults() {
    resultsEl.replaceChildren();
    setResultsExpanded(false);
  }

  function renderResults(results) {
    clearResults();

    if (!results.length) {
      setStatus("No results found. Try a different search.", null);
      return;
    }

    setStatus(null);

    for (const result of results) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "result";
      button.setAttribute("role", "option");
      button.dataset.titleId = result.id;

      const metaParts = [];
      if (result.year) {
        metaParts.push(`<span>${result.year}</span>`);
      }
      if (result.type) {
        metaParts.push(`<span class="result__badge">${result.type}</span>`);
      }

      button.innerHTML = `
        <span class="result__play" aria-hidden="true">${PLAY_ICON}</span>
        <span class="result__body">
          <span class="result__title">${escapeHtml(result.title)}</span>
          ${
            metaParts.length
              ? `<span class="result__meta">${metaParts.join("")}</span>`
              : ""
          }
        </span>
      `;

      button.addEventListener("click", () => playTitle(result.id));
      resultsEl.appendChild(button);
    }

    setResultsExpanded(true);
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function playTitle(titleId) {
    const url = `https://www.imdb.com/title/${titleId}/?imdbplay=open`;
    chrome.tabs.create({ url });
    window.close();
  }

  async function runSearch(query, { showLoading = true } = {}) {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LEN) {
      activeRequest?.abort();
      clearResults();
      hideImdbSearchLink();
      setStatus(
        trimmed.length ? "Type at least 2 characters to search." : null
      );
      return;
    }

    const currentRequestId = ++requestId;
    activeRequest?.abort();
    const controller = new AbortController();
    activeRequest = controller;

    if (showLoading) {
      setStatus("Searching…", "loading");
      clearResults();
      hideImdbSearchLink();
    }

    try {
      const results = await fetchSuggestions(trimmed, controller.signal);
      if (currentRequestId !== requestId) {
        return;
      }
      renderResults(results);
      showImdbSearchLink(trimmed);
    } catch (error) {
      if (error.name === "AbortError" || currentRequestId !== requestId) {
        return;
      }
      clearResults();
      setStatus("Search failed. Check your connection and try again.", "error");
      showImdbSearchLink(trimmed);
    } finally {
      if (activeRequest === controller) {
        activeRequest = null;
      }
    }
  }

  function scheduleSearch(query) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runSearch(query, { showLoading: false });
    }, DEBOUNCE_MS);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(debounceTimer);
    runSearch(input.value, { showLoading: true });
  });

  input.addEventListener("input", () => {
    scheduleSearch(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      input.value = "";
      clearTimeout(debounceTimer);
      activeRequest?.abort();
      clearResults();
      hideImdbSearchLink();
      setStatus(null);
      input.focus();
    }
  });

  input.focus();
})();
