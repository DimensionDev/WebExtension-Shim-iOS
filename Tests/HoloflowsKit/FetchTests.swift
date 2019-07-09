//
//  FetchTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-7-9.
//

import XCTest
import HoloflowsKit

class FetchTests: XCTestCase {

    var browser = Browser()

    override func setUp() {
        super.setUp()
        browser = Browser()
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

}
