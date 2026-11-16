import AppKit
import Foundation

enum BrowserOpener {
    static func open(urlString: String, targetId: String) -> [String: Any] {
        guard let url = URL(string: urlString),
              let scheme = url.scheme?.lowercased(),
              scheme == "http" || scheme == "https" else {
            return ["ok": false, "error": "INVALID_URL"]
        }

        var config = ConfigStore.load()
        guard let target = resolveTarget(targetId: targetId, config: config) else {
            return ["ok": false, "error": targetId == "last_used" ? "NO_TARGET_CONFIGURED" : "TARGET_NOT_FOUND"]
        }

        guard let appURL = resolveApplicationURL(for: target) else {
            return [
                "ok": false,
                "error": "TARGET_APP_NOT_FOUND",
                "detail": target.displayName
            ]
        }

        let openConfig = NSWorkspace.OpenConfiguration()
        openConfig.activates = true

        let semaphore = DispatchSemaphore(value: 0)
        var openError: Error?

        NSWorkspace.shared.open([url], withApplicationAt: appURL, configuration: openConfig) { _, error in
            openError = error
            semaphore.signal()
        }
        _ = semaphore.wait(timeout: .now() + 5)

        if let openError = openError {
            return [
                "ok": false,
                "error": "OPEN_FAILED",
                "detail": openError.localizedDescription
            ]
        }

        config.lastUsedTargetId = target.id
        ConfigStore.save(config)

        return [
            "ok": true,
            "openedWith": target.displayName,
            "targetId": target.id,
            "lastUsedTargetId": target.id
        ]
    }

    private static func resolveTarget(targetId: String, config: ExtensionConfig) -> BrowserTarget? {
        let enabledTargets = config.targets.filter { $0.enabled }
        if targetId == "last_used" {
            if let lastUsedTargetId = config.lastUsedTargetId,
               let target = enabledTargets.first(where: { $0.id == lastUsedTargetId }) {
                return target
            }
            return enabledTargets.first
        }
        return config.targets.first(where: { $0.id == targetId && $0.enabled })
    }

    private static func resolveApplicationURL(for target: BrowserTarget) -> URL? {
        if let appPath = target.appPath, !appPath.isEmpty {
            let url = URL(fileURLWithPath: appPath)
            if FileManager.default.fileExists(atPath: url.path) {
                return url
            }
        }

        if let bundleIdentifier = target.bundleIdentifier,
           let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleIdentifier) {
            return url
        }

        // Fallback: try common app name in /Applications
        let candidate = URL(fileURLWithPath: "/Applications/\(target.displayName).app")
        if FileManager.default.fileExists(atPath: candidate.path) {
            return candidate
        }

        return nil
    }
}
