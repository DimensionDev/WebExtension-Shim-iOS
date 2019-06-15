//
//  Tab.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-10.
//

import Foundation
import WebKit
import JavaScriptCore
import ConsolePrint

public class Tab: NSObject {

    weak var tabs: Tabs?

    public let id: Int
    public let userContentController: WKUserContentController
    public let webView: WKWebView


    public init(id: Int, createProperties properties: WebExtensionAPI.CreateProperties? = nil, webViewConfiguration configuration: WKWebViewConfiguration = WKWebViewConfiguration()) {
        self.id = id
        self.userContentController = WKUserContentController()

        configuration.userContentController = userContentController
        let bundle = Bundle(for: Tab.self)
        if let bundleURL = bundle.resourceURL?.appendingPathComponent("WebExtensionScripts.bundle"),
            let scriptsBundle = Bundle(url: bundleURL),
            let scriptPath = scriptsBundle.path(forResource: "webExtension", ofType: "js"),
            let script = try? String(contentsOfFile: scriptPath) {
            let userScript = WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
            userContentController.addUserScript(userScript)
        } else {
            assertionFailure()
        }

        self.webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 100, height: 100), configuration: configuration)

        super.init()

        webView.setNeedsLayout()
        webView.uiDelegate = self
        webView.navigationDelegate = self

        for event in ScriptEvent.allCases {
            userContentController.add(self, name: event.rawValue)
        }

        if let url = properties?.url, let URL = URL(string: url) {
            webView.load(URLRequest(url: URL))
        } else {
            // TODO:
        }
    }

    public func resignMessageHandler() {
        for event in ScriptEvent.allCases {
            userContentController.removeScriptMessageHandler(forName: event.rawValue)
        }
    }

    deinit {
        webView.removeFromSuperview()
        consolePrint("deinit")
    }

}

// MARK: - WKScriptMessageHandler
extension Tab: WKScriptMessageHandler {

    static let completionHandler: ((Any?, Error?) -> Void) = { any, error in
        guard let error = error else {
            consolePrint("\(String(describing: any))")
            return
        }
        consolePrint(error.localizedDescription)
    }

    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let eventType = ScriptEvent(rawValue: message.name) else {
            assertionFailure()
            return
        }
        let messageBody = message.body as? String ?? ""
        consolePrint("[\(eventType.rawValue)]: \(messageBody)")

        guard let id = try? ScriptMessage.parseMessageID(messageBody: messageBody) else {
            assertionFailure()
            return
        }

        switch eventType {
        case .echo:
            let messageResult: Result<ScriptMessage.Echo, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: messageResult, completionHandler: Tab.completionHandler)

        case .send:
            let messageResult: Result<ScriptMessage.Send, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
            guard let message = try? messageResult.get() else {
                assertionFailure()
                return
            }
            tabs?.sendMessage(message, from: self)

        case .browserTabsCreate:         browserTabsCreate(messageID: id, messageBody: messageBody)
        case .browserTabsRemove:         browserTabsRemove(messageID: id, messageBody: messageBody)
        case .browserTabsExecuteScript:  browserTabsExecuteScript(messageID: id, messageBody: messageBody)

        case .browserStorageLocalGet:    browserStorageLocalGet(messageID: id, messageBody: messageBody)
        case .browserStorageLocalSet:    browserStorageLocalSet(messageID: id, messageBody: messageBody)
        case .browserStorageLocalRemove: browserStorageLocalRemove(messageID: id, messageBody: messageBody)
        case .browserStorageLocalClear:  browserStorageLocalClear(messageID: id, messageBody: messageBody)
            
        }   // end switch eventType
    }   // end func userContentController

}

// MARK: - WKUIDelegate
extension Tab: WKUIDelegate {

}

// MARK: - WKNavigationDelegate
extension Tab: WKNavigationDelegate {

    public func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        consolePrint(webView.url)
        let details = WebExtensionAPI.NavigationDetails(tabId: id, url: webView.url?.absoluteString ?? "")
        let result = Result<WebExtensionAPI.NavigationDetails, Error>.success(details)
        ScriptMessage.dispatchEvent(webView: self.webView, eventName: "webNavigationOnCommitted", result: result, completionHandler: Tab.completionHandler)
    }

}

// MARK: - Encodable
extension Tab: Encodable {

    enum CodingKeys: String, CodingKey {
        case id
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
    }

}
