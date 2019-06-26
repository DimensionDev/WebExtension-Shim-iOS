//
//  MessageExchangeTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import XCTest
import HoloflowsKit
import SwiftyJSON

class MessageExchangeTests: XCTestCase {

    var browser = Browser()

    override func setUp() {
        super.setUp()
        browser = Browser()
    }

}

// [x] SendMessage
// [x] @host OnMessage
extension MessageExchangeTests {

    func testSendMessage() {
        let request = try! JSONDecoder().decode(HoloflowsRPC.Request<WebExtension.SendMessage>.self, from: Data(MessageExchangeTests.requestJSON.utf8))
        XCTAssertEqual(request.jsonrpc, RPC.Version.default)
        XCTAssertEqual(request.method, WebExtension.SendMessage.method)
        XCTAssertEqual(request.params.extensionID, "eofkdgkhfoebecmamljfaepckoecjhib")
        XCTAssertEqual(request.params.toExtensionID, "eofkdgkhfoebecmamljfaepckoecjhib")
        XCTAssertEqual(request.params.tabId, 0)
        XCTAssertEqual(request.params.messageID, "0.c7zclkj3")
        XCTAssertEqual(request.params.message.string, "Message Body")
        XCTAssertEqual(request.id, "0.d832czxv3y")
    }

    func testOnMessage() {
        let request = try! JSONDecoder().decode(HoloflowsRPC.Request<WebExtension.SendMessage>.self, from: Data(MessageExchangeTests.requestJSON.utf8))

        let url = "https://www.apple.com"
        let tab = browser.tabs.create(options: WebExtension.Browser.Tabs.Create.Options(url: url))
        let sender = WebExtension.Browser.Runtime.MessageSender(tab: tab, id: request.params.extensionID, url: url)

        let onMessage = WebExtension.OnMessage(fromMessageSender: sender, sendMessage: request.params)
        let response = HoloflowsRPC.Response<WebExtension.OnMessage>(result: onMessage, id: UUID().uuidString)

        let data = try! JSONEncoder().encode(response)
        let json = try! JSON(data: data)
        XCTAssertEqual(json["jsonrpc"], "2.0")
        XCTAssertEqual(json["result"]["extensionID"].string, onMessage.extensionID)
        XCTAssertEqual(json["result"]["toExtensionID"].string, onMessage.toExtensionID)
        XCTAssertEqual(json["result"]["messageID"].string, onMessage.messageID)
        XCTAssertEqual(json["result"]["message"].string, onMessage.message.string)
        XCTAssertEqual(json["result"]["sender"]["tab"]["id"].int, 0)
        XCTAssertEqual(json["result"]["sender"]["id"].string, request.params.extensionID)
        XCTAssertEqual(json["result"]["sender"]["url"].string, url)
    }

    func testSendAndReceiveMessage() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        // add message listener
        let addListenerScript = """
        var message = '';
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            message = event.detail.result.message
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        // send message
        let sendMessageRequest = try! JSONDecoder().decode(HoloflowsRPC.Request<WebExtension.SendMessage>.self, from: Data(MessageExchangeTests.requestJSON.utf8))
        let sendMessageScript = TestHelper.webKit(messageBody: sendMessageRequest)
        let sendMessageExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: sendMessageScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [sendMessageExpectation], timeout: 3.0)

        // check message
        let checkMessageScript = """
        message;
        """
        let checkMessageExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: checkMessageScript, forTestCase: self) { (any, error) in
            XCTAssertNil(error)
            XCTAssertNotNil(any)
            XCTAssertEqual(any as? String, "Message Body")
        }
        wait(for: [checkMessageExpectation], timeout: 3.0)


    }

    static let requestJSON = """
        {
            "jsonrpc": "2.0",
            "method": "sendMessage",
            "params": [
                "eofkdgkhfoebecmamljfaepckoecjhib",
                "eofkdgkhfoebecmamljfaepckoecjhib",
                0,
                "0.c7zclkj3",
                "Message Body"
            ],
            "id": "0.d832czxv3y"
        }
        """

}
