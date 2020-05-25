//
//  WKScriptMessageHandlerTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import XCTest
import WebExtension_Shim

class WKScriptMessageHandlerTests: XCTestCase {

    var browser = Browser(delegate: EmptyBrowserDelegate())

    override func setUp() {
        super.setUp()
        browser = Browser(delegate: EmptyBrowserDelegate())
    }

}

extension WKScriptMessageHandlerTests {

    func testRPCEcho() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let messageBody = HoloflowsRPC.Request<WebExtension._Echo>(params: WebExtension._Echo(payload: Date().description), id: UUID().uuidString)
        let echoScript = TestHelper.webKit(messageBody: messageBody)
        let echoExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: echoScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [echoExpectation], timeout: 3.0)
        
    }

}

