//
//  ScriptMessage.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-11.
//

import Foundation
import WebKit
import enum Swift.Result


extension ScriptMessage {

    public static func parseMessageID(messageBody message: String) throws -> String {
        let decoder = JSONDecoder()
        let id = try decoder.decode(MessageWithID.self, from: Data(message.utf8)).messageID
        return id
    }

    public static func receiveMessage<T: Decodable>(messageBody message: String) -> Result<T, Error> {
        let decoder = JSONDecoder()
        return Result {
            try decoder.decode(T.self, from: Data(message.utf8))
        }
    }

    public static func dispatchEvent(webView: WKWebView, eventName: String, result: Result<Void, Error>, completionHandler: ((Any?, Error?) -> Void)?) {
        switch result {
        case .success:
            webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', {detail: undefined}))", completionHandler: completionHandler)

        case let .failure(error):
            webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', {error: '\(error.localizedDescription)'}))", completionHandler: completionHandler)
        }
    }

    public static func dispatchEvent(webView: WKWebView, eventName: String, result: Result<Any, Error>, completionHandler: ((Any?, Error?) -> Void)?) {
        switch result {
        case .success(let value):
            if let string = value as? String  {
                let detail = CustomEventPayload(detail: string)
                guard let jsonData = try? JSONEncoder().encode(detail),
                let jsonString = String(data: jsonData, encoding: .utf8) else {
                    assertionFailure()
                    return
                }
                webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', \(jsonString)))", completionHandler: completionHandler)
            } else if let double = value as? Double {
                webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', {detail: \(double)}))", completionHandler: completionHandler)
            } else if let int = value as? Int {
                webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', {detail: \(int)}))", completionHandler: completionHandler)
            } else {
                webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', {detail: undefined}))", completionHandler: completionHandler)
            }

        case let .failure(error):
            webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', {error: '\(error.localizedDescription)'}))", completionHandler: completionHandler)
        }
    }

    public static func dispatchEvent<T: Encodable>(webView: WKWebView, eventName: String, result: Result<T, Error>, completionHandler: ((Any?, Error?) -> Void)?) {
        switch result {
        case let .success(encodable):
            let encoder = JSONEncoder()

            do {
                let detail = CustomEventPayload(detail: encodable)
                let jsonData = try encoder.encode(detail)
                guard let jsonString = String(data: jsonData, encoding: .utf8) else {
                    assertionFailure()
                    return
                }

                webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', \(jsonString)))", completionHandler: completionHandler)

            } catch {
                assertionFailure(error.localizedDescription)
                webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', {error: '\(error.localizedDescription)'}))", completionHandler: completionHandler)
            }

        case let .failure(error):
            webView.evaluateJavaScript("document.dispatchEvent(new CustomEvent('\(eventName)', {error: '\(error.localizedDescription)'}))", completionHandler: completionHandler)
        }
    }

}

extension ScriptMessage {

    private struct MessageWithID: Codable {
        let messageID: String
    }

    struct CustomEventPayload<T: Encodable>: Encodable {
        let detail: T
    }

}

extension ScriptMessage {

    // only used for encode error description
    enum InternalError: Swift.Error {
        case tabsCreateFail
        case tabsRemoveFail
        case tabsSendMessageFail
        case tabsExecuteScriptReturnNil

        var localizedDescription: String {
            switch self {
            case .tabsCreateFail:               return "tabs create fail"
            case .tabsRemoveFail:               return "tabs remove fail"
            case .tabsSendMessageFail:          return "tabs send message fail"
            case .tabsExecuteScriptReturnNil:   return "tabs execute script return nil"
            }
        }
    }

}

