<p align="center">
  <img src="assets/readme-banner.png" alt="Element Snapper — click any element, copy as prompt-ready Markdown" width="100%">
</p>

<h1 align="center">Element Snapper</h1>

<p align="center">
  A lightweight Chrome extension for selecting any element on a page and copying its HTML plus computed CSS into a prompt-friendly Markdown block.
</p>

<p align="center">
  <img src="icons/icon128.png" alt="Element Snapper icon" width="96" height="96">
</p>

## Install

Grab the latest build from the [Releases page](https://github.com/magiccodelab/element-snapper/releases/latest). Two assets are published every release:

| File | When to pick it | How to install |
| --- | --- | --- |
| `element-snapper-<version>.zip` | **Recommended.** Pre-built extension bundle. | Unzip → open `chrome://extensions` → enable **Developer mode** → click **Load unpacked** → select the unzipped folder. |
| `element-snapper-<version>.crx` | Drag-drop install for users who don't want a folder lying around. | Open `chrome://extensions`, enable **Developer mode**, then drag the `.crx` file onto the page. Chrome will warn the extension is not from the Web Store and may disable it on next launch — that is expected for a self-signed CRX. Click **Keep** to confirm. |

Or build from source — see **Develop** below.

## Stack

- TypeScript
- Vite + `@crxjs/vite-plugin` (MV3 bundler)
- Tailwind CSS v4
- pnpm

## Develop

1. `pnpm install`
2. `pnpm dev` — rebuilds `dist/` on every save.
3. Open `chrome://extensions`, enable developer mode, choose **Load unpacked**, and select the `dist/` folder.
4. Start the picker from the extension icon or from the page right-click menu.
5. Click an element to copy the prompt. Press `Esc` to cancel.

For a one-off production build, run `pnpm build` and load `dist/`.

Type-check the source without emitting with `pnpm typecheck`.

## Shortcuts

- `Alt+Shift+E` — start / cancel the picker on the current tab
- `Alt+Shift+S` — open the settings page
- Right-click the toolbar icon → **Element Snapper Settings** (Chrome's icon context menu always appears; we put the settings entry at the top)
- Right-click anywhere on a page → **Start Element Snapper**

Shortcuts can be remapped at `chrome://extensions/shortcuts`.

## Settings

Open the settings page from Chrome's extension details page, with `Alt+Shift+S`, or by right-clicking the extension icon and choosing settings.

- Capture selected element with parent context, or selected element only.
- Include computed inline styles, or keep the prompt structure lighter.
- Keep raw `element.style` attributes when they exist.
- Follow the browser language automatically, or pin Simplified Chinese, Traditional Chinese, or English.
- Follow system theme, or pin light or dark mode.

## What Gets Copied

- Selected element HTML.
- Optional inline computed styles for the selected element.
- Optional raw `element.style` attributes.
- Optional parent chain with layout context.
- Element and viewport dimensions.

## Privacy

Element Snapper runs locally in the browser. It does not send page content to a server.
