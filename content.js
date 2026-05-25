(() => {
  if (window.__elementSnapper) return;
  window.__elementSnapper = true;

  let active = false;
  let hoveredEl = null;
  const OVERLAY_ID = "__es-overlay";
  const TOAST_ID = "__es-toast";

  const DEFAULT_STYLES = new Map();
  let defaultStyleEl = null;

  function getDefaultStyles(tagName) {
    if (DEFAULT_STYLES.has(tagName)) return DEFAULT_STYLES.get(tagName);
    if (!defaultStyleEl) {
      defaultStyleEl = document.createElement("iframe");
      defaultStyleEl.style.cssText = "position:fixed;width:0;height:0;border:none;visibility:hidden;";
      document.body.appendChild(defaultStyleEl);
    }
    const el = defaultStyleEl.contentDocument.createElement(tagName);
    defaultStyleEl.contentDocument.body.appendChild(el);
    const defaults = {};
    const computed = defaultStyleEl.contentWindow.getComputedStyle(el);
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      defaults[prop] = computed.getPropertyValue(prop);
    }
    el.remove();
    DEFAULT_STYLES.set(tagName, defaults);
    return defaults;
  }

  const STYLE_PROPS = [
    "display", "position", "top", "right", "bottom", "left",
    "width", "height", "min-width", "max-width", "min-height", "max-height",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "border", "border-top", "border-right", "border-bottom", "border-left",
    "border-radius", "border-top-left-radius", "border-top-right-radius",
    "border-bottom-left-radius", "border-bottom-right-radius",
    "background", "background-color", "background-image", "background-size",
    "background-position", "background-repeat",
    "color", "font-family", "font-size", "font-weight", "font-style",
    "letter-spacing", "line-height", "text-align", "text-decoration",
    "text-transform", "text-shadow", "white-space", "word-spacing",
    "flex", "flex-direction", "flex-wrap", "justify-content", "align-items",
    "align-self", "flex-grow", "flex-shrink", "flex-basis", "gap", "order",
    "grid-template-columns", "grid-template-rows", "grid-column", "grid-row",
    "grid-gap", "grid-auto-flow",
    "overflow", "overflow-x", "overflow-y",
    "opacity", "visibility", "z-index",
    "transform", "transition", "animation",
    "box-shadow", "cursor", "outline",
    "object-fit", "object-position",
    "aspect-ratio", "container-type",
  ];

  function getNonDefaultStyles(el) {
    const computed = window.getComputedStyle(el);
    const defaults = getDefaultStyles(el.tagName.toLowerCase());
    const styles = {};
    for (const prop of STYLE_PROPS) {
      const val = computed.getPropertyValue(prop);
      if (!val || val === "none" || val === "normal" || val === "auto") continue;
      if (defaults[prop] === val) continue;
      styles[prop] = val;
    }
    return styles;
  }

  function styleToString(styles) {
    return Object.entries(styles)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
  }

  function serializeElement(el, depth = 0, maxDepth = 8) {
    if (depth > maxDepth) return "";
    if (el.nodeType === Node.TEXT_NODE) {
      const text = el.textContent.trim();
      return text || "";
    }
    if (el.nodeType !== Node.ELEMENT_NODE) return "";
    if (el.id === OVERLAY_ID || el.id === TOAST_ID) return "";

    const tag = el.tagName.toLowerCase();
    const attrs = [];

    for (const attr of el.attributes) {
      if (attr.name === "class" || attr.name === "id" || attr.name === "data-testid" ||
          attr.name === "href" || attr.name === "src" || attr.name === "alt" ||
          attr.name === "type" || attr.name === "placeholder" || attr.name === "role" ||
          attr.name === "aria-label") {
        attrs.push(`${attr.name}="${attr.value}"`);
      }
    }

    const styles = getNonDefaultStyles(el);
    const styleStr = styleToString(styles);
    if (styleStr) {
      attrs.push(`style="${styleStr}"`);
    }

    const indent = "  ".repeat(depth);
    const attrStr = attrs.length ? " " + attrs.join(" ") : "";

    const voidTags = new Set(["img", "br", "hr", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"]);
    if (voidTags.has(tag)) {
      return `${indent}<${tag}${attrStr} />`;
    }

    const children = [];
    for (const child of el.childNodes) {
      const s = serializeElement(child, depth + 1, maxDepth);
      if (s) children.push(s);
    }

    if (children.length === 0) {
      return `${indent}<${tag}${attrStr}></${tag}>`;
    }

    if (children.length === 1 && !children[0].includes("\n") && children[0].trim().length < 80) {
      return `${indent}<${tag}${attrStr}>${children[0].trim()}</${tag}>`;
    }

    return `${indent}<${tag}${attrStr}>\n${children.join("\n")}\n${indent}</${tag}>`;
  }

  function getAncestorChain(el, maxLevels = 3) {
    const ancestors = [];
    let current = el.parentElement;
    for (let i = 0; i < maxLevels && current && current !== document.documentElement; i++) {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : "";
      const cls = current.className && typeof current.className === "string"
        ? "." + current.className.trim().split(/\s+/).slice(0, 2).join(".")
        : "";

      const styles = getNonDefaultStyles(current);
      const styleStr = styleToString(styles);
      const rect = current.getBoundingClientRect();

      ancestors.push({
        selector: `${tag}${id}${cls}`,
        style: styleStr,
        dimensions: `${Math.round(rect.width)}×${Math.round(rect.height)}px`,
      });
      current = current.parentElement;
    }
    return ancestors.reverse();
  }

  function buildPrompt(el) {
    const rect = el.getBoundingClientRect();
    const html = serializeElement(el);
    const ancestors = getAncestorChain(el);

    const lines = [
      "I need help with this HTML element. Here is the element with its inline computed styles:",
      "",
    ];

    if (ancestors.length > 0) {
      lines.push("**Parent chain** (outermost → innermost, layout styles only):");
      lines.push("");
      for (const a of ancestors) {
        const stylePart = a.style ? ` style="${a.style}"` : "";
        lines.push(`- \`<${a.selector}${stylePart}>\` — ${a.dimensions}`);
      }
      lines.push("");
    }

    lines.push(
      "**Selected element:**",
      "",
      "```html",
      html,
      "```",
      "",
      `Element dimensions: ${Math.round(rect.width)}×${Math.round(rect.height)}px`,
      `Viewport: ${window.innerWidth}×${window.innerHeight}px`,
    );
    return lines.join("\n");
  }

  function getOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = OVERLAY_ID;
      overlay.style.cssText = `
        position: fixed; pointer-events: none; z-index: 2147483647;
        border: 2px solid #0d9488; background: rgba(13, 148, 136, 0.10);
        border-radius: 6px; transition: all 0.05s ease-out; display: none;
        box-shadow: 0 0 0 1px rgba(13, 148, 136, 0.24), 0 14px 34px rgba(15, 23, 42, 0.16);
      `;

      const label = document.createElement("div");
      label.style.cssText = `
        position: absolute; top: -36px; left: -2px;
        max-width: min(420px, calc(100vw - 24px));
        background: rgba(15, 23, 42, 0.96); color: #f8fafc;
        font: 12px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-weight: 600; letter-spacing: 0; padding: 7px 10px;
        border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.20);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      `;
      overlay.appendChild(label);
      document.documentElement.appendChild(overlay);
    }
    return overlay;
  }

  function showOverlay(el) {
    const overlay = getOverlay();
    const rect = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.firstChild.style.top = rect.top < 42 ? "calc(100% + 8px)" : "-36px";

    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    const dim = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
    overlay.firstChild.textContent = `${tag}${id}${cls} ${dim}`;
  }

  function hideOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.style.display = "none";
  }

  function showToast(msg) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      toast.style.cssText = `
        position: fixed; bottom: max(20px, env(safe-area-inset-bottom)); right: 20px; z-index: 2147483647;
        max-width: min(360px, calc(100vw - 32px));
        background: rgba(15, 23, 42, 0.96); color: #f8fafc;
        font: 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0; padding: 12px 14px; border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.28);
        backdrop-filter: blur(12px); transition: opacity 0.18s ease, transform 0.18s ease;
        pointer-events: none;
      `;
      document.documentElement.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(6px)";
    }, 2200);
  }

  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el.id === OVERLAY_ID || el.id === TOAST_ID) return;
    if (el !== hoveredEl) {
      hoveredEl = el;
      showOverlay(el);
    }
  }

  const PAD = 2;
  let _captured = false;

  function isInsideOverlay(e) {
    if (!hoveredEl) return false;
    const rect = hoveredEl.getBoundingClientRect();
    return (
      e.clientX >= rect.left - PAD &&
      e.clientX <= rect.right + PAD &&
      e.clientY >= rect.top - PAD &&
      e.clientY <= rect.bottom + PAD
    );
  }

  function onInteraction(e) {
    if (!active) return;
    const inside = isInsideOverlay(e);

    if (e.type === "pointerdown" && inside && hoveredEl) {
      _captured = true;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const prompt = buildPrompt(hoveredEl);
      navigator.clipboard.writeText(prompt).then(() => {
        showToast(`Copied ${prompt.length} chars to clipboard`);
      }).catch(() => {
        showToast("Copy failed. Check clipboard permissions.");
      });

      setTimeout(() => {
        _captured = false;
        deactivate();
      }, 0);
      return;
    }

    if (_captured || inside) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  const ALL_EVENTS = ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "contextmenu"];

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      deactivate();
    }
  }

  function activate() {
    active = true;
    _captured = false;
    for (const evt of ALL_EVENTS) {
      document.addEventListener(evt, onInteraction, true);
    }
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "crosshair";
    showToast("Element Snapper active. Click an element, Esc cancels.");
  }

  function deactivate() {
    active = false;
    hoveredEl = null;
    _captured = false;
    for (const evt of ALL_EVENTS) {
      document.removeEventListener(evt, onInteraction, true);
    }
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "";
    hideOverlay();
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "togglePicker") {
      if (active) deactivate();
      else activate();
      sendResponse({ ok: true });
    }
  });
})();
