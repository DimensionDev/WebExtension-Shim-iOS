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
            let sender = WebExtension.Browser.Runtime.MessageSender(tab: self, id: sendMessage.extensionID, url: webView.url?.absoluteString)
            let onMessage = WebExtension.OnMessage(fromMessageSender: sender, sendMessage: sendMessage)
            let response = HoloflowsRPC.Response(result: onMessage, id: id)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: .success(response), completionHandler: Tab.completionHandler)

        case let .failure(error):
            let result: Result<HoloflowsRPC.Response<WebExtension._Echo>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }
    
}
