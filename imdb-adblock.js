(function () {
  "use strict";

  const AD_TEST_IDS = /^section-AdRow/i;
  const AD_IFRAME_RE =
    /(googlesyndication|doubleclick|amazon-adsystem|taboola|pubmatic|rubiconproject|adservice|adnxs|criteo)/i;

  const STATIC_SELECTORS = [
    '[data-testid^="section-AdRow"]',
    '[data-testid^="taboola-"]',
    '[data-testid="dynamic-slate-ad"]',
    '[data-testid="inline-ad"]',
    '[data-testid="advertisement"]',
    '[data-testid="sponsored-content"]',
    '[data-testid="video-slate-ad"]',
    ".ins.adsbygoogle",
    '[class^="div-gpt-ad"]',
    '[data-id^="div-gpt-ad"]',
    'div[id^="taboola-stream-"]',
    ".taboolaads",
    ".aax-v2_avia",
    ".aax-v2_div",
    ".ipc-page-section--ad",
    '[class*="adSlot"]',
    '[class*="AdSlot"]',
    '[class*="ad-slot"]',
    '[class*="advert-slot"]',
    '[class*="sponsored-feed"]',
  ];

  function isSponsoredSection(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    const testId = element.getAttribute("data-testid") || "";
    if (AD_TEST_IDS.test(testId) || /taboola/i.test(testId)) {
      return true;
    }

    const labels = element.querySelectorAll(
      '[class*="widget_header"], [class*="Sponsored"], [class*="sponsored"], [class*="label"]'
    );

    for (const label of labels) {
      const text = label.textContent?.trim() || "";
      if (/^sponsored$/i.test(text) && text.length < 24) {
        return true;
      }
    }

    return false;
  }

  function isAdIframe(element) {
    if (!(element instanceof HTMLIFrameElement)) {
      return false;
    }

    const src = element.src || element.getAttribute("src") || "";
    return AD_IFRAME_RE.test(src);
  }

  function isAdLikeNode(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (isAdIframe(element)) {
      return true;
    }

    const testId = element.getAttribute("data-testid") || "";
    if (AD_TEST_IDS.test(testId) || /taboola|inline-ad|slate-ad/i.test(testId)) {
      return true;
    }

    if (element.matches(".article")) {
      return isSponsoredSection(element);
    }

    const id = element.id || "";
    if (/^google_ads_iframe|^taboola/i.test(id)) {
      return true;
    }

    const className = typeof element.className === "string" ? element.className : "";
    if (/\b(div-gpt-ad|adsbygoogle|taboola|adSlot|AdSlot)\b/i.test(className)) {
      return true;
    }

    return false;
  }

  function removeNode(element) {
    element.remove();
  }

  function purgeAds(root = document) {
    for (const selector of STATIC_SELECTORS) {
      root.querySelectorAll(selector).forEach(removeNode);
    }

    root.querySelectorAll("iframe").forEach((frame) => {
      if (isAdIframe(frame)) {
        removeNode(frame);
      }
    });

    root.querySelectorAll(".article, section.ipc-page-section, div[data-testid^='section-']").forEach(
      (section) => {
        if (isSponsoredSection(section)) {
          removeNode(section);
        }
      }
    );
  }

  let scheduled = false;

  function schedulePurge() {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      purgeAds();
    });
  }

  const observer = new MutationObserver((mutations) => {
    let shouldPurge = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (isAdLikeNode(node)) {
              removeNode(node);
            } else {
              shouldPurge = true;
            }
          }
        }
      } else if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
        if (isAdLikeNode(mutation.target)) {
          removeNode(mutation.target);
        }
      }
    }

    if (shouldPurge) {
      schedulePurge();
    }
  });

  function boot() {
    purgeAds();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "class", "data-testid", "id"],
    });
    setInterval(purgeAds, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
