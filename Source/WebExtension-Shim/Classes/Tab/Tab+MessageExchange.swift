//
//  Tab+MessageExchange.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension Tab {

    open func sendMessage(id: String, messageBody: String) {
        let meta = self.meta
        let url = webView.url?.absoluteString
        
        DispatchQueue.global().async { [weak self] in
            guard let `self` = self else { return }
            let result: Result<WebExtension.SendMessage, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
            
            switch result {
            case let .success(sendMessage):
                let sender = WebExtension.Browser.Runtime.MessageSender(tabMeta: meta, id: sendMessage.extensionID, url: url)
                
                // transfer message to target
                let onMessage = WebExtension.OnMessage(fromMessageSender: sender, sendMessage: sendMessage)
                let request = HoloflowsRPC.ServerRequest(params: onMessage, id: id)
                if let tabID = sendMessage.tabId {
                    DispatchQueue.main.async {
                        if let targetTab = self.browser?.tabs.storage.first(where: { $0.id == tabID }) {
                            HoloflowsRPC.dispathRequest(webView: targetTab.webView, id: id, request: request, completionHandler: self.completionHandler())
                        } else {
                            let result: Result<HoloflowsRPC.Response<WebExtension.OnMessage>, RPC.Error> = .failure(RPC.Error.invalidParams)
                            HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: self.completionHandler())
                        }
                    }
                } else {
                    DispatchQueue.main.async {
                        if let extensionTab = self.browser?.tabs.backgroundTab {
                            HoloflowsRPC.dispathRequest(webView: extensionTab.webView, id: id, request: request, completionHandler: self.completionHandler())
                        }
                        for targetTab in self.browser?.tabs.storage ?? [] {
                            guard targetTab.id != self.id else { return }
                            HoloflowsRPC.dispathRequest(webView: targetTab.webView, id: id, request: request, completionHandler: self.completionHandler())
                        }
                        
                        let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .success(.init(result: "", id: id))
                        HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: self.completionHandler())
                    }
                }
                
            case let .failure(error):
                DispatchQueue.main.async {
                    let result: Result<HoloflowsRPC.Response<WebExtension._Echo>, RPC.Error> = .failure(error)
                    HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: self.completionHandler())
                }
            }   // end switch
        }
    }
    
}
