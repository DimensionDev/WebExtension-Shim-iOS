//
//  Tab+BrowserTabsAPI.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-14.
//

import Foundation
import SwiftyJSON
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
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
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
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
        consolePrint(tabs?.storage)
    }

    open func browserTabsExecuteScript(id: String, messageBody: String) {
        let messageResult: Result<WebExtension.Browser.Tabs.ExecuteScript, RPC.Error> = HoloflowsRPC.parseRPC(messageBody: messageBody)

        switch messageResult {
        case let .success(executeScript):
            guard let tabs = tabs,
            let targetTab = tabs.storage.first(where: { $0.id == (executeScript.tabID ?? self.id) }) else {
                let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(RPC.Error.internalError)
                HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
                return
            }

            let script = executeScript.details.code ?? ""
            consolePrint("targetTab[\(targetTab.id)] eval: \(script)")
            targetTab.webView.evaluateJavaScript(script) { [weak self] any, error in
                guard let `self` = self else { return }
                if let error = error {
                    let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(RPCError.serverError)
                    HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: Tab.completionHandler)
                    consolePrint(error.localizedDescription)

                } else {
                    let result: Result<HoloflowsRPC.Response<JSON>, RPC.Error> = {
                        guard let any = any else {
                            return .success(HoloflowsRPC.Response(result: JSON.null, id: id))
                        }
                        guard let value = JSON(rawValue: any) else {
                            return .failure(RPCError.serverError)
                        }
                        return .success(HoloflowsRPC.Response(result: value, id: id))
                    }()
                    consolePrint("\(result), \(String(describing: any))")
                    HoloflowsRPC.dispatchResponse(webView: self.webView, id: id, result: result, completionHandler: Tab.completionHandler)
                }
            }   // end targetTab.seb.evaluateJavaScript(…)

        case let .failure(error):
            consolePrint(error.localizedDescription)
            let result: Result<HoloflowsRPC.Response<String>, RPC.Error> = .failure(error)
            HoloflowsRPC.dispatchResponse(webView: webView, id: id, result: result, completionHandler: Tab.completionHandler)
        }
    }

}
