#!/usr/bin/env python3
import json
import os
import struct
import subprocess
import sys
from urllib.parse import urlparse

HOST_NAME = "com.example.open_in_another_browser"
CONFIG_DIR = os.path.expanduser("~/Library/Application Support/OpenInAnotherBrowser")
CONFIG_PATH = os.path.join(CONFIG_DIR, "config.json")

DEFAULT_TARGETS = [
    {
        "id": "helium",
        "displayName": "Helium",
        "bundleIdentifier": "net.imput.helium",
        "appPath": None,
        "enabled": True,
    },
    {
        "id": "zen",
        "displayName": "Zen",
        "bundleIdentifier": "app.zen-browser.zen",
        "appPath": None,
        "enabled": True,
    },
    {
        "id": "safari",
        "displayName": "Safari",
        "bundleIdentifier": "com.apple.Safari",
        "appPath": None,
        "enabled": True,
    },
    {
        "id": "chrome",
        "displayName": "Google Chrome",
        "bundleIdentifier": "com.google.Chrome",
        "appPath": None,
        "enabled": True,
    },
    {
        "id": "ungoogled-chromium",
        "displayName": "Chromium",
        "bundleIdentifier": "io.ungoogled-software.ungoogled-chromium",
        "appPath": None,
        "enabled": True,
    },
    {
        "id": "brave",
        "displayName": "Brave",
        "bundleIdentifier": "com.brave.Browser",
        "appPath": None,
        "enabled": True,
    },
    {
        "id": "duckduckgo",
        "displayName": "DuckDuckGo",
        "bundleIdentifier": "com.duckduckgo.macos.browser",
        "appPath": None,
        "enabled": True,
    },
    {
        "id": "firefox",
        "displayName": "Firefox",
        "bundleIdentifier": "org.mozilla.firefox",
        "appPath": None,
        "enabled": True,
    },
    {
        "id": "safari-technology-preview",
        "displayName": "Safari Technology Preview",
        "bundleIdentifier": "com.apple.SafariTechnologyPreview",
        "appPath": None,
        "enabled": True,
    },
]


def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        return None
    if len(raw_length) < 4:
        raise ValueError("Incomplete message length")
    message_length = struct.unpack("<I", raw_length)[0]
    data = sys.stdin.buffer.read(message_length)
    if len(data) < message_length:
        raise ValueError("Incomplete message body")
    return json.loads(data.decode("utf-8"))


def send_message(message):
    encoded = json.dumps(message).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def load_config():
    if not os.path.exists(CONFIG_PATH):
        return {"lastUsedTargetId": None, "targets": DEFAULT_TARGETS}
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception:
        return {"lastUsedTargetId": None, "targets": DEFAULT_TARGETS}
    targets = cfg.get("targets") or DEFAULT_TARGETS
    norm = []
    for t in targets:
        norm.append(
            {
                "id": t.get("id"),
                "displayName": t.get("displayName") or t.get("id"),
                "bundleIdentifier": t.get("bundleIdentifier"),
                "appPath": t.get("appPath"),
                "enabled": t.get("enabled", True),
            }
        )
    return {"lastUsedTargetId": cfg.get("lastUsedTargetId"), "targets": norm}


def save_config(config):
    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)


def is_supported_url(url):
    try:
        p = urlparse(url)
        return p.scheme in ("http", "https") and bool(p.netloc)
    except Exception:
        return False


def resolve_target(config, target_id):
    targets = [
        t
        for t in (config.get("targets") or [])
        if t.get("enabled", True) and t.get("id")
    ]
    if not targets:
        return None, "NO_TARGET_CONFIGURED"
    if target_id in (None, "", "last_used"):
        tid = config.get("lastUsedTargetId")
        if tid:
            for t in targets:
                if t.get("id") == tid:
                    return t, None
        return targets[0], None
    for t in targets:
        if t.get("id") == target_id:
            return t, None
    return None, "TARGET_NOT_FOUND"


def open_in_target(target, url):
    app_path = target.get("appPath")
    bundle_id = target.get("bundleIdentifier")
    if app_path and os.path.exists(app_path):
        cmd = ["open", "-a", app_path, url]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        return proc.returncode == 0, (
            proc.stderr.strip() or proc.stdout.strip() or None
        )
    if bundle_id:
        cmd = ["open", "-b", bundle_id, url]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode == 0:
            return True, None
        bundle_err = proc.stderr.strip() or proc.stdout.strip() or "open -b failed"
    else:
        bundle_err = None
    name = target.get("displayName") or target.get("id")
    if name:
        guess = f"/Applications/{name}.app"
        if os.path.exists(guess):
            cmd = ["open", "-a", guess, url]
            proc = subprocess.run(cmd, capture_output=True, text=True)
            return proc.returncode == 0, (
                proc.stderr.strip() or proc.stdout.strip() or None
            )
        cmd = ["open", "-a", name, url]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode == 0:
            return True, None
        err = proc.stderr.strip() or proc.stdout.strip() or bundle_err
        return False, err
    return False, bundle_err or "TARGET_APP_NOT_FOUND"


def handle_message(msg):
    msg = msg or {}
    mtype = msg.get("type")

    if mtype == "get_config":
        cfg = load_config()
        return {
            "ok": True,
            "lastUsedTargetId": cfg.get("lastUsedTargetId"),
            "targets": cfg.get("targets", []),
        }

    if mtype == "open_url":
        url = msg.get("url")
        target_id = msg.get("targetId") or "last_used"
        if not is_supported_url(url):
            return {"ok": False, "error": "INVALID_URL"}
        cfg = load_config()
        target, err = resolve_target(cfg, target_id)
        if err:
            return {"ok": False, "error": err}
        ok, detail = open_in_target(target, url)
        if not ok:
            err_code = (
                "TARGET_APP_NOT_FOUND"
                if detail
                and (
                    "Unable to find application" in detail
                    or "No application knows" in detail
                )
                else "OPEN_FAILED"
            )
            res = {"ok": False, "error": err_code}
            if detail:
                res["detail"] = detail
            return res
        cfg["lastUsedTargetId"] = target.get("id")
        save_config(cfg)
        return {
            "ok": True,
            "openedWith": target.get("displayName") or target.get("id"),
            "targetId": target.get("id"),
            "lastUsedTargetId": cfg["lastUsedTargetId"],
        }

    if mtype == "set_last_used":
        tid = msg.get("targetId")
        cfg = load_config()
        target, err = resolve_target(cfg, tid)
        if err:
            return {"ok": False, "error": err}
        cfg["lastUsedTargetId"] = target.get("id")
        save_config(cfg)
        return {"ok": True, "lastUsedTargetId": cfg["lastUsedTargetId"]}

    return {"ok": False, "error": "UNKNOWN_MESSAGE"}


def main():
    try:
        while True:
            msg = read_message()
            if msg is None:
                break
            try:
                response = handle_message(msg)
            except Exception as e:
                response = {
                    "ok": False,
                    "error": "NATIVE_MESSAGING_FAILED",
                    "detail": str(e),
                }
            send_message(response)
    except Exception:
        pass


if __name__ == "__main__":
    main()
