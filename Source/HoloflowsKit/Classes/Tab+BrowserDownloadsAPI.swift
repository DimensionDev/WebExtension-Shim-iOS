//
//  Tab+BrowserDownloadsAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-19.
//

import Foundation
import ConsolePrint

extension Tab {

    open func browserDownloadsDownload(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.DownloadsDownload, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(download):
            guard let blobResourceManager = delegate?.tab(self, requestBlobResourceManager: ()) else {
                let result: Result<Void, Error> = .failure(ScriptMessage.InternalError.downloadsDownloadWithoutBlobManagerSet)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
                return
            }

            delegate?.tab(self, willDownloadBlobWithOptions: download.options)
            blobResourceManager.data(with: download.options.url) { [weak self] result in
                guard let `self` = self else { return }
                switch result {
                case let .success(blobStorage):
                    self.delegate?.tab(self, didDownloadBlobWithOptions: download.options, result: .success(blobStorage))
                    let result: Result<WebExtensionAPI.DownloadItem, Error> = .success(WebExtensionAPI.DownloadItem(state: .complete))
                    ScriptMessage.dispatchEvent(webView: self.webView, eventName: id, result: result, completionHandler: Tab.completionHandler)

                case let .failure(error):
                    let result: Result<Void, Error> = .failure(error)
                    ScriptMessage.dispatchEvent(webView: self.webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
                }
            }
            
        case let .failure(error):
            let result: Result<Void, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
