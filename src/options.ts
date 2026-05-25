import "./options.css";
import {
  DEFAULT_SETTINGS,
  getSettings,
  resolveLanguage,
  sanitizeSettings,
  saveSettings,
  type Settings,
  type ResolvedLanguage,
} from "./settings";

interface OptionsCopy {
  eyebrow: string;
  title: string;
  saved: string;
  saving: string;
  captureLabel: string;
  captureTitle: string;
  scopeTitle: string;
  scopeSelf: string;
  scopeSelfDesc: string;
  scopeImmediate: string;
  scopeImmediateDesc: string;
  scopeParents: string;
  scopeParentsDesc: string;
  computedTitle: string;
  computedDesc: string;
  elementStyleTitle: string;
  elementStyleDesc: string;
  copyToastTitle: string;
  copyToastDesc: string;
  promptLanguageTitle: string;
  promptLanguageDesc: string;
  uiLanguage: string;
  auto: string;
  themeTitle: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  previewLabel: string;
  previewTitle: string;
  reset: string;
  skipToContent: string;
}

const OPTIONS_COPY: Record<ResolvedLanguage, OptionsCopy> = {
  en: {
    eyebrow: "Extension Settings",
    title: "Element Snapper",
    saved: "Saved",
    saving: "Saving",
    captureLabel: "Capture",
    captureTitle: "Prompt content",
    scopeTitle: "Element range",
    scopeSelf: "Selected only",
    scopeSelfDesc: "Just the clicked element",
    scopeImmediate: "+ direct parent",
    scopeImmediateDesc: "One level of context",
    scopeParents: "+ parent chain",
    scopeParentsDesc: "Three levels up",
    computedTitle: "Include computed styles",
    computedDesc: "Adds browser-resolved CSS as inline styles",
    elementStyleTitle: "Include original element style",
    elementStyleDesc: "Keeps the raw element.style attribute when present",
    copyToastTitle: "Show copy-success toast",
    copyToastDesc: "Floating confirmation after each copy — failures and the picker-active hint always show",
    promptLanguageTitle: "Prompt language",
    promptLanguageDesc: "Language used inside the copied prompt — defaults to English for stable LLM input",
    uiLanguage: "Interface language",
    auto: "Follow browser",
    themeTitle: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    previewLabel: "Preview",
    previewTitle: "Prompt shape",
    reset: "Reset defaults",
    skipToContent: "Skip to settings",
  },
  "zh-CN": {
    eyebrow: "扩展设置",
    title: "Element Snapper",
    saved: "已保存",
    saving: "保存中",
    captureLabel: "采集",
    captureTitle: "提示词内容",
    scopeTitle: "元素范围",
    scopeSelf: "仅选中元素",
    scopeSelfDesc: "只复制点击到的元素本身",
    scopeImmediate: "+ 直接父元素",
    scopeImmediateDesc: "再向上保留一层上下文",
    scopeParents: "+ 父级链路",
    scopeParentsDesc: "向上保留三层父级",
    computedTitle: "携带计算样式",
    computedDesc: "把浏览器解析后的 CSS 写入 inline style",
    elementStyleTitle: "携带原始 element.style",
    elementStyleDesc: "元素本身有 style 属性时保留原始值",
    copyToastTitle: "复制成功提示",
    copyToastDesc: "每次复制后浮窗确认，关闭后仍保留失败提示与「已激活」提示",
    promptLanguageTitle: "提示词语言",
    promptLanguageDesc: "复制出来的提示词正文使用的语言，默认英文以获得更稳定的 LLM 输入",
    uiLanguage: "界面语言",
    auto: "跟随浏览器",
    themeTitle: "主题",
    themeSystem: "跟随系统",
    themeLight: "白天模式",
    themeDark: "夜间模式",
    previewLabel: "预览",
    previewTitle: "提示词结构",
    reset: "恢复默认",
    skipToContent: "跳到设置",
  },
  "zh-TW": {
    eyebrow: "擴充功能設定",
    title: "Element Snapper",
    saved: "已儲存",
    saving: "儲存中",
    captureLabel: "擷取",
    captureTitle: "提示詞內容",
    scopeTitle: "元素範圍",
    scopeSelf: "僅選中元素",
    scopeSelfDesc: "只複製點擊到的元素本身",
    scopeImmediate: "+ 直接父層",
    scopeImmediateDesc: "再向上保留一層上下文",
    scopeParents: "+ 父層鏈路",
    scopeParentsDesc: "向上保留三層父層",
    computedTitle: "攜帶計算樣式",
    computedDesc: "把瀏覽器解析後的 CSS 寫入 inline style",
    elementStyleTitle: "攜帶原始 element.style",
    elementStyleDesc: "元素本身有 style 屬性時保留原始值",
    copyToastTitle: "複製成功提示",
    copyToastDesc: "每次複製後浮窗確認，關閉後仍保留失敗提示與「已啟動」提示",
    promptLanguageTitle: "提示詞語言",
    promptLanguageDesc: "複製出來的提示詞正文使用的語言，預設英文以獲得更穩定的 LLM 輸入",
    uiLanguage: "介面語言",
    auto: "跟隨瀏覽器",
    themeTitle: "主題",
    themeSystem: "跟隨系統",
    themeLight: "白天模式",
    themeDark: "夜間模式",
    previewLabel: "預覽",
    previewTitle: "提示詞結構",
    reset: "恢復預設",
    skipToContent: "跳到設定",
  },
};

interface PreviewLabels {
  intro: string;
  parents: string;
  selected: string;
  dims: string;
  viewport: string;
}

function previewLabels(settings: Settings, lang: ResolvedLanguage): PreviewLabels {
  const withStyles = settings.includeComputedStyles;
  const map: Record<ResolvedLanguage, PreviewLabels> = {
    en: {
      intro: withStyles
        ? "I need help with this HTML element. Here is the element with its selected attributes and computed styles:"
        : "I need help with this HTML element. Here is the selected element structure:",
      parents: "**Parent chain** (outermost to innermost):",
      selected: "**Selected element:**",
      dims: "Element dimensions: 128x40px",
      viewport: "Viewport: 1440x900px",
    },
    "zh-CN": {
      intro: withStyles
        ? "我需要分析这个 HTML 元素。下面是带有关键属性和计算样式的元素信息："
        : "我需要分析这个 HTML 元素。下面是选中元素的结构：",
      parents: "**父级链路**（从外到内）：",
      selected: "**选中元素：**",
      dims: "元素尺寸：128x40px",
      viewport: "视口尺寸：1440x900px",
    },
    "zh-TW": {
      intro: withStyles
        ? "我需要分析這個 HTML 元素。下面是帶有關鍵屬性和計算樣式的元素資訊："
        : "我需要分析這個 HTML 元素。下面是選中元素的結構：",
      parents: "**父層鏈路**（由外到內）：",
      selected: "**選中元素：**",
      dims: "元素尺寸：128x40px",
      viewport: "視窗尺寸：1440x900px",
    },
  };
  return map[lang];
}

function sampleHtml(settings: Settings): string {
  let style = "";
  if (settings.includeComputedStyles) {
    style = ` style="display: inline-flex; padding: 10px 14px; border-radius: 8px"`;
  } else if (settings.includeElementStyle) {
    style = ` style="padding: 10px 14px"`;
  }
  return `<button class="primary-action"${style}>\n  Continue\n</button>`;
}

let settings: Settings = { ...DEFAULT_SETTINGS };
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const formFields = Array.from(
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[name], select[name]"),
);
const saveStatus = document.getElementById("saveStatus") as HTMLDivElement;
const preview = document.getElementById("preview") as HTMLPreElement;
const resetButton = document.getElementById("resetButton") as HTMLButtonElement;

function copy(): OptionsCopy {
  const lang = resolveLanguage(settings.uiLanguage);
  return OPTIONS_COPY[lang] ?? OPTIONS_COPY.en;
}

function t(key: keyof OptionsCopy): string {
  return copy()[key] ?? OPTIONS_COPY.en[key] ?? String(key);
}

function applyTheme(): void {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = settings.theme === "dark" || (settings.theme === "system" && prefersDark);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
}

function renderText(): void {
  document.documentElement.lang = resolveLanguage(settings.uiLanguage);
  for (const node of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = node.dataset.i18n as keyof OptionsCopy | undefined;
    if (key) node.textContent = t(key);
  }
  for (const node of document.querySelectorAll<HTMLElement>("[data-i18n-title]")) {
    const key = node.dataset.i18nTitle as keyof OptionsCopy | undefined;
    if (key) node.setAttribute("title", t(key));
  }
  saveStatus.textContent = t("saved");
  document.title = `${t("title")} · ${t("eyebrow")}`;
}

function renderFields(): void {
  for (const field of formFields) {
    const name = field.name as keyof Settings;
    if (field instanceof HTMLInputElement) {
      if (field.type === "checkbox") field.checked = Boolean(settings[name]);
      else if (field.type === "radio") field.checked = field.value === settings[name];
      else field.value = String(settings[name]);
    } else {
      field.value = String(settings[name]);
    }
  }
}

function renderPreview(): void {
  const lang = resolveLanguage(settings.promptLanguage);
  const labels = previewLabels(settings, lang);
  const lines: string[] = [labels.intro, ""];
  if (settings.captureScope === "withParents" || settings.captureScope === "withImmediateParent") {
    lines.push(labels.parents, "");
    lines.push("- `<main.wrapper>` - 960x620px");
    if (settings.captureScope === "withParents") {
      lines.push("- `<section.panel>` - 720x420px");
      lines.push("- `<form.actions>` - 320x88px");
    }
    lines.push("");
  }
  lines.push(labels.selected, "", "```html", sampleHtml(settings), "```", "", labels.dims, labels.viewport);
  preview.textContent = lines.join("\n");
}

function render(): void {
  applyTheme();
  renderText();
  renderFields();
  renderPreview();
}

async function persist(patch: Partial<Settings>): Promise<void> {
  settings = sanitizeSettings({ ...settings, ...patch });
  render();
  saveStatus.textContent = t("saving");
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    settings = await saveSettings(settings);
    saveStatus.textContent = t("saved");
  }, 120);
}

for (const field of formFields) {
  field.addEventListener("change", () => {
    const name = field.name as keyof Settings;
    const value =
      field instanceof HTMLInputElement && field.type === "checkbox"
        ? field.checked
        : field.value;
    void persist({ [name]: value } as Partial<Settings>);
  });
}

resetButton.addEventListener("click", () => {
  void persist({ ...DEFAULT_SETTINGS });
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

void (async () => {
  settings = await getSettings();
  render();
})();
