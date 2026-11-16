# Native messaging host manifests (macOS)

Use the same manifest file name: `com.example.open_in_another_browser.json`  
The host `name` inside must match the extension (`com.example.open_in_another_browser`).

## Before installing
1. Set `"path"` in the manifest to the **absolute path** of your native host launcher (e.g. `/Users/you/.../open-in-browser/chrome/native-host/host`). The included `host` script runs `host.py` using the local virtual environment (`.venv`). Make sure it is executable (`chmod +x ...`).
2. Load the extension in the browser, copy its **Extension ID** from the extensions page, and replace `YOUR_EXTENSION_ID_HERE` in `"allowed_origins"` with that ID (keep the `chrome-extension://.../` format).

## Install locations (macOS, Chromium-based browsers)

Copy `com.example.open_in_another_browser.json` to the appropriate folder for each browser where you install this **Chrome/Chromium extension**:

| Browser | Manifest directory |
|---|---|
| Google Chrome | `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/` |
| Chromium | `~/Library/Application Support/Chromium/NativeMessagingHosts/` |
| Brave | `~/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts/` |
| Microsoft Edge | `~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/` |
| Helium | `~/Library/Application Support/net.imput.helium/NativeMessagingHosts/` *(likely; verify on your system)* |

Create the `NativeMessagingHosts` directory if it does not exist. Restart the browser (or reload the extension) after installing/updating the manifest.

> **Helium note:** Helium is Chromium-based, so this Chrome extension approach may work there, but the exact NativeMessagingHosts path can vary. If the path above doesn’t exist, check under `~/Library/Application Support/` for a Helium-related folder (e.g. `net.imput.helium` or `Helium`) and use its `NativeMessagingHosts/` subfolder.

> Note: Install paths can vary by browser version/profile setup, but these are the common defaults on macOS.
