//
//  Tabs.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-10.
//

import Foundation
import WebKit
import SwiftyJSON
import ConsolePrint
import os

public protocol TabsDelegate: class {
    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin
    func pluginResourceURLScheme() -> [String]
    func tabs(_ tabs: Tabs, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration
}

extension TabsDelegate {
    public func pluginResourceURLScheme() -> [String] { return [] }
    public func tabs(_ tabs: Tabs, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        return WKWebViewConfiguration()
    }
}

public class Tabs: NSObject {

    public private(set) var storage: [Tab] = []
    
    /// store active tab order. The last is top-most.
    public internal(set) var activeTabStack = WeakArray<Tab>([])

    weak var browserCore: BrowserCore?

    private(set) lazy var extensionTab: Tab = createExtensionTab()
    private(set) var userAgent: String?
    private var nextID = 1

    init(browserCore: BrowserCore) {
        self.browserCore = browserCore

        super.init()

        // Init User-Agent
        extensionTab.webView.evaluateJavaScript("navigator.userAgent") { any, error in
            guard let userAgent = any as? String else { return }
            self.userAgent = userAgent
        }
    }

}

extension Tabs {

    /// Creates a new tab.
    ///
    /// - Parameter properties: Properties to give the new tab.
    /// - Note: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create
    @discardableResult
    public func create(options: WebExtension.Browser.Tabs.Create.Options?, webViewConfiguration: WKWebViewConfiguration? = nil) -> Tab {
        consolePrint("create tab: options: \(String(describing: options))")
        os_log("^ %{public}s[%{public}ld], %{public}s: %{public}s", ((#file as NSString).lastPathComponent), #line, #function, String(describing: options))

        let tab: Tab = {
            let pluginForContentScript = self.plugin(forScriptType: .contentScript)
            let webViewConfiguration = self.webViewConfiguration(forOptions: options, scriptType: .contentScript)
            let tabConfiguration = TabConfiguration(id: nextID,
                                                    plugin: pluginForContentScript,
                                                    createOptions: options,
                                                    webViewConfiguration: webViewConfiguration,
                                                    tabDelegate: browserCore,
                                                    tabDownloadDelegate: browserCore,
                                                    tabs: self)

            return Tab(configuration: tabConfiguration)
        }()

        // dispatch delegate from browser core into proxy
        if let uiDelegate = browserCore?.uiDelegate(for: tab) {
            tab.uiDelegateProxy?.registerSecondary(uiDelegate)
        }
        if let navigationDelegate = browserCore?.navigationDelegate(for: tab) {
            tab.navigationDelegateProxy?.registerSecondary(navigationDelegate)
        }

        // active tab
        tab.delegate?.tab(tab, shouldActive: tab.isActive)

        nextID += 1
        storage.append(tab)

        return tab
    }

    @discardableResult
    public func remove(id: Int) -> Tab? {
        let removed = remove(ids: [id])
        assert(removed.count < 2)
        return removed.first
    }

    @discardableResult
    public func remove(ids: [Int]) -> [Tab] {
        let removed = storage.filter { ids.contains($0.id) }

        storage.removeAll(where: { ids.contains($0.id) })

        for tab in removed {
            tab.resignMessageHandler()
        }

        return removed
    }

}

extension Tabs {

    private func plugin(forScriptType type: Plugin.ScriptType) -> Plugin? {
        guard let plugin = browserCore?.plugin(forScriptType: type) else {
            return nil
        }

        guard plugin.environment == type else {
            assertionFailure()
            return nil
        }

        return plugin
    }

    private func webViewConfiguration(forOptions options: WebExtension.Browser.Tabs.Create.Options?, scriptType type: Plugin.ScriptType) -> WKWebViewConfiguration {
        let configuration = browserCore?.tabs(self, webViewConfigurationForOptions: options) ?? WKWebViewConfiguration()
        let schemes = browserCore?.pluginResourceURLScheme() ?? []

        let holoflowsExtension = "holoflows-extension"
        let holoflowsBlob = "holoflows-blob"
        for scheme in schemes {
            guard scheme != holoflowsExtension, scheme != holoflowsBlob else { continue }
            configuration.setURLSchemeHandler(self, forURLScheme: scheme)
        }
        configuration.setURLSchemeHandler(self, forURLScheme: holoflowsExtension)
        configuration.setURLSchemeHandler(self, forURLScheme: holoflowsBlob)

        return configuration
    }

    private func createExtensionTab() -> Tab {

        let tab: Tab = {
            let pluginForBackgroundScript = browserCore?.plugin(forScriptType: .backgroundScript) ?? Plugin(id: UUID().uuidString, manifest: JSON.null, environment: .backgroundScript, resources: JSON.null)
            let options: WebExtension.Browser.Tabs.Create.Options = {
                let url = Tabs.backgroundPagePath(for: pluginForBackgroundScript)
                let options = WebExtension.Browser.Tabs.Create.Options(active: true, url: url)
                return options
            }()
            let webViewConfiguration = self.webViewConfiguration(forOptions: options, scriptType: .backgroundScript)
            let tabConfiguration = TabConfiguration(id: -1,
                                                    plugin: pluginForBackgroundScript,
                                                    createOptions: options,
                                                    webViewConfiguration: webViewConfiguration,
                                                    tabDelegate: browserCore,
                                                    tabDownloadDelegate: browserCore,
                                                    tabs: self)

            return Tab(configuration: tabConfiguration)
        }()

        // dispatch delegate from browser core into proxy
        if let uiDelegate = browserCore?.uiDelegate(for: tab) {
            tab.uiDelegateProxy?.registerSecondary(uiDelegate)
        }
        if let navigationDelegate = browserCore?.navigationDelegate(for: tab) {
            tab.navigationDelegateProxy?.registerSecondary(navigationDelegate)
        }

        tab.delegate?.tab(tab, shouldActive: tab.isActive)

        return tab
    }

}

// MARK: - WKURLSchemeHandler
extension Tabs: WKURLSchemeHandler {

    public enum URLSchemeHandlerError: Swift.Error {
        case invalidURL
        case noPluginResourceProvider
    }

    public func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLSchemeHandlerError.invalidURL)
            return
        }

        let fileExtension = url.pathExtension
        let filename = url.deletingPathExtension().lastPathComponent
        if filename == "_generated_background_page", fileExtension == "html", url.scheme == "holoflows-extension" {
            let html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>background page</title>
            </head>
            <body>

            </body>
            </html>
            """
            let data = html.data(using: .utf8)!
            let returnResponse = URLResponse(
                url: url,
                mimeType: "text/html",
                expectedContentLength: data.count,
                textEncodingName: nil)

            urlSchemeTask.didReceive(returnResponse)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
            return
        }

        guard let tab = (storage + [extensionTab]).first(where: { $0.webView === webView }),
        let resourceProviderForURL = tab.delegate?.tab(tab, pluginResourceProviderForURL: url) else {
            urlSchemeTask.didFailWithError(URLSchemeHandlerError.noPluginResourceProvider)
            return
        }

        resourceProviderForURL.data(from: url) { result in
            switch result {
            case .success(let (data, response)):
//                let httpResponse = HTTPURLResponse(url: response.url, mimeType: response.mimeType, expectedContentLength: response.expectedContentLength, textEncodingName: response.textEncodingName)
//                httpResponse.statusCode

                let header: [String : String] = [
                    "Content-Type": response.mimeType ?? "",
                    "Content-Length" : String(response.expectedContentLength),
                ]
                guard let httpURLResponse = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: header) else {
                    urlSchemeTask.didFailWithError(BundleResourceManager.Error.fileNotFound)
                    return
                }
                urlSchemeTask.didReceive(httpURLResponse)
                urlSchemeTask.didReceive(data)
                urlSchemeTask.didFinish()

                consolePrint("urlSchemeTask.didFinish() =: \(response)")
            case .failure(let error):
                urlSchemeTask.didFailWithError(error)
                consolePrint("urlSchemeTask.didFailWithError() =: \(error.localizedDescription)")
            }
        }
    }

    public func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // do nothing
    }

    static func backgroundPagePath(for plugin: Plugin) -> String {
        // Infinite loop whne use background.html
        if let backgroundPageFilename = plugin.manifest["background"].dictionaryValue["page"]?.string {
            return "holoflows-extension://\(plugin.id)/\(backgroundPageFilename)"
        }
        return "holoflows-extension://\(plugin.id)/_generated_background_page.html"
    }

}
