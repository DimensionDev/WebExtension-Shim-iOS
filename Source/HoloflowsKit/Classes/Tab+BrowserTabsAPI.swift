//
//  Tab+BrowserTabsAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-14.
//

import Foundation
import ConsolePrint

extension Tab {

    open func browserTabsCreate(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Tabs.Create, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(create):
            let result = (tabs.flatMap { tabs -> Result<HoloflowsRPC.Response<Tab>, RPC.Error> in
                let tab = tabs.create(options: create.options)
                let response = HoloflowsRPC.Response(result: tab, id: id)
                return .success(response)
            }) ?? .failure(RPC.Error.serverError)

            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)

            consolePrint(tabs?.storage)

        case let .failure(error):
            let result: Result<Tab, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    open func browserTabsRemove(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Tabs.Remove, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)
        switch messageResult {
        case let .success(remove):
            if let _ = tabs?.remove(ids: [remove.tabId]) {
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .success(.init(result: "", id: id))
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)

            } else {
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(RPC.Error.serverError)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
            }

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(RPC.Error.serverError)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
        consolePrint(tabs?.storage)
    }

    open func browserTabsExecuteScript(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.TabsExecuteScript, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        guard let message = try? messageResult.get(),
            let tabs = tabs,
            let targetTab = tabs.storage.first(where: { $0.id == (message.tabId ?? 0) }) else {
                assertionFailure()
                return
        }

        let script = message.details.code
        targetTab.webView.evaluateJavaScript(script) { [weak self] any, error in
            guard let `self` = self else { return }
            if let error = error {
                let result: Result<Void, Error> = .failure(error)
                ScriptMessage.dispatchEvent(webView: self.webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            } else {
                let payload: Result<Any, Error> = {
                    guard let value = any else {
                        return .failure(ScriptMessage.InternalError.tabsExecuteScriptReturnNil)
                    }
                    return .success(value)
                }()
                consolePrint("\(payload), \(String(describing: any))")
                ScriptMessage.dispatchEvent(webView: self.webView, eventName: id, result: payload, completionHandler: Tab.completionHandler)
            }
        }
    }

}
