//
//  HoloflowsRPC.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation
import WebKit
import ConsolePrint

public enum HoloflowsRPC {

    public static let encoder = JSONEncoder()
    public static let decoder = JSONDecoder()

    public static func dispatchScript<T: RPC.Response>(id: String, result: Result<T, RPC.Error>) -> String {
        switch result {
        case let .success(response):
            guard let jsonData = try? encoder.encode(response),
            let jsonString = String(data: jsonData, encoding: .utf8) else {
                assertionFailure()
                return "document.dispatchEvent(new CustomEvent('\(ScriptEvent.holoflowsjsonrpc.rawValue)', { detail: { jsonrpc: '2.0', error: { id: -32603, message: 'server error. internal xml-rpc error' }, id: \(id) } }))"
            }

            let script = "document.dispatchEvent(new CustomEvent('\(ScriptEvent.holoflowsjsonrpc.rawValue)', { detail: \(jsonString) }))"
            return script

        case let .failure(error):
            let response = HoloflowsRPC.ErrorResponse(error: error, id: id)
            guard let jsonData = try? encoder.encode(response),
            let jsonString = String(data: jsonData, encoding: .utf8) else {
                assertionFailure()
                return "document.dispatchEvent(new CustomEvent('\(ScriptEvent.holoflowsjsonrpc.rawValue)', { detail: { jsonrpc: '2.0', error: { id: -32603, message: 'server error. internal xml-rpc error' }, id: \(id) } }))"
            }

            let script = "document.dispatchEvent(new CustomEvent('\(ScriptEvent.holoflowsjsonrpc.rawValue)', { detail: \(jsonString) }))"
            return script
        }
    }

}

extension HoloflowsRPC {

    public static func parseRPCMeta(messageBody: String) throws -> (method: String, id: String) {
        let messageData = Data(messageBody.utf8)
        let request = try decoder.decode(BasicRPCRequest.self, from: messageData)
        return (request.method, request.id)
    }

    public static func parseRPC<T: WebExtension.ClientRequest>(messageBody: String) -> Result<T, RPC.Error> {
        let messageData = Data(messageBody.utf8)
        do {
            let request = try decoder.decode(HoloflowsRPC.Request<T>.self, from: messageData)
            return .success(request.params)
        } catch {
            return .failure(RPC.Error.parseError)
        }
    }

    private struct BasicRPCRequest: Decodable {
        let jsonrpc: String = RPC.Version.default
        let method: String
        let id: String
    }

}

extension HoloflowsRPC {

    public static func dispatchResponse<T: RPC.Response>(webView: WKWebView, id: String, result: Result<T, RPC.Error>, completionHandler: ((Any?, Error?) -> Void)?) {
        let script = dispatchScript(id: id, result: result)
        webView.evaluateJavaScript(script, completionHandler: completionHandler)
        consolePrint("webView: \(webView.url?.absoluteString ?? ""), script: \(script)")
    }
    
}

