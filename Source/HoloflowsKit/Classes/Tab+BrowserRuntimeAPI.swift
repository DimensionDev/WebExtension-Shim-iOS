//
//  Tab+BrowserRuntimeAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-15.
//

import Foundation
import ConsolePrint
import SwiftyJSON

extension Tab {

    open func browserRuntimeGetManifest(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.RuntimeGetManifest, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case .success:
            let json = delegate
                .flatMap { Data($0.tab(self, requestManifest: ()).utf8) }
                .flatMap { JSON(rawValue: $0) } ?? JSON.null

            let result: Result<JSON, Error> = .success(json)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            
        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<Void, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    open func browserRuntimeGetURL(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Runtime.GetURL, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(getURL):
            guard let bundleResourceManager = delegate?.tab(self, requestBundleResourceManager: ()),
            let bundle = bundleResourceManager.bundle(for: getURL.extensionID) else {
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(.serverError)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
                return
            }

            // let bundleName = bundle.bundleURL.deletingPathExtension().lastPathComponent
            // TODO: resolve not exists resource path for bundle
            let path: String = {
                let prefix = "/"
                let path = getURL.path
                if path.hasPrefix(prefix) {
                    return String(path.dropFirst(prefix.count))
                } else {
                    return path
                }

            }()
            let url = "holoflows-kit://" + [getURL.extensionID, path].joined(separator: "/")
            consolePrint(url)

            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .success(HoloflowsRPC.Response(result: url, id: id))
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
