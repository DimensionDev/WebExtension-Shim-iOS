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
            consolePrint("\(any)")
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

        case .browserTabsCreate:
            let messageResult: Result<ScriptMessage.TabsCreate, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
            switch messageResult {
            case let .success(tabsCreate):
                let tab = (tabs.flatMap { tabs -> Result<Tab, Error> in
                    return .success(tabs.create(createProperties: tabsCreate.createProperties))
                }) ?? .failure(ScriptMessage.InternalError.tabsCreateFail)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: tab, completionHandler: Tab.completionHandler)
                consolePrint(tabs?.storage)

            case let .failure(error):
                let result: Result<Tab, Error> = .failure(error)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            }

        case .browserTabsRemove:
            let messageResult: Result<ScriptMessage.TabsRemove, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
            switch messageResult {
            case let .success(tabsRemove):
                switch tabsRemove.tabID {
                case .integer(let tabID):
                    if let _ = tabs?.remove(id: tabID) {
                        let result: Result<Void, Error> = .success(Void())
                        ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
                    } else {
                        let result: Result<Void, Error> = .failure(ScriptMessage.InternalError.tabsRemoveFail)
                        ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
                    }

                case .integerArray(let tabIDs):
                    if let _ = tabs?.remove(ids: tabIDs) {
                        let result: Result<Void, Error> = .success(Void())
                        ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
                    } else {
                        let result: Result<Void, Error> = .failure(ScriptMessage.InternalError.tabsRemoveFail)
                        ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
                    }
                }


            case let .failure(error):
                let result: Result<Void, Error> = .failure(error)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            }
            consolePrint(tabs?.storage)

        case .browserTabsExecuteScript:
            let messageResult: Result<ScriptMessage.TabsExecuteScript, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
            guard let message = try? messageResult.get(),
            let tabs = tabs,
            let targetTab = tabs.storage.first(where: { $0.id == (message.tabId ?? 0) }) else {
                assertionFailure()
                return
            }

            let script = message.details.code
            targetTab.webView.evaluateJavaScript(script) { [weak self] any, error in
                guard let `self` = self else { return }
                if let error = error {
                    let result: Result<Void, Error> = .failure(error)
                    ScriptMessage.dispatchEvent(webView: self.webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
                } else {
                    let payload: Result<Any, Error> = {
                        guard let value = any else {
                            return .failure(ScriptMessage.InternalError.tabsExecuteScriptReturnNil)
                        }
                        return .success(value)
                    }()
                    consolePrint("\(payload), \(any)")
                    ScriptMessage.dispatchEvent(webView: self.webView, eventName: id, result: payload, completionHandler: Tab.completionHandler)
                }
            }

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
