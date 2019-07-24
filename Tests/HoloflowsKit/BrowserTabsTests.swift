//
//  BrowserTabsTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import XCTest
import HoloflowsKit
import SwiftyJSON

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

    func testQuery() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        XCTAssertEqual(browser.tabs.storage.count, 1)
        let _ = browser.tabs.create(options: .init(active: false, url: "https://www.apple.com"))

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
        let query = WebExtension.Browser.Tabs.Query(extensionID: "HoloflowsKit-UnitTests", queryInfo: JSON.null)
        let queryRequest = HoloflowsRPC.Request(params: query, id: queryID)
        let queryScript = TestHelper.webKit(messageBody: queryRequest)
        let queryExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: queryScript, forTestCase: self) { any, error in
            // do noting
        }
        wait(for: [queryExpectation], timeout: 3.0)

        // check
        let checkExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "array;", forTestCase: self) { any, error in
            XCTAssertNil(error)
            let array = JSON(rawValue: any ?? Data())?.arrayValue ?? []
            XCTAssertEqual(array.count, 2)
            XCTAssertEqual(array[0]["id"], 0)
            XCTAssertEqual(array[0]["url"], "about:blank")
            XCTAssertEqual(array[1]["id"], 1)
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

        // check
        let checkExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "array;", forTestCase: self) { any, error in
            XCTAssertNil(error)
            let array = JSON(rawValue: any ?? Data())?.arrayValue ?? []
            XCTAssertEqual(array.count, 3)
            XCTAssertEqual(array[0]["id"], 0)
            XCTAssertEqual(array[0]["url"], "about:blank")
            XCTAssertEqual(array[1]["id"], 1)
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

        let updateProperties = WebExtension.Browser.Tabs.Update.UpdateProperties(url: "https://example.org/")
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
