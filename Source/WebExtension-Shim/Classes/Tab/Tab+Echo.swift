//
//  Tab+Echo.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

extension Tab {

    open func echo(id: String, messageBody: String) {
        let result: Result<WebExtension._Echo, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch result {
        case let .success(echo):
            let response = HoloflowsRPC.Response(result: echo, id: id)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: .success(response), completionHandler: completionHandler())

        case let .failure(error):
            let result: Result<HoloflowsRPC.Response<WebExtension._Echo>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: completionHandler())
        }
    }

}

extension WebExtension {
    public struct _Echo: WebExtension.ClientRequest {
        public static let method: String = "_echo"

        public let extensionID: String = "HoloflowsKit"
        public let payload: String

        public init(payload: String) {
            self.payload = payload
        }
    }
}
