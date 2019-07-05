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
    func tabs(_ tabs: Tabs, createTabWithOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration
}

open class Tabs {

    open weak var delegate: TabsDelegate?
    open weak var browser: Browser?

    private(set) lazy var extensionTab: Tab = {
        return createExtensionTab(options: WebExtension.Browser.Tabs.Create.Options(active: false, url: ExtensionBundleResourceManager.backgroundPagePath))
    }()
    public private(set) var storage: [Tab] = []

    private var nextID = 0
    
}

extension Tabs {

    /// Creates a new tab.
    ///
    /// - Parameter properties: Properties to give the new tab.
    /// - Note: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create
    @discardableResult
    open func create(options: WebExtension.Browser.Tabs.Create.Options?, webViewConfiguration: WKWebViewConfiguration? = nil) -> Tab {
        let webViewConfiguration = delegate?.tabs(self, createTabWithOptions: options)
        let tab = Tab(id: nextID, createOptions: options, webViewConfiguration: webViewConfiguration)
        tab.tabs = self
        tab.delegate = browser
        nextID += 1
        storage.append(tab)
        return tab
    }

    @discardableResult
    func createExtensionTab(options: WebExtension.Browser.Tabs.Create.Options?, webViewConfiguration: WKWebViewConfiguration? = nil) -> Tab {
        let webViewConfiguration = delegate?.tabs(self, createTabWithOptions: options)
        let tab = Tab(id: -1, createOptions: options, webViewConfiguration: webViewConfiguration)
        tab.tabs = self
        tab.delegate = browser
        return tab
    }


    @discardableResult
    open func remove(id: Int) -> Tab? {
        let removed = remove(ids: [id])
        assert(removed.count < 2)
        return removed.first
    }

    @discardableResult
    open func remove(ids: [Int]) -> [Tab] {
        let removed = storage.filter { ids.contains($0.id) }

        storage.removeAll(where: { ids.contains($0.id) })

        for tab in removed {
            tab.resignMessageHandler()
        }

        return removed
    }

}
