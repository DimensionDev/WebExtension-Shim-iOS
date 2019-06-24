//
//  BrowserTabsTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import XCTest
import HoloflowsKit

class BrowserTabsTests: XCTestCase {

    var browser = Browser()

    override func setUp() {
        super.setUp()
        browser = Browser()
    }

}

extension BrowserTabsTests {

    func testCreate() {
        XCTAssertEqual(browser.tabs.storage.count, 0)
        let tab = browser.tabs.create(options: nil)
        XCTAssertEqual(tab.id, 0)
        XCTAssertEqual(browser.tabs.storage.count, 1)
    }

    func testRemove() {
        XCTAssertEqual(browser.tabs.storage.count, 0)
        let tab = browser.tabs.create(options: nil)
        XCTAssertEqual(tab.id, 0)
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
