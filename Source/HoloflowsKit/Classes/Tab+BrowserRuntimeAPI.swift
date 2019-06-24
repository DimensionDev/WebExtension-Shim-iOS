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

    open func browserRuntimeGetManifest(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Runtime.GetManifest, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(getManifest):
            let json = delegate
                .flatMap { Data($0.tab(self, requestManifestForExtension: getManifest.extensionID).utf8) }
                .flatMap { JSON(rawValue: $0) } ?? JSON.null

            let result: Result<HoloflowsRPC.Response<JSON>, RPC.Error> = .success(HoloflowsRPC.Response(result: json, id: id))
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
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
