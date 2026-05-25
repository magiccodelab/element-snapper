import {
  STORAGE_KEY,
  getSettings,
  resolveLanguage,
  sanitizeSettings,
  type Settings,
} from "./settings";
import { getMessages, type Messages } from "./i18n";

declare global {
  interface Window {
    __elementSnapper?: boolean;
  }
}

if (!window.__elementSnapper) {
  window.__elementSnapper = true;
  initPicker();
}

interface ThemeTokens {
  primary: string;
  primaryFg: string;
  panel: string;
  panelFg: string;
  border: string;
  shadow: string;
}

interface AncestorInfo {
  selector: string;
  style: string;
  dimensions: string;
}

const OVERLAY_ID = "__es-overlay";
const TOAST_ID = "__es-toast";

const FLOATING_THEME: Record<"light" | "dark", ThemeTokens> = {
  light: {
    primary: "221 83% 53%",
    primaryFg: "0 0% 100%",
    panel: "220 20% 10%",
    panelFg: "0 0% 100%",
    border: "220 15% 89%",
    shadow: "220 20% 10%",
  },
  dark: {
    primary: "217 85% 62%",
    primaryFg: "0 0% 100%",
    panel: "224 16% 13%",
    panelFg: "210 20% 92%",
    border: "224 14% 28%",
    shadow: "0 0% 0%",
  },
};

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
] as const;

const VOID_TAGS = new Set([
  "img", "br", "hr", "input", "meta", "link", "area",
  "base", "col", "embed", "source", "track", "wbr",
]);

const INTERACTION_EVENTS = [
  "pointerdown", "pointerup", "mousedown", "mouseup", "click", "contextmenu",
] as const;

function initPicker(): void {
  let userSettings: Settings = sanitizeSettings();
  let active = false;
  let hoveredEl: Element | null = null;
  let defaultStyleEl: HTMLIFrameElement | null = null;
  const defaultStylesCache = new Map<string, Record<string, string>>();

  void getSettings().then((s) => {
    userSettings = s;
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    const next = changes[STORAGE_KEY]?.newValue as Partial<Settings> | undefined;
    if (next) userSettings = sanitizeSettings(next);
  });

  function resolveTheme(): "light" | "dark" {
    if (userSettings.theme === "light" || userSettings.theme === "dark") {
      return userSettings.theme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyThemeTokens(el: HTMLElement): void {
    const tokens = FLOATING_THEME[resolveTheme()];
    for (const [key, value] of Object.entries(tokens)) {
      el.style.setProperty(`--es-${kebab(key)}`, value);
    }
  }

  function kebab(key: string): string {
    return key.replace(/([A-Z])/g, "-$1").toLowerCase();
  }

  function uiLabels(): Messages {
    return getMessages(resolveLanguage(userSettings.uiLanguage));
  }

  function promptLabels(): Messages {
    return getMessages(resolveLanguage(userSettings.promptLanguage));
  }

  function getDefaultStyles(tagName: string): Record<string, string> {
    const cached = defaultStylesCache.get(tagName);
    if (cached) return cached;
    if (!defaultStyleEl) {
      defaultStyleEl = document.createElement("iframe");
      defaultStyleEl.style.cssText = "position:fixed;width:0;height:0;border:none;visibility:hidden;";
      document.body.appendChild(defaultStyleEl);
    }
    const doc = defaultStyleEl.contentDocument;
    const win = defaultStyleEl.contentWindow;
    if (!doc || !win) {
      const empty: Record<string, string> = {};
      defaultStylesCache.set(tagName, empty);
      return empty;
    }
    const probe = doc.createElement(tagName);
    doc.body.appendChild(probe);
    const computed = win.getComputedStyle(probe);
    const defaults: Record<string, string> = {};
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      if (prop) defaults[prop] = computed.getPropertyValue(prop);
    }
    probe.remove();
    defaultStylesCache.set(tagName, defaults);
    return defaults;
  }

  function getNonDefaultStyles(el: Element): Record<string, string> {
    if (!userSettings.includeComputedStyles) return {};
    const computed = window.getComputedStyle(el);
    const defaults = getDefaultStyles(el.tagName.toLowerCase());
    const styles: Record<string, string> = {};
    for (const prop of STYLE_PROPS) {
      const val = computed.getPropertyValue(prop);
      if (!val || val === "none" || val === "normal" || val === "auto") continue;
      if (defaults[prop] === val) continue;
      styles[prop] = val;
    }
    return styles;
  }

  function styleToString(styles: Record<string, string>): string {
    return Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join("; ");
  }

  function serializeElement(node: Node, depth = 0, maxDepth = 8): string {
    if (depth > maxDepth) return "";
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim() ?? "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as Element;
    if (el.id === OVERLAY_ID || el.id === TOAST_ID) return "";

    const tag = el.tagName.toLowerCase();
    const attrs: string[] = [];
    const KEEP_ATTRS = new Set([
      "class", "id", "data-testid", "href", "src", "alt",
      "type", "placeholder", "role", "aria-label",
    ]);

    for (const attr of Array.from(el.attributes)) {
      if (attr.name === "style" && userSettings.includeElementStyle && !userSettings.includeComputedStyles) {
        attrs.push(`${attr.name}="${attr.value}"`);
        continue;
      }
      if (KEEP_ATTRS.has(attr.name)) {
        attrs.push(`${attr.name}="${attr.value}"`);
      }
    }

    const styleStr = styleToString(getNonDefaultStyles(el));
    if (styleStr) attrs.push(`style="${styleStr}"`);

    const indent = "  ".repeat(depth);
    const attrStr = attrs.length ? " " + attrs.join(" ") : "";

    if (VOID_TAGS.has(tag)) return `${indent}<${tag}${attrStr} />`;

    const children: string[] = [];
    for (const child of Array.from(el.childNodes)) {
      const s = serializeElement(child, depth + 1, maxDepth);
      if (s) children.push(s);
    }

    if (children.length === 0) return `${indent}<${tag}${attrStr}></${tag}>`;
    const first = children[0]!;
    if (children.length === 1 && !first.includes("\n") && first.trim().length < 80) {
      return `${indent}<${tag}${attrStr}>${first.trim()}</${tag}>`;
    }
    return `${indent}<${tag}${attrStr}>\n${children.join("\n")}\n${indent}</${tag}>`;
  }

  function getAncestorChain(el: Element, maxLevels = 3): AncestorInfo[] {
    const chain: AncestorInfo[] = [];
    let current = el.parentElement;
    for (let i = 0; i < maxLevels && current && current !== document.documentElement; i++) {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : "";
      const cls = typeof current.className === "string" && current.className
        ? "." + current.className.trim().split(/\s+/).slice(0, 2).join(".")
        : "";

      const styles = getNonDefaultStyles(current);
      let styleStr = styleToString(styles);
      if (!styleStr && userSettings.includeElementStyle) {
        styleStr = current.getAttribute("style") ?? "";
      }
      const rect = current.getBoundingClientRect();
      chain.push({
        selector: `${tag}${id}${cls}`,
        style: styleStr,
        dimensions: `${Math.round(rect.width)}×${Math.round(rect.height)}px`,
      });
      current = current.parentElement;
    }
    return chain.reverse();
  }

  function buildPrompt(el: Element): string {
    const rect = el.getBoundingClientRect();
    const html = serializeElement(el);
    const ancestorLevels =
      userSettings.captureScope === "withParents" ? 3
      : userSettings.captureScope === "withImmediateParent" ? 1
      : 0;
    const ancestors = ancestorLevels > 0 ? getAncestorChain(el, ancestorLevels) : [];
    const labels = promptLabels();

    const lines: string[] = [
      userSettings.includeComputedStyles ? labels.promptIntroWithStyles : labels.promptIntroWithoutStyles,
      "",
    ];

    if (ancestors.length > 0) {
      lines.push(`**${labels.parentChain}** (${labels.parentChainHint}):`, "");
      for (const a of ancestors) {
        const stylePart = a.style ? ` style="${a.style}"` : "";
        lines.push(`- \`<${a.selector}${stylePart}>\` - ${a.dimensions}`);
      }
      lines.push("");
    }

    lines.push(
      `**${labels.selectedElement}:**`,
      "",
      "```html",
      html,
      "```",
      "",
      `${labels.elementDimensions}: ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
      `${labels.viewport}: ${window.innerWidth}x${window.innerHeight}px`,
    );
    return lines.join("\n");
  }

  function getOverlay(): HTMLDivElement {
    let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = OVERLAY_ID;
      overlay.style.cssText = `
        position: fixed; pointer-events: none; z-index: 2147483647;
        border: 2px solid hsl(var(--es-primary)); background: hsl(var(--es-primary) / 0.10);
        border-radius: 6px; transition: all 0.05s ease-out; display: none;
        box-shadow: 0 0 0 1px hsl(var(--es-primary) / 0.24), 0 14px 34px hsl(var(--es-shadow) / 0.16);
      `;
      const label = document.createElement("div");
      label.style.cssText = `
        position: absolute; top: -36px; left: -2px;
        max-width: min(420px, calc(100vw - 24px));
        background: hsl(var(--es-panel) / 0.96); color: hsl(var(--es-panel-fg));
        font: 12px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-weight: 600; letter-spacing: 0; padding: 7px 10px;
        border: 1px solid hsl(var(--es-border)); border-radius: 8px;
        box-shadow: 0 12px 28px hsl(var(--es-shadow) / 0.20);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      `;
      overlay.appendChild(label);
      document.documentElement.appendChild(overlay);
    }
    applyThemeTokens(overlay);
    return overlay;
  }

  function showOverlay(el: Element): void {
    const overlay = getOverlay();
    const rect = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    const label = overlay.firstChild as HTMLDivElement | null;
    if (!label) return;
    label.style.top = rect.top < 42 ? "calc(100% + 8px)" : "-36px";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    label.textContent = `${tag}${id}${cls} ${Math.round(rect.width)}×${Math.round(rect.height)}`;
  }

  function hideOverlay(): void {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) (overlay as HTMLElement).style.display = "none";
  }

  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function showToast(msg: string): void {
    let toast = document.getElementById(TOAST_ID) as HTMLDivElement | null;
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      toast.style.cssText = `
        position: fixed; bottom: max(20px, env(safe-area-inset-bottom)); right: 20px; z-index: 2147483647;
        max-width: min(360px, calc(100vw - 32px));
        background: hsl(var(--es-panel) / 0.96); color: hsl(var(--es-panel-fg));
        font: 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0; padding: 12px 14px; border-radius: 8px;
        border: 1px solid hsl(var(--es-border));
        box-shadow: 0 16px 40px hsl(var(--es-shadow) / 0.28);
        backdrop-filter: blur(12px); transition: opacity 0.18s ease, transform 0.18s ease;
        pointer-events: none;
      `;
      document.documentElement.appendChild(toast);
    }
    applyThemeTokens(toast);
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (!toast) return;
      toast.style.opacity = "0";
      toast.style.transform = "translateY(6px)";
    }, 2200);
  }

  function onMouseMove(e: MouseEvent): void {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el.id === OVERLAY_ID || el.id === TOAST_ID) return;
    if (el !== hoveredEl) {
      hoveredEl = el;
      showOverlay(el);
    }
  }

  const PAD = 2;

  function isInsideHovered(e: MouseEvent): boolean {
    if (!hoveredEl) return false;
    const rect = hoveredEl.getBoundingClientRect();
    return (
      e.clientX >= rect.left - PAD &&
      e.clientX <= rect.right + PAD &&
      e.clientY >= rect.top - PAD &&
      e.clientY <= rect.bottom + PAD
    );
  }

  /**
   * Calling preventDefault on pointerdown does NOT stop the synthesized click
   * that fires later in the same gesture, so anchors still navigate and buttons
   * still trigger their handlers. We solve it by installing an independent,
   * short-lived capture-phase blocker on window that eats every follow-up
   * pointer/mouse event for the next ~400ms. It outlives deactivate() so the
   * cleanup of picker listeners cannot leave a gap for the native click to slip
   * through.
   */
  function suppressNativeFollowups(): void {
    const events = [
      "mousedown", "mouseup", "pointerup", "pointercancel",
      "click", "auxclick", "dblclick", "contextmenu",
    ] as const;
    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    for (const evt of events) window.addEventListener(evt, block, true);
    setTimeout(() => {
      for (const evt of events) window.removeEventListener(evt, block, true);
    }, 400);
  }

  function onInteraction(e: Event): void {
    if (!active) return;
    const mouseEvent = e as MouseEvent;
    const inside = isInsideHovered(mouseEvent);

    if (e.type === "pointerdown" && inside && hoveredEl) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const target = hoveredEl;
      // Install the blocker BEFORE deactivate so window-level listeners are in
      // place when the browser dispatches the rest of this gesture.
      suppressNativeFollowups();

      const prompt = buildPrompt(target);
      navigator.clipboard.writeText(prompt)
        .then(() => {
          if (userSettings.showCopyToast) showToast(uiLabels().copied(prompt.length));
        })
        .catch(() => showToast(uiLabels().copyFailed));

      deactivate();
      return;
    }

    if (inside) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      deactivate();
    }
  }

  function activate(): void {
    active = true;
    for (const evt of INTERACTION_EVENTS) {
      document.addEventListener(evt, onInteraction, true);
    }
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "crosshair";
    // No activation toast: the crosshair cursor + hover highlight are the
    // visual cue. A bottom-right toast hides any element the user might be
    // trying to pick down there.
  }

  function deactivate(): void {
    active = false;
    hoveredEl = null;
    for (const evt of INTERACTION_EVENTS) {
      document.removeEventListener(evt, onInteraction, true);
    }
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "";
    hideOverlay();
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if ((msg as { action?: string })?.action === "togglePicker") {
      if (active) deactivate();
      else activate();
      sendResponse({ ok: true });
    }
  });
}
