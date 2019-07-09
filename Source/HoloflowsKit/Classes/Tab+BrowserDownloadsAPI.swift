//
//  Tab+BrowserDownloadsAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-19.
//

import Foundation
import ConsolePrint

extension Tab {

    open func browserDownloadsDownload(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Downloads.Download, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(download):
            guard let handlers = delegate?.tab(self, requestURLSchemeHanderForExtension: download.extensionID, forPath: download.options.url) else {
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(.invalidParams)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
                return
            }

            let blobHandlers = handlers.compactMap { hander -> URLSchemeHandlerManager.URLSchemeHander? in
                guard hander.extensionID == download.extensionID else { return nil }
                guard hander.urlSchemeHandler is BlobResourceManager else { return nil }
                return hander
            }

            guard let blobResourceManager = blobHandlers.first?.urlSchemeHandler as? BlobResourceManager else {
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(.invalidParams)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
                return
            }

            delegate?.tab(self, willDownloadBlobWithOptions: download.options)

            blobResourceManager.data(with: download.options.url) { [weak self] result in
                guard let `self` = self else { return }
                switch result {
                case let .success(blobStorage):
                    let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .success(HoloflowsRPC.Response(result: "", id: id))
                    HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: Tab.completionHandler)

                    self.delegate?.tab(self, didDownloadBlobWithOptions: download.options, result: .success(blobStorage))

                case let .failure(error):
                    consolePrint(error.localizedDescription)
                    let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(.serverError)
                    HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: Tab.completionHandler)
                }
            }
            
        case let .failure(error):
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
