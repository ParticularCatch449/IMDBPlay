(function () {
  "use strict";

  const PLAYER_HOST_RE =
    /(^|\.)((playimdb|streamimdb|nextgencloudfabric)\.(com|ru))$/i;

  if (!PLAYER_HOST_RE.test(location.hostname)) {
    return;
  }

  const PAGE_GUARD_SCRIPT_ID = "imdbplay-page-guard-script";

  function injectPageGuard() {
    if (document.getElementById(PAGE_GUARD_SCRIPT_ID)) {
      return;
    }

    try {
      const root = document.documentElement || document.head;
      if (!root) {
        return;
      }

      const script = document.createElement("script");
      script.id = PAGE_GUARD_SCRIPT_ID;
      script.src = chrome.runtime.getURL("player-guard-page.js");
      script.async = false;
      root.appendChild(script);
    } catch {
      /* ignore */
    }
  }

  if (document.documentElement) {
    injectPageGuard();
  } else {
    const rootObserver = new MutationObserver(() => {
      if (document.documentElement) {
        rootObserver.disconnect();
        injectPageGuard();
      }
    });
    rootObserver.observe(document, { childList: true });
  }

  const AD_URL_RE =
    /(doubleclick|googlesyndication|amazon-adsystem|taboola|popads|popcash|exoclick|adsterra|propellerads|clickadu|histats|outbrain|mgid|criteo|pubmatic|rubiconproject|adnxs|media\.net|betway|casino|1xbet|stake\.com|affiliate|tracking|redirect)/i;

  const PLAYER_UI_RE =
    /(player|plyr|vjs-|jwplayer|videojs|control|settings|quality|subtitle|caption|speed|episode|season|menu|dropdown|modal|toolbar|button)/i;

  function isPlayerFamilyUrl(url) {
    try {
      return PLAYER_HOST_RE.test(new URL(url, location.href).hostname);
    } catch {
      return false;
    }
  }

  function isExternalUrl(url) {
    if (!url || typeof url !== "string") {
      return false;
    }

    if (
      url.startsWith("javascript:") ||
      url.startsWith("data:") ||
      url === "#" ||
      url.startsWith("#")
    ) {
      return false;
    }

    if (url.startsWith("blob:") || url.startsWith("about:")) {
      return false;
    }

    try {
      const parsed = new URL(url, location.href);
      if (parsed.origin === location.origin || isPlayerFamilyUrl(parsed.href)) {
        return false;
      }
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  function isAdUrl(url) {
    if (!url || typeof url !== "string") {
      return false;
    }

    try {
      return AD_URL_RE.test(new URL(url, location.href).href);
    } catch {
      return false;
    }
  }

  function isSeekControl(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    if (
      element.closest(
        '[data-plyr="seek"], .plyr__progress, .plyr__progress__buffer, .plyr__progress__played, .plyr__progress__container, input[type="range"]'
      )
    ) {
      return true;
    }

    const hint = `${element.className || ""} ${
      element.getAttribute("aria-label") || ""
    } ${element.getAttribute("data-plyr") || ""}`.toLowerCase();

    return /seek|progress|scrub|timeline/.test(hint);
  }

  function isPlayerUiElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    if (isSeekControl(element)) {
      return true;
    }

    if (element.closest("video, audio, button, input, select, textarea, label")) {
      return true;
    }

    if (element.closest(".plyr, .plyr__controls, .plyr__menu, [class*='plyr']")) {
      return true;
    }

    const hint = `${element.className || ""} ${element.id || ""} ${
      element.getAttribute("role") || ""
    } ${element.getAttribute("aria-label") || ""}`;

    return PLAYER_UI_RE.test(hint);
  }

  function isClickjackLayer(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (isPlayerUiElement(element)) {
      return false;
    }

    if (element.querySelector("video, audio")) {
      return false;
    }

    const style = getComputedStyle(element);
    const position = style.position;
    if (position !== "fixed" && position !== "absolute") {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const coversPlayer =
      rect.width >= window.innerWidth * 0.35 &&
      rect.height >= window.innerHeight * 0.35;
    if (!coversPlayer) {
      return false;
    }

    const zIndex = parseInt(style.zIndex, 10);
    const href = element.getAttribute("href") || "";
    const isLink = element.tagName === "A" || Boolean(element.closest("a[href]"));
    const opacity = parseFloat(style.opacity || "1");
    const pointerOnly =
      style.cursor === "pointer" && element.childElementCount === 0;

    if (isLink && isExternalUrl(href)) {
      return true;
    }

    if (!Number.isNaN(zIndex) && zIndex >= 500) {
      if (opacity < 0.15 || pointerOnly || isLink) {
        return true;
      }
    }

    return false;
  }

  function isAdOverlay(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }

    if (isClickjackLayer(node)) {
      return true;
    }

    const style = getComputedStyle(node);
    const zIndex = parseInt(style.zIndex, 10);
    const isFullscreenish =
      (style.position === "fixed" || style.position === "absolute") &&
      parseInt(style.width, 10) > window.innerWidth * 0.5 &&
      parseInt(style.height, 10) > window.innerHeight * 0.5;

    if (!isFullscreenish || Number.isNaN(zIndex) || zIndex < 1000) {
      return false;
    }

    const text = (node.textContent || "").toLowerCase();
    const adHints =
      /advert|sponsor|click here|close ad|skip ad|promoted|casino|betting/.test(
        text
      );
    const hasIframeAd = Boolean(node.querySelector("iframe[src*='ad']"));
    const hasVideo = Boolean(node.querySelector("video"));

    return (adHints || hasIframeAd) && !hasVideo;
  }

  function requestParentFullscreen() {
    const payload = { type: "IMDBPLAY_REQUEST_FULLSCREEN" };
    try {
      if (window.parent !== window) {
        window.parent.postMessage(payload, "*");
      }
    } catch {
      /* ignore */
    }
  }

  function requestParentExitFullscreen() {
    const payload = { type: "IMDBPLAY_EXIT_FULLSCREEN" };
    try {
      if (window.parent !== window) {
        window.parent.postMessage(payload, "*");
      }
    } catch {
      /* ignore */
    }
  }

  function isFullscreenControl(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const control = element.closest(
      "button, [role='button'], a[href], [data-plyr='fullscreen']"
    );
    if (!control) {
      return false;
    }

    if (control.getAttribute("data-plyr") === "fullscreen") {
      return true;
    }

    const hint = `${control.className || ""} ${
      control.getAttribute("aria-label") || ""
    } ${control.getAttribute("title") || ""} ${control.id || ""}`.toLowerCase();

    return /full\s*screen|fullscreen|enlarge|expand/.test(hint);
  }

  function isSettingsControl(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const control = element.closest(
      "button, [role='button'], [role='menuitem'], a[href], [data-plyr='settings']"
    );
    if (!control) {
      return false;
    }

    if (control.getAttribute("data-plyr") === "settings") {
      return true;
    }

    const hint = `${control.className || ""} ${
      control.getAttribute("aria-label") || ""
    } ${control.getAttribute("title") || ""} ${control.id || ""} ${
      control.getAttribute("data-plyr") || ""
    }`.toLowerCase();

    return /settings?|quality|subtitle|caption|speed|gear|cog|options|preferences|configure|menu/.test(
      hint
    );
  }

  function isPopunderShieldTarget(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    if (isSeekControl(element)) {
      return false;
    }

    return isSettingsControl(element) || isFullscreenControl(element);
  }

  function watchFullscreenClicks() {
    if (window.parent === window) {
      return;
    }

    document.addEventListener(
      "click",
      (event) => {
        if (!isFullscreenControl(event.target)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        requestParentFullscreen();
      },
      true
    );
  }

  function blockAdNavigation(event) {
    const shieldPointer =
      event.type === "mousedown" ||
      event.type === "pointerdown" ||
      event.type === "touchstart";

    if (shieldPointer && isPopunderShieldTarget(event.target)) {
      event.stopImmediatePropagation();
      return;
    }

    const path = event.composedPath?.() || [];

    for (const node of path) {
      if (!(node instanceof Element)) {
        continue;
      }

      if (shieldPointer && isPopunderShieldTarget(node)) {
        event.stopImmediatePropagation();
        return;
      }

      if (isClickjackLayer(node)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        node.remove();
        return;
      }

      const anchor = node.closest?.("a[href]");
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        const target = (anchor.getAttribute("target") || "").toLowerCase();
        const leavesPlayer =
          target === "_blank" ||
          target === "_new" ||
          target === "_top" ||
          target === "_parent";

        if (
          window.parent !== window &&
          (target === "_top" || target === "_parent")
        ) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        if (isAdUrl(href) || (leavesPlayer && isExternalUrl(href))) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }
        if (leavesPlayer && isExternalUrl(href) && !isPlayerUiElement(anchor)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      }
    }
  }

  function blockAdForms(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const action = form.getAttribute("action") || location.href;
    const target = (form.getAttribute("target") || "").toLowerCase();
    if (isExternalUrl(action) || target === "_blank" || target === "_new") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  function isAdScript(script) {
    if (!(script instanceof HTMLScriptElement)) {
      return false;
    }

    const src = script.src || "";
    if (
      /histats|popads|propeller|clckadu|adsterra|exoclick|clickadu|popcash|hqlps|ghtxmm/i.test(
        src
      )
    ) {
      return true;
    }

    const text = script.textContent || "";
    if (text.length < 60) {
      return false;
    }

    const hasPopunder =
      /shown_at|unloaded_at|last_click|popunder|ad_slot/i.test(text) &&
      /mousedown|pointerdown|click|touchstart/.test(text) &&
      /window\.open|location\.(assign|replace|href)|\.submit\(/.test(text);

    const hasOpenOverlay =
      /addiv|clickjack|z-index:\s*2147483647/i.test(text) &&
      /window\.open|\.open\(/.test(text);

    return hasPopunder || hasOpenOverlay;
  }

  function neutralizeAdScripts(root = document) {
    root.querySelectorAll("script").forEach((script) => {
      if (isAdScript(script)) {
        script.remove();
      }
    });
  }

  function watchAdScripts() {
    const scriptObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLScriptElement && isAdScript(node)) {
            node.remove();
          } else if (node instanceof HTMLElement) {
            neutralizeAdScripts(node);
          }
        });
      }
    });

    scriptObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function blockParentMousedownAds() {
    const blockOverlayHit = (event) => {
      const target = event.target;
      if (target instanceof HTMLIFrameElement) {
        return;
      }
      if (isClickjackLayer(target) || isAdOverlay(target)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (target instanceof HTMLElement) {
          target.remove();
        }
      }
    };

    window.addEventListener("mousedown", blockOverlayHit, true);
    document.addEventListener("mousedown", blockOverlayHit, true);
  }

  watchFullscreenClicks();
  watchAdScripts();
  blockParentMousedownAds();

  const guardStyle = document.createElement("style");
  guardStyle.textContent = `
    .imdbplay-blocked-overlay,
    [class*="pause-ad"],
    [class*="pauseAd"],
    [id*="pause-ad"],
    [class*="preroll"],
    [class*="midroll"],
    [class*="popunder"],
    a[target="_blank"][href^="http"]:not([href*="${location.hostname}"]),
    div[style*="z-index: 2147483647"],
    div[style*="z-index:2147483647"] {
      display: none !important;
      pointer-events: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;
  (document.documentElement || document.head || document).appendChild(guardStyle);

  ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart"].forEach(
    (eventName) => {
      document.addEventListener(eventName, blockAdNavigation, true);
    }
  );
  document.addEventListener("submit", blockAdForms, true);

  function isAdIframe(node) {
    if (!(node instanceof HTMLIFrameElement)) {
      return false;
    }

    const src = node.src || node.getAttribute("src") || "";
    return isAdUrl(src) || /ad|banner|sponsor|popunder|click/i.test(src);
  }

  function stripAdOverlays(root) {
    root
      .querySelectorAll("a[href], form[action], iframe, div, section, aside")
      .forEach((node) => {
        if (node instanceof HTMLIFrameElement && isAdIframe(node)) {
          node.remove();
          return;
        }

        if (isAdOverlay(node) || isClickjackLayer(node)) {
          node.classList.add("imdbplay-blocked-overlay");
          node.remove();
        }
      });
  }

  const overlayObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (isAdOverlay(node) || isClickjackLayer(node)) {
            node.remove();
          } else {
            stripAdOverlays(node);
          }
        }
      });
    }
  });

  function boot() {
    neutralizeAdScripts(document);
    stripAdOverlays(document);
    overlayObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "href", "target", "src"],
    });
    setInterval(() => {
      stripAdOverlays(document);
      neutralizeAdScripts(document);
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
