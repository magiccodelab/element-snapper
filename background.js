const PICKER_MENU_ID = "element-snapper-start-picker";

function togglePicker(tab) {
  if (!tab?.id) return;

  const message = chrome.tabs.sendMessage(tab.id, { action: "togglePicker" });
  if (message?.catch) {
    message.catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: PICKER_MENU_ID,
    title: "Start Element Snapper",
    contexts: ["page", "selection", "link", "image"],
  });
});

chrome.action.onClicked.addListener(togglePicker);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === PICKER_MENU_ID) {
    togglePicker(tab);
  }
});
