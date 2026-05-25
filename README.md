<p align="right">
  <b>简体中文</b> · <a href="README.en.md">English</a>
</p>

<p align="center">
  <img src="assets/readme-banner.png" alt="Element Snapper —— 点击页面元素，一键复制为 AI 友好的提示词" width="100%">
</p>

<h1 align="center">Element Snapper</h1>

<p align="center">
  一个轻量的 Chrome 扩展：点击页面上任意元素，把它的 HTML 和计算样式一并复制成 AI 友好的 Markdown 提示词。
</p>

<p align="center">
  <img src="icons/icon128.png" alt="Element Snapper 图标" width="96" height="96">
</p>

## 为什么需要它

和 AI / 编程 agent 一起做前端时，**截图能传达的信息有限**：颜色看起来对了但不知道是哪个 design token，间距好像不对但说不清是 `padding` 还是 `gap`，SVG 里某个节点偏了又没法精确指给模型看。

Element Snapper 让你直接在浏览器里**点中任意一个元素**——**小到 SVG 里的一根 `<path>`、一个 `<circle>`，大到整个卡片容器甚至外层布局**——把它的 HTML、计算样式（computed CSS）、父级链路一次性复制成一段 AI 友好的 Markdown，粘进对话框，模型就拿到了截图里看不到的那些上下文：确切的 token 值、布局类型、层级关系、视口与元素尺寸。

常见用法：

- 问 AI"这个按钮为什么没居中" → 选中按钮并带上父级链路，让 agent 看到外面那一层 flex 容器。
- 让 AI 帮你重画一个图标 → 直接选中 SVG 内部的某个 `<path>` / `<circle>` / `<rect>`，而不是把整张插画都塞进去。
- 让 AI 复刻一整段布局 → 选中整个卡片容器，连同 3 层父级一并带走，剩下的交给计算样式自己说话。
- 提 UI bug → 选中坏掉的那个元素，尺寸、原始 inline style、祖先选择器在复现块里一目了然。

## 安装

到 [Releases 页](https://github.com/magiccodelab/element-snapper/releases/latest) 下载最新版本。每次发版会同时上传两个文件：

| 文件 | 适合场景 | 安装方法 |
| --- | --- | --- |
| `element-snapper-<version>.zip` | **推荐**。预构建好的扩展目录。 | 解压 → 打开 `chrome://extensions` → 开启 **开发者模式** → 点 **加载已解压的扩展程序 / Load unpacked** → 选刚解压出来的目录。 |
| `element-snapper-<version>.crx` | 想直接拖拽安装、不想留一个目录在硬盘上。 | 在 `chrome://extensions` 开启开发者模式后，把 `.crx` 文件拖到页面上。这是自签名 CRX、未上架 Chrome Web Store，Chrome 会提示来源不可信、下次启动可能被禁用——属于正常现象，点 **保留 / Keep** 即可。 |

也可以从源码自行构建——见下面的 **本地开发**。

## 技术栈

- TypeScript
- Vite + `@crxjs/vite-plugin`（MV3 打包）
- Tailwind CSS v4
- pnpm

## 本地开发

1. `pnpm install`
2. `pnpm dev`——保存即增量构建到 `dist/`。
3. 打开 `chrome://extensions`，开启开发者模式，**Load unpacked** 选 `dist/` 目录。
4. 从扩展图标或页面右键菜单启动选择器。
5. 点击元素复制提示词，按 `Esc` 取消。

只想跑一次生产构建：`pnpm build`，然后加载 `dist/`。
只做类型检查不出文件：`pnpm typecheck`。

## 快捷键

- `Alt+Shift+E` —— 在当前 tab 启动 / 取消选择器
- `Alt+Shift+S` —— 打开设置页
- 右键工具栏图标 → **Element Snapper Settings**（Chrome 自带的图标右键菜单永远会弹出来，我们的设置入口放在了最上面）
- 在页面任意位置右键 → **Start Element Snapper**

快捷键可以在 `chrome://extensions/shortcuts` 自行改键。

## 设置

设置页可以从 Chrome 扩展详情页打开，也可以用 `Alt+Shift+S`，或者右键扩展图标选 settings 进入。

- 元素范围：仅选中元素 / + 直接父元素 / + 父级链（3 层）。
- 是否携带计算样式（把浏览器解析后的 CSS 写入 inline style）。
- 是否保留原始 `element.style` 属性。
- 是否显示"复制成功"浮窗提示（失败提示总是显示）。
- 提示词语言：默认 **English**，也可切到简体 / 繁体中文，或跟随浏览器。
- 界面语言：跟随浏览器，或固定为简体 / 繁体 / 英文。
- 主题：跟随系统、亮色、暗色。

## 复制出来的内容

- 选中元素的 HTML 结构
- 可选：选中元素的计算样式（以 inline style 写出）
- 可选：选中元素的原始 `element.style` 属性
- 可选：父级链路（带选择器、样式、尺寸）
- 选中元素的尺寸 + 当前视口尺寸

## 隐私

Element Snapper 完全在本地浏览器里运行，不会把页面内容上传到任何服务器。
