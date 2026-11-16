const ext = globalThis.browser ?? globalThis.chrome;
// Safari ignores the application id argument; kept for WebExtension API compatibility.
const NATIVE_APP_ID = "application.id";

function isSupportedUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

async function getActiveTab() {
  const tabs = await ext.tabs.query({ active: true, currentWindow: true });
  return tabs?.[0] ?? null;
}

async function sendNative(message) {
  return ext.runtime.sendNativeMessage(NATIVE_APP_ID, message);
}

async function openUrlInTarget(targetId = "last_used") {
  const tab = await getActiveTab();
  if (!tab?.url) {
    return { ok: false, error: "NO_ACTIVE_TAB_URL" };
  }
  if (!isSupportedUrl(tab.url)) {
    return { ok: false, error: "UNSUPPORTED_URL" };
  }
  try {
    return await sendNative({ type: "open_url", url: tab.url, targetId });
  } catch (error) {
    return { ok: false, error: "NATIVE_MESSAGING_FAILED", detail: String(error) };
  }
}

async function getConfig() {
  try {
    return await sendNative({ type: "get_config" });
  } catch (error) {
    return { ok: false, error: "NATIVE_MESSAGING_FAILED", detail: String(error) };
  }
}

ext.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "open_last_used":
        sendResponse(await openUrlInTarget("last_used"));
        return;
      case "open_url":
        sendResponse(await openUrlInTarget(message.targetId || "last_used"));
        return;
      case "get_config":
        sendResponse(await getConfig());
        return;
      default:
        sendResponse({ ok: false, error: "UNKNOWN_MESSAGE" });
    }
  })();
  return true;
});

// Fallback: if the toolbar action is clicked without popup in some contexts.
if (ext.action?.onClicked) {
  ext.action.onClicked.addListener(async () => {
    await openUrlInTarget("last_used");
  });
}

// Keyboard shortcut command (if configured in browser settings).
if (ext.commands?.onCommand) {
  ext.commands.onCommand.addListener(async (command) => {
    if (command === "open-last-used") {
      await openUrlInTarget("last_used");
    }
  });
}
