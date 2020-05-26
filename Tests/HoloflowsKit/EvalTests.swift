//
//  EvalTests.swift
//  Pods
//
//  Created by Cirno MainasuK on 2020-5-25.
//

import XCTest
import WebExtension_Shim
import SwiftyJSON

class EvalTests: XCTestCase {

    var browser = Browser(delegate: EmptyBrowserDelegate())
    
    override func setUp() {
        super.setUp()
        browser = Browser(delegate: EmptyBrowserDelegate())
    }

}

extension EvalTests {
    
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
        
        let executeScript = WebExtension.Eval(extensionID: "HoloflowKit-UnitTests", string: "var result = plus(50 * 8, 2);")
        let script = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: executeScript, id: UUID().uuidString))
        let calculateExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: script, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [calculateExpectation], timeout: 3.0)
        
        // needs wait native callback finish
        TestHelper.waitCallback(3.0, forTestCase: self)
        
        let resultCheckExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "result;", forTestCase: self) { (any, error) in
            XCTAssertEqual(any as? Int, 402)
        }
        wait(for: [resultCheckExpectation], timeout: 3.0, enforceOrder: true)
    }
    
}
