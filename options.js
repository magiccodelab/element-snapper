const OPTIONS_COPY = {
  en: {
    eyebrow: "Extension Settings",
    title: "Element Snapper",
    saved: "Saved",
    saving: "Saving",
    captureLabel: "Capture",
    captureTitle: "Prompt Content",
    scopeTitle: "Element range",
    scopeParents: "Selected + parents",
    scopeParentsDesc: "Keeps the current context-rich output.",
    scopeSelf: "Selected only",
    scopeSelfDesc: "Copies just the clicked element.",
    computedTitle: "Include computed styles",
    computedDesc: "Adds browser-resolved CSS as inline styles.",
    elementStyleTitle: "Include original element style",
    elementStyleDesc: "Keeps the raw element.style attribute when present.",
    appearanceLabel: "Appearance",
    appearanceTitle: "Language & Theme",
    uiLanguage: "Interface language",
    promptLanguage: "Prompt language",
    auto: "Follow browser",
    themeTitle: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    previewLabel: "Preview",
    previewTitle: "Prompt Shape",
    reset: "Reset defaults",
  },
  "zh-CN": {
    eyebrow: "扩展设置",
    title: "Element Snapper",
    saved: "已保存",
    saving: "保存中",
    captureLabel: "采集",
    captureTitle: "提示词内容",
    scopeTitle: "元素范围",
    scopeParents: "选中元素 + 父层级",
    scopeParentsDesc: "保留当前这种上下文更完整的输出。",
    scopeSelf: "仅选中元素",
    scopeSelfDesc: "只复制点击到的元素本身。",
    computedTitle: "携带计算样式",
    computedDesc: "把浏览器解析后的 CSS 写入 inline style。",
    elementStyleTitle: "携带原始 element.style",
    elementStyleDesc: "元素本身有 style 属性时保留原始值。",
    appearanceLabel: "外观",
    appearanceTitle: "语言与主题",
    uiLanguage: "界面语言",
    promptLanguage: "提示词语言",
    auto: "跟随浏览器",
    themeTitle: "主题",
    themeSystem: "跟随系统",
    themeLight: "白天模式",
    themeDark: "夜间模式",
    previewLabel: "预览",
    previewTitle: "提示词结构",
    reset: "恢复默认",
  },
  "zh-TW": {
    eyebrow: "擴充功能設定",
    title: "Element Snapper",
    saved: "已儲存",
    saving: "儲存中",
    captureLabel: "擷取",
    captureTitle: "提示詞內容",
    scopeTitle: "元素範圍",
    scopeParents: "選中元素 + 父層級",
    scopeParentsDesc: "保留目前這種上下文更完整的輸出。",
    scopeSelf: "僅選中元素",
    scopeSelfDesc: "只複製點擊到的元素本身。",
    computedTitle: "攜帶計算樣式",
    computedDesc: "把瀏覽器解析後的 CSS 寫入 inline style。",
    elementStyleTitle: "攜帶原始 element.style",
    elementStyleDesc: "元素本身有 style 屬性時保留原始值。",
    appearanceLabel: "外觀",
    appearanceTitle: "語言與主題",
    uiLanguage: "介面語言",
    promptLanguage: "提示詞語言",
    auto: "跟隨瀏覽器",
    themeTitle: "主題",
    themeSystem: "跟隨系統",
    themeLight: "白天模式",
    themeDark: "夜間模式",
    previewLabel: "預覽",
    previewTitle: "提示詞結構",
    reset: "恢復預設",
  },
};

function sampleHtml() {
  let style = "";
  if (settings.includeComputedStyles) {
    style = ` style="display: inline-flex; padding: 10px 14px; border-radius: 8px"`;
  } else if (settings.includeElementStyle) {
    style = ` style="padding: 10px 14px"`;
  }
  return `<button class="primary-action"${style}>
  Continue
</button>`;
}

let settings = { ...ElementSnapperSettings.DEFAULT_SETTINGS };
let saveTimer = null;

const formFields = Array.from(document.querySelectorAll("input[name], select[name]"));
const saveStatus = document.getElementById("saveStatus");
const preview = document.getElementById("preview");
const resetButton = document.getElementById("resetButton");

function t(key) {
  const lang = ElementSnapperSettings.resolveLanguage(settings.uiLanguage);
  return OPTIONS_COPY[lang]?.[key] || OPTIONS_COPY.en[key] || key;
}

function applyTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = settings.theme === "dark" || (settings.theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

function renderText() {
  document.documentElement.lang = ElementSnapperSettings.resolveLanguage(settings.uiLanguage);
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  saveStatus.textContent = t("saved");
}

function renderFields() {
  for (const field of formFields) {
    if (field.type === "checkbox") {
      field.checked = Boolean(settings[field.name]);
    } else if (field.type === "radio") {
      field.checked = field.value === settings[field.name];
    } else {
      field.value = settings[field.name];
    }
  }
}

function renderPreview() {
  const promptLang = ElementSnapperSettings.resolveLanguage(settings.promptLanguage);
  const labels = {
    en: {
      intro: settings.includeComputedStyles
        ? "I need help with this HTML element. Here is the element with its selected attributes and computed styles:"
        : "I need help with this HTML element. Here is the selected element structure:",
      parents: "**Parent chain** (outermost to innermost):",
      selected: "**Selected element:**",
      dims: "Element dimensions: 128x40px",
      viewport: "Viewport: 1440x900px",
    },
    "zh-CN": {
      intro: settings.includeComputedStyles
        ? "我需要分析这个 HTML 元素。下面是带有关键属性和计算样式的元素信息："
        : "我需要分析这个 HTML 元素。下面是选中元素的结构：",
      parents: "**父级链路**（从外到内）：",
      selected: "**选中元素：**",
      dims: "元素尺寸：128x40px",
      viewport: "视口尺寸：1440x900px",
    },
    "zh-TW": {
      intro: settings.includeComputedStyles
        ? "我需要分析這個 HTML 元素。下面是帶有關鍵屬性和計算樣式的元素資訊："
        : "我需要分析這個 HTML 元素。下面是選中元素的結構：",
      parents: "**父層鏈路**（由外到內）：",
      selected: "**選中元素：**",
      dims: "元素尺寸：128x40px",
      viewport: "視窗尺寸：1440x900px",
    },
  }[promptLang];

  const lines = [labels.intro, ""];
  if (settings.captureScope === "withParents") {
    lines.push(labels.parents, "", "- `<main.wrapper>` - 960x620px", "");
  }
  lines.push(labels.selected, "", "```html", sampleHtml(), "```", "", labels.dims, labels.viewport);
  preview.textContent = lines.join("\n");
}

function render() {
  applyTheme();
  renderText();
  renderFields();
  renderPreview();
}

async function persist(patch) {
  settings = ElementSnapperSettings.sanitizeSettings({ ...settings, ...patch });
  render();
  saveStatus.textContent = t("saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    settings = await ElementSnapperSettings.saveSettings(settings);
    saveStatus.textContent = t("saved");
  }, 120);
}

for (const field of formFields) {
  field.addEventListener("change", () => {
    const value = field.type === "checkbox" ? field.checked : field.value;
    persist({ [field.name]: value });
  });
}

resetButton.addEventListener("click", () => {
  persist({ ...ElementSnapperSettings.DEFAULT_SETTINGS });
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

(async function init() {
  settings = await ElementSnapperSettings.getSettings();
  render();
})();
