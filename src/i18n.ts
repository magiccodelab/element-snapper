import type { ResolvedLanguage } from "./settings";

export interface Messages {
  menuStart: string;
  menuSettings: string;
  promptIntroWithStyles: string;
  promptIntroWithoutStyles: string;
  parentChain: string;
  parentChainHint: string;
  selectedElement: string;
  elementDimensions: string;
  viewport: string;
  copied: (count: number) => string;
  copyFailed: string;
  pickerActive: string;
}

export const DICTIONARY: Record<ResolvedLanguage, Messages> = {
  en: {
    menuStart: "Start Element Snapper",
    menuSettings: "Element Snapper Settings",
    promptIntroWithStyles:
      "I need help with this HTML element. Here is the element with its selected attributes and computed styles:",
    promptIntroWithoutStyles:
      "I need help with this HTML element. Here is the selected element structure:",
    parentChain: "Parent chain",
    parentChainHint: "outermost to innermost",
    selectedElement: "Selected element",
    elementDimensions: "Element dimensions",
    viewport: "Viewport",
    copied: (count) => `Copied ${count} chars to clipboard`,
    copyFailed: "Copy failed — check clipboard permissions",
    pickerActive: "Element Snapper active — click an element, Esc cancels",
  },
  "zh-CN": {
    menuStart: "启动 Element Snapper",
    menuSettings: "Element Snapper 设置",
    promptIntroWithStyles: "我需要分析这个 HTML 元素。下面是带有关键属性和计算样式的元素信息：",
    promptIntroWithoutStyles: "我需要分析这个 HTML 元素。下面是选中元素的结构：",
    parentChain: "父级链路",
    parentChainHint: "从外到内",
    selectedElement: "选中元素",
    elementDimensions: "元素尺寸",
    viewport: "视口尺寸",
    copied: (count) => `已复制 ${count} 个字符到剪贴板`,
    copyFailed: "复制失败，请检查剪贴板权限",
    pickerActive: "Element Snapper 已启动 · 点击元素复制，按 Esc 取消",
  },
  "zh-TW": {
    menuStart: "啟動 Element Snapper",
    menuSettings: "Element Snapper 設定",
    promptIntroWithStyles: "我需要分析這個 HTML 元素。下面是帶有關鍵屬性和計算樣式的元素資訊：",
    promptIntroWithoutStyles: "我需要分析這個 HTML 元素。下面是選中元素的結構：",
    parentChain: "父層鏈路",
    parentChainHint: "由外到內",
    selectedElement: "選中元素",
    elementDimensions: "元素尺寸",
    viewport: "視窗尺寸",
    copied: (count) => `已複製 ${count} 個字元到剪貼簿`,
    copyFailed: "複製失敗，請檢查剪貼簿權限",
    pickerActive: "Element Snapper 已啟動 · 點擊元素複製，按 Esc 取消",
  },
};

export function getMessages(language: ResolvedLanguage): Messages {
  return DICTIONARY[language] ?? DICTIONARY.en;
}
