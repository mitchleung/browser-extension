const ext = globalThis.browser ?? globalThis.chrome;
// Must match the native messaging host name registered on this machine.
const NATIVE_HOST_NAME = "com.example.open_in_another_browser";

function isSupportedUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

async function getActiveTab() {
  const tabs = await ext.tabs.query({ active: true, currentWindow: true });
  return tabs?.[0] ?? null;
}

async function sendNative(message) {
  return ext.runtime.sendNativeMessage(NATIVE_HOST_NAME, message);
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

if (ext.commands?.onCommand) {
  ext.commands.onCommand.addListener(async (command) => {
    if (command === "open-last-used") {
      await openUrlInTarget("last_used");
    }
  });
}
