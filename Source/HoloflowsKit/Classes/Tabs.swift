//
//  Tabs.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-10.
//

import Foundation
import WebKit
import ConsolePrint

public protocol TabsDelegate: class {
    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin
    func tabs(_ tabs: Tabs,  webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration
}

public class Tabs {

    weak var delegate: TabsDelegate?
    weak var browser: Browser?

    public private(set) var storage: [Tab] = []

    private(set) lazy var extensionTab: Tab = createExtensionTab(options: WebExtension.Browser.Tabs.Create.Options(active: false, url: ExtensionBundleResourceManager.backgroundPagePath))
    private(set) var userAgent = ""
    private var nextID = 0
}

extension Tabs {

    /// Creates a new tab.
    ///
    /// - Parameter properties: Properties to give the new tab.
    /// - Note: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create
    @discardableResult
    public func create(options: WebExtension.Browser.Tabs.Create.Options?, webViewConfiguration: WKWebViewConfiguration? = nil) -> Tab {
        let webViewConfiguration = delegate?.tabs(self, webViewConfigurationForOptions: options) ?? WKWebViewConfiguration()
        let plugin: Plugin? = {
            guard let plugin = delegate?.plugin(forScriptType: .contentScript) else {
                return nil
            }
            guard plugin.environment == .contentScript else {
                assertionFailure()
                return nil
            }
            return plugin
        }()

        let tab = Tab(id: nextID, plugin: plugin, createOptions: options, webViewConfiguration: webViewConfiguration)
        tab.tabs = self
        tab.delegate = browser?.core
        nextID += 1
        storage.append(tab)
        return tab
    }

    @discardableResult
    public func remove(id: Int) -> Tab? {
        let removed = remove(ids: [id])
        assert(removed.count < 2)
        return removed.first
    }

    @discardableResult
    public func remove(ids: [Int]) -> [Tab] {
        let removed = storage.filter { ids.contains($0.id) }

        storage.removeAll(where: { ids.contains($0.id) })

        for tab in removed {
            tab.resignMessageHandler()
        }

        return removed
    }

}

extension Tabs {

    @discardableResult
    private func createExtensionTab(options: WebExtension.Browser.Tabs.Create.Options?, webViewConfiguration: WKWebViewConfiguration? = nil) -> Tab {
        let webViewConfiguration = delegate?.tabs(self, webViewConfigurationForOptions: options) ?? WKWebViewConfiguration()
        let plugin = delegate?.plugin(forScriptType: .contentScript)
        let tab = Tab(id: -1, plugin: plugin, createOptions: options, webViewConfiguration: webViewConfiguration)
        tab.tabs = self
        tab.delegate = browser?.core

        // Setup User-Agent
        tab.webView.evaluateJavaScript("navigator.userAgent") { any, error in
            guard let userAgent = any as? String else { return }
            self.userAgent = userAgent
        }

        return tab
    }

}
