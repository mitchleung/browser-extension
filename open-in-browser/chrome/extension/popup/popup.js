const ext = globalThis.browser ?? globalThis.chrome;
const NATIVE_HOST_NAME = "com.example.open_in_another_browser";

const statusEl = document.getElementById("status");
const targetsEl = document.getElementById("targets");
const openLastBtn = document.getElementById("open-last");
const currentUrlEl = document.getElementById("current-url");

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#b42318" : "";
}

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

function renderTargets(config) {
  targetsEl.innerHTML = "";
  const targets = (config?.targets ?? []).filter((t) => t.enabled !== false);
  if (!targets.length) {
    const empty = document.createElement("p");
    empty.className = "status";
    empty.textContent = "No target browsers configured. Check the native host setup/config.";
    targetsEl.appendChild(empty);
    return;
  }

  for (const target of targets) {
    const btn = document.createElement("button");
    const isLast = config?.lastUsedTargetId && target.id === config.lastUsedTargetId;
    const label = target.displayName || target.id;
    btn.innerHTML = `<strong>${label}</strong>${isLast ? ' <span class="meta">(last used)</span>' : ""}<span class="meta">${target.bundleIdentifier || target.appPath || "unresolved app"}</span>`;
    btn.addEventListener("click", () => openInTarget(target.id, label));
    targetsEl.appendChild(btn);
  }
}

async function loadConfig() {
  try {
    const config = await sendNative({ type: "get_config" });
    if (!config || config.ok === false) {
      setStatus(config?.error ? `Config error: ${config.error}` : "Could not load config from native host.", true);
      renderTargets({ targets: [] });
      return null;
    }
    const last = config.lastUsedTargetId ? `Last used: ${config.lastUsedTargetId}` : "No last-used browser yet.";
    if (!statusEl.textContent || statusEl.textContent === "Loading…") {
      setStatus(last);
    } else if (isSupportedUrl(currentUrlEl.textContent)) {
      setStatus(last);
    }
    renderTargets(config);
    return config;
  } catch (error) {
    setStatus("Native messaging unavailable. Install/register the native host and reload the extension.", true);
    renderTargets({ targets: [] });
    openLastBtn.disabled = true;
    return null;
  }
}

async function refreshCurrentTab() {
  try {
    const tab = await getActiveTab();
    const url = tab?.url || tab?.pendingUrl || "";
    currentUrlEl.textContent = url || "No active tab URL available";
    const supported = isSupportedUrl(url);
    if (url && !supported) {
      setStatus("Current page is not an http(s) URL.", true);
    }
    return tab;
  } catch (error) {
    currentUrlEl.textContent = "Unable to read current tab URL";
    setStatus(`Could not read current tab: ${String(error)}`, true);
    return null;
  }
}

async function openInTarget(targetId, label = targetId) {
  const tab = await getActiveTab();
  if (!tab?.url) {
    setStatus("No active tab URL found.", true);
    return;
  }
  if (!isSupportedUrl(tab.url)) {
    setStatus("Only http(s) pages can be opened in another browser.", true);
    return;
  }

  setStatus(`Opening in ${label}…`);
  openLastBtn.disabled = true;
  try {
    const res = await sendNative({ type: "open_url", url: tab.url, targetId });
    if (res?.ok) {
      setStatus(`Opened in ${res.openedWith || label}.`);
      await loadConfig();
    } else {
      setStatus(`Failed: ${res?.error || "unknown error"}${res?.detail ? ` (${res.detail})` : ""}`, true);
    }
  } catch (error) {
    setStatus(`Native messaging failed: ${String(error)}`, true);
  } finally {
    await refreshCurrentTab();
  }
}

openLastBtn.addEventListener("click", () => openInTarget("last_used", "last used browser"));

(async () => {
  try {
    await refreshCurrentTab();
  } catch (_) {}
  await loadConfig();
  try {
    const tab = await getActiveTab();
    const url = tab?.url || tab?.pendingUrl || "";
    if (!isSupportedUrl(url)) {
      openLastBtn.disabled = true;
    }
  } catch (_) {}
})();
