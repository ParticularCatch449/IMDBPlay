(function () {
  "use strict";

  const PLAYER_HOST_RE =
    /(^|\.)((playimdb|streamimdb|nextgencloudfabric)\.(com|ru))$/i;

  if (!PLAYER_HOST_RE.test(location.hostname)) {
    return;
  }

  (function primeAdCooldownStorage() {
    const now = String(Date.now());
    const keys = [
      "shown_at",
      "unloaded_at",
      "last_click",
      "last_pop",
      "popunder_at",
      "ad_shown",
      "popup_shown",
    ];
    try {
      for (const key of keys) {
        localStorage.setItem(key, now);
        sessionStorage.setItem(key, now);
      }
    } catch {
      /* ignore */
    }
  })();

  const AD_URL_RE =
    /(doubleclick|googlesyndication|amazon-adsystem|taboola|popads|popcash|exoclick|adsterra|propellerads|clickadu|histats|outbrain|mgid|criteo|pubmatic|rubiconproject|adnxs|media\.net|betway|casino|1xbet|stake\.com|affiliate|tracking|redirect|clk\.|click\?|\/go\/|\/out\/|popunder)/i;

  const PLAYER_UI_RE =
    /(player|plyr|vjs-|jwplayer|videojs|control|settings|quality|subtitle|caption|speed|episode|season|menu|dropdown|modal|toolbar|button)/i;

  const POPUNDER_EVENT_TYPES = new Set([
    "mousedown",
    "pointerdown",
    "mouseup",
    "pointerup",
    "click",
    "touchstart",
  ]);

  const fakePopup = {
    closed: false,
    close() {},
    focus() {},
    blur() {},
    location: { href: "about:blank", assign() {}, replace() {} },
  };

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

  function isPopunderListener(listener) {
    if (typeof listener !== "function") {
      return false;
    }

    const source = Function.prototype.toString.call(listener);
    const hasStorage =
      /localStorage|sessionStorage/.test(source) &&
      /\.(setItem|getItem|removeItem)/.test(source);
    const hasOpen = /window\.open|\.open\s*\(|location\.(assign|replace|href)/.test(
      source
    );
    const hasCooldownKey =
      /shown_at|unloaded_at|last_click|last_pop|popunder|ad_slot|cooldown/i.test(
        source
      );
    const hasPointerHook =
      /mousedown|pointerdown|click|mouseup|touchstart/.test(source);

    if (!hasCooldownKey || !hasPointerHook) {
      return false;
    }

    return hasStorage || hasOpen;
  }

  function isPopunderRegistrationTarget(target) {
    return (
      target === window ||
      target === document ||
      target === document.documentElement ||
      target === document.body
    );
  }

  function hookEventListener() {
    const nativeAdd = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (
        POPUNDER_EVENT_TYPES.has(type) &&
        isPopunderRegistrationTarget(this) &&
        isPopunderListener(listener)
      ) {
        return;
      }

      return nativeAdd.call(this, type, listener, options);
    };

    const nativeRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      return nativeRemove.call(this, type, listener, options);
    };
  }

  function hookWindowEventProperties() {
    for (const prop of [
      "onmousedown",
      "onpointerdown",
      "onclick",
      "onmouseup",
      "ontouchstart",
    ]) {
      let stored = null;
      try {
        Object.defineProperty(window, prop, {
          configurable: true,
          enumerable: true,
          get() {
            return stored;
          },
          set(fn) {
            if (!isPopunderListener(fn)) {
              stored = fn;
            }
          },
        });
      } catch {
        /* ignore */
      }
    }
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

  function shouldBlockPopup(url, features) {
    const featureStr =
      typeof features === "string" ? features.toLowerCase() : "";
    if (/fullscreen|full_screen/.test(featureStr)) {
      requestParentFullscreen();
      return true;
    }

    if (!url || url === "about:blank") {
      return true;
    }

    if (typeof url === "string" && (isExternalUrl(url) || isAdUrl(url))) {
      return true;
    }

    return false;
  }

  function blockPopups() {
    const nativeOpen = Window.prototype.open;

    Window.prototype.open = function (url, target, features) {
      if (shouldBlockPopup(url, features)) {
        return fakePopup;
      }
      return nativeOpen.apply(this, arguments);
    };

    if (typeof window.open === "function") {
      window.open = function (url, target, features) {
        if (shouldBlockPopup(url, features)) {
          return fakePopup;
        }
        return nativeOpen.apply(window, arguments);
      };
    }

    const nativeAssign = Location.prototype.assign;
    const nativeReplace = Location.prototype.replace;

    Location.prototype.assign = function (url) {
      const next = String(url);
      if (isExternalUrl(next) || isAdUrl(next)) {
        return;
      }
      return nativeAssign.call(this, url);
    };

    Location.prototype.replace = function (url) {
      const next = String(url);
      if (isExternalUrl(next) || isAdUrl(next)) {
        return;
      }
      return nativeReplace.call(this, url);
    };

    try {
      const hrefDesc =
        Object.getOwnPropertyDescriptor(Location.prototype, "href") ||
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(location), "href");
      if (hrefDesc && hrefDesc.set) {
        Object.defineProperty(Location.prototype, "href", {
          configurable: true,
          enumerable: hrefDesc.enumerable,
          get: hrefDesc.get,
          set(url) {
            const next = String(url);
            if (isExternalUrl(next) || isAdUrl(next)) {
              return;
            }
            hrefDesc.set.call(this, url);
          },
        });
      }
    } catch {
      /* ignore */
    }

    const formSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      const action = this.getAttribute("action") || location.href;
      const target = (this.getAttribute("target") || "").toLowerCase();
      if (
        isExternalUrl(action) ||
        isAdUrl(action) ||
        target === "_blank" ||
        target === "_new"
      ) {
        return;
      }
      return formSubmit.call(this);
    };

    const anchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      const href = this.getAttribute("href") || "";
      const target = (this.getAttribute("target") || "").toLowerCase();
      const leaves =
        target === "_blank" ||
        target === "_new" ||
        target === "_top" ||
        target === "_parent";
      if (isAdUrl(href) || (leaves && isExternalUrl(href))) {
        return;
      }
      return anchorClick.call(this);
    };
  }

  function hookFullscreenApi() {
    if (window.parent === window) {
      return;
    }

    const proto = Element.prototype;
    const requestNames = [
      "requestFullscreen",
      "webkitRequestFullscreen",
      "mozRequestFullScreen",
      "msRequestFullscreen",
    ];

    for (const name of requestNames) {
      const original = proto[name];
      if (typeof original !== "function") {
        continue;
      }

      proto[name] = function (...args) {
        requestParentFullscreen();
        return Promise.resolve();
      };
    }
  }

  function shieldProtectedControlEvents() {
    const shieldPointer = (event) => {
      if (!isPopunderShieldTarget(event.target)) {
        return;
      }

      event.stopImmediatePropagation();
    };

    const eventTypes = ["mousedown", "pointerdown", "touchstart"];
    for (const type of eventTypes) {
      window.addEventListener(type, shieldPointer, true);
      document.addEventListener(type, shieldPointer, true);
    }
  }

  hookEventListener();
  hookWindowEventProperties();
  blockPopups();
  hookFullscreenApi();
  shieldProtectedControlEvents();

  setInterval(() => {
    const now = String(Date.now());
    const keys = [
      "shown_at",
      "unloaded_at",
      "last_click",
      "last_pop",
      "popunder_at",
      "ad_shown",
      "popup_shown",
    ];
    try {
      for (const key of keys) {
        localStorage.setItem(key, now);
        sessionStorage.setItem(key, now);
      }
    } catch {
      /* ignore */
    }
  }, 5000);
})();
