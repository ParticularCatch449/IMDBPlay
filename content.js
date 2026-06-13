(function () {
  "use strict";

  const PLAY_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  const TRUSTED_PLAYER_HOST_RE =
    /(^|\.)((playimdb|streamimdb|nextgencloudfabric)\.(com|ru))$/i;

  function isTrustedPlayerOrigin(origin) {
    try {
      return TRUSTED_PLAYER_HOST_RE.test(new URL(origin).hostname);
    } catch {
      return false;
    }
  }

  const PLAY_NOW_LABEL = "Play Now";

  function getTitleId() {
    const match = location.pathname.match(/\/title\/(tt\d+)/i);
    return match ? match[1] : null;
  }

  function getButtonLabel() {
    return PLAY_NOW_LABEL;
  }

  function extractTitleId(href) {
    if (!href) {
      return null;
    }
    const match = href.match(/\/title\/(tt\d+)/i);
    return match ? match[1] : null;
  }

  function isTitleDetailPage() {
    return extractTitleId(location.pathname) !== null;
  }

  function isTrailerControl(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const tag = element.tagName;
    const role = element.getAttribute("role") || "";
    if (tag !== "BUTTON" && tag !== "A" && role !== "button") {
      return false;
    }

    const testId = element.getAttribute("data-testid") || "";
    if (/trailer/i.test(testId)) {
      return true;
    }

    const label = (element.textContent || "").trim();
    if (/^trailer$/i.test(label)) {
      return true;
    }

    const aria = element.getAttribute("aria-label") || "";
    return /trailer/i.test(aria);
  }

  function findTrailerButtons(root = document) {
    const matches = new Set();

    for (const candidate of root.querySelectorAll('button, a, [role="button"]')) {
      if (isTrailerControl(candidate)) {
        matches.add(candidate);
      }
    }

    return [...matches];
  }

  function collectUniqueTitleIds(container) {
    const titleIds = new Set();
    for (const link of container.querySelectorAll('a[href*="/title/tt"]')) {
      if (link.closest(".imdbplay-card-actions, .imdbplay-btn-wrap")) {
        continue;
      }
      const titleId = extractTitleId(link.getAttribute("href"));
      if (titleId) {
        titleIds.add(titleId);
      }
    }
    return titleIds;
  }

  const MAX_CARD_WALK_DEPTH = 10;
  const REJECTED_CARD_CONTAINER_RE =
    /ipc-page-grid|chart-layout|chart-row|chart-table|carousel|scroller|slider|overflow|ipc-overflow|titles?-carousel|rail|slider-refocus|subgrid|title-list__grid|ipc-page-content-section|ipc-page-section|find-results__list|ipc-metadata-list--compact-bottom/i;
  const REJECTED_LIST_CARD_CONTAINER_RE =
    /ipc-page-grid|carousel|scroller|slider|overflow|ipc-overflow|titles?-carousel|rail|slider-refocus|subgrid|title-list__grid|ipc-page-content-section|ipc-page-section|find-results__list|ipc-metadata-list--compact-bottom/i;

  function nodeClassBlob(node) {
    const className =
      typeof node.className === "string" ? node.className : "";
    const testId = node.getAttribute("data-testid") || "";
    return `${className} ${testId}`;
  }

  function isRejectedCardContainer(node, rejectionRe = REJECTED_CARD_CONTAINER_RE) {
    if (rejectionRe.test(nodeClassBlob(node))) {
      return true;
    }

    const titleLinks = node.querySelectorAll('a[href*="/title/tt"]').length;
    if (titleLinks > 2) {
      return true;
    }

    const rect = node.getBoundingClientRect();
    if (
      rect.width > 0 &&
      rect.width > window.innerWidth * 0.82 &&
      titleLinks > 1
    ) {
      return true;
    }

    return false;
  }

  function isPosterOnlyContainer(node) {
    const blob = nodeClassBlob(node);
    if (
      /ipc-poster-card|cli-poster|poster-card|poster-container|ipc-media--poster/i.test(
        blob
      ) &&
      !node.querySelector(
        '.ipc-metadata-list, [class*="title-metadata"], .ipc-title, .ipc-title__text, [data-testid*="title"]'
      )
    ) {
      return true;
    }

    if (/poster/i.test(blob) && !/card|slate|list-item|summary|metadata/i.test(blob)) {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 220) {
        return true;
      }
    }

    return false;
  }

  function looksLikeCardContainer(node) {
    if (isRejectedCardContainer(node) || isPosterOnlyContainer(node)) {
      return false;
    }

    const blob = nodeClassBlob(node);
    const cardPattern =
      /poster-card|title-card|cli-poster|ipc-poster|ipc-slate|list-item|search-result|metadata-list-summary|top.?10|watchlist-item|ipc-title/i;
    if (cardPattern.test(blob)) {
      return true;
    }

    const hasPoster = !!node.querySelector(
      'img[src*="media-amazon"], img[src*="imdb"], [class*="poster"]'
    );
    const hasTitleLink = !!node.querySelector('a[href*="/title/tt"]');
    if (!hasPoster || !hasTitleLink) {
      return false;
    }

    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.width <= window.innerWidth * 0.82;
  }

  function hasOffPosterTitleLink(node) {
    for (const link of node.querySelectorAll('a[href*="/title/tt"]')) {
      if (!isTitleLinkOnPoster(link)) {
        return true;
      }
    }
    return false;
  }

  function looksLikeSmallPosterCardContainer(node) {
    const blob = nodeClassBlob(node);
    if (!/ipc-poster-card|cli-poster|poster-card|ipc-poster/i.test(blob)) {
      return false;
    }

    const titleBelow = node.querySelector(
      '.ipc-title, .ipc-title__text, [data-testid*="title"]'
    );
    if (titleBelow && !isPosterAreaElement(titleBelow)) {
      return true;
    }

    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.width <= 220;
  }

  function looksLikeListCardContainer(node) {
    if (isRejectedCardContainer(node, REJECTED_LIST_CARD_CONTAINER_RE)) {
      return false;
    }

    if (looksLikeSmallPosterCardContainer(node)) {
      return true;
    }

    const blob = nodeClassBlob(node);
    const cardPattern =
      /chart|poster-card|title-card|cli-poster|ipc-poster|ipc-slate|list-item|search-result|metadata-list-summary|top.?10|watchlist-item|ipc-title|interest|tenup/i;
    if (cardPattern.test(blob)) {
      return true;
    }

    const hasPoster = !!node.querySelector(
      'img[src*="media-amazon"], img[src*="imdb"], [class*="poster"]'
    );
    const hasTitleLink = !!node.querySelector('a[href*="/title/tt"]');
    if (!hasTitleLink) {
      return false;
    }

    if (hasOffPosterTitleLink(node)) {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.width <= window.innerWidth * 0.82;
    }

    if (hasPoster) {
      const titleText = node.querySelector(
        '.ipc-title, .ipc-title__text, [data-testid*="title"]'
      );
      if (titleText && !isPosterAreaElement(titleText)) {
        return true;
      }
    }

    return false;
  }

  function isCardAlreadyInjected(cardRoot) {
    return (
      cardRoot.getAttribute("data-imdbplay-injected") === "1" ||
      !!cardRoot.querySelector(".imdbplay-card-actions")
    );
  }

  function markCardInjected(cardRoot) {
    cardRoot.setAttribute("data-imdbplay-injected", "1");
  }

  function isInsideAnchor(element) {
    return element instanceof Element && !!element.closest("a");
  }

  function isTenUpCard(cardRoot) {
    if (!(cardRoot instanceof Element)) {
      return false;
    }
    return (
      cardRoot.matches('[data-testid^="tenup_item"]') ||
      !!cardRoot.closest('[data-testid^="tenup_item"]') ||
      !!cardRoot.querySelector('[data-testid="tenup_title_metadata"]')
    );
  }

  function isRecentlyViewedPosterCard(cardRoot) {
    if (!(cardRoot instanceof Element) || !cardRoot.matches(".ipc-poster-card")) {
      return false;
    }
    return (
      cardRoot.classList.contains("rvi-shoveler__item") ||
      !!cardRoot.closest(
        '[class*="rvi-shoveler"], [class*="recently-viewed"], [data-testid*="rvi"]'
      )
    );
  }

  function isTitleRowElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    return !!(
      element.matches(
        '.ipc-title, .ipc-title__text, a.ipc-poster-card__title, h3, h4, [data-testid*="title"]'
      ) || element.closest(".ipc-title, .ipc-title__text")
    );
  }

  function isPosterAreaElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    if (isTitleRowElement(element)) {
      return false;
    }
    if (element.closest('a[href*="/title/tt"]')?.querySelector("img")) {
      return true;
    }
    return !!element.closest(
      [
        ".ipc-media--poster",
        ".ipc-media",
        ".ipc-poster",
        '[class*="cli-poster"]',
        '[class*="poster-container"]',
      ].join(", ")
    );
  }

  function isTitleLinkOnPoster(titleLink) {
    if (!(titleLink instanceof HTMLAnchorElement)) {
      return false;
    }
    if (isTitleRowElement(titleLink)) {
      return false;
    }
    if (isPosterAreaElement(titleLink)) {
      return true;
    }
    return !!titleLink.querySelector("img");
  }

  function cardHasTrailerButton(cardRoot) {
    return findTrailerButtons(cardRoot).length > 0;
  }

  function isChartContext(root = document) {
    return (
      /\/(chart|interest|search|find)\//i.test(location.pathname) ||
      !!root.querySelector(
        '[class*="chart"], [data-testid*="chart"], [class*="top-10"], [data-testid*="top-10"]'
      )
    );
  }

  function isHomepageListContext(root = document) {
    if (!/^\/$/.test(location.pathname)) {
      return false;
    }
    return !!root.querySelector(
      [
        '[class*="top-10"]',
        '[data-testid*="top-10"]',
        '[class*="in-theater"]',
        '[data-testid*="in-theater"]',
        '[class*="opening-this-week"]',
        '[data-testid*="opening"]',
        '[data-testid^="tenup_item"]',
        '[data-testid*="tenup"]',
        ".ipc-metadata-list-summary-item",
      ].join(", ")
    );
  }

  function findSectionsByHeading(root, pattern) {
    const containers = [];
    const seen = new Set();
    const headingSelectors = [
      "h1",
      "h2",
      "h3",
      "h4",
      "hgroup",
      '[class*="section-heading"]',
      '[class*="title--section"]',
      ".ipc-title--section",
    ].join(", ");

    for (const heading of root.querySelectorAll(headingSelectors)) {
      if (!pattern.test(heading.textContent || "")) {
        continue;
      }

      const section =
        heading.closest(
          [
            ".ipc-page-content-section",
            ".ipc-page-section",
            '[class*="page-section"]',
            '[data-testid*="section"]',
            "section",
            "li",
          ].join(", ")
        ) || heading.parentElement?.parentElement;
      if (section && !seen.has(section)) {
        seen.add(section);
        containers.push(section);
      }
    }

    return containers;
  }

  function getRecentlyViewedContainers(root = document) {
    return findSectionsByHeading(root, /recently\s+viewed/i);
  }

  function isPosterOnlyCard(cardRoot) {
    if (!(cardRoot instanceof Element)) {
      return false;
    }
    if (cardHasTrailerButton(cardRoot)) {
      return false;
    }
    if (findMarkAsWatchedRow(cardRoot)) {
      return false;
    }

    const hasPoster = !!cardRoot.querySelector(
      'img[src*="media-amazon"], img[src*="imdb"], .ipc-media img, [class*="poster"] img'
    );
    const hasTitleLink = !!cardRoot.querySelector('a[href*="/title/tt"]');
    if (!hasPoster || !hasTitleLink) {
      return false;
    }

    if (isLargeFeaturedCard(cardRoot)) {
      return false;
    }

    return true;
  }

  function getPosterOnlyCarouselContainers(root = document) {
    const containers = [];
    const seen = new Set();
    const carouselSelectors = [
      '[class*="carousel"]',
      '[class*="scroller"]',
      '[class*="slider"]',
      '[data-testid*="carousel"]',
      ".ipc-overflow",
    ].join(", ");

    for (const carousel of root.querySelectorAll(carouselSelectors)) {
      if (seen.has(carousel)) {
        continue;
      }

      const cards = carousel.querySelectorAll(
        '.ipc-poster-card, [class*="poster-card"], .cli-poster'
      );
      if (cards.length < 2) {
        continue;
      }

      let posterOnlyCount = 0;
      for (const card of cards) {
        if (isPosterOnlyCard(card)) {
          posterOnlyCount += 1;
        }
      }

      if (posterOnlyCount >= Math.min(2, cards.length)) {
        seen.add(carousel);
        containers.push(carousel);
      }
    }

    return containers;
  }

  function isListCardInjectionContext(root = document) {
    return (
      isChartContext(root) ||
      isHomepageListContext(root) ||
      getRecentlyViewedContainers(root).length > 0 ||
      getPosterOnlyCarouselContainers(root).length > 0
    );
  }

  function isSearchContext() {
    return /\/(find|search)\//i.test(location.pathname);
  }

  function findCardContainer(anchorElement, options = {}) {
    const { mode = "default" } = options;
    const anchorTitleId =
      anchorElement instanceof HTMLAnchorElement
        ? extractTitleId(anchorElement.getAttribute("href"))
        : null;
    let node = anchorElement.parentElement;
    let depth = 0;

    while (node && node !== document.body && depth < MAX_CARD_WALK_DEPTH) {
      if (!node.contains(anchorElement)) {
        node = node.parentElement;
        depth += 1;
        continue;
      }

      const titleIds = collectUniqueTitleIds(node);
      if (
        titleIds.size === 1 &&
        (!anchorTitleId || titleIds.has(anchorTitleId))
      ) {
        const titleId = [...titleIds][0];
        const titleLink =
          node.querySelector(`a[href*="/title/${titleId}"]`) ||
          anchorElement;

        if (mode === "trailer") {
          return { root: node, titleId, titleLink };
        }

        const looksLikeCard =
          mode === "list"
            ? looksLikeListCardContainer(node)
            : looksLikeCardContainer(node);
        if (looksLikeCard) {
          return { root: node, titleId, titleLink };
        }
      }

      node = node.parentElement;
      depth += 1;
    }

    return null;
  }

  function findCardFromTrailer(trailerBtn) {
    return findCardContainer(trailerBtn, { mode: "trailer" });
  }

  function findCardFromTitleLink(titleLink) {
    return findCardContainer(titleLink, { mode: "list" });
  }

  function createCardPlayButton(titleId, lightbox) {
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "imdbplay-btn imdbplay-card-btn";
    playButton.dataset.titleId = titleId;
    playButton.innerHTML = `<span class="imdbplay-btn__icon">${PLAY_ICON}</span><span class="imdbplay-btn__label">${PLAY_NOW_LABEL}</span>`;
    playButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      lightbox.open(getPlayUrl(titleId));
    });
    return playButton;
  }

  function createCardActionsWrap(playButton, compact, block) {
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "imdbplay-card-actions";
    if (compact) {
      actionsWrap.classList.add("imdbplay-card-actions--compact");
      playButton.classList.add("imdbplay-card-btn--compact");
    } else if (block) {
      actionsWrap.classList.add("imdbplay-card-actions--block");
    }
    actionsWrap.appendChild(playButton);
    return actionsWrap;
  }

  function findSynopsisOrDescription(cardRoot) {
    return cardRoot.querySelector(
      [
        ".ipc-html-content-inner",
        '[class*="synopsis"]',
        '[class*="plot"]',
        '[class*="description"]',
        ".cli-list-item-card__summary",
        '[data-testid*="plot"]',
      ].join(", ")
    );
  }

  function isLargeFeaturedCard(cardRoot) {
    if (findMarkAsWatchedRow(cardRoot)) {
      return true;
    }
    if (findMetadataBlock(cardRoot)) {
      return true;
    }
    const synopsis = findSynopsisOrDescription(cardRoot);
    return !!(synopsis && (synopsis.textContent || "").trim().length > 20);
  }

  function isSmallPosterCard(cardRoot) {
    if (isLargeFeaturedCard(cardRoot)) {
      return false;
    }

    const blob = nodeClassBlob(cardRoot);
    if (/ipc-poster-card|cli-poster|poster-card/i.test(blob)) {
      return true;
    }

    const rect = cardRoot.getBoundingClientRect();
    if (rect.width > 0 && rect.width <= 220) {
      const titleBelow = cardRoot.querySelector(
        '.ipc-title, .ipc-title__text, [data-testid*="title"]'
      );
      if (titleBelow && !isPosterAreaElement(titleBelow)) {
        return true;
      }
    }

    return false;
  }

  function isCompactCardLayout(cardRoot) {
    if (isLargeFeaturedCard(cardRoot)) {
      return false;
    }

    if (isPosterOnlyCard(cardRoot)) {
      return true;
    }

    if (isSmallPosterCard(cardRoot)) {
      return true;
    }

    const blob = nodeClassBlob(cardRoot);
    if (
      /list-item|compact|metadata-list-summary|find-result|search-result/i.test(
        blob
      )
    ) {
      return true;
    }
    if (
      cardRoot.closest(
        '.find-result, .ipc-metadata-list-summary-item, [data-testid*="find-result"]'
      )
    ) {
      return true;
    }
    if (isSearchContext() || /\/(search|find)\//i.test(location.pathname)) {
      return true;
    }

    const rect = cardRoot.getBoundingClientRect();
    return rect.width > 0 && rect.width < 200;
  }

  function isBlockCardLayout(cardRoot) {
    if (isCompactCardLayout(cardRoot)) {
      return false;
    }
    if (isLargeFeaturedCard(cardRoot)) {
      return true;
    }
    const blob = nodeClassBlob(cardRoot);
    return /metadata-list|list-item/i.test(blob);
  }

  function findMarkAsWatchedRow(cardRoot) {
    for (const el of cardRoot.querySelectorAll(
      'button, a, [role="button"]'
    )) {
      const text = `${el.textContent || ""} ${el.getAttribute("aria-label") || ""}`;
      if (!/mark\s+as\s+watched/i.test(text)) {
        continue;
      }

      let row = el;
      for (
        let depth = 0;
        depth < 4 && row.parentElement && row.parentElement !== cardRoot;
        depth += 1
      ) {
        row = row.parentElement;
      }
      return row;
    }
    return null;
  }

  function findMetadataBlock(cardRoot) {
    return cardRoot.querySelector(
      [
        ".ipc-metadata-list",
        ".cli-title-metadata",
        '[class*="title-metadata"]',
        '[data-testid*="metadata"]',
        ".ipc-metadata-list-summary-item__c",
      ].join(", ")
    );
  }

  function findTitleTextRow(cardRoot, titleLink) {
    let row = titleLink;
    for (
      let depth = 0;
      depth < 4 && row.parentElement && row.parentElement !== cardRoot;
      depth += 1
    ) {
      row = row.parentElement;
    }
    return row;
  }

  function isChartOrInterestCard(cardRoot) {
    if (/\/(chart|interest)\//i.test(location.pathname)) {
      return true;
    }
    if (
      cardRoot.closest(
        '[class*="chart"], [data-testid*="chart"], [class*="interest"], [data-testid^="tenup_item"]'
      )
    ) {
      return true;
    }
    const blob = nodeClassBlob(cardRoot);
    return /chart|interest|metadata-list-summary|tenup/i.test(blob);
  }

  function findTitleElementBelowPoster(cardRoot, titleLink) {
    for (const el of cardRoot.querySelectorAll(".ipc-title")) {
      if (el.closest(".imdbplay-card-actions")) {
        continue;
      }
      if (isSafeCardActionsAnchor(el, cardRoot)) {
        return el;
      }
    }

    for (const el of cardRoot.querySelectorAll(
      "a.ipc-poster-card__title, .ipc-title__text, h3, h4"
    )) {
      if (el.closest(".imdbplay-card-actions")) {
        continue;
      }
      if (isSafeCardActionsAnchor(el, cardRoot)) {
        return el;
      }
    }

    if (
      titleLink &&
      cardRoot.contains(titleLink) &&
      !isTitleLinkOnPoster(titleLink)
    ) {
      const titleRow = findTitleTextRow(cardRoot, titleLink);
      if (titleRow && isSafeCardActionsAnchor(titleRow, cardRoot)) {
        return titleRow;
      }
    }

    return null;
  }

  function insertAdjacentNotInAnchor(element, toInsert, position = "afterend") {
    if (!(element instanceof Element) || !(toInsert instanceof Element)) {
      return false;
    }

    let target = element;
    if (isInsideAnchor(target)) {
      const titleDiv = target.closest(".ipc-title");
      if (titleDiv) {
        target = titleDiv;
      } else {
        const anchor = target.closest("a");
        if (anchor) {
          target = anchor;
        }
      }
    }

    target.insertAdjacentElement(position, toInsert);
    return !isInsideAnchor(toInsert);
  }

  function insertTitleRowCardActions(cardRoot, actionsWrap, titleLink) {
    const titleEl = findTitleElementBelowPoster(cardRoot, titleLink);
    if (titleEl) {
      return insertAdjacentNotInAnchor(titleEl, actionsWrap, "afterend");
    }

    return false;
  }

  function findInlineWatchedButton(cardRoot) {
    return cardRoot.querySelector('[data-testid^="inline-watched-button"]');
  }

  function insertTenUpCardActions(cardRoot, actionsWrap) {
    const watchedBtn = findInlineWatchedButton(cardRoot);
    if (
      watchedBtn?.parentElement &&
      !isInsideAnchor(watchedBtn.parentElement)
    ) {
      watchedBtn.parentElement.insertBefore(actionsWrap, watchedBtn);
      return !isInsideAnchor(actionsWrap);
    }

    const watchedRow = findMarkAsWatchedRow(cardRoot);
    if (
      watchedRow?.parentElement &&
      !isInsideAnchor(watchedRow.parentElement)
    ) {
      watchedRow.parentElement.insertBefore(actionsWrap, watchedRow);
      return !isInsideAnchor(actionsWrap);
    }

    const metadata = cardRoot.querySelector('[data-testid="tenup_title_metadata"]');
    const titleDiv =
      metadata?.querySelector(".ipc-title") ||
      cardRoot.querySelector(".ipc-title");
    if (titleDiv) {
      return insertAdjacentNotInAnchor(titleDiv, actionsWrap, "afterend");
    }

    if (!metadata) {
      const poster = cardRoot.querySelector(".ipc-poster, .ipc-media--poster");
      if (poster) {
        return insertAdjacentNotInAnchor(poster, actionsWrap, "afterend");
      }
    }

    return false;
  }

  function insertRviCardActions(cardRoot, actionsWrap) {
    const titleLink = cardRoot.querySelector("a.ipc-poster-card__title");
    if (titleLink && cardRoot.contains(titleLink)) {
      return insertAdjacentNotInAnchor(titleLink, actionsWrap, "afterend");
    }
    return false;
  }

  function isSafeCardActionsAnchor(element, cardRoot) {
    if (!(element instanceof Element) || !cardRoot.contains(element)) {
      return false;
    }
    if (isInsideAnchor(element)) {
      return false;
    }
    if (isPosterAreaElement(element)) {
      return false;
    }
    if (element === cardRoot && cardRoot.firstElementChild) {
      if (isPosterAreaElement(cardRoot.firstElementChild)) {
        return false;
      }
    }
    return true;
  }

  function isPrimaryImdbActionControl(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const tag = element.tagName;
    const role = element.getAttribute("role") || "";
    if (tag !== "BUTTON" && tag !== "A" && role !== "button") {
      return false;
    }

    const testId = element.getAttribute("data-testid") || "";
    const label = (element.textContent || "").trim();
    const aria = element.getAttribute("aria-label") || "";
    const blob = `${testId} ${label} ${aria}`;
    return /watch\s*now|show\s*time/i.test(blob);
  }

  function hasPrimaryImdbAction(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    if (isPrimaryImdbActionControl(element)) {
      return true;
    }
    for (const control of element.querySelectorAll('button, a, [role="button"]')) {
      if (isPrimaryImdbActionControl(control)) {
        return true;
      }
    }
    return false;
  }

  function siblingHasPrimaryImdbAction(parent, exclude) {
    if (!(parent instanceof Element)) {
      return false;
    }
    for (const child of parent.children) {
      if (child === exclude) {
        continue;
      }
      if (hasPrimaryImdbAction(child)) {
        return true;
      }
    }
    return false;
  }

  function findTrailerActionsAnchor(trailerBtn, cardRoot) {
    if (!(trailerBtn instanceof Element) || !cardRoot.contains(trailerBtn)) {
      return null;
    }

    const trailerParent = trailerBtn.parentElement;
    if (
      trailerParent &&
      siblingHasPrimaryImdbAction(trailerParent, trailerBtn)
    ) {
      return { parent: trailerParent, before: trailerBtn };
    }

    let trailerRow = trailerBtn.parentElement;
    while (
      trailerRow &&
      trailerRow.parentElement &&
      trailerRow.parentElement !== cardRoot
    ) {
      if (hasPrimaryImdbAction(trailerRow)) {
        if (trailerParent) {
          return { parent: trailerParent, before: trailerBtn };
        }
        break;
      }

      const rowParent = trailerRow.parentElement;
      if (siblingHasPrimaryImdbAction(rowParent, trailerRow)) {
        return { parent: rowParent, before: trailerRow };
      }

      trailerRow = rowParent;
    }

    if (trailerRow?.parentElement) {
      return { parent: trailerRow.parentElement, before: trailerRow };
    }

    if (trailerBtn.parentElement) {
      return { parent: trailerBtn.parentElement, before: trailerBtn };
    }

    return null;
  }

  function insertCardActions(cardRoot, actionsWrap, trailerBtn, titleLink) {
    if (trailerBtn && cardRoot.contains(trailerBtn)) {
      const anchor = findTrailerActionsAnchor(trailerBtn, cardRoot);
      if (anchor && !isInsideAnchor(anchor.parent)) {
        anchor.parent.insertBefore(actionsWrap, anchor.before);
        if (!isInsideAnchor(actionsWrap)) {
          return true;
        }
        actionsWrap.remove();
      }
    }

    if (isTenUpCard(cardRoot)) {
      if (insertTenUpCardActions(cardRoot, actionsWrap)) {
        return true;
      }
    }

    if (isRecentlyViewedPosterCard(cardRoot)) {
      if (insertRviCardActions(cardRoot, actionsWrap)) {
        return true;
      }
    }

    if (isChartOrInterestCard(cardRoot) || isPosterOnlyCard(cardRoot)) {
      if (insertTitleRowCardActions(cardRoot, actionsWrap, titleLink)) {
        return true;
      }
    }

    const watchedRow = findMarkAsWatchedRow(cardRoot);
    if (
      watchedRow &&
      watchedRow.parentElement &&
      isSafeCardActionsAnchor(watchedRow.parentElement, cardRoot)
    ) {
      watchedRow.parentElement.insertBefore(actionsWrap, watchedRow);
      if (!isInsideAnchor(actionsWrap)) {
        return true;
      }
      actionsWrap.remove();
    }

    const metadataBlock = findMetadataBlock(cardRoot);
    if (metadataBlock && isSafeCardActionsAnchor(metadataBlock, cardRoot)) {
      if (insertAdjacentNotInAnchor(metadataBlock, actionsWrap, "afterend")) {
        return true;
      }
    }

    const titleTextRow = cardRoot.querySelector(".ipc-title");
    if (titleTextRow && isSafeCardActionsAnchor(titleTextRow, cardRoot)) {
      if (insertAdjacentNotInAnchor(titleTextRow, actionsWrap, "afterend")) {
        return true;
      }
    }

    if (titleLink && cardRoot.contains(titleLink) && !isTitleLinkOnPoster(titleLink)) {
      if (titleLink.matches("a.ipc-poster-card__title")) {
        if (insertAdjacentNotInAnchor(titleLink, actionsWrap, "afterend")) {
          return true;
        }
      }

      const titleRow = findTitleTextRow(cardRoot, titleLink);
      if (
        titleRow &&
        titleRow.parentElement &&
        isSafeCardActionsAnchor(titleRow, cardRoot)
      ) {
        if (insertAdjacentNotInAnchor(titleRow, actionsWrap, "afterend")) {
          return true;
        }
      }
    }

    return false;
  }

  function maintainCardPlayButton(button, card, trailerBtn) {
    button.dataset.titleId = card.titleId;
    const actionsWrap = button.closest(".imdbplay-card-actions");
    if (actionsWrap && isInsideAnchor(actionsWrap)) {
      actionsWrap.remove();
      insertCardActions(card.root, actionsWrap, trailerBtn, card.titleLink);
    }
  }

  function injectPlayButtonIntoCard(card, lightbox, trailerBtn) {
    if (isCardAlreadyInjected(card.root)) {
      const existingButton = card.root.querySelector(".imdbplay-card-btn");
      if (existingButton) {
        maintainCardPlayButton(existingButton, card, trailerBtn);
      }
      return false;
    }

    const playButton = createCardPlayButton(card.titleId, lightbox);

    const tenUp = isTenUpCard(card.root);
    const compact = tenUp ? false : isCompactCardLayout(card.root);
    const actionsWrap = createCardActionsWrap(
      playButton,
      compact,
      tenUp || (!compact && isBlockCardLayout(card.root))
    );
    const inserted = insertCardActions(
      card.root,
      actionsWrap,
      trailerBtn,
      card.titleLink
    );
    if (!inserted) {
      return false;
    }

    markCardInjected(card.root);
    return true;
  }

  function getChartContainers(root = document) {
    if (/\/(chart|interest|search|find)\//i.test(location.pathname)) {
      return [root];
    }

    const containers = [];
    const selectors = [
      '[class*="chart"]',
      '[data-testid*="chart"]',
      '[class*="top-10"]',
      '[data-testid*="top-10"]',
      '[class*="in-theater"]',
      '[data-testid*="in-theater"]',
      '[class*="opening-this-week"]',
      '[data-testid*="opening"]',
      '[data-testid^="tenup_item"]',
      '[data-testid*="tenup"]',
      ".ipc-metadata-list-summary-item",
    ].join(", ");

    for (const el of root.querySelectorAll(selectors)) {
      containers.push(el);
    }

    containers.push(...getRecentlyViewedContainers(root));
    containers.push(...getPosterOnlyCarouselContainers(root));

    return containers;
  }

  function collectPosterOnlyCardRoots(root = document) {
    const seenRoots = new Set();
    const cards = [];
    const selectors = '.ipc-poster-card, [class*="poster-card"], .cli-poster';

    for (const cardRoot of root.querySelectorAll(selectors)) {
      if (
        seenRoots.has(cardRoot) ||
        !isPosterOnlyCard(cardRoot) ||
        collectUniqueTitleIds(cardRoot).size !== 1
      ) {
        continue;
      }
      seenRoots.add(cardRoot);
      cards.push(cardRoot);
    }

    return cards;
  }

  function collectChartCardRoots(root = document) {
    const seenRoots = new Set();
    const cards = [];

    for (const container of getChartContainers(root)) {
      for (const titleLink of container.querySelectorAll('a[href*="/title/tt"]')) {
        if (titleLink.closest(".imdbplay-card-actions, .imdbplay-btn-wrap")) {
          continue;
        }

        const onPoster = isTitleLinkOnPoster(titleLink);
        const card = findCardFromTitleLink(titleLink);
        if (!card || seenRoots.has(card.root)) {
          continue;
        }

        if (
          onPoster &&
          !isSmallPosterCard(card.root) &&
          !isPosterOnlyCard(card.root)
        ) {
          continue;
        }

        seenRoots.add(card.root);
        cards.push(card.root);
      }
    }

    for (const cardRoot of collectPosterOnlyCardRoots(root)) {
      if (!seenRoots.has(cardRoot)) {
        seenRoots.add(cardRoot);
        cards.push(cardRoot);
      }
    }

    return cards;
  }

  function cardFromRoot(cardRoot) {
    const titleLink = cardRoot.querySelector('a[href*="/title/tt"]');
    if (!titleLink) {
      return null;
    }
    const titleId = extractTitleId(titleLink.getAttribute("href"));
    if (!titleId) {
      return null;
    }
    return { root: cardRoot, titleId, titleLink };
  }

  function isTenUpInjectionContext() {
    return (
      /^\/$/.test(location.pathname) || /\/interest\//i.test(location.pathname)
    );
  }

  function injectTenUpCards(lightbox, root = document) {
    if (!isTenUpInjectionContext()) {
      return;
    }

    for (const cardRoot of root.querySelectorAll('[data-testid^="tenup_item"]')) {
      if (isCardAlreadyInjected(cardRoot)) {
        continue;
      }

      const card = cardFromRoot(cardRoot);
      if (!card) {
        continue;
      }

      injectPlayButtonIntoCard(card, lightbox, null);
    }
  }

  function injectCardButtons(lightbox, root = document) {
    if (isTitleDetailPage()) {
      return;
    }

    const processedCards = new Set();

    function tryInject(card, trailerBtn) {
      if (!card || processedCards.has(card.root)) {
        return;
      }
      if (injectPlayButtonIntoCard(card, lightbox, trailerBtn)) {
        processedCards.add(card.root);
      }
    }

    injectTenUpCards(lightbox, root);

    for (const trailerBtn of findTrailerButtons(root)) {
      const card = findCardFromTrailer(trailerBtn);
      if (!card) {
        continue;
      }
      tryInject(card, trailerBtn);
    }

    if (isListCardInjectionContext(root)) {
      for (const cardRoot of collectChartCardRoots(root)) {
        if (
          isCardAlreadyInjected(cardRoot) ||
          cardHasTrailerButton(cardRoot) ||
          processedCards.has(cardRoot)
        ) {
          continue;
        }
        const card = cardFromRoot(cardRoot);
        tryInject(card, null);
      }
    }

    if (isSearchContext()) {
      for (const cardRoot of root.querySelectorAll(
        ".find-result, .ipc-metadata-list-summary-item, [data-testid*='find-result']"
      )) {
        if (
          isCardAlreadyInjected(cardRoot) ||
          cardHasTrailerButton(cardRoot) ||
          processedCards.has(cardRoot)
        ) {
          continue;
        }
        const card = cardFromRoot(cardRoot);
        tryInject(card, null);
      }
    }
  }

  function getPlayUrl(titleId) {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref_");
    const url = new URL(`https://playimdb.com/title/${titleId}/`);
    if (ref) {
      url.searchParams.set("ref_", ref);
    }
    return url.toString();
  }

  function isFrameBlank(frame) {
    const attr = frame.getAttribute("src");
    return !attr || attr === "about:blank" || frame.src === "about:blank";
  }

  function loadFrameUrl(frame, url) {
    try {
      const frameWindow = frame.contentWindow;
      if (frameWindow) {
        frameWindow.location.replace(url);
        return;
      }
    } catch {
      /* cross-origin or not ready */
    }

    frame.src = url;
  }

  function bootstrapFrameUrl(frame, url, onPlayerLoad) {
    let settled = false;
    let navigatingToPlayer = false;

    function finish() {
      if (settled) {
        return;
      }
      settled = true;
      frame.removeEventListener("load", onFrameLoad);
      onPlayerLoad?.();
    }

    function onFrameLoad() {
      if (settled) {
        return;
      }

      if (!navigatingToPlayer) {
        navigatingToPlayer = true;
        frame.src = url;
        return;
      }

      finish();
    }

    frame.addEventListener("load", onFrameLoad);

    function cancel() {
      settled = true;
      frame.removeEventListener("load", onFrameLoad);
    }

    if (!isFrameBlank(frame)) {
      clearFrame(frame);
      return cancel;
    }

    try {
      if (frame.contentDocument?.readyState === "complete") {
        onFrameLoad();
      }
    } catch {
      navigatingToPlayer = true;
      frame.src = url;
    }

    return cancel;
  }

  function clearFrame(frame) {
    try {
      frame.contentWindow?.location.replace("about:blank");
    } catch {
      /* cross-origin */
    }

    // Always sync src attribute; location.replace alone leaves stale src after
    // cross-origin player loads, which breaks isFrameBlank on re-open.
    frame.src = "about:blank";
  }

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      null
    );
  }

  function isModalFullscreen(modal) {
    const active = getFullscreenElement();
    return active === modal;
  }

  function requestModalFullscreen(modal) {
    const request =
      modal.requestFullscreen || modal.webkitRequestFullscreen;
    if (!request) {
      return Promise.reject(new Error("Fullscreen not supported"));
    }
    return Promise.resolve(request.call(modal));
  }

  function exitModalFullscreen() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit && getFullscreenElement()) {
      return Promise.resolve(exit.call(document));
    }
    return Promise.resolve();
  }

  function createDonateLink(variant) {
    const link = document.createElement("a");
    link.className = "imdbplay-donate";
    if (variant === "player") {
      link.classList.add("imdbplay-donate--player");
    }
    link.href = "https://ko-fi.com/particularcatch";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerHTML =
      '<span class="imdbplay-donate__icon" aria-hidden="true">☕</span> Support';
    link.title = "Support IMDBPlay on Ko-fi";
    return link;
  }

  function createLightbox() {
    const overlay = document.createElement("div");
    overlay.className = "imdbplay-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "IMDBPlay player");
    // Trusted embed only (playimdb.com via getPlayUrl). No sandbox attribute avoids
    // Chrome's allow-scripts + allow-same-origin warning; player-guard.js still runs
    // on player pages via manifest content scripts.
    overlay.innerHTML = `
      <div class="imdbplay-modal">
        <div class="imdbplay-toolbar">
          <button type="button" class="imdbplay-close" aria-label="Close player">&times;</button>
        </div>
        <div class="imdbplay-loading">Loading player…</div>
        <iframe class="imdbplay-frame" title="IMDBPlay media player" allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>
      </div>
    `;

    const modal = overlay.querySelector(".imdbplay-modal");
    const toolbar = overlay.querySelector(".imdbplay-toolbar");
    const closeBtn = overlay.querySelector(".imdbplay-close");
    const frame = overlay.querySelector(".imdbplay-frame");
    const loading = overlay.querySelector(".imdbplay-loading");
    let isOpen = false;
    let cancelBootstrap = null;

    function updateFullscreenOverlay() {
      const active = isModalFullscreen(modal);
      overlay.classList.toggle("imdbplay-overlay--fullscreen", active);
    }

    function handlePlayerControlMessage(data) {
      if (!isOpen || !data || typeof data.type !== "string") {
        return;
      }

      if (data.type === "IMDBPLAY_REQUEST_FULLSCREEN") {
        if (isModalFullscreen(modal)) {
          exitModalFullscreen().catch(() => {});
        } else {
          requestModalFullscreen(modal).catch(() => {});
        }
        return;
      }

      if (data.type === "IMDBPLAY_EXIT_FULLSCREEN") {
        exitModalFullscreen().catch(() => {});
      }
    }

    function onPlayerMessage(event) {
      if (!isTrustedPlayerOrigin(event.origin)) {
        return;
      }

      handlePlayerControlMessage(event.data);
    }

    function onFullscreenChange() {
      updateFullscreenOverlay();
    }

    function detachListeners() {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      window.removeEventListener("message", onPlayerMessage);
    }

    function close() {
      isOpen = false;
      cancelBootstrap?.();
      cancelBootstrap = null;
      exitModalFullscreen().catch(() => {});
      overlay.classList.remove("imdbplay-open", "imdbplay-overlay--fullscreen");
      document.body.style.overflow = "";
      clearFrame(frame);
      loading.classList.remove("imdbplay-hidden");
      detachListeners();
    }

    function open(url) {
      cancelBootstrap?.();
      cancelBootstrap = null;

      if (isOpen) {
        detachListeners();
      }

      clearFrame(frame);

      if (!overlay.isConnected) {
        document.body.appendChild(overlay);
      }

      isOpen = true;
      document.body.style.overflow = "hidden";
      loading.classList.remove("imdbplay-hidden");
      cancelBootstrap = bootstrapFrameUrl(frame, url, () => {
        loading.classList.add("imdbplay-hidden");
        cancelBootstrap = null;
      });
      window.addEventListener("message", onPlayerMessage);
      requestAnimationFrame(() => overlay.classList.add("imdbplay-open"));
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("fullscreenchange", onFullscreenChange);
      document.addEventListener("webkitfullscreenchange", onFullscreenChange);
      updateFullscreenOverlay();
      closeBtn.focus();
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        if (isModalFullscreen(modal)) {
          event.preventDefault();
          exitModalFullscreen().catch(() => {});
          return;
        }
        close();
      }
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close();
      }
    });

    toolbar.insertBefore(createDonateLink("player"), closeBtn);

    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (event) => event.stopPropagation());

    return { open, close, overlay };
  }

  function findButtonAnchor() {
    return (
      document.querySelector('[data-testid="hero-subnav-bar-left"]') ||
      document.querySelector('[data-testid="hero-title-block"]') ||
      document.querySelector(".hero__primary-text") ||
      document.querySelector("h1")
    );
  }

  function injectButton(lightbox) {
    const titleId = getTitleId();
    if (!titleId) {
      return;
    }

    if (document.querySelector(".imdbplay-btn-wrap")) {
      return;
    }

    const anchor = findButtonAnchor();
    if (!anchor) {
      return;
    }

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "imdbplay-btn";
    playButton.innerHTML = `<span class="imdbplay-btn__icon">${PLAY_ICON}</span><span class="imdbplay-btn__label">${getButtonLabel()}</span>`;

    playButton.addEventListener("click", () => {
      lightbox.open(getPlayUrl(titleId));
    });

    const wrapper = document.createElement("span");
    wrapper.className = "imdbplay-btn-wrap";

    const actions = document.createElement("span");
    actions.className = "imdbplay-actions";
    actions.appendChild(playButton);

    const donateLink = createDonateLink();

    if (anchor.matches('[data-testid="hero-subnav-bar-left"]')) {
      wrapper.classList.add("imdbplay-btn-wrap--subnav");
      wrapper.appendChild(actions);
      wrapper.appendChild(donateLink);
      anchor.appendChild(wrapper);
    } else {
      const titleEl =
        anchor.querySelector('[data-testid="hero__pageTitle"]') ||
        anchor.querySelector("h1");
      wrapper.appendChild(actions);
      wrapper.appendChild(donateLink);
      if (titleEl) {
        titleEl.insertAdjacentElement("afterend", wrapper);
      } else {
        anchor.appendChild(wrapper);
      }
    }
  }

  function maybeAutoOpenFromQuery(lightbox) {
    const params = new URLSearchParams(location.search);
    if (params.get("imdbplay") !== "open") {
      return;
    }

    const titleId = getTitleId();
    if (!titleId) {
      return;
    }

    params.delete("imdbplay");
    const cleanSearch = params.toString();
    const cleanUrl =
      location.pathname +
      (cleanSearch ? `?${cleanSearch}` : "") +
      location.hash;
    history.replaceState(null, "", cleanUrl);
    lightbox.open(getPlayUrl(titleId));
  }

  function init() {
    const lightbox = createLightbox();
    let lastPath = location.pathname;
    let syncScheduled = false;

    function sync() {
      if (isTitleDetailPage()) {
        injectButton(lightbox);
        return;
      }

      injectCardButtons(lightbox);
    }

    function scheduleSync() {
      if (syncScheduled) {
        return;
      }
      syncScheduled = true;
      requestAnimationFrame(() => {
        syncScheduled = false;
        sync();
      });
    }

    sync();
    maybeAutoOpenFromQuery(lightbox);

    const domObserver = new MutationObserver(scheduleSync);
    domObserver.observe(document.body, { childList: true, subtree: true });

    const routeObserver = new MutationObserver(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        document.querySelector(".imdbplay-btn-wrap")?.remove();
        document.querySelectorAll(".imdbplay-card-actions").forEach((wrap) => {
          wrap.remove();
        });
        document
          .querySelectorAll('[data-imdbplay-injected="1"]')
          .forEach((card) => {
            card.removeAttribute("data-imdbplay-injected");
          });
        scheduleSync();
      }
    });
    routeObserver.observe(document.querySelector("title") || document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
