//
//  BrowserTabsTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import XCTest
import WebKit
import WebExtension_Shim
import SwiftyJSON

class BrowserTabsTests: XCTestCase {

    lazy var browser = Browser(delegate: self)

    override func setUp() {
        super.setUp()
        browser = Browser(delegate: self)
    }

}

extension BrowserTabsTests: BrowserDelegate {
    
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

extension BrowserTabsTests: TabDelegate {
    
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
        return nil
    }
    
}

extension BrowserTabsTests {

    func testCreate() {
        XCTAssertEqual(browser.tabs.storage.count, 0)
        let tab = browser.tabs.create(options: nil)
        XCTAssertEqual(tab.id, 1)
        XCTAssertEqual(browser.tabs.storage.count, 1)
    }

    func testRemove() {
        XCTAssertEqual(browser.tabs.storage.count, 0)
        let tab = browser.tabs.create(options: nil)
        XCTAssertEqual(tab.id, 1)
        XCTAssertEqual(browser.tabs.storage.count, 1)
        browser.tabs.remove(id: tab.id)
        XCTAssertEqual(browser.tabs.storage.count, 0)
    }

    func testCreateAndRemove() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        XCTAssertEqual(browser.tabs.storage.count, 1)

        let extensionID = "HoloflowsKit-UnitTests"
        let create = WebExtension.Browser.Tabs.Create(extensionID: extensionID, options: WebExtension.Browser.Tabs.Create.Options(url: "https://www.apple.com"))
        let createRequest = HoloflowsRPC.Request<WebExtension.Browser.Tabs.Create>(params: create, id: UUID().uuidString)
        let createScript = TestHelper.webKit(messageBody: createRequest)

        let createScriptExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: createScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [createScriptExpectation], timeout: 5.0)
        TestHelper.waitCallback(3, forTestCase: self)
        XCTAssertEqual(browser.tabs.storage.count, 2)

        let remove = WebExtension.Browser.Tabs.Remove(extensionID: extensionID, tabId: browser.tabs.storage[1].id)
        let removeRequest = HoloflowsRPC.Request<WebExtension.Browser.Tabs.Remove>(params: remove, id: UUID().uuidString)
        let removeScript = TestHelper.webKit(messageBody: removeRequest)
        let removeScriptExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: removeScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [removeScriptExpectation], timeout: 5.0)
        TestHelper.waitCallback(3, forTestCase: self)
        XCTAssertEqual(browser.tabs.storage.count, 1)
    }

    func testQuery() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        XCTAssertEqual(browser.tabs.storage.count, 1)
        let _ = browser.tabs.create(options: .init(active: false, url: "https://www.apple.com"))
        XCTAssertEqual(browser.tabs.storage.count, 2)
        // add listener
        let queryID = UUID().uuidString
        let addListenerScript = """
        let myArray = [];
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            if (event.detail.id != '\(queryID)') {
                return;
            }
            
            myArray = event.detail.result;
            \(TestHelper.echoScript(val: "myArray"))
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        // query
        let query = WebExtension.Browser.Tabs.Query(extensionID: "HoloflowsKit-UnitTests", queryInfo: JSON.null)
        let queryRequest = HoloflowsRPC.Request(params: query, id: queryID)
        let queryScript = TestHelper.webKit(messageBody: queryRequest)
        let queryExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: queryScript, forTestCase: self) { any, error in
            // do noting
        }
        wait(for: [queryExpectation], timeout: 3.0)
        
        // needs wait native query callback finish
        TestHelper.waitCallback(3.0, forTestCase: self)

        // check
        let checkExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "myArray", forTestCase: self) { any, error in
            XCTAssertNil(error)
            let array = JSON(rawValue: any ?? Data())?.arrayValue ?? []
            XCTAssertEqual(array.count, 2)
            guard array.count == 2 else {
                XCTFail()
                return
            }
            XCTAssertEqual(array[0]["id"], 1)
            XCTAssertEqual(array[0]["url"], "about:blank")
            XCTAssertEqual(array[1]["id"], 2)
            XCTAssertEqual(array[1]["url"], "https://www.apple.com/")
        }
        wait(for: [checkExpectation], timeout: 3.0)
    }

    func testQueryActive() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        XCTAssertEqual(browser.tabs.storage.count, 1)
        let _ = browser.tabs.create(options: .init(active: true, url: "https://www.apple.com"))
        let _ = browser.tabs.create(options: .init(active: false, url: "https://www.example.com"))

        // add listener
        let queryID = UUID().uuidString
        let addListenerScript = """
        var array = [];
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
        if (event.detail.id != '\(queryID)') { return; }

        array = event.detail.result;
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        // query
        let json: JSON = ["active", true]
        let query = WebExtension.Browser.Tabs.Query(extensionID: "HoloflowsKit-UnitTests", queryInfo: json)
        let queryRequest = HoloflowsRPC.Request(params: query, id: queryID)
        let queryScript = TestHelper.webKit(messageBody: queryRequest)
        let queryExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: queryScript, forTestCase: self) { any, error in
            // do noting
        }
        wait(for: [queryExpectation], timeout: 3.0)
        
        // needs wait native query callback finish
        TestHelper.waitCallback(3.0, forTestCase: self)

        // check
        let checkExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "array;", forTestCase: self) { any, error in
            XCTAssertNil(error)
            let array = JSON(rawValue: any ?? Data())?.arrayValue ?? []
            XCTAssertEqual(array.count, 3)
            guard array.count == 3 else {
                XCTFail()
                return
            }
            XCTAssertEqual(array[0]["id"], 1)
            XCTAssertEqual(array[0]["url"], "about:blank")
            XCTAssertEqual(array[1]["id"], 2)
            XCTAssertEqual(array[1]["url"], "https://www.apple.com/")
        }
        wait(for: [checkExpectation], timeout: 3.0)
    }

    func testUpdate() {
        let tab = browser.tabs.create(options: .init(active: false, url: "https://www.apple.com/"))
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        XCTAssertEqual(browser.tabs.storage.count, 1)

        TestHelper.waitCallback(3.0, forTestCase: self)
        XCTAssertEqual(tab.webView.url?.absoluteString, "https://www.apple.com/")

        let updateProperties = WebExtension.Browser.Tabs.Update.UpdateProperties(url: "https://example.org/", active: false)
        let update = WebExtension.Browser.Tabs.Update(extensionID: "HoloflowsKit-UnitTests", tabId: tab.id, updateProperties: updateProperties)
        let updateRequest = HoloflowsRPC.Request(params: update, id: UUID().uuidString)
        let updateScript = TestHelper.webKit(messageBody: updateRequest)
        let updateExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: updateScript, forTestCase: self) { any, error in
            // do noting
        }
        wait(for: [updateExpectation], timeout: 3.0)

        XCTAssertEqual(tab.webView.url?.absoluteString, "https://example.org/")
    }

}

extension BrowserTabsTests {

    func testScriptExecute() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let addFunctionScript = """
        function plus(lhs, rhs) {
            return lhs + rhs;
        };
        """
        let addFunctionExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addFunctionScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addFunctionExpectation], timeout: 3.0)

        let executeScript = WebExtension.Browser.Tabs.ExecuteScript(extensionID: "HoloflowKit-UnitTests", tabID: tab.id, details: .init(code: "var result = plus(50 * 8, 2);", file: nil, runAt: nil))
        let script = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: executeScript, id: UUID().uuidString))
        let calculateExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: script, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [calculateExpectation], timeout: 3.0)


        let resultCheckExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "result;", forTestCase: self) { (any, error) in
            XCTAssertEqual(any as? Int, 402)
        }
        wait(for: [resultCheckExpectation], timeout: 3.0, enforceOrder: true)
    }

}
