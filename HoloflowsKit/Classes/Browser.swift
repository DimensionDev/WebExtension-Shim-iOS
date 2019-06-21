//
//  Browser.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-10.
//

import Foundation
import WebKit
import ConsolePrint

public protocol BrowserDelegate: class {
    func browser(_ browser: Browser, configureWebViewConfiguration webViewConfiguration: WKWebViewConfiguration)
}

open class Browser: NSObject {

    // MARK: - Singleton
    public static let `default` = Browser()

    public let tabs = Tabs()

    open var manifest: String = ""
    open weak var delegate: BrowserDelegate?


    // URL scheme handler for custom scheme content loading
    open weak var bundleResourceManager: BundleResourceManager?
    open weak var blobResourceManager: BlobResourceManager?

    open weak var tabsDelegate: TabsDelegate? {
        didSet {
            tabs.delegate = tabsDelegate
        }
    }

    public override init() {
        super.init()
        tabs.browser = self

        tabsDelegate = self
        tabs.delegate = tabsDelegate
    }

}

// MARK: - TabsDelegate
extension Browser: TabsDelegate {

    public func tabs(_ tabs: Tabs, createTabWithCreateProperties properties: WebExtensionAPI.CreateProperties?) -> WKWebViewConfiguration {
        let configuration = WKWebViewConfiguration()
        configuration.setURLSchemeHandler(bundleResourceManager, forURLScheme: "holoflows-extension")
        configuration.setURLSchemeHandler(blobResourceManager, forURLScheme: "holoflows-blob")
        delegate?.browser(self, configureWebViewConfiguration: configuration)
        return configuration
    }

}

// MARK: - TabDelegate
extension Browser: TabDelegate {

    open func tab(_ tab: Tab, requestManifest: Void) -> String {
        return manifest
    }

    open func tab(_ tab: Tab, requestBundleResourceManager: Void) -> BundleResourceManager? {
        return bundleResourceManager
    }

    public func tab(_ tab: Tab, requestBlobResourceManager: Void) -> BlobResourceManager? {
        return blobResourceManager
    }

    open func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtensionAPI.DownloadOptions) {
        consolePrint(options)
    }

    open func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtensionAPI.DownloadOptions, result: Result<BlobStorage, Error>) {
        switch result {
        case let .success(blobStorage):
            consolePrint(blobStorage)
        case let .failure(error):
            consolePrint(error.localizedDescription)
        }
    }

}
