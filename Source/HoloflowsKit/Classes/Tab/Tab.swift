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
import SwiftyJSON
import Alamofire

// MARK: - Delegates

public protocol TabDelegate: class {
    func uiDelegate(for tab: Tab) -> WKUIDelegate?
    func navigationDelegate(for tab: Tab) -> WKNavigationDelegate?
    func tab(_ tab: Tab, localStorageManagerForTab: Tab) -> LocalStorageManager

    func tab(_ tab: Tab, shouldActive: Bool)
    func tab(_ tab: Tab, pluginResourceProviderForURL url: URL) -> PluginResourceProvider?
}

extension TabDelegate {
    public func uiDelegate(for tab: Tab) -> WKUIDelegate? { return nil }
    public func navigationDelegate(for tab: Tab) -> WKNavigationDelegate? { return nil }

    public func tab(_ tab: Tab, shouldActive: Bool) { }
    public func tab(_ tab: Tab, pluginResourceProviderForURL url: URL) -> PluginResourceProvider? { return nil }
}

public protocol TabDownloadsDelegate: class {
    typealias Result = Swift.Result
    
    func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options)
    func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<(Data, URLResponse), Error>)
}

extension TabDownloadsDelegate {
    public func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options) { }
    public func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<(Data, URLResponse), Error>) { }
}

// MARK: - Tab
public class Tab: NSObject {

    weak var tabs: Tabs?

    let session: SessionManager = {
        let configuration = URLSessionConfiguration.ephemeral
//        configuration.httpAdditionalHeaders = ["User-Agent" : self.tabs?.userAgent as Any]
        configuration.httpAdditionalHeaders = ["User-Agent" : "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"]
        let session = Alamofire.SessionManager(configuration: configuration)
        return session
    }()

    public let id: Int
    public let webView: WKWebView
    public let isActive: Bool

    let plugin: Plugin?
    let userContentController: WKUserContentController

    var uiDelegateProxy: WebViewProxy<WKUIDelegate>?
    var navigationDelegateProxy: WebViewProxy<WKNavigationDelegate>?

    weak var delegate: TabDelegate?
    weak var downloadsDelegate: TabDownloadsDelegate?

    public init(id: Int, plugin: Plugin?, createOptions options: WebExtension.Browser.Tabs.Create.Options? = nil, webViewConfiguration configuration: WKWebViewConfiguration) {
        self.id = id
        self.plugin = plugin
        self.userContentController = WKUserContentController()
        configuration.userContentController = userContentController
        
        let bundle = Bundle(for: Tab.self)

        // FIXME:
        if let bundleURL = bundle.resourceURL?.appendingPathComponent("WebExtensionScripts.bundle"),
        let scriptsBundle = Bundle(url: bundleURL),
        let scriptPath = scriptsBundle.path(forResource: "webextension-shim", ofType: "js"),
        let script = try? String(contentsOfFile: scriptPath) {
            let newScript = script
                .replacingOccurrences(of: "##ID##", with: plugin?.id ?? "")
                .replacingOccurrences(of: "##Manifest##", with: plugin?.manifest.rawString() ?? "")
                .replacingOccurrences(of: "##Env##", with: plugin?.environment.rawValue ?? "")
                .replacingOccurrences(of: "##Resources##", with: plugin?.resources.rawString() ?? "")

            let hasSchemePrefix = options?.url?.hasPrefix("holoflows-extension://") ?? false
            let injectionTime: WKUserScriptInjectionTime = hasSchemePrefix ? .atDocumentStart : .atDocumentEnd
//            let injectionTime = WKUserScriptInjectionTime.atDocumentEnd
            let userScript = WKUserScript(source: newScript, injectionTime: injectionTime, forMainFrameOnly: false)
            userContentController.addUserScript(userScript)
        } else {
            assertionFailure()
        }

        self.webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 100, height: 100), configuration: configuration)
        self.isActive = options?.active ?? false

        super.init()

        uiDelegateProxy = WebViewProxy(self)
        navigationDelegateProxy = WebViewProxy(self)

        webView.setNeedsLayout()
        webView.uiDelegate = uiDelegateProxy as? WKUIDelegate
        webView.navigationDelegate = navigationDelegateProxy as? WKNavigationDelegate

        for event in ScriptEvent.allCases {
            userContentController.add(self, name: event.rawValue)
        }

        if let url = options?.url, let URL = URL(string: url) {
            webView.load(URLRequest(url: URL))
        } else {
            let html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>URL not invalid</title>
            </head>
            <body>

            </body>
            </html>
            """
            webView.loadHTMLString(html, baseURL: nil)
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

extension Tab {

    public func completionHandler(file: String = #file, method: String = #function, line: Int = #line) -> HoloflowsRPC.CompletionHandler {
        return HoloflowsRPC.CompletionHandler(tabMeta: meta, file: file, method: method, line: line)
    }

}


// MARK: - WKScriptMessageHandler
extension Tab: WKScriptMessageHandler {

    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let eventType = ScriptEvent(rawValue: message.name) else {
            assertionFailure()
            return
        }
        let messageBody = JSON(rawValue: message.body)?.rawString() ?? ""
        consolePrint("[\(eventType.rawValue)]: \(messageBody.prefix(300))")

        guard let (method, id) = try? HoloflowsRPC.parseRPCMeta(messageBody: messageBody) else {
            //assertionFailure()
            consolePrint(messageBody)
            return
        }

        guard let api = WebExtension.API(method: method) else {
            let result: Result<HoloflowsRPC.Response<WebExtension._Echo>, RPC.Error> = .failure(RPCError.invalidRequest)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: completionHandler())
            consolePrint("invalid request")
            return
        }

        switch api {
        case ._echo:                                echo(id: id, messageBody: messageBody)
        case .sendMessage:                          sendMessage(id: id, messageBody: messageBody)
        case .fetch:                                fetch(id: id, messageBody: messageBody)
        case .urlCreateObjectURL:                   URLCreateObjectURL(id: id, messageBody: messageBody)
        case .browserDownloadsDownload:             browserDownloadsDownload(id: id, messageBody: messageBody)
        case .browserRuntimeGetURL:                 browserRuntimeGetURL(id: id, messageBody: messageBody)
        case .browserTabsExecuteScript:             browserTabsExecuteScript(id: id, messageBody: messageBody)
        case .browserTabsCreate:                    browserTabsCreate(id: id, messageBody: messageBody)
        case .browserTabsRemove:                    browserTabsRemove(id: id, messageBody: messageBody)
        case .browserTabsQuery:                     browserTabsQuery(id: id, messageBody: messageBody)
        case .browserTabsUpdate:                    browserTabsUpdate(id: id, messageBody: messageBody)
        case .browserStorageLocalGet:               browserStorageLocalGet(id: id, messageBody: messageBody)
        case .browserStorageLocalSet:               browserStorageLocalSet(id: id, messageBody: messageBody)
        case .browserStorageLocalRemove:            browserStorageLocalRemove(id: id, messageBody: messageBody)
        case .browserStorageLocalClear:             browserStorageLocalClear(id: id, messageBody: messageBody)
        case .websocketCreate:                      websocketCreate(id: id, messageBody: messageBody)
        case .websocketClose:                       websocketClose(id: id, messageBody: messageBody)
        case .websocketSend:                        websocketSend(id: id, messageBody: messageBody)
        }          
//        }   // end switch eventType
    }   // end func userContentController

}

// MARK: - WKUIDelegate
extension Tab: WKUIDelegate {

}

// MARK: - WKNavigationDelegate
extension Tab: WKNavigationDelegate {

    public func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        consolePrint(webView.url)

        typealias OnCommitted = WebExtension.Browser.WebNavigation.OnCommitted

        let rpcID = UUID().uuidString
        let onCommitted =  OnCommitted(tab: .init(tabId: id, url: webView.url?.absoluteString ?? ""))
        let request = HoloflowsRPC.ServerRequest(params: onCommitted, id: rpcID)

        HoloflowsRPC.dispathRequest(webView: webView, id: rpcID, request: request, completionHandler: completionHandler())
    }

}

// MARK: - Encodable
extension Tab {

    public var meta: Meta {
        return Meta(id: id, url: webView.url?.absoluteString ?? "")
    }

    public struct Meta: Codable {
        let id: Int
        let url: String

        public init(id: Int, url: String) {
            self.id = id
            self.url = url
        }
    }

}
