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

    open func browserRuntimeGetURL(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.RuntimeGetURL, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(runtimeGetURL):
            guard let bundleResourceManager = delegate?.tab(self, requestBundleResourceManager: ()) else {
                let result: Result<Void, Error> = .failure(ScriptMessage.InternalError.runtimeGetURLWithoutResourceManagerSet)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
                return
            }

            let bundleName = bundleResourceManager.bundle.bundleURL.deletingPathExtension().lastPathComponent
            let path: String = {
                let prefix = "/"
                let path = runtimeGetURL.url
                if path.hasPrefix(prefix) {
                    return String(path.dropFirst(prefix.count))
                } else {
                    return path
                }

            }()
            let url = "holoflows-extension://" + [bundleName, path].joined(separator: "/")
            consolePrint(url)

            let result: Result<String, Error> = .success(url)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<Void, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
