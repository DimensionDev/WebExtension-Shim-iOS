//
//  HoloflowsKitTests.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import XCTest
import WebKit
import HoloflowsKit
import ConsolePrint

enum TestHelper {

    static func prepareTest(tab: Tab, forTestCase testCase: XCTestCase) {
        if tab.webView.url == nil {
            tab.webView.loadHTMLString("", baseURL: nil)
        }

        // wait for browser script inject
        let sleepExpectation = testCase.expectation(description: "sleep")
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            sleepExpectation.fulfill()
        }

        testCase.wait(for: [sleepExpectation], timeout: 6.0)
    }

    //static func prepareCustomURLSchemeTest(tab: Tab) {
    //    let bundle = Bundle(for: TabsTests.self)
    //    let htmlPath = bundle.path(forResource: "Lena", ofType: "html")
    //    XCTAssertNotNil(htmlPath)
    //    let url = URL(fileURLWithPath: htmlPath!)
    //    let html = try? String(contentsOf: url)
    //    XCTAssertNotNil(html)
    //    tab.webView.loadHTMLString(html!, baseURL: bundle.bundleURL)
    //
    //    waitCallback(3)
    //}
    //
    //static func prepareBlobTest(tab: Tab) {
    //    prepareCustomURLSchemeTest(tab: tab)
    //}
    //
    //static func prepareDownloadTest(tab: Tab) {
    //    prepareCustomURLSchemeTest(tab: tab)
    //}

    static func expectEvaluateJavaScript(in webView: WKWebView, script: String, verbose: Bool = true, forTestCase testCase: XCTestCase, completionHandler: @escaping ((Any?, Error?) -> Void)) -> XCTestExpectation {
        let scriptExpectation = testCase.expectation(description: "evaluate java script")

        if verbose {
            consolePrint("eval: \(script.prefix(200))")
        }
        webView.evaluateJavaScript(script) { (any, error) in
            if verbose {
                consolePrint("\(String(describing: any).prefix(200)) \(error?.localizedDescription ?? "")")
            }
            completionHandler(any, error)
            scriptExpectation.fulfill()
        }

        return scriptExpectation
    }

    static func waitCallback(_ timeout: TimeInterval, forTestCase testCase: XCTestCase) {
        let waitCallbackExpectation = testCase.expectation(description: "waitCallback")

        DispatchQueue.main.asyncAfter(deadline: .now() + timeout) {
            waitCallbackExpectation.fulfill()
        }

        testCase.wait(for: [waitCallbackExpectation], timeout: timeout * 2)
    }

    static func webKit<T>(messageHandler scriptEvent: ScriptEvent = ScriptEvent.holoflowsjsonrpc, messageBody: HoloflowsRPC.Request<T>, callback: String = "") -> String {
        let jsonData = try! JSONEncoder().encode(messageBody)
        let jsonString = String(data: jsonData, encoding: .utf8)!

        return """
        window.webkit.messageHandlers['\(scriptEvent.rawValue)'].postMessage(JSON.stringify(\(jsonString)));
        """
    }

    static func echoScript(messageHandler scriptEvent: ScriptEvent = ScriptEvent.holoflowsjsonrpc, val: String) -> String {
        return """
        window.webkit.messageHandlers['\(scriptEvent.rawValue)'].postMessage(JSON.stringify({
            jsonrpc: "2.0",
            method: "_echo",
            id: "\(UUID().uuidString)",
            params: \(val)
        }));
        """
    }

}
