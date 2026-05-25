const PICKER_MENU_ID = "element-snapper-start-picker";

async function togglePicker(tab) {
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { action: "togglePicker" });
  } catch (error) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      await chrome.tabs.sendMessage(tab.id, { action: "togglePicker" });
    } catch (injectionError) {
      // Some browser pages disallow extension scripts.
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: PICKER_MENU_ID,
      title: "Start Element Snapper",
      contexts: ["page", "selection", "link", "image"],
    });
  });
});

chrome.action.onClicked.addListener(togglePicker);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === PICKER_MENU_ID) {
    togglePicker(tab);
  }
});
