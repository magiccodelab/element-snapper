# Element Snapper

A lightweight Chrome extension for selecting any element on a page and copying its HTML plus computed CSS into a prompt-friendly Markdown block.

## Usage

1. Run `npm install`.
2. Run `npm run build`.
3. Open `chrome://extensions`.
4. Enable developer mode.
5. Choose **Load unpacked** and select this folder.
6. Start the picker from the extension icon or from the page right-click menu.
7. Click an element to copy the prompt. Press `Esc` to cancel.

## Settings

Open the settings page from Chrome's extension details page, or right-click the extension icon and choose settings.

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
