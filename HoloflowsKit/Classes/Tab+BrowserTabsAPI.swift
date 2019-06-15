//
//  Tab+BrowserTabsAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-14.
//

import Foundation
import ConsolePrint

extension Tab {

    public func browserTabsCreate(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.TabsCreate, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(tabsCreate):
            let tab = (tabs.flatMap { tabs -> Result<Tab, Error> in
                return .success(tabs.create(createProperties: tabsCreate.createProperties))
            }) ?? .failure(ScriptMessage.InternalError.tabsCreateFail)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: tab, completionHandler: Tab.completionHandler)
            consolePrint(tabs?.storage)

        case let .failure(error):
            let result: Result<Tab, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

    public func browserTabsRemove(messageID id: String, messageBody: String) {
        let messageResult: Result<ScriptMessage.TabsRemove, Error> = ScriptMessage.receiveMessage(messageBody: messageBody)
        switch messageResult {
        case let .success(tabsRemove):
            if let _ = tabs?.remove(ids: tabsRemove.ids) {
                let result: Result<Void, Error> = .success(Void())
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            } else {
                let result: Result<Void, Error> = .failure(ScriptMessage.InternalError.tabsRemoveFail)
                ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
            }

        case let .failure(error):
            let result: Result<Void, Error> = .failure(error)
            ScriptMessage.dispatchEvent(webView: webView, eventName: id, result: result, completionHandler: Tab.completionHandler)
        }
        consolePrint(tabs?.storage)
    }

    public func browserTabsExecuteScript(messageID id: String, messageBody: String) {
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
