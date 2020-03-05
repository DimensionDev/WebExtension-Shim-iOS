//
//  Tab+MessageExchange.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension Tab {

    open func sendMessage(id: String, messageBody: String) {
        let result: Result<WebExtension.SendMessage, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch result {
        case let .success(sendMessage):
            let sender = WebExtension.Browser.Runtime.MessageSender(tabMeta: meta, id: sendMessage.extensionID, url: webView.url?.absoluteString)

            // transfer message to target
            let onMessage = WebExtension.OnMessage(fromMessageSender: sender, sendMessage: sendMessage)
            let request = HoloflowsRPC.ServerRequest(params: onMessage, id: id)
            if let tabID = sendMessage.tabId {
                if let targetTab = browser?.tabs.storage.first(where: { $0.id == tabID }) {
                    HoloflowsRPC.dispathRequest(webView: targetTab.webView, id: id, request: request, completionHandler: completionHandler())
                } else {
                    let result: Result<HoloflowsRPC.Response<WebExtension.OnMessage>, RPC.Error> = .failure(RPC.Error.invalidParams)
                    HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: completionHandler())
                }
            } else {
                if let extensionTab = browser?.tabs.backgroundTab {
                    HoloflowsRPC.dispathRequest(webView: extensionTab.webView, id: id, request: request, completionHandler: completionHandler())
                }
                for targetTab in browser?.tabs.storage ?? [] {
                    guard targetTab.id != self.id else { return }
                    HoloflowsRPC.dispathRequest(webView: targetTab.webView, id: id, request: request, completionHandler: completionHandler())
                }
            }

            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .success(.init(result: "", id: id))
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: completionHandler())


        case let .failure(error):
            let result: Result<HoloflowsRPC.Response<WebExtension._Echo>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: completionHandler())
        }
    }
    
}
