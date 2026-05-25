# Element Snapper

A lightweight Chrome extension for selecting any element on a page and copying its HTML plus computed CSS into a prompt-friendly Markdown block.

## Usage

1. Open `chrome://extensions`.
2. Enable developer mode.
3. Choose **Load unpacked** and select this folder.
4. Start the picker from the extension icon or from the page right-click menu.
5. Click an element to copy the prompt. Press `Esc` to cancel.

## What Gets Copied

- Selected element HTML.
- Inline computed styles for the selected element.
- A short parent chain with layout context.
- Element and viewport dimensions.

## Privacy

Element Snapper runs locally in the browser. It does not send page content to a server.
