import {
  STORAGE_KEY,
  getSettings,
  resolveLanguage,
  type Settings,
} from "./settings";
import { getMessages } from "./i18n";

const PICKER_MENU_ID = "element-snapper-start-picker";
const SETTINGS_MENU_ID = "element-snapper-open-settings";

async function togglePicker(tab: chrome.tabs.Tab | undefined): Promise<void> {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { action: "togglePicker" });
  } catch {
    // Content script unavailable (e.g. chrome:// page or pre-install tab).
  }
}

async function setupContextMenus(): Promise<void> {
  const settings: Settings = await getSettings();
  const labels = getMessages(resolveLanguage(settings.uiLanguage));

  await chrome.action.setTitle({ title: labels.menuStart });
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: PICKER_MENU_ID,
      title: labels.menuStart,
      contexts: ["page", "selection", "link", "image"],
    });
    chrome.contextMenus.create({
      id: SETTINGS_MENU_ID,
      title: labels.menuSettings,
      contexts: ["action"],
    });
  });
}

chrome.runtime.onInstalled.addListener(setupContextMenus);
chrome.runtime.onStartup.addListener(setupContextMenus);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes[STORAGE_KEY]) {
    void setupContextMenus();
  }
});

chrome.action.onClicked.addListener((tab) => {
  void togglePicker(tab);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === PICKER_MENU_ID) {
    void togglePicker(tab);
  }
  if (info.menuItemId === SETTINGS_MENU_ID) {
    void chrome.runtime.openOptionsPage();
  }
});

chrome.commands?.onCommand.addListener(async (command) => {
  if (command === "open-options") {
    await chrome.runtime.openOptionsPage();
  } else if (command === "toggle-picker") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await togglePicker(tab);
  }
});
