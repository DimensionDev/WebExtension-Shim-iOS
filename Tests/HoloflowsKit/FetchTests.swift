//
//  FetchTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-7-9.
//

import XCTest
import SwiftyJSON
import WebKit
import WebExtension_Shim

class FetchTests: XCTestCase {

    lazy var browser = Browser(delegate: self)
    let blobResourceManager = BlobResourceManager(realm: RealmService.default.realm)
    let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: FetchTests.self))

    override func setUp() {
        super.setUp()
        browser = Browser(delegate: self)
    }

}

extension FetchTests: BrowserDelegate {
    func pluginResourceURLScheme() -> [String] {
        return []
    }
    
    func browser(_ browser: Browser, pluginForScriptType scriptType: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON.null, environment: scriptType, resources: JSON.null)
    }
    
    func browser(_ browser: Browser, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        return WKWebViewConfiguration()
    }
    
    func browser(_ browser: Browser, tabDelegateForTab tab: Tab) -> TabDelegate? {
        return self
    }
    
    func browser(_ browser: Browser, tabDownloadDelegateFor tab: Tab) -> TabDownloadsDelegate? {
        return nil
    }
}
    
extension FetchTests: TabDelegate {
    
    func uiDelegateShim(for tab: Tab) -> WKUIDelegateShim? {
        return nil
    }
    
    func navigationDelegateShim(for tab: Tab) -> WKNavigationDelegateShim? {
        return nil
    }
    
    func tab(_ tab: Tab, localStorageManagerForExtension id: String) -> LocalStorageManager {
        return LocalStorageManager(realm: RealmService(name: id).realm)
    }
    
    func tab(_ tab: Tab, pluginResourceProviderForURL url: URL) -> PluginResourceProvider? {
        switch url.scheme {
        case "holoflows-blob":
            return blobResourceManager
        case "holoflows-extension":
            return bundleResourceManager
        default:
            return nil
        }
    }
    
}

extension FetchTests {

    func testFetchGet() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let fetch = WebExtension.Fetch(extensionID: "HoloflowsKit-UnitTest", request: WebExtension.Fetch.Request(method: "GET", url: "https://postman-echo.com/get?foo1=bar1&foo2=bar2"))
        let fetchRequest = HoloflowsRPC.Request(params: fetch, id: UUID().uuidString)

        let fetchScript = TestHelper.webKit(messageBody: fetchRequest)
        let fetchExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: fetchScript, forTestCase: self) { any, error in
            // do nothing
        }

        wait(for: [fetchExpectation], timeout: 3.0)
        TestHelper.waitCallback(10, forTestCase: self)
    }

    func testFetchGetBundleResource() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let fetch = WebExtension.Fetch(extensionID: "HoloflowsKit-UnitTest", request: WebExtension.Fetch.Request(method: "GET", url: "holoflows-extension://HoloflowsKit-UnitTest/Lena.html"))
        let fetchRequest = HoloflowsRPC.Request(params: fetch, id: UUID().uuidString)

        let fetchScript = TestHelper.webKit(messageBody: fetchRequest)
        let fetchExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: fetchScript, forTestCase: self) { any, error in
            // do nothing
        }

        wait(for: [fetchExpectation], timeout: 3.0)
        TestHelper.waitCallback(10, forTestCase: self)
    }

}

