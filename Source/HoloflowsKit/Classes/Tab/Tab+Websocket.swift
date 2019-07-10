//
//  Tab+Websocket.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-7-10.
//

import Foundation
import ConsolePrint
import SwiftyJSON

extension Tab {

    public func websocketCreate(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.WebSocket.Create, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(create):
            fatalError()
        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    public func websocketClose(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.WebSocket.Close, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(close):
            fatalError()
        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    public func websocketSend(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.WebSocket.Send, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(send):
            fatalError()
        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
