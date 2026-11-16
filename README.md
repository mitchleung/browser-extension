# Browser Extension

Personal browser extension tools for macOS, focused on quickly opening the current tab in another browser.

## Why

When you use multiple browsers, copying a URL from one browser and pasting it into another is slow and repetitive. This repo contains extensions that let you send the current tab to another browser in one click (and remember the last used browser). A common workflow is to keep Safari as the default browser for bookmark sync (e.g. iCloud) while opening specific pages in Chrome, Chromium, Brave, Firefox, Helium, Zen, DuckDuckGo, or Safari Technology Preview as needed.

## Projects

### [Open in Another Browser (Safari)](open-in-browser/README.md)

A Safari Web Extension for macOS packaged in a containing app (Xcode project). It uses Safari’s native messaging/app extension model to open the current `http(s)` tab in another browser.

- **Best for:** opening tabs **from Safari** to other browsers
- **Location:** `open-in-browser/safari/`
- **Setup:** build/run the Xcode app, enable the extension in Safari, and configure local signing/bundle settings as needed
- **Details:** see [open-in-browser/README.md](open-in-browser/README.md)

### [Open in Another Browser (Chrome/Chromium)](open-in-browser/chrome/README.md)

A Chrome/Manifest V3 extension plus a local native messaging host for macOS. The extension UI reads the current tab, and the native host opens the URL in the selected browser.

- **Best for:** opening tabs **from Chrome or other Chromium-based browsers** (e.g. Chrome, Brave, Microsoft Edge, Chromium, Helium*) to other browsers
- **Location:** `open-in-browser/chrome/`
- **Setup:** load the unpacked extension, configure/install the native messaging host manifest for your browser, and set the correct extension ID and host path
- **Details:** see [open-in-browser/chrome/README.md](open-in-browser/chrome/README.md)

\*Helium is Chromium-based, but native messaging host paths/support may vary. See the Chrome extension docs.

## Supported target browsers (defaults)

The bundled/default target lists currently include:

- Helium
- Zen
- Safari
- Google Chrome
- Chromium
- Brave
- Firefox
- DuckDuckGo
- Safari Technology Preview

Targets are configurable:

- **Safari version:** `open-in-browser/safari/Open In Another Browser/Open In Another Browser Extension/BrowserTarget.swift`
- **Chrome/Chromium version (host defaults):** `open-in-browser/chrome/native-host/host.py`
- **Chrome/Chromium version (active local config):** `~/Library/Application Support/OpenInAnotherBrowser/config.json`

Bundle IDs and app paths can differ by install/build, so you may need to adjust targets on your machine.

## Repository structure

- `open-in-browser/` — browser extension projects and documentation
  - `README.md` — Safari extension documentation
  - `safari/` — Safari app + extension Xcode project
  - `chrome/` — Chrome/Chromium extension, native host, and manifests
- `LICENSE` — project license

## Notes

- This is a personal/local-tools repo; expect some machine-specific setup (signing, bundle IDs, native host registration, browser extension IDs).
- Only `http(s)` pages are intended to be opened in another browser.
- Local/private configuration and user-specific artifacts should stay out of commits (see `.gitignore`).

## License

MIT — see [LICENSE](LICENSE).
