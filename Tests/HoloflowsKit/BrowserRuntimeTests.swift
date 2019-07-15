//
//  BrowserRuntimeTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import WebKit
import HoloflowsKit
import SwiftyJSON
import ConsolePrint

class BrowserRuntimeTests: XCTestCase {

    var browser = Browser()

    override func setUp() {
        super.setUp()
        browser = Browser()
    }

}

extension BrowserRuntimeTests {

    func testGetURL() {
//        let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: BrowserRuntimeTests.self))
//        let handers = [URLSchemeHandlerManager.URLSchemeHander(scheme: "holoflows-kit", extensionID: "HoloflowsKit-UnitTests", urlSchemeHandler: bundleResourceManager)]
//        browser.schemeHanderManager = URLSchemeHandlerManager(handlers: handers)

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
            XCTAssertEqual(any as? String, "holoflows-kit://HoloflowsKit-UnitTests/lena_std.tif.tiff")
        }
        wait(for: [checkURLExpectation], timeout: 3.0)
    }

}
