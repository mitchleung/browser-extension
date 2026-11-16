import Foundation

enum ConfigStore {
    private static let configKey = "openInAnotherBrowser.config"

    static func load() -> ExtensionConfig {
        let defaults = UserDefaults.standard
        guard let data = defaults.data(forKey: configKey) else {
            return .default
        }
        do {
            var decoded = try JSONDecoder().decode(ExtensionConfig.self, from: data)
            if decoded.targets.isEmpty {
                return .default
            }
            decoded = mergedWithDefaults(decoded)
            save(decoded)
            return decoded
        } catch {
            return .default
        }
    }

    private static func mergedWithDefaults(_ config: ExtensionConfig) -> ExtensionConfig {
        var merged = config
        let existingIds = Set(config.targets.map(\.id))
        for target in ExtensionConfig.default.targets where !existingIds.contains(target.id) {
            merged.targets.append(target)
        }
        return merged
    }

    static func save(_ config: ExtensionConfig) {
        do {
            let data = try JSONEncoder().encode(config)
            UserDefaults.standard.set(data, forKey: configKey)
        } catch {
            // Best-effort persistence; ignore encoding failures.
        }
    }

    static func setLastUsed(targetId: String) {
        var config = load()
        config.lastUsedTargetId = targetId
        save(config)
    }

    static func payload() -> [String: Any] {
        let config = load()
        let targets: [[String: Any]] = config.targets.map { target in
            var dict: [String: Any] = [
                "id": target.id,
                "displayName": target.displayName,
                "enabled": target.enabled,
            ]
            if let bundleIdentifier = target.bundleIdentifier {
                dict["bundleIdentifier"] = bundleIdentifier
            }
            if let appPath = target.appPath {
                dict["appPath"] = appPath
            }
            return dict
        }

        var payload: [String: Any] = [
            "ok": true,
            "targets": targets,
        ]
        if let lastUsedTargetId = config.lastUsedTargetId {
            payload["lastUsedTargetId"] = lastUsedTargetId
        }
        return payload
    }
}
