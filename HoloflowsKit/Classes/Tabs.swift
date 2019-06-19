//
//  Tabs.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-10.
//

import Foundation
import WebKit
import ConsolePrint

public protocol TabsDelegate: class {
    func tabs(_ tabs: Tabs, createTabWithCreateProperties properties: WebExtensionAPI.CreateProperties?) -> WKWebViewConfiguration
}

open class Tabs {

    open weak var delegate: TabsDelegate?
    open weak var browser: Browser?
    open private(set) var storage: [Tab] = []

    private var nextID = 0
    
}

extension Tabs {

    /// Creates a new tab.
    ///
    /// - Parameter properties: Properties to give the new tab.
    /// - Note: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create
    @discardableResult
    open func create(createProperties properties: WebExtensionAPI.CreateProperties?, webViewConfiguration: WKWebViewConfiguration? = nil) -> Tab {
        let webViewConfiguration = delegate?.tabs(self, createTabWithCreateProperties: properties)
        let tab = Tab(id: nextID, createProperties: properties, webViewConfiguration: webViewConfiguration)
        tab.tabs = self
        tab.delegate = browser
        nextID += 1
        storage.append(tab)
        return tab
    }

    @discardableResult
    open func remove(id: Int) -> Tab? {
        let removed = remove(ids: [id])
        assert(removed.count < 2)
        return removed.first
    }

    @discardableResult
    open func remove(ids: [Int]) -> [Tab] {
        let removed = storage.filter { ids.contains($0.id) }

        storage.removeAll(where: { ids.contains($0.id) })

        for tab in removed {
            tab.resignMessageHandler()
        }

        return removed
    }

    open func sendMessage(_ message: ScriptMessage.Send, from sender: Tab) {
        consolePrint("Send message: \(message) from sender: \(sender)")
        let receive = ScriptMessage.Receive(messageID: message.messageID, message: message.message, sender: sender)
        let result = Result<ScriptMessage.Receive, Error>.success(receive)

        if let tabID = message.tabID {
            guard let tab = storage.first(where: { $0.id == tabID }) else {
                consolePrint("Not found tab to send message: \(message)")
                return
            }

            ScriptMessage.dispatchEvent(webView: tab.webView, eventName: "receive", result: result, completionHandler: Tab.completionHandler)

        } else {
            for tab in storage where tab != sender {
                ScriptMessage.dispatchEvent(webView: tab.webView, eventName: "receive", result: result, completionHandler: Tab.completionHandler)
            }
        }
    }

}
