//
//  Tab+Fetch.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-7-9.
//

import Foundation
import ConsolePrint

extension Tab {

    open func fetch(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Fetch, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(fetch):
            consolePrint(fetch.request.url)
            guard let url = URL(string: fetch.request.url) else {
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(RPC.Error.invalidParams)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
                return
            }
            let request: URLRequest = {
                var request = URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 10.0)
                request.httpMethod = fetch.request.method
                return request
            }()
            let configuration: URLSessionConfiguration = {
                let configuration = URLSessionConfiguration.ephemeral
                configuration.httpAdditionalHeaders = ["User-Agent" : tabs?.userAgent as Any]
                return configuration
            }()
            URLSession(configuration: configuration).dataTask(with: request) { [weak self] data, response, error in
                guard let `self` = self else { return }
                guard error == nil,
                let response = response as? HTTPURLResponse,
                let data = data else {
                    let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(RPC.Error.internalError)
                    HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: Tab.completionHandler)
                    consolePrint(error?.localizedDescription ?? "nil")
                    return
                }

                let fetchResponse: WebExtension.Fetch.Response
                if let dataString = String(data: data, encoding: .utf8) {
                    let data = WebExtension.StringOrBlob(type: .text, content: dataString, mimeType: response.mimeType ?? "")
                    fetchResponse = WebExtension.Fetch.Response(status: response.statusCode,
                                                           statusText: HTTPResponseStatus(statusCode: response.statusCode).reasonPhrase,
                                                           data: data)
                    consolePrint(dataString)
                } else {
                    let data = WebExtension.StringOrBlob(type: .blob, content: data.base64EncodedString(), mimeType: response.mimeType ?? "")
                    fetchResponse = WebExtension.Fetch.Response(status: response.statusCode,
                                                           statusText: HTTPURLResponse.localizedString(forStatusCode: response.statusCode),
                                                           data: data)
                    consolePrint(data)
                }

                let result: Result<HoloflowsRPC.Response<WebExtension.Fetch.Response>, RPC.Error> = .success(HoloflowsRPC.Response(result: fetchResponse, id: id))
                DispatchQueue.main.async { [weak self] in
                    guard let `self` = self else { return }
                    HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: Tab.completionHandler)
                }
            }.resume()

        case let .failure(error):
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
