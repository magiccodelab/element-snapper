export const STORAGE_KEY = "elementSnapperSettings";

export type CaptureScope = "selfOnly" | "withImmediateParent" | "withParents";
export type LanguageOption = "auto" | "zh-CN" | "zh-TW" | "en";
export type ResolvedLanguage = "zh-CN" | "zh-TW" | "en";
export type ThemeOption = "system" | "light" | "dark";

export interface Settings {
  captureScope: CaptureScope;
  includeComputedStyles: boolean;
  includeElementStyle: boolean;
  showCopyToast: boolean;
  uiLanguage: LanguageOption;
  promptLanguage: LanguageOption;
  theme: ThemeOption;
}

export const DEFAULT_SETTINGS: Settings = {
  captureScope: "withParents",
  includeComputedStyles: true,
  includeElementStyle: true,
  showCopyToast: true,
  uiLanguage: "auto",
  // Prompts default to English so the LLM gets a stable, widely-supported
  // language regardless of where the user happens to be browsing.
  promptLanguage: "en",
  theme: "system",
};

const VALID_VALUES = {
  captureScope: new Set<CaptureScope>(["selfOnly", "withImmediateParent", "withParents"]),
  uiLanguage: new Set<LanguageOption>(["auto", "zh-CN", "zh-TW", "en"]),
  promptLanguage: new Set<LanguageOption>(["auto", "zh-CN", "zh-TW", "en"]),
  theme: new Set<ThemeOption>(["system", "light", "dark"]),
} as const;

function normalizeLanguage(language: string | undefined | null): ResolvedLanguage {
  const raw = String(language ?? "").toLowerCase();
  if (raw.startsWith("zh-tw") || raw.startsWith("zh-hk") || raw.startsWith("zh-mo") || raw.includes("hant")) {
    return "zh-TW";
  }
  if (raw.startsWith("zh")) return "zh-CN";
  return "en";
}

function getBrowserLanguage(): string {
  if (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) {
    return chrome.i18n.getUILanguage();
  }
  return globalThis.navigator?.language ?? "en";
}

export function resolveLanguage(value: LanguageOption): ResolvedLanguage {
  if (value !== "auto") return value;
  return normalizeLanguage(getBrowserLanguage());
}

export function sanitizeSettings(input: Partial<Settings> = {}): Settings {
  const merged: Settings = { ...DEFAULT_SETTINGS, ...input };
  for (const key of ["captureScope", "uiLanguage", "promptLanguage", "theme"] as const) {
    const set = VALID_VALUES[key] as Set<string>;
    if (!set.has(merged[key])) {
      (merged[key] as Settings[typeof key]) = DEFAULT_SETTINGS[key];
    }
  }
  merged.includeComputedStyles = Boolean(merged.includeComputedStyles);
  merged.includeElementStyle = Boolean(merged.includeElementStyle);
  merged.showCopyToast = input.showCopyToast === undefined
    ? DEFAULT_SETTINGS.showCopyToast
    : Boolean(input.showCopyToast);
  return merged;
}

export async function getSettings(): Promise<Settings> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      const data = await chrome.storage.sync.get(STORAGE_KEY);
      return sanitizeSettings(data[STORAGE_KEY] as Partial<Settings> | undefined);
    }
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      return sanitizeSettings(raw ? (JSON.parse(raw) as Partial<Settings>) : {});
    }
  } catch {
    return sanitizeSettings();
  }
  return sanitizeSettings();
}

export async function saveSettings(next: Partial<Settings>): Promise<Settings> {
  const settings = sanitizeSettings(next);
  if (typeof chrome !== "undefined" && chrome.storage?.sync) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
  }
  // Always mirror to localStorage so the options page can read theme + language
  // synchronously at boot and avoid a flash of incorrect theme.
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage quota or disabled — fine.
    }
  }
  return settings;
}
