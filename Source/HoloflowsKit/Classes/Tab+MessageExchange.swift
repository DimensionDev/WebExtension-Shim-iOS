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
                if let targetTab = tabs?.storage.first(where: { $0.id == tabID }) {
                    HoloflowsRPC.dispathRequest(webView: targetTab.webView, id: id, request: request, completionHandler: Tab.completionHandler)
                } else {
                    let result: Result<HoloflowsRPC.Response<WebExtension.OnMessage>, RPC.Error> = .failure(RPC.Error.invalidParams)
                    HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
                }
            } else {
                for targetTab in tabs?.storage ?? [] {
                    HoloflowsRPC.dispathRequest(webView: targetTab.webView, id: id, request: request, completionHandler: Tab.completionHandler)
                }
            }


        case let .failure(error):
            let result: Result<HoloflowsRPC.Response<WebExtension._Echo>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }
    
}
