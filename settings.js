(() => {
  const root = globalThis;
  const STORAGE_KEY = "elementSnapperSettings";

  const DEFAULT_SETTINGS = {
    captureScope: "withParents",
    includeComputedStyles: true,
    includeElementStyle: true,
    uiLanguage: "auto",
    promptLanguage: "auto",
    theme: "system",
  };

  const VALID_VALUES = {
    captureScope: new Set(["withParents", "selfOnly"]),
    uiLanguage: new Set(["auto", "zh-CN", "zh-TW", "en"]),
    promptLanguage: new Set(["auto", "zh-CN", "zh-TW", "en"]),
    theme: new Set(["system", "light", "dark"]),
  };

  function normalizeLanguage(language) {
    const raw = String(language || "").toLowerCase();
    if (raw.startsWith("zh-tw") || raw.startsWith("zh-hk") || raw.startsWith("zh-mo") || raw.includes("hant")) {
      return "zh-TW";
    }
    if (raw.startsWith("zh")) return "zh-CN";
    return "en";
  }

  function getBrowserLanguage() {
    if (root.chrome?.i18n?.getUILanguage) {
      return root.chrome.i18n.getUILanguage();
    }
    return root.navigator?.language || "en";
  }

  function resolveLanguage(value) {
    if (value && value !== "auto") return value;
    return normalizeLanguage(getBrowserLanguage());
  }

  function sanitizeSettings(input = {}) {
    const settings = { ...DEFAULT_SETTINGS, ...input };

    for (const key of ["captureScope", "uiLanguage", "promptLanguage", "theme"]) {
      if (!VALID_VALUES[key].has(settings[key])) {
        settings[key] = DEFAULT_SETTINGS[key];
      }
    }

    settings.includeComputedStyles = Boolean(settings.includeComputedStyles);
    settings.includeElementStyle = Boolean(settings.includeElementStyle);
    return settings;
  }

  async function getSettings() {
    try {
      if (root.chrome?.storage?.sync) {
        const data = await root.chrome.storage.sync.get(STORAGE_KEY);
        return sanitizeSettings(data[STORAGE_KEY]);
      }
      if (root.localStorage) {
        return sanitizeSettings(JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "{}"));
      }
    } catch (error) {
      return sanitizeSettings();
    }
    return sanitizeSettings();
  }

  async function saveSettings(nextSettings) {
    const settings = sanitizeSettings(nextSettings);
    if (root.chrome?.storage?.sync) {
      await root.chrome.storage.sync.set({ [STORAGE_KEY]: settings });
    } else if (root.localStorage) {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    return settings;
  }

  root.ElementSnapperSettings = {
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    getSettings,
    saveSettings,
    sanitizeSettings,
    resolveLanguage,
  };
})();
