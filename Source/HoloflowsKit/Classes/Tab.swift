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

public protocol TabDelegate: class {
    func tab(_ tab: Tab, requestManifestForExtension extensionID: String) -> String
    func tab(_ tab: Tab, requestBundleResourceManagerForExtension extensionID: String) -> BundleResourceManager?
    func tab(_ tab: Tab, requestBlobResourceManagerForExtension extensionID: String) -> BlobResourceManager?
    func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options)
    func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<BlobStorage, Error>)
}

open class Tab: NSObject {

    weak var tabs: Tabs?

    public let id: Int
    public let userContentController: WKUserContentController
    public let webView: WKWebView

    public var uiDelegateProxy: WebViewProxy<WKUIDelegate>?
    public var navigationDelegateProxy: WebViewProxy<WKNavigationDelegate>?

    open weak var delegate: TabDelegate?
    open weak var uiDelegate: WKUIDelegate? {
        didSet {
            uiDelegate.flatMap { uiDelegateProxy?.registerSecondary($0) }
        }
    }
    open weak var navigationDelegate: WKNavigationDelegate? {
        didSet {
            navigationDelegate.flatMap{ navigationDelegateProxy?.registerSecondary($0) }
        }
    }

    public init(id: Int, createOptions options: WebExtension.Browser.Tabs.Create.Options? = nil, webViewConfiguration configuration: WKWebViewConfiguration? = nil) {
        self.id = id
        self.userContentController = WKUserContentController()
        let configuration = configuration ?? WKWebViewConfiguration()
        configuration.userContentController = userContentController
        let bundle = Bundle(for: Tab.self)
        if let bundleURL = bundle.resourceURL?.appendingPathComponent("WebExtensionScripts.bundle"),
        let scriptsBundle = Bundle(url: bundleURL),
        let scriptPath = scriptsBundle.path(forResource: "out", ofType: "js"),
        let script = try? String(contentsOfFile: scriptPath) {
//            let dict = ["js/x.js" : "console.log('Hello');"]
//            let jsonData = try! JSONEncoder().encode(dict)
//            let jsonString = String(data: jsonData, encoding: .utf8)
//            let newScript = script.replacingOccurrences(of: "#Inject_JSON_Object#", with: jsonString ?? "")
            let userScript = WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
            userContentController.addUserScript(userScript)
        } else {
            assertionFailure()
        }

        self.webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 100, height: 100), configuration: configuration)

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

    open func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
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
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
            consolePrint("invalid request")
            return
        }

        switch api {
        case ._echo:                                echo(id: id, messageBody: messageBody)
        case .sendMessage:                          sendMessage(id: id, messageBody: messageBody)
        case .urlCreateObjectURL:                   URLCreateObjectURL(id: id, messageBody: messageBody)
        case .browserDownloadsDownload:             browserDownloadsDownload(id: id, messageBody: messageBody)
        case .browserRuntimeGetURL:                 browserRuntimeGetURL(id: id, messageBody: messageBody)
        case .browserRuntimeGetManifest:            browserRuntimeGetManifest(id: id, messageBody: messageBody)
        case .browserTabsExecuteScript:             browserTabsExecuteScript(id: id, messageBody: messageBody)
        case .browserTabsCreate:                    browserTabsCreate(id: id, messageBody: messageBody)
        case .browserTabsRemove:                    browserTabsRemove(id: id, messageBody: messageBody)
        case .browserTabsQuery:                     browserTabsQuery(id: id, messageBody: messageBody)
        case .browserStorageLocalGet:               browserStorageLocalGet(id: id, messageBody: messageBody)
        case .browserStorageLocalSet:               browserStorageLocalSet(id: id, messageBody: messageBody)
        case .browserStorageLocalRemove:            browserStorageLocalRemove(id: id, messageBody: messageBody)
        case .browserStorageLocalClear:             browserStorageLocalClear(id: id, messageBody: messageBody)
        case .browserStorageLocalGetBytesInUse:     browserStorageLocalGetBytesInUse(id: id, messageBody: messageBody)
        }          
//        }   // end switch eventType
    }   // end func userContentController

}

// MARK: - WKUIDelegate
extension Tab: WKUIDelegate {

}

// MARK: - WKNavigationDelegate
extension Tab: WKNavigationDelegate {

    open func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        consolePrint(webView.url)

        typealias OnCommitted = WebExtension.Browser.WebNavigation.OnCommitted

        let rpcID = UUID().uuidString
        let onCommitted =  OnCommitted(tab: .init(tabId: id, url: webView.url?.absoluteString ?? ""))
        let request = HoloflowsRPC.ServerRequest(params: onCommitted, id: rpcID)

        HoloflowsRPC.dispathRequest(webView: webView, id: rpcID, request: request, completionHandler: Tab.completionHandler)
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
