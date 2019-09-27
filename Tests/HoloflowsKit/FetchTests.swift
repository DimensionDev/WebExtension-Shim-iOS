//
//  FetchTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-7-9.
//

import XCTest
import SwiftyJSON
import WebExtension_Shim

class FetchTests: XCTestCase {

    var browser = Browser()
    let localStorageManager = LocalStorageManager(realm: RealmService.default.realm)
    let blobResourceManager = BlobResourceManager(realm: RealmService.default.realm)
    let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: FetchTests.self))

    override func setUp() {
        super.setUp()
        browser = Browser(core: self)
    }

}

extension FetchTests: BrowserCore {

    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON.null, environment: type, resources: JSON.null)
    }


    func tab(_ tab: Tab, localStorageManagerForTab: Tab) -> LocalStorageManager {
        return localStorageManager
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

