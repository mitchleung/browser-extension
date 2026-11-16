# Open in Another Browser (Chrome/Chromium extension)

Chrome/Chromium version of the **Open in Another Browser** extension for macOS. It lets you open the current `http(s)` tab in another browser and remembers the last used target.

> This extension requires a **local native messaging host** on macOS. The web extension UI cannot open other apps/browsers by itself.

## Folder contents

- `extension/` — unpacked Chrome extension (Manifest V3, popup, background, icons)
- `native-host/host.py` — native messaging host implementation (Python, stdlib-only)
- `native-host/host` — launcher script that runs `host.py` using the local virtual environment
- `native-host/.venv/` — local Python virtual environment for the host (gitignored)
- `native-host/com.example.open_in_another_browser.json` — native host manifest template
- `native-host/manifests/` — per-browser manifest copies and install notes

## Prerequisites

- macOS
- Google Chrome or another Chromium-based browser (e.g. Brave, Microsoft Edge, Chromium, Helium*)
- `python3` available as `/usr/bin/env python3`
- Permission to run local scripts/apps on your machine

\*Helium is Chromium-based but native messaging host locations/support may vary by version. See `native-host/manifests/README.md`.

## 1) Native host setup (Python venv)

The native host is already set up to run via a local venv through `native-host/host`.

- Venv location: `open-in-browser/chrome/native-host/.venv`
- Launcher: `open-in-browser/chrome/native-host/host` (executes `.venv/bin/python host.py`)

`host.py` currently uses only the Python standard library, so no extra packages are required.

If you recreate the venv or add dependencies later:

```bash
cd open-in-browser/chrome/native-host
python3 -m venv .venv
# if needed later:
# .venv/bin/pip install <package>
chmod +x host host.py
```

The host stores last-used/config data at:

- `~/Library/Application Support/OpenInAnotherBrowser/config.json`

## 2) Load the extension in Chrome (or another Chromium browser)

1. Open the browser’s extensions page (e.g. `chrome://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select: `open-in-browser/chrome/extension`
5. Copy the extension **ID** shown on the extension card

> The extension ID is specific to the browser/profile/load context. If it changes, update the native host manifest `allowed_origins`.

## 3) Install the native messaging host manifest

Chrome/Chromium browsers require a host manifest file installed in that browser’s `NativeMessagingHosts` directory.

### 3.1 Choose the correct manifest copy

Use the template/copy for your browser from:

- `native-host/com.example.open_in_another_browser.json` (template), or
- `native-host/manifests/<Browser>/com.example.open_in_another_browser.json`

Supported/common macOS locations (see `native-host/manifests/README.md` for details):

| Browser        | Manifest directory                                                                        |
| -------------- | ----------------------------------------------------------------------------------------- |
| Google Chrome  | `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`                       |
| Chromium       | `~/Library/Application Support/Chromium/NativeMessagingHosts/`                            |
| Brave          | `~/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts/`         |
| Microsoft Edge | `~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/`                      |
| Helium         | `~/Library/Application Support/net.imput.helium/NativeMessagingHosts/` _(likely; verify)_ |

Create the `NativeMessagingHosts` directory if it does not exist.

### 3.2 Edit the installed manifest

Install/copy the file as:

- `com.example.open_in_another_browser.json`

Then update these fields:

- **`name`**: must remain `com.example.open_in_another_browser` (must match the extension)
- **`type`**: must remain `stdio`
- **`path`**: absolute path to the host launcher, for example:
  ```json
  "path": "/ABSOLUTE/PATH/TO/open-in-browser/chrome/native-host/host"
  ```
- **`allowed_origins`**: set to the extension ID for that browser, for example:
  ```json
  "allowed_origins": ["chrome-extension://<YOUR_EXTENSION_ID>/"]
  ```
  (keep the `chrome-extension://` prefix and trailing `/`)

### 3.3 Reload

- Reload the extension (or restart the browser) after installing/updating the manifest
- Open an `http(s)` page and use the extension popup

## 4) How it works

1. The popup/background script reads the active tab URL
2. The extension sends a native message (`get_config` / `open_url`) to `com.example.open_in_another_browser`
3. The native host resolves the target browser and opens the URL via macOS
4. The host persists the last used target and returns status to the extension

Only `http(s)` URLs are supported. Restricted/internal pages will show an error.

## Browser targets

Default targets are defined in `native-host/host.py` (e.g. Helium, Zen, Safari, Chrome, Chromium, Brave, Firefox, DuckDuckGo, Safari Technology Preview) with common bundle IDs.

If a browser on your machine uses a different bundle ID or install path, update the target in `host.py` (or the saved config in `~/Library/Application Support/OpenInAnotherBrowser/config.json`).

To check a bundle ID locally:

```bash
mdls -name kMDItemCFBundleIdentifier -r /Applications/Firefox.app
# or
defaults read /Applications/Firefox.app/Contents/Info.plist CFBundleIdentifier
```

## Troubleshooting

### “Native messaging unavailable…” / “No target browsers configured…”

- Confirm the manifest is installed in the **correct browser’s** `NativeMessagingHosts` directory
- Confirm `allowed_origins` contains the **current extension ID** for that browser
- Confirm `path` is an **absolute** path to `.../open-in-browser/chrome/native-host/host` (or another valid host executable)
- Confirm `host`/`host.py` are executable and `python3` is available (`/usr/bin/env python3`)
- Confirm the manifest filename is `com.example.open_in_another_browser.json` and `name` matches exactly
- Reload the extension and fully restart the browser if needed

### “Failed: TARGET_APP_NOT_FOUND / OPEN_FAILED”

- The target browser may not be installed, or its bundle ID/app path differs on your system
- Update the target’s `bundleIdentifier` / `appPath` in `native-host/host.py` (or config file)

### Notes for Helium / Firefox / Zen

- **Helium (Chromium-based):** may work with this Chrome extension + native host if you install the manifest in Helium’s correct `NativeMessagingHosts` path and use the Helium extension ID
- **Firefox / Zen (Firefox-based):** this Chrome extension/native messaging manifest format does not apply; a Firefox-compatible extension and Firefox native messaging setup are required
