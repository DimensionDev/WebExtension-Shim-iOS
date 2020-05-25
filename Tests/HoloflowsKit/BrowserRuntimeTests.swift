//
//  BrowserRuntimeTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import WebKit
import WebExtension_Shim
import SwiftyJSON
import ConsolePrint

class BrowserRuntimeTests: XCTestCase {

    var browser = Browser(delegate: EmptyBrowserDelegate())

    override func setUp() {
        super.setUp()
        browser = Browser(delegate: EmptyBrowserDelegate())
    }

}

extension BrowserRuntimeTests: BrowserDelegate {
    
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
        return nil
    }
    
    func browser(_ browser: Browser, tabDownloadDelegateFor tab: Tab) -> TabDownloadsDelegate? {
        return nil
    }
    
}

extension BrowserRuntimeTests {

    func testGetURL() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let getURLID = UUID().uuidString
        let addListenerScript = """
        var url = '';
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            if (event.detail.id != '\(getURLID)') { return; }

            url = event.detail.result;
            \(TestHelper.echoScript(val: "url"))
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        let getURL = WebExtension.Browser.Runtime.GetURL(extensionID: "HoloflowsKit-UnitTests", path: "lena_std.tif.tiff")
        let getURLScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: getURL, id: getURLID))
        let getURLExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: getURLScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [getURLExpectation], timeout: 3.0)

        // check url
        TestHelper.waitCallback(3.0, forTestCase: self)
        let checkURLExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "url;", forTestCase: self) { (any, error) in
            XCTAssertEqual(any as? String, "holoflows-extension://HoloflowsKit-UnitTests/lena_std.tif.tiff")
        }
        wait(for: [checkURLExpectation], timeout: 3.0)
    }

}
