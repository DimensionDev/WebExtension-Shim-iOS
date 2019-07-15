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

    public static func dispatchScript<T: RPC.Request & Encodable>(id: String, request: T) -> String? {
        guard let jsonData = try? encoder.encode(request),
        let jsonString = String(data: jsonData, encoding: .utf8) else {
            return nil
        }

        let script = "document.dispatchEvent(new CustomEvent('\(ScriptEvent.holoflowsjsonrpc.rawValue)', { detail: \(jsonString) }))"
        return script
    }

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

    public static func dispathRequest<T: RPC.Request & Encodable>(webView: WKWebView, id: String, request: T, completionHandler: CompletionHandler?) {
        guard let script = dispatchScript(id: id, request: request) else {
            assertionFailure()
            return
        }
        webView.evaluateJavaScript(script, completionHandler: completionHandler?.completionHandler(id: id))
        consolePrint("webView: \(webView.url?.absoluteString ?? ""), script: \(script)")
    }

    public static func dispatchResponse<T: RPC.Response>(webView: WKWebView, id: String, result: Result<T, RPC.Error>, completionHandler: CompletionHandler?) {
        let script = dispatchScript(id: id, result: result)
        webView.evaluateJavaScript(script, completionHandler: completionHandler?.completionHandler(id: id))
        consolePrint("webView: \(webView.url?.absoluteString ?? ""), script: \(script.prefix(500))")
    }
    
}

extension HoloflowsRPC {

    public struct CompletionHandler {
        let tabMeta: Tab.Meta?
        let file: String
        let method: String
        let line: Int

        func completionHandler(id: String) -> (Any?, Error?) -> Void {
            let file = self.file
            let method = self.method
            let line = self.line

            return { any, error in
                guard let error = error else {
                    let anyString = any.flatMap { String(describing: $0) }
                    let tabMetaString = self.tabMeta.flatMap { "[\($0.id)]\($0.url)" }
                    let description = [tabMetaString, id, anyString].compactMap { $0 }.joined(separator: " | ")
                    consolePrint("eval result =: " + description, file: file, method: method, line: line)
                    return
                }

                consolePrint(error.localizedDescription, file: file, method: method, line: line)
            }
        }

        public init(tabMeta: Tab.Meta? = nil, file: String = #file, method: String = #function, line: Int = #line) {
            self.tabMeta = tabMeta
            self.file = file
            self.method = method
            self.line = line
        }
    }

}


