//
//  ExampleBrowserCore.swift
//  HoloflowsKit_Example
//
//  Created by Cirno MainasuK on 2019-7-9.
//  Copyright © 2019 CocoaPods. All rights reserved.
//

import Foundation
import WebKit

import HoloflowsKit
import SwiftyJSON

class ExampleBrowserCore: BrowserCore {

}

// MARK: - TabsDelegate
extension ExampleBrowserCore {

    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON(stringLiteral: "{}"), environment: type, resources: JSON(stringLiteral: ""))
    }

    func tabs(_ tabs: Tabs, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        return WKWebViewConfiguration()
    }

}

// MARK: - TabDelegate
extension ExampleBrowserCore {

    func uiDelegate(for tab: Tab) -> WKUIDelegate? {
        return nil
    }

    func navigationDelegate(for tab: Tab) -> WKNavigationDelegate? {
        return nil
    }

    func tab(_ tab: Tab, bundleResourceManagerOfExtensionID extensionID: String, forPath path: String) -> BundleResourceManager? {
        return nil
    }

    func tab(_ tab: Tab, blobResourceManagerOfExtensionID extensionID: String, forPath path: String) -> BlobResourceManager? {
        return nil
    }


}

// MARK: - TabDownloadsDelegate
extension ExampleBrowserCore {

    func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options) {
        // do nothing
    }

    func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<BlobStorage, Error>) {
        // do nothing
    }

}
