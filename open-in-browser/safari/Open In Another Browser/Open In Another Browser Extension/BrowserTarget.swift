import Foundation

struct BrowserTarget: Codable, Equatable {
    var id: String
    var displayName: String
    var bundleIdentifier: String?
    var appPath: String?
    var enabled: Bool

    static let defaultTargets: [BrowserTarget] = [
        BrowserTarget(
            id: "helium",
            displayName: "Helium",
            bundleIdentifier: "net.imput.helium",
            appPath: nil,
            enabled: true
        ),
        BrowserTarget(
            id: "zen",
            displayName: "Zen",
            bundleIdentifier: "app.zen-browser.zen",
            appPath: nil,
            enabled: true
        ),
        BrowserTarget(
            id: "safari",
            displayName: "Safari",
            bundleIdentifier: "com.apple.Safari",
            appPath: nil,
            enabled: true
        ),
        BrowserTarget(
            id: "chrome",
            displayName: "Google Chrome",
            bundleIdentifier: "com.google.Chrome",
            appPath: nil,
            enabled: true
        ),
        BrowserTarget(
            id: "ungoogled-chromium",
            displayName: "Chromium",
            bundleIdentifier: "io.ungoogled-software.ungoogled-chromium",
            appPath: nil,
            enabled: true
        ),
        BrowserTarget(
            id: "brave",
            displayName: "Brave",
            bundleIdentifier: "com.brave.Browser",
            appPath: nil,
            enabled: true
        ),
        BrowserTarget(
            id: "duckduckgo",
            displayName: "DuckDuckGo",
            bundleIdentifier: "com.duckduckgo.macos.browser",
            appPath: nil,
            enabled: true
        ),
        BrowserTarget(
            id: "firefox",
            displayName: "Firefox",
            bundleIdentifier: "org.mozilla.firefox",
            appPath: nil,
            enabled: true
        ),
        BrowserTarget(
            id: "safari-technology-preview",
            displayName: "Safari Technology Preview",
            bundleIdentifier: "com.apple.SafariTechnologyPreview",
            appPath: nil,
            enabled: true
        )
    ]
}

struct ExtensionConfig: Codable {
    var lastUsedTargetId: String?
    var targets: [BrowserTarget]

    static let `default` = ExtensionConfig(
        lastUsedTargetId: nil,
        targets: BrowserTarget.defaultTargets
    )
}
