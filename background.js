importScripts("settings.js", "i18n.js");

const PICKER_MENU_ID = "element-snapper-start-picker";
const SETTINGS_MENU_ID = "element-snapper-open-settings";
const settingsApi = globalThis.ElementSnapperSettings;
const i18nApi = globalThis.ElementSnapperI18n;

async function togglePicker(tab) {
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { action: "togglePicker" });
  } catch (error) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["settings.js", "i18n.js", "content.js"],
      });
      await chrome.tabs.sendMessage(tab.id, { action: "togglePicker" });
    } catch (injectionError) {
      // Some browser pages disallow extension scripts.
    }
  }
}

async function setupContextMenus() {
  const settings = await settingsApi.getSettings();
  const labels = i18nApi.getMessages(settingsApi.resolveLanguage(settings.uiLanguage));

  chrome.action.setTitle({ title: labels.menuStart });
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
  if (areaName === "sync" && changes[settingsApi.STORAGE_KEY]) {
    setupContextMenus();
  }
});

chrome.action.onClicked.addListener(togglePicker);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === PICKER_MENU_ID) {
    togglePicker(tab);
  }
  if (info.menuItemId === SETTINGS_MENU_ID) {
    chrome.runtime.openOptionsPage();
  }
});
