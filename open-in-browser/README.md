# Open in Another Browser (Safari)

A personal Safari Web Extension for macOS to **quickly open the current tab in another browser** (for example Safari, Chrome, Chromium, Brave, Firefox, DuckDuckGo, or Safari Technology Preview) and remember the last used target.

## Why need this

I currently have Safari, Chrome, Brave, DuckDuckGo, Firefox, Safari Technology Preview and constantly switching between them. It's kind of pain to copy the URL and paste into another browser. Hence created this extension. I keep Safari as the default browser to sync all bookmarks to iCloud as the single source of truth for all bookmarks.

## What’s in this repo

- `safari/Open In Another Browser/` — macOS app + Safari Web Extension Xcode project
  - `Open In Another Browser/` — containing macOS app (host app UI/resources)
  - `Open In Another Browser Extension/` — extension native handler and web extension resources
    - `Resources/` — extension manifest, background script, and popup UI (`popup/`)
    - `SafariWebExtensionHandler.swift`, `BrowserTarget.swift`, `BrowserOpener.swift`, `ConfigStore.swift` — native messaging, target config, and URL opening logic
  - `Open In Another Browser.xcodeproj/` — Xcode project
  - `Sample.xcconfig` — sample/public build configuration values

## How it works

1. The popup/background script reads the active tab URL.
2. It sends a native message to open that URL in a chosen (or last-used) browser target.
3. The native handler resolves the target app (by app path / bundle identifier) and opens the URL via macOS.
4. Only `http(s)` URLs are opened; restricted/internal pages return an error.

## Build & run (local, macOS)

1. Open `safari/Open In Another Browser/Open In Another Browser.xcodeproj` in Xcode.
2. Create your local (private) config from the sample if needed:
   - copy `safari/Open In Another Browser/Sample.xcconfig` to `Local.xcconfig` in the same folder
   - set your own bundle identifiers / development team values locally (do not commit private values)
3. Select the app scheme/target and build & run.
4. Enable the extension in Safari:
   - Safari → Settings → Developer → **Allow Unsigned Extensions** (for local development)
   - Safari → Settings → Extensions → enable **Open In Another Browser** and grant permissions
5. Open an `http(s)` page in Safari and use the extension button to send it to another browser.

## Browser targets

Available/default targets are defined in `safari/Open In Another Browser/Open In Another Browser Extension/BrowserTarget.swift`. If a browser on your machine uses a different bundle identifier or install path, update the target’s `bundleIdentifier` and/or `appPath`.

To check a bundle ID locally:

```bash
mdls -name kMDItemCFBundleIdentifier -r /Applications/Google\ Chrome.app
# or
defaults read /Applications/Google\ Chrome.app/Contents/Info.plist CFBundleIdentifier
```

## Notes

- This is currently a Safari-focused MVP intended for personal workflow (fast browser switching).
- Keep local/private signing or machine-specific configuration out of commits (see `.gitignore`).
- User-local Xcode state and other ignored local artifacts are intentionally not part of the repo.
