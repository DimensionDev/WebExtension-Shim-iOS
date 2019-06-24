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

    open weak var delegate: TabDelegate?

    public init(id: Int, createOptions options: WebExtension.Browser.Tabs.Create.Options? = nil, webViewConfiguration configuration: WKWebViewConfiguration? = nil) {
        self.id = id
        self.userContentController = WKUserContentController()
        let configuration = configuration ?? WKWebViewConfiguration()
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
        let messageBody = message.body as? String ?? ""
        consolePrint("[\(eventType.rawValue)]: \(messageBody.prefix(200))")

        guard let (method, id) = try? HoloflowsRPC.parseRPCMeta(messageBody: messageBody) else {
            assertionFailure()
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
        case .browserStorageLocalGet:               browserStorageLocalGet(id: id, messageBody: messageBody)
        case .browserStorageLocalSet:               browserStorageLocalSet(id: id, messageBody: messageBody)
        case .browserStorageLocalRemove:            browserStorageLocalRemove(id: id, messageBody: messageBody)
        case .browserStorageLocalClear:             browserStorageLocalClear(id: id, messageBody: messageBody)
        case .browserStorageLocalGetBytesInUse:     browserStorageLocalGetBytesInUse(id: id, messageBody: messageBody)
        }

//        switch eventType {
//        case .echo:
//            let messageResult: Result<ScriptMessage.Echo, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
//            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: messageResult, completionHandler: Tab.completionHandler)
//
//        case .send:
//            let messageResult: Result<ScriptMessage.Send, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
//            guard let message = try? messageResult.get() else {
//                assertionFailure()
//                return
//            }
//            tabs?.sendMessage(message, from: self)
//
//        case .createObjectURL:
//            let messageResult: Result<ScriptMessage.CreateObjectURL, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
//            switch messageResult {
//            case let .success(createObjectURL):
//                guard let blobStorage = createObjectURL.blobStorage else {
//                    let result: Result<Void, Error> = .failure(ScriptMessage.InternalError.createObjectURLWithoutValidBlob)
//                    ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
//                    return
//                }
//                let realm = RealmService.default.realm
//                do {
//                    try realm.write {
//                        realm.add(blobStorage, update: .all)
//                    }
//
//                    let result: Result<String, Error> = .success(blobStorage.url)
//                    ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
//
//                } catch {
//                    let result: Result<Void, Error> = .failure(error)
//                    ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
//                }
//
//            case let .failure(error):
//                consolePrint(error.localizedDescription)
//                let result: Result<Void, Error> = .failure(error)
//                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
//            }
//
//        case .browserTabsCreate:         browserTabsCreate(messageID: id, messageBody: messageBody)
//        case .browserTabsRemove:         browserTabsRemove(messageID: id, messageBody: messageBody)
//        case .browserTabsExecuteScript:  browserTabsExecuteScript(messageID: id, messageBody: messageBody)
//
//        case .browserStorageLocalGet:    browserStorageLocalGet(messageID: id, messageBody: messageBody)
//        case .browserStorageLocalSet:    browserStorageLocalSet(messageID: id, messageBody: messageBody)
//        case .browserStorageLocalRemove: browserStorageLocalRemove(messageID: id, messageBody: messageBody)
//        case .browserStorageLocalClear:  browserStorageLocalClear(messageID: id, messageBody: messageBody)
//
//        case .browserRuntimeGetManifest: browserRuntimeGetManifest(messageID: id, messageBody: messageBody)
//        case .browserRuntimeGetURL:      browserRuntimeGetURL(messageID: id, messageBody: messageBody)
//
//        case .browserDownloadsDownload:  browserDownloadsDownload(messageID: id, messageBody: messageBody)
//            
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

    open func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
    }

}
