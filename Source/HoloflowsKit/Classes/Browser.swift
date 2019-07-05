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

    open var schemeHanderManager = URLSchemeHandlerManager()

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

        // make sure extensionTab init
        let _ = tabs.extensionTab
    }

}

// MARK: - TabsDelegate
extension Browser: TabsDelegate {
    
    public func tabs(_ tabs: Tabs, createTabWithOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        let configuration = WKWebViewConfiguration()
        for (scheme, hander) in schemeHanderManager.handlerDict {
            configuration.setURLSchemeHandler(hander.urlSchemeHander, forURLScheme: scheme)
        }
        delegate?.browser(self, configureWebViewConfiguration: configuration)
        return configuration
    }

}

// MARK: - TabDelegate
extension Browser: TabDelegate {

    open func tab(_ tab: Tab, requestManifestForExtension extensionID: String) -> String {
        return manifest
    }

    public func tab(_ tab: Tab, requestURLSchemeHanderForExtension extensionID: String, forPath path: String) -> [URLSchemeHandlerManager.URLSchemeHander] {
        guard let url = URL(string: path) else {
            consolePrint("not found bundle resource manager for path: \(path)")
            return []
        }

        if let scheme = url.scheme {
            return schemeHanderManager.handlerDict[scheme].flatMap { [$0] } ?? []

        } else {
            return schemeHanderManager.handlerDict.map { $0.1 }.filter { handler in
                handler.extensionID == extensionID
            }
        }
    }

    public func tab(_ tab: Tab, requestBundleResourceManagerForExtension extensionID: String, forPath path: String) -> BundleResourceManager? {
        guard let url = URL(string: path) else {
            consolePrint("not found bundle resource manager for path: \(path)")
            return nil
        }

        if let scheme = url.scheme {
            return schemeHanderManager.handlerDict[scheme]?.urlSchemeHander as? BundleResourceManager
        } else {
            return schemeHanderManager.handlerDict.first(where: { $0.value.extensionID == extensionID })?.value.urlSchemeHander as? BundleResourceManager
        }
    }

    public func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options) {
        consolePrint(options)
    }

    public func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<BlobStorage, Error>) {
        switch result {
        case let .success(blobStorage):
            consolePrint(blobStorage)
        case let .failure(error):
            consolePrint(error.localizedDescription)
        }
    }

}
