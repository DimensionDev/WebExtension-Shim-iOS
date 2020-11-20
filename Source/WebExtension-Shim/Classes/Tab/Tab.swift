//
//  Maskbook.swift
//  Maskbook
//
//  Created by Cirno MainasuK on 2019-6-10.
//

import Foundation
import WebKit
import ConsolePrint
import SwiftyJSON
import Alamofire
import os

// MARK: - TabDelegate
public protocol TabDelegate: class {
    func uiDelegateShim(for tab: Tab) -> WKUIDelegateShim?
    func navigationDelegateShim(for tab: Tab) -> WKNavigationDelegateShim?
    func customScriptMessageHandlerNames(for tab: Tab) -> [String]
    func tab(_ tab: Tab, shouldOpenExternallyForURL url: URL) -> Bool
    func tab(_ tab: Tab, userContentController: WKUserContentController, didReceive message: WKScriptMessage)
    func tab(_ tab: Tab, localStorageManagerForExtension id: String) -> LocalStorageManager

    func tab(_ tab: Tab, shouldActive: Bool)
    func tab(_ tab: Tab, webViewWillRemoveFromSuperview webView: WKWebView)
    func tab(_ tab: Tab, pluginResourceProviderForURL url: URL) -> PluginResourceProvider?
}

extension TabDelegate {
    public func uiDelegate(for tab: Tab) -> WKUIDelegate? { return nil }
    public func navigationDelegate(for tab: Tab) -> WKNavigationDelegate? { return nil }
    public func customScriptMessageHandlerNames(for tab: Tab) -> [String] { return [] }
    public func tab(_ tab: Tab, shouldOpenExternallyForURL url: URL) -> Bool { return false }
    public func tab(_ tab: Tab, userContentController: WKUserContentController, didReceive message: WKScriptMessage) { }
    public func tab(_ tab: Tab, localStorageManagerForExtension id: String) -> LocalStorageManager {
        return LocalStorageManager(realm: RealmService(name: id).realm)
    }

    public func tab(_ tab: Tab, shouldActive: Bool) { }
    public func tab(_ tab: Tab, webViewWillRemoveFromSuperview webView: WKWebView) { }
    public func tab(_ tab: Tab, pluginResourceProviderForURL url: URL) -> PluginResourceProvider? { return nil }
}

// MARK: - TabDownloadsDelegate
public protocol TabDownloadsDelegate: class {
    typealias Result = Swift.Result
    
    func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options)
    func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<(Data, URLResponse), Error>)
}

extension TabDownloadsDelegate {
    public func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options) { }
    public func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<(Data, URLResponse), Error>) { }
}

public struct TabConfiguration {
    public let id: Int
    public let plugin: Plugin?
    public let createOptions: WebExtension.Browser.Tabs.Create.Options?
    public let webViewConfiguration: WKWebViewConfiguration
    public let tabDelegate: (Tab) -> TabDelegate?
    public let tabDownloadDelegate: (Tab) -> TabDownloadsDelegate?

    public weak var browser: Browser?
}

// MARK: - Tab
public class Tab: NSObject {

    weak var browser: Browser?
    weak var delegate: TabDelegate?
    weak var downloadsDelegate: TabDownloadsDelegate?

    let session: SessionManager

    public let id: Int
    public let webView: WKWebView
    public let isActive: Bool

    public let plugin: Plugin?
    let userContentController = WKUserContentController()

    weak var uiDelegateShim: WKUIDelegateShim? {
        didSet {
            webView.uiDelegate = uiDelegateShim ?? WKUIDelegateShim(tab: self)
        }
    }
    weak var navigationDelegateShim: WKNavigationDelegateShim? {
        didSet {
            webView.navigationDelegate = navigationDelegateShim ?? WKNavigationDelegateShim(tab: self)
        }
    }
    
    // User space script message names
    var scriptMessageHandlerNames: [String] = []


    public init(configuration: TabConfiguration) {
        self.browser = configuration.browser
        self.id = configuration.id
        self.plugin = configuration.plugin

        // Setup WKWebView
        configuration.webViewConfiguration.userContentController = self.userContentController
        for userScript in plugin?.userScripts ?? [] {
            userContentController.addUserScript(userScript)
        }

        self.webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 100, height: 100), configuration: configuration.webViewConfiguration)
        self.isActive = configuration.createOptions?.active ?? true     // set active status. default true

        // Setup Alamofire session
        self.session = {
            let userAgent = configuration.browser?.userAgent ?? "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"

            let sessionConfiguration = URLSessionConfiguration.ephemeral
            sessionConfiguration.httpAdditionalHeaders = ["User-Agent" : userAgent]
            let session = Alamofire.SessionManager(configuration: sessionConfiguration)

            return session
       }()

        super.init()
        
        self.delegate = configuration.tabDelegate(self)
        self.downloadsDelegate = configuration.tabDownloadDelegate(self)

        webView.setNeedsLayout()
        webView.uiDelegate = self.delegate?.uiDelegateShim(for: self)
        webView.navigationDelegate = self.delegate?.navigationDelegateShim(for: self)
        webView.allowsLinkPreview = false

        // register Holoflows RPC event
        for event in ScriptEvent.allCases {
            userContentController.add(self, name: event.rawValue)
        }
        // register app custom message handler
        scriptMessageHandlerNames = delegate?.customScriptMessageHandlerNames(for: self) ?? []
        for name in scriptMessageHandlerNames where !ScriptEvent.allCases.contains(where: { $0.rawValue == name }) {
            userContentController.add(self, name: name)
        }

        // Load url
        if let url = configuration.createOptions?.url, let URL = URL(string: url) {
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

        for name in scriptMessageHandlerNames where !ScriptEvent.allCases.contains(where: { $0.rawValue == name }) {
            userContentController.removeScriptMessageHandler(forName: name)
        }
    }

    deinit {
        delegate?.tab(self, webViewWillRemoveFromSuperview: webView)
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
        if scriptMessageHandlerNames.contains(message.name) {
            delegate?.tab(self, userContentController: userContentController, didReceive: message)
            return
        }

        guard let eventType = ScriptEvent(rawValue: message.name) else {
            assertionFailure()
            return
        }
        let messageBody = JSON(rawValue: message.body)?.rawString() ?? ""
        consolePrint("[\(eventType.rawValue)]: \(messageBody.prefix(300))")
        os_log("^ %{public}s[%{public}ld], %{public}s: [%{public}s|%{public}s]: %{public}s", ((#file as NSString).lastPathComponent), #line, #function, String(describing: id), eventType.rawValue, messageBody)

        guard let (method, id) = try? HoloflowsRPC.parseRPCMeta(messageBody: messageBody) else {
            //assertionFailure()
            consolePrint(messageBody)
            os_log("^ %{public}s[%{public}ld], %{public}s: invalid RPC message: %{public}s|%{public}s", ((#file as NSString).lastPathComponent), #line, #function, String(describing: self.id), messageBody)
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
        case .eval:                                 eval(id: id, messageBody: messageBody)
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
        }          
    }   // end func userContentController

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
