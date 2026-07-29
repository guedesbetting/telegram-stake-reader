"use strict";

const SR = StakeReaderCore;
const PROCESSED = "data-stake-reader-processed";
const UI_CLASS = "stake-reader-ui";
const MEDIA_HOST_CLASS = "stake-reader-media-host";

let cachedSettings = {
  bankroll: 1000,
  management: 100,
  enabled: true,
  overlayPosition: "bottom-left",
  percentageMode: "as-units"
};
let scanScheduled = false;

const MESSAGE_SELECTOR = [
  ".Message",
  ".bubble",
  "[data-message-id]",
  "[data-mid]",
  "[data-peer-id][data-mid]"
].join(",");

async function refreshSettings() {
  cachedSettings = await chrome.storage.local.get({
    bankroll: 1000,
    management: 100,
    enabled: true,
    overlayPosition: "bottom-left",
    percentageMode: "as-units"
  });
}

function getMessageText(element) {
  if (!(element instanceof HTMLElement)) return "";

  /*
   * Não clonamos a mensagem. Clonar elementos <video> ou <audio> pode
   * recriar instâncias de mídia e interferir no autoplay/estado de áudio
   * do Telegram Web. A leitura abaixo percorre somente nós de texto.
   */
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        if (parent.closest(`.${UI_CLASS}`)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.closest("video, audio, script, style, noscript, svg")) {
          return NodeFilter.FILTER_REJECT;
        }

        const text = node.nodeValue?.trim();
        return text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const parts = [];
  let node;

  while ((node = walker.nextNode())) {
    parts.push(node.nodeValue.trim());
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function containsRecognizedStake(element) {
  const text = getMessageText(element);
  return text.length >= 2 && text.length <= 8000 && SR.findStakes(text).length > 0;
}

function isLeafMessageCandidate(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.closest(`.${UI_CLASS}`)) return false;
  if (!containsRecognizedStake(element)) return false;

  const nestedCandidates = element.querySelectorAll(MESSAGE_SELECTOR);
  for (const nested of nestedCandidates) {
    if (nested !== element && containsRecognizedStake(nested)) return false;
  }

  return true;
}

function getCandidateMessages(root = document) {
  const candidates = new Set();

  if (root instanceof HTMLElement && root.matches(MESSAGE_SELECTOR)) {
    candidates.add(root);
  }

  root.querySelectorAll?.(MESSAGE_SELECTOR).forEach((element) => {
    candidates.add(element);
  });

  return [...candidates].filter(isLeafMessageCandidate);
}

function isUsableMedia(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.closest(`.${UI_CLASS}`)) return false;

  const classText = String(element.className || "").toLowerCase();
  if (/avatar|emoji|sticker|reaction|icon|profile/.test(classText)) return false;

  const rect = element.getBoundingClientRect();
  const width = rect.width || element.clientWidth || 0;
  const height = rect.height || element.clientHeight || 0;

  return width >= 180 && height >= 90;
}

function findMediaHost(messageElement) {
  const preferredSelectors = [
    ".media-container",
    ".media-inner",
    ".attachment",
    ".photo",
    ".video-container",
    ".album-item",
    "video",
    "img"
  ];

  for (const selector of preferredSelectors) {
    const candidates = messageElement.querySelectorAll(selector);

    for (const media of candidates) {
      if (!isUsableMedia(media)) continue;

      if (media.matches("img, video")) {
        const preferredParent = media.closest(
          ".media-container, .media-inner, .attachment, .photo, .video-container, .album-item, a"
        );
        return preferredParent || media.parentElement;
      }

      return media;
    }
  }

  return null;
}

function createUi(stakes, overlay = false) {
  const wrapper = document.createElement("div");
  wrapper.className = UI_CLASS;
  wrapper.dataset.stakeReader = "true";

  if (overlay) {
    wrapper.classList.add("stake-reader-ui--overlay");
    wrapper.dataset.position = cachedSettings.overlayPosition || "bottom-left";
  }

  const buttons = document.createElement("div");
  buttons.className = "stake-reader-buttons";

  const result = document.createElement("div");
  result.className = "stake-reader-result";
  result.hidden = true;

  for (const stake of stakes) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stake-reader-chip";
    button.textContent = `💰 ${stake.value.toLocaleString("pt-BR")}${stake.type === "unit" ? "u" : "%"}`;
    button.title = "Calcular valor desta stake";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        const amount = SR.calculateStake(
          stake,
          cachedSettings.bankroll,
          cachedSettings.management,
          cachedSettings.percentageMode || "as-units"
        );
        const formatted = SR.formatBetValue(amount);
        result.textContent = `Valor: R$ ${formatted}`;
        result.hidden = false;

        navigator.clipboard?.writeText(formatted).catch(() => {});
      } catch (error) {
        result.textContent = error instanceof Error ? error.message : "Erro no cálculo.";
        result.hidden = false;
      }
    });

    buttons.appendChild(button);
  }

  wrapper.append(buttons, result);
  return wrapper;
}

function processMessage(element) {
  if (!(element instanceof HTMLElement)) return;
  if (!isLeafMessageCandidate(element)) return;

  const existingUi = element.querySelector(`.${UI_CLASS}`);
  if (existingUi) {
    element.setAttribute(PROCESSED, "true");
    return;
  }

  const stakes = SR.findStakes(getMessageText(element));
  if (stakes.length === 0) return;

  element.setAttribute(PROCESSED, "true");

  const mediaHost = findMediaHost(element);
  if (mediaHost instanceof HTMLElement) {
    mediaHost.classList.add(MEDIA_HOST_CLASS);
    mediaHost.appendChild(createUi(stakes, true));
    return;
  }

  element.appendChild(createUi(stakes, false));
}

function removeDuplicateUi() {
  const validMessages = getCandidateMessages(document);
  const validUi = new Set();

  for (const message of validMessages) {
    const controls = [...message.querySelectorAll(`.${UI_CLASS}`)];
    controls.forEach((control, index) => {
      if (index === 0) validUi.add(control);
      else control.remove();
    });
  }

  document.querySelectorAll(`.${UI_CLASS}`).forEach((ui) => {
    if (!validUi.has(ui)) ui.remove();
  });

  document.querySelectorAll(`.${MEDIA_HOST_CLASS}`).forEach((host) => {
    if (!host.querySelector(`.${UI_CLASS}`)) host.classList.remove(MEDIA_HOST_CLASS);
  });
}

function scan(root = document) {
  if (!cachedSettings.enabled) return;
  removeDuplicateUi();
  getCandidateMessages(root).forEach(processMessage);
}

function scheduleScan() {
  if (scanScheduled || !cachedSettings.enabled) return;
  scanScheduled = true;

  requestAnimationFrame(() => {
    scanScheduled = false;
    scan(document);
  });
}

function removeAllUi() {
  document.querySelectorAll(`.${UI_CLASS}`).forEach((element) => element.remove());
  document.querySelectorAll(`.${MEDIA_HOST_CLASS}`).forEach((element) => {
    element.classList.remove(MEDIA_HOST_CLASS);
  });
  document.querySelectorAll(`[${PROCESSED}]`).forEach((element) => {
    element.removeAttribute(PROCESSED);
  });
}

function startObserver() {
  const observer = new MutationObserver((mutations) => {
    if (!cachedSettings.enabled) return;

    const hasExternalChange = mutations.some((mutation) =>
      [...mutation.addedNodes].some((node) =>
        node instanceof HTMLElement &&
        !node.matches(`.${UI_CLASS}`) &&
        !node.closest(`.${UI_CLASS}`)
      )
    );

    if (hasExternalChange) scheduleScan();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  Object.entries(changes).forEach(([key, value]) => {
    cachedSettings[key] = value.newValue;
  });

  removeAllUi();
  scheduleScan();
});

(async function init() {
  await refreshSettings();
  removeAllUi();
  scan(document);
  startObserver();
})();
